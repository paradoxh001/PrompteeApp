const http=require('http'),https=require('https'),fs=require('fs'),path=require('path');

let corePromise=null,rateCheck=null;
function loadCore(){ if(!corePromise) corePromise=import('./lib/proxy-core.js'); return corePromise; }

const s=http.createServer((q,r)=>{
  const cors=(h)=>{h['Access-Control-Allow-Origin']='*';h['Access-Control-Allow-Headers']='*';h['Access-Control-Allow-Methods']='GET,POST,OPTIONS';return h;};
  if(q.method==='OPTIONS'){r.writeHead(204,cors({}));r.end();return;}
  if(q.url==='/api/chat'&&q.method==='POST'){
    let body='';
    q.on('data',c=>body+=c);
    q.on('end',async()=>{
      let parsed;
      try{parsed=JSON.parse(body);}catch(e){r.writeHead(400,cors({'Content-Type':'application/json'}));r.end(JSON.stringify({error:'Invalid JSON'}));return;}

      let core;
      try{ core=await loadCore(); }
      catch(e){ r.writeHead(500,cors({'Content-Type':'application/json'})); r.end(JSON.stringify({error:'proxy core unavailable'})); return; }
      if(!rateCheck)rateCheck=core.createRateLimiter({limit:120,windowMs:60000});

      const client=(q.headers['x-forwarded-for']||q.socket.remoteAddress||'unknown').toString().split(',')[0].trim();
      const gate=rateCheck(client);
      if(!gate.allowed){r.writeHead(429,cors({'Content-Type':'application/json','Retry-After':String(gate.retryAfter)}));r.end(JSON.stringify({error:'请求过于频繁，请稍后重试'}));return;}

      const parts=core.splitProxyPayload(parsed);
      const allowedHosts=core.resolveAllowedHosts(process.env.PROXY_ALLOWED_HOSTS);
      const target=core.validateTarget(parts.targetUrl,allowedHosts);
      if(!target.ok){r.writeHead(target.status,cors({'Content-Type':'application/json'}));r.end(JSON.stringify({error:target.error}));return;}

      const auth=core.resolveAuth(parts.authStyle,parts.apiKey);
      const data=JSON.stringify(parts.payload);
      const u=new URL(target.url);
      const opts={hostname:u.hostname,path:u.pathname+u.search,method:'POST',
        headers:{'Content-Type':'application/json',[auth.name]:auth.value,'Content-Length':Buffer.byteLength(data)}};
      const preq=https.request(opts,pres=>{r.writeHead(pres.statusCode,cors({'Content-Type':pres.headers['content-type']||'application/json'}));pres.pipe(r);});
      preq.on('error',e=>{r.writeHead(502,cors({'Content-Type':'application/json'}));r.end(JSON.stringify({error:e.message}));});
      preq.end(data);
    });
    return;
  }
  let fp=q.url==='/'?'index.html':q.url.slice(1);
  fp=path.join(__dirname,fp);
  try{fs.statSync(fp);const c=fs.readFileSync(fp);r.writeHead(200,cors({'Content-Type':fp.endsWith('.html')?'text/html;charset=utf-8':'application/javascript;charset=utf-8'}));r.end(c);}
  catch(e){r.writeHead(404,cors({'Content-Type':'text/plain'}));r.end('Not Found');}
});
s.listen(3001,()=>{});