import { sql } from "drizzle-orm";
import { db } from "@/db";
import type { ChatPreview } from "./types";

// A message is unread for `userId` when the other side sent it after userId's read marker.
const unreadFor = (userId: string) => sql`
  u.sender_id <> ${userId}
  and u.created_at > coalesce(
    case when m.professional_id = ${userId} then m.professional_last_read_at else m.company_last_read_at end,
    '-infinity'::timestamp
  )`;

/** Last message and unread count of each match, in one query. */
export async function loadChatPreviews(userId: string, matchIds: string[]): Promise<Map<string, ChatPreview>> {
  if (matchIds.length === 0) return new Map();
  const ids = sql.join(matchIds.map((id) => sql`${id}`), sql`, `);
  const rows = await db.execute<{
    match_id: string;
    last_body: string | null;
    last_has_attachment: boolean;
    last_sender_id: string | null;
    unread: number;
  }>(sql`
    select
      m.id as match_id,
      lm.body as last_body,
      lm.attachment_public_id is not null as last_has_attachment,
      lm.sender_id as last_sender_id,
      (select count(*)::int from chat_messages u where u.match_id = m.id and ${unreadFor(userId)}) as unread
    from matches m
    left join lateral (
      select c.body, c.attachment_public_id, c.sender_id
      from chat_messages c
      where c.match_id = m.id
      order by c.created_at desc, c.id desc
      limit 1
    ) lm on true
    where m.id in (${ids})
  `);

  return new Map(
    rows.map((r) => [
      r.match_id,
      {
        lastMessage: r.last_sender_id
          ? { body: r.last_body, hasAttachment: r.last_has_attachment, fromMe: r.last_sender_id === userId }
          : null,
        unread: r.unread,
      },
    ])
  );
}

/** Unread messages across the user's mutual matches (the nav badge). */
export async function unreadTotal(userId: string): Promise<number> {
  const [row] = await db.execute<{ total: number }>(sql`
    select count(*)::int as total
    from chat_messages u
    join matches m on m.id = u.match_id
    where (m.professional_id = ${userId} or m.company_id = ${userId})
      and m.professional_status = 'liked' and m.company_status = 'liked'
      and ${unreadFor(userId)}
  `);
  return row?.total ?? 0;
}
