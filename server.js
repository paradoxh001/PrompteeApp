const http=require('http'),https=require('https'),fs=require('fs'),path=require('path');
const s=http.createServer((q,r)=>{
  const cors=(h)=>{h['Access-Control-Allow-Origin']='*';h['Access-Control-Allow-Headers']='*';h['Access-Control-Allow-Methods']='GET,POST,OPTIONS';return h;};
  if(q.method==='OPTIONS'){r.writeHead(204,cors({}));r.end();return;}
  if(q.url==='/api/chat'&&q.method==='POST'){
    let body='';
    q.on('data',c=>body+=c);
    q.on('end',()=>{
      let parsed;
      try{parsed=JSON.parse(body);}catch(e){r.writeHead(400,cors({'Content-Type':'application/json'}));r.end(JSON.stringify({error:'Invalid JSON'}));return;}
      const apiKey=parsed.api_key||'';
      delete parsed.api_key;
      const data=JSON.stringify(parsed);
      const opts={hostname:'ark.cn-beijing.volces.com',path:'/api/v3/chat/completions',method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey,'Content-Length':Buffer.byteLength(data)}};
      const req=https.request(opts,res=>{r.writeHead(res.statusCode,cors({'Content-Type':res.headers['content-type']||'application/json'}));res.pipe(r);});
      req.on('error',e=>{r.writeHead(502,cors({'Content-Type':'application/json'}));r.end(JSON.stringify({error:e.message}));});
      req.end(data);
    });
    return;
  }
  let fp=q.url==='/'?'index.html':q.url.slice(1);
  fp=path.join(__dirname,fp);
  try{fs.statSync(fp);const c=fs.readFileSync(fp);r.writeHead(200,cors({'Content-Type':fp.endsWith('.html')?'text/html;charset=utf-8':'application/javascript;charset=utf-8'}));r.end(c);}
  catch(e){r.writeHead(404,cors({'Content-Type':'text/plain'}));r.end('Not Found');}
});
s.listen(3001,()=>{});
