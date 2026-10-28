export const PRIVACY_VERSION = "2026-10-27";
export const RECENT_PARENT_MS = 15 * 60 * 1000;
export function recentParent(session, now = Date.now()) {
  const created = Date.parse(session?.created_at);
  return session?.role === "parent" && Number.isFinite(created) && now - created >= 0 && now - created <= RECENT_PARENT_MS;
}
export function privacyExport(parent, kids, progress) {
  return {format:"little-spark-family-v1", exportedAt:new Date().toISOString(),parent,children:kids.map(k=>({...k,lessons:progress.filter(p=>p.kid_id===k.id).map(({kid_id,...p})=>p)}))};
}
