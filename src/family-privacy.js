export function clearProfileCopies(ids) {
  try {
    for (const key of Object.keys(localStorage)) {
      if (ids.some(id => key === `little-spark-profile-${id}` || key.startsWith(`little-spark-profile-${id}-`))) localStorage.removeItem(key);
    }
  } catch {}
}
export function attachPrivacyControls({panel, api, message, refresh, user, kids, escape}) {
  const controls = document.createElement('details');
  controls.className = 'family-privacy';
  controls.innerHTML = `<summary>Your family’s data</summary><p>Only used to run your family’s lessons. Never sold or used to train AI. <a href="/privacy/" target="_blank" rel="noopener noreferrer">Read the privacy notice ↗</a></p><p>Export or delete within 15 minutes of signing in with a new parent email link. Deletion cannot be undone.</p><button type="button" class="button secondary" id="export-family">Download family data</button><details><summary>Delete the whole family account</summary><p>Removes your parent account, every child profile, saved lesson progress, sessions and login links from the active database. Local copies on other devices must be cleared there. Provider backups and delivery/security records expire separately as explained in the privacy notice.</p><form id="delete-family"><label>Your parent email<input name="email" type="email" autocomplete="off" required></label><label>Type DELETE<input name="confirmation" autocomplete="off" pattern="DELETE" required></label><button class="button secondary" type="submit">Permanently delete family</button></form></details>`;
  panel.querySelector('.family-email').after(controls);
  if(user.privacyVersion !== '2026-10-27') {
    const permission=document.createElement('form');permission.className='parent-permission';
    permission.innerHTML='<strong>Before creating profiles or sharing child links</strong><p>Read our <a href="/privacy/" target="_blank" rel="noopener noreferrer">privacy notice ↗</a>. We save nicknames, icons and lesson progress to run your family’s lab. We never sell this data or use it to train AI. You can withdraw permission by deleting a child or family.</p><label><input type="checkbox" required> I am the parent or legal guardian and authorize saving my children’s profiles and progress.</label><button class="button secondary" type="submit">Confirm parent permission</button>';
    controls.before(permission);
    permission.onsubmit=async e=>{e.preventDefault();const b=permission.querySelector('button');b.disabled=true;try{await api('parent-permission',{parentPermission:true,privacyVersion:'2026-10-27'});await refresh();message('Parent permission saved.');}catch(error){message(error.message);b.disabled=false;}};
  }
  controls.querySelector('#export-family').onclick = async (e) => {
    e.target.disabled = true;
    try {
      const {data} = await api('export-family',{});
      const url = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
      const a=document.createElement('a');a.href=url;a.download='little-spark-family-data.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      message('Family data downloaded. Keep this file private.');
    } catch(error) { message(error.message); } finally { e.target.disabled=false; }
  };
  controls.querySelector('#delete-family').onsubmit = async (e) => {
    e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;
    const data=new FormData(e.target);
    try {
      await api('delete-family',{confirmEmail:data.get('email'),confirmDelete:data.get('confirmation')});
      clearProfileCopies(kids.map(k=>k.id));
      location.assign('/signin/?deleted=1');
    } catch(error) {message(error.message);b.disabled=false;}
  };
  for (const child of kids) {
    const edit=panel.querySelector(`[data-edit-child="${child.id}"]`)?.parentElement;
    if (!edit) continue;
    const remove=document.createElement('details');
    remove.innerHTML=`<summary>Delete this child profile</summary><p>Deletes ${escape(child.name)}’s saved progress in all lessons and signs out their devices. This cannot be undone.</p><form><label>Type the exact nickname<input name="nickname" maxlength="32" autocomplete="off" required></label><button class="button secondary" type="submit">Permanently delete child</button></form>`;
    edit.append(remove);
    remove.querySelector('form').onsubmit=async e=>{
      e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;
      try {await api('delete-child',{id:child.id,confirmName:new FormData(e.target).get('nickname')});clearProfileCopies([child.id]);await refresh();message('Child profile and saved progress deleted.');}
      catch(error){message(error.message);b.disabled=false;}
    };
  }
}
