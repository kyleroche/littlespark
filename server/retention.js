import {sendServiceEmail} from './email.js';
export async function runRetention(store,{sendEmail=sendServiceEmail}={}) {
  await store.cleanup();
  let confirmed=0;
  for(const family of await store.permissionConfirmations()) {
    await sendEmail({to:family.email,subject:'Your Little Spark parent permission',text:'You confirmed that you are the parent or legal guardian and authorized Little Spark to save your children’s nicknames, icons and lesson progress. We use this only to provide family learning and account security. We never sell it or use it to train AI.\n\nYou can review, download or delete family data, or withdraw permission by deleting a child or family, in Family → Your family’s data: https://littlespark.tech/signin/\n\nIf you did not authorize this, contact kyro+littlespark@mail.grokbot.com. Privacy notice: https://littlespark.tech/privacy/',idempotencyKey:`permission-${family.id}-${new Date(family.parent_permission_at).getTime()}`});
    await store.markPermissionConfirmation(family.id,family.parent_permission_at);confirmed++;
  }
  return {confirmed};
}
