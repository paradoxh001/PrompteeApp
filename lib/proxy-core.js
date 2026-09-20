// Shared proxy rules used by both the Vercel function (api/chat.js) and the
// local dev server (server.js). Keeping them in one place stops the allowlist
// and auth mapping from drifting apart between the two runtimes.

export const DEFAULT_ALLOWED_HOSTS = [
  "ark.cn-beijing.volces.com",
  "api.deepseek.com",
  "api.moonshot.cn",
  "dashscope.aliyuncs.com",
  "open.bigmodel.cn",
  "api.siliconflow.cn",
  "api.stepfun.com",
  "openrouter.ai",
  "api.openai.com",
  "api.minimaxi.com"
];

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/,
  /^127\./,
  /^0\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^\[?::1\]?$/,
  /\.local$/,
  /\.internal$/,
  /^metadata\./
];

export function resolveAllowedHosts(envValue) {
  const extra = String(envValue || "")
    .split(",")
    .map(function (s) { return s.trim().toLowerCase(); })
    .filter(Boolean);
  return new Set(DEFAULT_ALLOWED_HOSTS.concat(extra));
}

export function isPrivateHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  return PRIVATE_HOST_PATTERNS.some(function (re) { return re.test(host); });
}

export function validateTarget(rawUrl, allowedHosts) {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { ok: false, status: 400, error: "缺少目标地址 target_url" };
  }
  let url;
  try {
    url = new URL(rawUrl);
  } catch (e) {
    return { ok: false, status: 400, error: "目标地址不是合法 URL" };
  }
  if (url.protocol !== "https:") {
    return { ok: false, status: 400, error: "目标地址必须是 https" };
  }
  const host = url.hostname.toLowerCase();
  if (isPrivateHost(host)) {
    return { ok: false, status: 403, error: "目标地址指向内网，已拒绝" };
  }
  if (!allowedHosts.has(host)) {
    return {
      ok: false,
      status: 403,
      error: "目标域名 " + host + " 不在代理白名单内。请改用直连模式，或把它加入 PROXY_ALLOWED_HOSTS"
    };
  }
  return { ok: true, url: url.toString() };
}

export function resolveAuth(style, apiKey) {
  const key = String(apiKey || "").replace(/[\r\n]/g, "");
  if (style === "x-api-key") return { name: "x-api-key", value: key };
  if (style === "api-key") return { name: "api-key", value: key };
  return { name: "Authorization", value: "Bearer " + key };
}

export function createRateLimiter(options) {
  const limit = (options && options.limit) || 60;
  const windowMs = (options && options.windowMs) || 60000;
  const hits = new Map();
  return function check(clientId) {
    const now = Date.now();
    const id = String(clientId || "unknown");
    const recent = (hits.get(id) || []).filter(function (t) { return now - t < windowMs; });
    if (recent.length >= limit) {
      const retryAfter = Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 1000));
      hits.set(id, recent);
      return { allowed: false, retryAfter: retryAfter };
    }
    recent.push(now);
    hits.set(id, recent);
    if (hits.size > 5000) hits.clear();
    return { allowed: true, retryAfter: 0 };
  };
}

export function splitProxyPayload(body) {
  const raw = body && typeof body === "object" ? body : {};
  const payload = Object.assign({}, raw);
  const targetUrl = payload.target_url;
  const apiKey = payload.api_key;
  const authStyle = payload.auth_style;
  delete payload.target_url;
  delete payload.api_key;
  delete payload.auth_style;
  return { targetUrl: targetUrl, apiKey: apiKey, authStyle: authStyle, payload: payload };
}