import test from 'node:test';
import assert from 'node:assert/strict';
import {recentParent,privacyExport} from '../server/privacy.js';
test('sensitive family controls require a recent parent session',()=>{
 const now=Date.now(),s={role:'parent',created_at:new Date(now-1000).toISOString()};
 assert.equal(recentParent(s,now),true);
 assert.equal(recentParent({...s,role:'kid'},now),false);
 assert.equal(recentParent({...s,created_at:new Date(now-16*60e3).toISOString()},now),false);
 assert.equal(recentParent({...s,created_at:'bad'},now),false);
});
test('portable export groups only each child’s lesson rows',()=>{
 const data=privacyExport({email:'qa@example.invalid'},[{id:'a'},{id:'b'}],[{kid_id:'a',lesson_id:'first-circuit',state:{step:3}},{kid_id:'b',lesson_id:'fruit-piano',state:{step:1}}]);
 assert.deepEqual(data.children[0].lessons,[{lesson_id:'first-circuit',state:{step:3}}]);
 assert.equal(data.children[1].lessons[0].lesson_id,'fruit-piano');
});
import {runRetention} from '../server/retention.js';
import retentionHandler from '../api/retention.js';
test('daily housekeeping confirms parent permission without deleting inactive families',async()=>{
 const calls=[],store={cleanup:async()=>calls.push('cleanup'),permissionConfirmations:async()=>[{id:'fixture',email:'qa@example.invalid',parent_permission_at:'2026-01-01T00:00:00Z'}],markPermissionConfirmation:async()=>calls.push('confirmed')};
 const result=await runRetention(store,{sendEmail:async m=>{assert.equal(m.to,'qa@example.invalid');assert.match(m.text,/never sell it or use it to train AI/);calls.push('sent');}});
 assert.deepEqual(calls,['cleanup','sent','confirmed']);assert.deepEqual(result,{confirmed:1});
});
test('failed permission delivery stays pending for retry',async()=>{
 let marked=false;const store={cleanup:async()=>{},permissionConfirmations:async()=>[{id:'fixture',parent_permission_at:'2026-01-01'}],markPermissionConfirmation:async()=>{marked=true;}};
 await assert.rejects(runRetention(store,{sendEmail:async()=>{throw Error('delivery failed');}}));assert.equal(marked,false);
});
test('housekeeping refuses requests without its server secret',async()=>{
 const old=process.env.CRON_SECRET;delete process.env.CRON_SECRET;
 try {let result;const res={setHeader(){},end(body){result={status:this.statusCode,body:JSON.parse(body)};}};await retentionHandler({method:'GET',headers:{}},res);assert.equal(result.status,401);}finally{if(old!==undefined)process.env.CRON_SECRET=old;}
});
