# DESIGN.md — Helllo Visual System

Source of truth: Figma "Helllo — Brand Identity" (snNq4LfmuM6VuXOrUjwApb). Tokens live in
`src/app/globals.css`; fonts are loaded in `src/app/layout.tsx`; brand assets in
`src/components/brand/` and `public/brand/`.

## Personality
Warm, direct, a little cheeky. The product is a "hello": every match is an icebreaker, not an
application. Flat, saturated colour blocks; pill shapes; one handwritten word at a time.
No gradients, no glassy glows, no serif. Italic only for the match caption (below).

## Colours (Figma variables `colore/*`)
| Token | Hex | Role |
|---|---|---|
| `viola` | `#653171` | All text, icons, outlines, dark blocks |
| `rosso` | `#E93D29` | Logo, primary actions, "available" pills, energetic blocks |
| `rosa` | `#F6B9C9` | Chips, active nav pill, soft blocks, accents on viola/blu |
| `blu` | `#225AD6` | Candidate info card, profile background, verified badge, links/focus |
| `crema` | `#F4E9E9` | Soft surfaces: inputs, placeholders, page sections |
| `bianco` | `#FFFFFF` | App background, cards on colour |

Lines and dividers: viola at 15% (`border-viola/15`) or `viola-100/200`.

Derived scales (use for states, not as new colours):
- `viola-50…950`: the neutral/ink scale (950 = brand viola). Body copy `text-viola`, secondary
  `text-viola-500`, meta `text-viola-400`, borders `viola-100/200`, subtle fills `viola-50`.
- `rosso-50…950`: rosa at 200, brand rosso at 500, deeper reds for hover/text (600/700).
- `blu-50…950`: brand blu at 600.

Pairings that pass contrast: viola on white/crema/rosa; white or crema on viola/blu;
rosa on viola/blu (large or medium text); white on rosso is 4.1:1, so only for bold labels
(buttons, pills), never body copy.
Never rosso text on rosa, never rosa text on white.

Semantic tokens (`primary`, `accent`, `secondary`, `muted`, `ring`, `destructive`…) map onto the
brand palette, so shadcn-style components follow it automatically. `ring` is blu (visible against
rosso buttons). `destructive` is `rosso-700`; pair errors with an icon/text, never colour alone.

## Typography
| Style | Family | Size/LH | Weight | Tracking | Utility |
|---|---|---|---|---|---|
| Display | Hanken Grotesk | 40/44 | 700 | -2% | `text-display` |
| Title | Hanken Grotesk | 28/32 | 700 | -1.5% | `text-title` |
| Prompt | Bricolage Grotesque | 26/32 | 500 | -1% | `font-prompt text-prompt` |
| Body | Hanken Grotesk | 16/22 | 400 | 0 | `text-body` |
| Body Strong | Hanken Grotesk | 16/22 | 500 | 0 | `text-body font-medium` |
| Label | Hanken Grotesk | 13/16 | 500 | 0 | `text-label` |
| Chip | Hanken Grotesk | 14/18 | 500 | 0 | `text-chip` |
| Accent Script | Pacifico | 24/32 | 400 | 0 | `font-script` |
| Match caption | Hanken Grotesk Italic | 28/32 | 900 | -1.5% | `text-[1.75rem] leading-8 font-black italic` |

- `font-sans` and `font-display` are both Hanken Grotesk; headlines are bold and tight.
- `font-prompt` (Bricolage) is the user's own voice: answers to profile prompts, bios, headlines
  someone wrote about themselves, quotes. Medium weight.
- `font-script` (Pacifico) highlights **one word** inside a headline or prompt ("Cerco il
  *primo* lavoro vero."). Never a full sentence, never body copy, never bold/italic. On viola/blu
  it is rosa; on white/crema it is rosso or viola.
- Labels are sentence case, not uppercase-tracked.

## Shape & spacing
- Cards: `rounded-card` (28px), padding 24px, gap 14px. Large illustration blocks 36px.
- Buttons, chips, inputs, nav pills: fully rounded (`rounded-full`).
- Icon buttons: circles with a 1px viola outline on white.
- 8px rhythm. Flat colour blocks instead of shadows; `shadow-card` only for floating layers.

## Components
- **Primary button**: rosso fill, white Hanken bold, pill, height 48–56px. The positive swipe
  action reads "helllo!" (the white wordmark + "!"), the profile CTA "Di' helllo!".
- **Secondary button**: white fill, 1px viola outline, viola text. Tertiary: viola underlined link.
- **Chip**: rosa fill, viola `text-chip`, pill, 8×16 padding. On rosa backgrounds use white chips.
- **Status pill**: rosso fill, white text, white dot ("Disponibile da subito").
- **Prompt card**: coloured block (viola / rosa / rosso / white, rotate through them), label
  13/16 on top (rosa on viola, viola on rosa, white/rosa on rosso), answer in Prompt style.
- **Info row**: 24px viola line icon, label 13/16 over value 16/22 medium, 1px viola/15 divider.
- **Candidate card**: photo area on top, blu info block (name Title white + age regular, role in
  rosa, headline in Prompt with one Pacifico word, location row, chips), round crema
  "expand" button.
- **Bottom nav**: viola line icons; the active item sits in a rosa pill.
- **Match screen** (Figma v2 "titolo energico"): `MatchTitle` (tilted rosso wordmark + "!" +
  blu "È un" sticker) spilling over a rosa block with crema stripes (`MatchStripes`) holding both
  cards tilted ±6°, joined by `LogoMark`; Black Italic caption, rosa icebreaker chips, crema
  message field, rosso CTA. Everything enters one beat at a time.
- **Icons**: lucide, 1.75–2px stroke, viola. Verified = blu filled badge-check.

## Brand assets
- `Logo` (`src/components/brand/Logo.tsx`): the wordmark, `currentColor`, rosso by default;
  white on rosso/blu/viola. Never set the name in type when the logo fits.
- `LogoMark`: round rosso badge with the white "lll".
- `public/brand/pattern-rosa.svg` (viola squiggles on rosa) and `pattern-crema.svg` (blu
  squiggles on crema): hero/banner backgrounds, used with `bg-cover`.
- App icon (rosa + rosso "lll") for the home screen; favicon (rosso + white "l") for tabs.
- Standalone files exported from Figma, in `public/brand/`: `logo-rosso.svg`, `logo-bianco.svg`,
  `logo-viola.svg` (+ `logo-rosso.png`, `logo-bianco.png` for emails), `logo-mark.svg`,
  `favicon.svg`, `app-icon.svg`, `banner-rosa.svg/.png`, `banner-crema.svg/.png` (wordmark on
  pattern, 1920×1080). Wired up by Next: `src/app/icon.svg`, `favicon.ico`, `apple-icon.png`,
  `opengraph-image.png` / `twitter-image.png` (from the rosa banner), PWA icons in `public/icons/`.

## Voice
Italian, informal "tu", short sentences. Say "helllo" where others say "like/candidati":
"Di' helllo!", "È un helllo!", "Vi siete scelti a vicenda. Ora rompete il ghiaccio."
The name is written "Helllo" in running text and as the lowercase wordmark in UI.
