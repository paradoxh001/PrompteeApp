import {
  resolveAllowedHosts,
  validateTarget,
  resolveAuth,
  createRateLimiter,
  splitProxyPayload
} from "../lib/proxy-core.js";

const checkRate = createRateLimiter({ limit: 60, windowMs: 60000 });

function applyCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
}

function clientId(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd) return fwd.split(",")[0].trim();
  return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : "unknown";
}

export default async function handler(req, res) {
  applyCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const gate = checkRate(clientId(req));
  if (!gate.allowed) {
    res.setHeader("Retry-After", String(gate.retryAfter));
    return res.status(429).json({ error: "请求过于频繁，请稍后重试" });
  }

  const parts = splitProxyPayload(req.body);
  const allowed = resolveAllowedHosts(process.env.PROXY_ALLOWED_HOSTS);
  const target = validateTarget(parts.targetUrl, allowed);
  if (!target.ok) {
    return res.status(target.status).json({ error: target.error });
  }

  const auth = resolveAuth(parts.authStyle, parts.apiKey);
  const headers = { "Content-Type": "application/json" };
  headers[auth.name] = auth.value;

  try {
    const upstream = await fetch(target.url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(parts.payload)
    });

    res.status(upstream.status);
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");

    if (upstream.body) {
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        res.write(decoder.decode(chunk.value, { stream: true }));
      }
      res.end();
    } else {
      res.send(await upstream.text());
    }
  } catch (err) {
    res.status(502).json({ error: err && err.message ? err.message : "代理请求失败" });
  }
}