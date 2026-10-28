import { neon } from "@neondatabase/serverless";
import { privacyExport, PRIVACY_VERSION } from "./privacy.js";
import { randomUUID } from "node:crypto";
import {
  hashToken,
  newToken,
  kidCode,
  LINK_TTL_MS,
  normalizeProgress,
  normalizeLesson,
  normalizeName,
} from "./auth-utils.js";
export function createStore(url = process.env.DATABASE_URL) {
  if (!url) throw Error("Accounts are not configured.");
  const sql = neon(url);
  return {
    async limit(key, max, windowMs) {
      const rows =
        await sql`INSERT INTO ls_limits(key,count,expires_at) VALUES(${key},1,now()+(${windowMs}*interval '1 millisecond')) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN ls_limits.expires_at<now() THEN 1 ELSE ls_limits.count+1 END,expires_at=CASE WHEN ls_limits.expires_at<now() THEN EXCLUDED.expires_at ELSE ls_limits.expires_at END RETURNING count`;
      return rows[0].count <= max;
    },
    async session(token) {
      if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
      const rows =
        await sql`SELECT s.hash,s.parent_id,s.kid_id,s.created_at,p.email,p.privacy_version,p.parent_permission_at,k.name,k.avatar FROM ls_sessions s LEFT JOIN ls_parents p ON p.id=s.parent_id LEFT JOIN ls_kids k ON k.id=s.kid_id WHERE s.hash=${hashToken(token)} AND s.expires_at>now() AND (s.parent_id IS NOT NULL OR (k.active=true AND s.auth_version=k.auth_version))`;
      const row = rows[0];

      return row
        ? {
            ...row,
            role: row.parent_id ? "parent" : "kid",
            id: row.parent_id || row.kid_id,
          }
        : null;
    },
    async logout(token) {
      if (token)
        await sql`DELETE FROM ls_sessions WHERE hash=${hashToken(token)}`;
    },
    async parentLink(email) {
      const token = newToken();
      await sql`INSERT INTO ls_parent_links(email,hash,expires_at) VALUES(${email},${hashToken(token)},now()+interval '5 minutes') ON CONFLICT(email) DO UPDATE SET hash=EXCLUDED.hash,expires_at=EXCLUDED.expires_at,used_at=NULL`;
      return token;
    },
    async consumeParent(token) {
      const sessionToken = newToken(),
        id = randomUUID();
      const rows =
        await sql`WITH consumed AS(UPDATE ls_parent_links SET used_at=now() WHERE hash=${hashToken(token)} AND used_at IS NULL AND expires_at>now() RETURNING email), person AS(INSERT INTO ls_parents(id,email) SELECT ${id}::uuid,email FROM consumed ON CONFLICT(email) DO UPDATE SET email=EXCLUDED.email RETURNING id,email), session AS(INSERT INTO ls_sessions(hash,parent_id,expires_at) SELECT ${hashToken(sessionToken)},id,now()+interval '30 days' FROM person RETURNING parent_id) SELECT person.id,person.email FROM person JOIN session ON session.parent_id=person.id`;
      return rows[0]
        ? {
            token: sessionToken,
            user: { role: "parent", id: rows[0].id, email: rows[0].email },
          }
        : null;
    },
    async children(parentId) {
      return sql`SELECT k.id,k.name,k.avatar,k.created_at,p.lesson_id,p.state,p.generation,p.updated_at FROM ls_kids k LEFT JOIN ls_progress p ON p.kid_id=k.id WHERE k.parent_id=${parentId} AND k.active=true ORDER BY k.created_at`;
    },
    async addChild(parentId, name, avatar) {
      const count =
        await sql`SELECT count(*)::int AS count FROM ls_kids WHERE parent_id=${parentId} AND active=true`;
      if (count[0].count >= 12)
        throw Error("This family already has 12 profiles.");
      const rows =
        await sql`INSERT INTO ls_kids(id,parent_id,name,avatar) VALUES(${randomUUID()},${parentId},${normalizeName(name)},${["robot", "otter", "rocket", "fox"].includes(avatar) ? avatar : "robot"}) RETURNING id,name,avatar`;
      return rows[0];
    },
    async updateChild(parentId, id, name, avatar) {
      const rows =
        await sql`UPDATE ls_kids SET name=${normalizeName(name)},avatar=${["robot", "otter", "rocket", "fox"].includes(avatar) ? avatar : "robot"} WHERE id=${id} AND parent_id=${parentId} AND active=true RETURNING id,name,avatar`;
      return rows[0] || null;
    },
    async revokeChild(parentId, id) {
      const rows =
        await sql`WITH owned AS(UPDATE ls_kids SET auth_version=auth_version+1 WHERE id=${id} AND parent_id=${parentId} RETURNING id), sessions AS(DELETE FROM ls_sessions WHERE kid_id IN(SELECT id FROM owned)), links AS(DELETE FROM ls_kid_links WHERE kid_id IN(SELECT id FROM owned)) SELECT id FROM owned`;
      return Boolean(rows[0]);
    },
    async childLink(parentId, id) {
      const code = kidCode();
      const rows =
        await sql`INSERT INTO ls_kid_links(kid_id,hash,auth_version,expires_at) SELECT id,${hashToken(code)},auth_version,now()+interval '5 minutes' FROM ls_kids WHERE id=${id} AND parent_id=${parentId} AND active=true ON CONFLICT(kid_id) DO UPDATE SET hash=EXCLUDED.hash,auth_version=EXCLUDED.auth_version,expires_at=EXCLUDED.expires_at,used_at=NULL RETURNING expires_at`;
      return rows[0]
        ? { code, expiresAt: rows[0].expires_at, expiresIn: LINK_TTL_MS }
        : null;
    },
    async consumeChild(code) {
      const token = newToken();
      const rows =
        await sql`WITH consumed AS(UPDATE ls_kid_links l SET used_at=now() FROM ls_kids k WHERE l.hash=${hashToken(code)} AND l.kid_id=k.id AND k.active=true AND l.auth_version=k.auth_version AND l.used_at IS NULL AND l.expires_at>now() RETURNING l.kid_id,l.auth_version), session AS(INSERT INTO ls_sessions(hash,kid_id,auth_version,expires_at) SELECT ${hashToken(token)},kid_id,auth_version,now()+interval '7 days' FROM consumed RETURNING kid_id) SELECT k.id,k.name,k.avatar FROM ls_kids k JOIN session ON session.kid_id=k.id`;
      return rows[0] ? { token, user: { role: "kid", ...rows[0] } } : null;
    },
    async progress(kidId, lesson = "first-circuit") {
      normalizeLesson(lesson);
      const rows =
        await sql`SELECT state,generation,updated_at FROM ls_progress WHERE kid_id=${kidId} AND lesson_id=${lesson}`;
      return rows[0] || { state: null, generation: 0, updated_at: null };
    },
    async saveProgress(kidId, input, generation = 0, reset = false, lesson = "first-circuit") {
      normalizeLesson(lesson);
      const state = normalizeProgress(input, lesson);
      if (reset) {
        const rows =
          await sql`INSERT INTO ls_progress(kid_id,lesson_id,state,generation) VALUES(${kidId},${lesson},${JSON.stringify(state)}::jsonb,1) ON CONFLICT(kid_id,lesson_id) DO UPDATE SET state=EXCLUDED.state,generation=ls_progress.generation+1,updated_at=now() RETURNING state,generation,updated_at`;
        return rows[0];
      }
      const rows =
        await sql`INSERT INTO ls_progress(kid_id,lesson_id,state,generation) VALUES(${kidId},${lesson},${JSON.stringify(state)}::jsonb,${generation}) ON CONFLICT(kid_id,lesson_id) DO UPDATE SET state=EXCLUDED.state || jsonb_build_object('experiments',COALESCE(ls_progress.state->'experiments','{}'::jsonb)||COALESCE(EXCLUDED.state->'experiments','{}'::jsonb),'completed',(SELECT COALESCE(jsonb_agg(DISTINCT value),'[]'::jsonb) FROM jsonb_array_elements(COALESCE(ls_progress.state->'completed','[]'::jsonb)||(EXCLUDED.state->'completed'))),'found',(SELECT COALESCE(jsonb_agg(DISTINCT value),'[]'::jsonb) FROM jsonb_array_elements(COALESCE(ls_progress.state->'found','[]'::jsonb)||(EXCLUDED.state->'found')))),updated_at=now() WHERE ls_progress.generation=${generation} RETURNING state,generation,updated_at`;
      return rows[0] || null;
    },
    async exportFamily(parentId) {
      const rows = await sql`SELECT id,email,created_at,privacy_version,parent_permission_at,permission_email_sent_at FROM ls_parents WHERE id=${parentId}`;
      if (!rows[0]) return null;
      const kids = await sql`SELECT id,name,avatar,active,created_at FROM ls_kids WHERE parent_id=${parentId} ORDER BY created_at`;
      const progress = await sql`SELECT p.kid_id,p.lesson_id,p.state,p.generation,p.updated_at FROM ls_progress p JOIN ls_kids k ON k.id=p.kid_id WHERE k.parent_id=${parentId}`;
      return privacyExport(rows[0],kids,progress);
    },
    async deleteChild(parentId, id, name) {
      const rows = await sql`WITH removed AS(DELETE FROM ls_kids WHERE id=${id} AND parent_id=${parentId} AND name=${name} RETURNING id), receipt AS(INSERT INTO ls_deletions(subject_id,kind) SELECT id,'kid' FROM removed RETURNING subject_id) SELECT subject_id AS id FROM receipt`;
      return Boolean(rows[0]);
    },
    async deleteFamily(parentId, email) {
      const rows = await sql`WITH removed AS(DELETE FROM ls_parents WHERE id=${parentId} AND email=${email} RETURNING id,email), links AS(DELETE FROM ls_parent_links WHERE email IN(SELECT email FROM removed)), receipt AS(INSERT INTO ls_deletions(subject_id,kind) SELECT id,'parent' FROM removed) SELECT email FROM removed`;
      return Boolean(rows[0]);
    },
    async parentPermission(parentId) {
      await sql`UPDATE ls_parents SET privacy_version=${PRIVACY_VERSION},parent_permission_at=now(),permission_email_sent_at=NULL WHERE id=${parentId}`;
    },
    async permissionConfirmations() {
      return sql`SELECT id,email,parent_permission_at FROM ls_parents WHERE parent_permission_at<now()-interval '30 minutes' AND permission_email_sent_at IS NULL ORDER BY parent_permission_at LIMIT 50`;
    },
    async markPermissionConfirmation(id,permissionAt) {
      await sql`UPDATE ls_parents SET permission_email_sent_at=now() WHERE id=${id} AND parent_permission_at=${permissionAt} AND permission_email_sent_at IS NULL`;
    },
    async cleanup() {
      await sql`DELETE FROM ls_deletions WHERE deleted_at<now()-interval '35 days'`;
      await sql`DELETE FROM ls_sessions WHERE expires_at<now()`;
      await sql`DELETE FROM ls_limits WHERE expires_at<now()-interval '1 day'`;
      await sql`DELETE FROM ls_parent_links WHERE expires_at<now()-interval '1 day'`;
      await sql`DELETE FROM ls_kid_links WHERE expires_at<now()-interval '1 day'`;
    },
  };
}
