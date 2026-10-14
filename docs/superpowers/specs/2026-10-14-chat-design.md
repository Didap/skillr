# Chat between companies and professionals — design

Date: 2026-10-14 · Branch: `feat/chat` (based on `fix/match-review`)

## Goal

Replace the front-end-only chat preview (the `Icebreaker` in `MatchOverlay`) with a real,
persistent, realtime 1:1 chat between a company and a professional who matched each other.
The chat is a full product feature: the "No Chat" principle in `PRODUCT.md` is removed and
all user-facing "niente chat" copy is rewritten.

### Decisions taken with the product owner

| Topic | Decision |
|---|---|
| Positioning | Full chat, "No Chat" principle removed |
| Who can write | Only the two sides of a **mutual** match (swipe match or accepted application) |
| v1 features | Text messages in realtime, conversation list, unread badges, read receipts, attachments (images/PDF), typing indicator, block, report |
| Where it lives | Inside "Match": `/matches` becomes the inbox, `/matches/[id]` hosts the thread |
| Realtime | Pusher Channels (already in deps and env) |
| Reports | Stored in DB + email to a moderation address; no admin UI in v1 |
| Tests | Add Vitest; integration tests against a dedicated Postgres test DB; manual two-account E2E |

### Out of scope (v1)

Email notifications for unread messages, editing/deleting messages, group conversations,
push notifications, moderation dashboard, message search.

## Data model (`src/db/schema.ts`)

A mutual match **is** the conversation, so there is no `conversations` table.

### New table `chat_messages`

The name avoids the legacy `messages` table created by the stale `0001` migration, which may
still exist in some databases with a different shape.

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | `crypto.randomUUID()` like the rest of the schema |
| `match_id` | text, not null | → `matches.id`, `on delete cascade` |
| `sender_id` | text, not null | → `user.id`, `on delete cascade` |
| `body` | text, nullable | trimmed, 1–2000 chars; null only when an attachment is present |
| `attachment_public_id` | text, nullable | Cloudinary public id (`authenticated` delivery type) |
| `attachment_name` | text, nullable | original file name, for display |
| `attachment_mime` | text, nullable | `image/*` or `application/pdf` |
| `attachment_size` | integer, nullable | bytes |
| `created_at` | timestamp, not null, default now | |

Index: `(match_id, created_at)`. Check constraint: `body is not null or attachment_public_id is not null`.

### New columns on `matches`

| Column | Type | Notes |
|---|---|---|
| `professional_last_read_at` | timestamp, nullable | last time the professional read the thread |
| `company_last_read_at` | timestamp, nullable | same for the company |
| `last_message_at` | timestamp, nullable | denormalized, set on every send; drives inbox ordering |
| `blocked_by_id` | text, nullable | → `user.id`, `on delete set null` |
| `blocked_at` | timestamp, nullable | |

Derived state:

- **Read receipt**: a message I sent is "Letto" when the other side's `*_last_read_at >= message.created_at`.
- **Unread count** for me: messages in the match with `sender_id != me` and `created_at > my *_last_read_at` (all of them when it is null).
- **Blocked**: `blocked_by_id is not null`. Nobody can send; only `blocked_by_id` can unblock.

### New table `chat_reports`

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | |
| `match_id` | text, not null | → `matches.id`, cascade |
| `reporter_id` | text, not null | → `user.id`, cascade |
| `message_id` | text, nullable | → `chat_messages.id`, `on delete set null` |
| `reason` | enum `chat_report_reason` | `spam`, `harassment`, `inappropriate`, `scam`, `other` |
| `details` | text, nullable | max 1000 chars |
| `created_at` | timestamp, default now | |

Relations: `matchesRelations` gains `messages` and `reports`; `chatMessagesRelations` and
`chatReportsRelations` point back to match/sender/reporter.

Schema changes are applied with `npm run db:push`, as the project does today.

## Server code

### Access rule (shared helper)

`src/lib/chat/access.ts` exports `loadConversation(matchId, userId)` returning the match row
with the viewer's side (`"professional" | "company"`) or an error. It rejects when:

1. the match does not exist → `"Conversazione non trovata"`
2. the viewer is neither `professional_id` nor `company_id` → `"Non autorizzato"`
3. the match is not mutual (`professional_status = 'liked' and company_status = 'liked'`) → `"Conversazione non disponibile"`

Every chat action and the Pusher auth route go through it.

### Server actions — `src/app/actions/chat.ts`

All return `{ success: true, data } | { error: string }` with Italian error strings, like the
rest of `src/app/actions`.

| Action | Behaviour |
|---|---|
| `getMatches()` (existing, extended) | The `/matches` list already loads the viewer's mutual matches with counterpart and call state. Each row gains `chat: { lastMessage, lastMessageAt, unread, blocked }` from one aggregate query (`loadChatSummaries` in `src/lib/chat/summaries.ts`, lateral join for the last message + correlated count for unread, no N+1), and rows are ordered by `coalesce(last_message_at, matched_at)` desc. No separate `getConversations` action: the inbox *is* the match list. |
| `getUnreadTotal()` | Total unread messages across the viewer's conversations, for the nav badge. |
| `getMessages(matchId, { before?, after? })` | Page of up to 50 messages. `before` (cursor on `created_at`, then `id`) loads older ones; `after` fetches anything newer than the last seen message (reconnect catch-up). Cursors are message ids (compared as `(created_at, id)` in SQL, so millisecond truncation in JS never skips or repeats a message). Attachments come back with a Cloudinary signed delivery URL. Also returns the other side's `last_read_at`, the blocked state and who blocked. |
| `sendMessage(matchId, { body?, attachment?, clientId })` | Zod-validated. Rejects empty, >2000 chars, blocked, not mutual, rate-limited (more than 20 messages by this sender in the last 10 s, counted in DB). Inserts the row, updates `last_message_at` and the sender's own `*_last_read_at`, then triggers Pusher events. Returns the stored message plus the echoed `clientId` so the client can reconcile its optimistic bubble. |
| `uploadChatAttachment(matchId, formData)` | Checks access and not blocked; accepts `image/jpeg`, `image/png`, `image/webp`, `image/gif` and `application/pdf` up to 5 MB; uploads to Cloudinary folder `helllo/chat/{matchId}` with `type: "authenticated"`, `resource_type: "image"` (Cloudinary treats PDFs as images); returns `{ publicId, name, mime, size }`. `sendMessage` re-checks that the public id is under the match folder. |
| `markRead(matchId)` | Sets the viewer's `*_last_read_at = now()`, triggers `message:read` on the thread and `inbox:update` on the viewer's own user channel (badge sync across tabs). |
| `blockConversation(matchId)` | Sets `blocked_by_id` / `blocked_at` if not already blocked; triggers `conversation:blocked`. |
| `unblockConversation(matchId)` | Only `blocked_by_id` can unblock; clears both columns; triggers `conversation:unblocked`. |
| `reportConversation(matchId, { reason, details?, messageId?, block })` | Inserts into `chat_reports`, emails `CHAT_MODERATION_EMAIL` via `sendInBackground` (skipped with a console warning if unset), optionally blocks. |

### Realtime — Pusher

- `src/lib/pusher/server.ts`: lazy singleton from `PUSHER_APP_ID`, `NEXT_PUBLIC_PUSHER_KEY`,
  `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_CLUSTER`. If any is missing it returns `null` and every
  `publish()` becomes a no-op: the DB stays the source of truth.
- `src/lib/pusher/client.ts`: lazy `pusher-js` singleton with `channelAuthorization` pointing
  at `/api/pusher/auth`; `null` when the public key is missing.
- Channels:
  - `private-match-{matchId}`: `message:new`, `message:read`, `conversation:blocked`,
    `conversation:unblocked`, plus client event `client-typing`.
  - `private-user-{userId}`: `inbox:update` (`{ matchId }`), used by the inbox and the badge.
- Server triggers pass the sender's `socket_id` (sent by the client with the action) so the
  sender's own tab does not receive a duplicate.
- `src/app/api/pusher/auth/route.ts` (POST, `x-www-form-urlencoded` with `socket_id` and
  `channel_name`): reads the session with `auth()`, authorizes `private-user-{id}` only for
  that user and `private-match-{id}` only when `loadConversation` succeeds; 403 otherwise.
  `/api` is already excluded from the `src/proxy.ts` matcher.
- **Pusher dashboard requirement**: "Enable client events" must be on for the app, otherwise
  typing indicators silently do nothing (everything else still works).

### Attachment URLs

Attachments are uploaded as Cloudinary `authenticated` resources: the plain public URL returns
401, only URLs signed with our API secret (`cloudinary.url(publicId, { type: "authenticated",
sign_url: true, ... })`) are served. Signed URLs are generated server-side for participants
only. They do not expire (expiring URLs need Cloudinary token auth, a paid add-on), which is
acceptable: they are unguessable and only handed to the two participants.

### Message payload shape (server → client)

```ts
type ChatMessage = {
  id: string;
  matchId: string;
  senderId: string;
  body: string | null;
  attachment: { url: string; name: string; mime: string; size: number } | null;
  createdAt: string; // ISO
};
```

Pusher events carry the same payload, signed URL included (Pusher only relays it over TLS
and does not store it). Payloads stay well under Pusher's 10 KB limit (body ≤ 2000 chars).

## Client

### Hook `useChatThread(matchId, initial)` — `src/components/chat/useChatThread.ts`

Owns the thread state: messages (deduplicated by `id`, optimistic ones by `clientId`),
pending/failed status per optimistic message, other side's `lastReadAt`, blocked state,
typing state.

- Subscribes to `private-match-{matchId}` when Pusher is available.
- On `pusher` `connected` after a disconnect, and on `visibilitychange` to visible, calls
  `getMessages(after: lastId)` to fill any gap.
- **Fallback**: when Pusher is unavailable or the connection state is `unavailable`/`failed`,
  polls `getMessages(after)` every 10 s while the document is visible.
- Calls `markRead` when a new message from the other side arrives while the thread is visible,
  and on mount.
- Typing: `client-typing` sent at most once every 3 s while the input changes; the indicator
  hides 5 s after the last event or when a message from that user arrives.

### `ChatRealtimeProvider` — `src/components/chat/ChatRealtimeProvider.tsx`

Mounted once in `AppShell`, so the sidebar, the tab bar and the inbox share one subscription
to `private-user-{me}`. It loads `getUnreadTotal()`, refetches it on `inbox:update` (and every
60 s as a fallback without Pusher), and exposes `{ unreadTotal, refreshUnread, onInboxUpdate }`
through `useChatRealtime()`. `DashboardSidebar` and `MobileTabBar` show a badge on the
"Match" item.

### Components (`src/components/chat/`)

- `ChatThread`: message list (grouped by day, own bubbles `bg-viola` as in the current
  `Icebreaker`), "Carica precedenti", read ticks on the last own message ("Inviato" / "Letto"),
  typing indicator, blocked banner, composer.
- `ChatComposer`: textarea (Enter sends, Shift+Enter new line, 2000-char limit with counter
  near the limit), attach button (image/PDF, 5 MB, preview chip before sending), send button
  disabled while empty. Failed messages show "Non inviato · Riprova" and keep their text.
- `ChatAttachment`: image thumbnail opening full size, or PDF card with name/size and download.
- `ChatMenu`: ⋯ menu with "Blocca" / "Sblocca", "Segnala", "Segnala e blocca"; report opens a
  dialog with reason radio list and optional details.
- `ConversationRow`: inbox row with avatar, name, last message preview (or "📎 Allegato"),
  relative time (`date-fns`, `it` locale), unread badge.

Visual language follows `DESIGN.md` / the Helllo tokens in `globals.css`; no new colours.

### Pages

- `/matches` (`src/app/(app)/matches/page.tsx`): the list becomes the inbox using the
  extended `getMatches()`, refreshed via `onInboxUpdate`. Existing call/review state indicators on
  each row stay. The "Zero chat, massima efficienza" aside is replaced.
- `/matches/[id]`: two-column layout from `md` up (details + booking left, `ChatThread`
  right); on mobile a segmented control "Chat" / "Dettagli", defaulting to "Chat". Initial
  messages are fetched server-side in the page's existing `Promise.all`. The "Zero messaggi,
  solo match." line is replaced.
- `MatchOverlay`: `Icebreaker` calls `sendMessage` for real; the "Anteprima: la chat non è
  ancora attiva" disclaimer goes away; after the first send it offers "Apri la chat" linking to
  `/matches/{matchId}`. The dev preview (`matchId="preview"`) keeps a local-only mode.
- Nav badge: "Match" item in `DashboardSidebar` and `MobileTabBar` shows the unread total.

## Error handling

| Situation | Behaviour |
|---|---|
| Send fails (network, validation, rate limit) | Bubble turns to failed state with the server's message and "Riprova"; text and attachment kept |
| Conversation blocked while typing | Send returns error, composer replaced by blocked banner (also pushed via `conversation:blocked`) |
| Match no longer mutual / deleted | Page `notFound()`; actions return error; Pusher auth 403 |
| Pusher keys missing / service down | No realtime, 10 s polling while visible; no user-facing error |
| Upload too large / wrong type | Inline error in composer before upload starts (client check) and on server |
| Cloudinary failure | Error toast via `sonner`; message not sent |

## Copy and docs

- `PRODUCT.md`: remove Strategic Principle 2 "No Chat"; update line 8 ("quick call booking
  without chat loops") to describe chat + call booking.
- `DESIGN.md`: add a Chat section (bubbles, composer, inbox row, badge).
- Rewrite "niente chat" copy: `src/app/page.tsx:38`, `src/components/landing/Hero.tsx:50`,
  `src/components/landing/Faq.tsx:9-10` (question replaced), `src/components/landing/HowItWorks.tsx:64`,
  `src/app/terms/page.tsx:20`, `src/app/(app)/matches/page.tsx:262-270`,
  `src/app/(app)/matches/[id]/page.tsx:208`.
- Terms: add a section on chat conduct, reports and blocking.
- `src/emails/MatchEmail.tsx:64`: CTA becomes "Apri la chat" (link unchanged).
- `.env.example`: add `CHAT_MODERATION_EMAIL`.

## Testing

- Add `vitest` (+ `vite-tsconfig-paths` for the `@/` alias) and `npm test`.
- Integration tests run against a separate database `helllo_test` on the Docker Postgres
  (`TEST_DATABASE_URL`); a global setup pushes the schema and each test truncates the chat
  tables and seeds two users + a mutual match. `auth()` / `requireUser` and the Pusher server
  module are mocked.
- Covered: access rule (stranger, non-mutual, missing match), send validation (empty, too
  long, attachment outside match folder), rate limit, blocked send, unblock only by blocker,
  unread counts and read receipts across both sides, pagination `before` / `after`,
  conversation ordering, report insert + optional block, Pusher auth route allow/deny.
- Manual E2E in the browser with two accounts (company + professional) in two windows:
  realtime send both ways, attachments (image + PDF), read receipts, typing, block/unblock,
  report, nav badge, MatchOverlay first message, and the polling fallback with Pusher keys
  removed.

## Rollout notes

- Run `npm run db:push` on each environment; check whether a legacy `messages` table exists
  and leave it untouched (drop separately if unused).
- Enable client events in the Pusher dashboard.
- Set `CHAT_MODERATION_EMAIL`.
- Cloudinary: Settings → Security → enable "Allow delivery of PDF and ZIP files", otherwise
  PDF attachments upload but return 401 on download (free plans block PDF delivery by default).
