import {timingSafeEqual} from 'node:crypto';
import {createStore} from '../server/store.js';
import {runRetention} from '../server/retention.js';
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
  const secret=process.env.CRON_SECRET, expected=secret?Buffer.from(`Bearer ${secret}`):null,actual=Buffer.from(String(req.headers.authorization||''));
  if(req.method!=='GET'||!expected||actual.length!==expected.length||!timingSafeEqual(actual,expected)){res.statusCode=401;return res.end(JSON.stringify({error:'Unauthorized'}));}
  try{const result=await runRetention(createStore());res.statusCode=200;res.end(JSON.stringify({ok:true,...result}));}
  catch{console.error('Retention job failed');res.statusCode=500;res.end(JSON.stringify({error:'Retention job failed'}));}
}
