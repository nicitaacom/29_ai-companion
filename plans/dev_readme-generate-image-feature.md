# Plan: `/generate-image` route (image + video AI generation)

> **⚠️ DECIDED AGAINST — full 51-model catalog**
>
> After reviewing the scope, this plan's original vision (supporting all 51 image/video models as live API calls) is **not happening**. Reasons:
>
> 1. **Focus.** Focus on one project at a time. Don't spread attention across 500 model integrations.
> 2. **No API key for most models.** "DaVinci Ultra" and most others are proprietary models with no public API key — they're their own thing (NSFW, research, etc.).
> 3. **Time + Cost.** Building integrations for 51 models would waste enormous time and tokens for a feature only the developer will ever use. This website has zero users — no need to reinvent the wheel.
> 4. **Impractical registration.** Supporting all image/video models would require registering on 100500+ websites and topping up minimal balances on each. Makes no sense.
>
> **Bottom line:** FOCUS and TIME are the biggest reasons. This plan is now scoped to **one working model** (OpenAI / DALL-E via the user's API key). All other models remain listed in the UI but are marked as "request within 24h" (not yet available). The rest of this document is historical — the implementation follows the simplified scope below.

This is a planning document for a new chat session to implement. Read `dev_readme-eslint.md` first -
this repo's ESLint (`eslint.config.mjs`) fully enforces its conventions (T/I type prefixes, `useXxx`
hook naming, `imports-order`, `response-variable-naming`, `api-folder-requires-api-namespace`, etc.);
code that doesn't follow them will fail `pnpm lint` / `pnpm build`.

**If you want NSFW content:** just use [davinci.ai](https://davinci.ai/app/explore) and save yourself time and money

### What models for NSFW I tried

DaVinci - the best but has no API - https://davinci.ai/app/explore
Seedream 3.0 L and 4.5 - no NSFW support - https://ai.byteplus.com/lumina/en/model/image?mode=image
GPT Image 2 - very hard and strict rules when it comes even close to NSFW (e.g kiss or BH or only panties)
Flux - NSFW not supported

<br/>

## 1. What this feature is

A standalone AI media generation tool at `/generate-image`, separate from the existing
companion/chat flow. A user picks a model (from a large catalog of third-party image or video
generation models), writes a prompt, generates, and can download the result. Nothing is stored
server-side - reloading the page loses all generated media (matches the "we do not store images"
NoteBadge copy). Two `NoteBadge`s explain this and cross-sell the existing companion-creation flow
("share your generated image by turning it into an AI avatar people can chat with").

Two generation modes behind one UI, switched by a toggle:

- **Image mode** - **exactly 25 models**, no subset (full list in section 3).
- **Video mode** - **exactly 26 models**, no subset (full list in section 3), each with a resolution
  range, duration range, and whether audio is supported.

**On "don't skip models" (confirmed):** section 3 below now transcribes the complete catalog as real
`const` data, not a "~N, etc." summary - every model from the source list has its own entry, nothing
trimmed for v1. That said, there are **two separate promises** being made here and only one of them is
fully under this plan's control:

1. **The UI shows all 51 models, unconditionally.** This is just static array data - guaranteed by
   writing it out in full, which section 3 now does.
2. **Every model actually generates real output when clicked.** This depends entirely on open question
   7.1 (which provider/gateway backs this) - a single aggregator API may not literally offer all 51 of
   these exact branded variants (some names here - "DaVinci Ultra," "Microsoft MAI Image 2.5," "Kling
   O3 Omni," "HeyGen V3 Video Agent" - are unusual enough that they read like one specific aggregator's
   own catalog naming, not a generic set every gateway carries). If the chosen gateway is missing any of
   these, the honest fix is either finding a gateway that has the full set, or - if a handful are truly
   unavailable anywhere - telling the user which ones and why, not quietly dropping them from the array
   without saying so. Don't promise (2) is solved until question 7.1 is answered against a real gateway's
   actual model list.

All video models (UI MUST show these):

Model Type
Close

Seedance 2.0 Fast
FAST
480p - 720p
4 - 15”
Audio
From
20

Seedance 2.0
TRENDING
480p - 4K
4 - 15”
Audio
From
29

Kling O3 Omni
HOT
720p - 4K
3 - 15”
Audio
From
18

Gemini Omni Flash
3 - 10”
From
28

Sora 2
720p
4 - 20”
Audio
From
30

Grok
LOW COST
480p - 720p
3 - 15”
Audio
From
11

Veo 3.1 Fast
FAST
720p - 1080p
4 - 8”
Audio
From
25

Runway Gen 4.5
2 - 10”
Audio
From
23

Kling O3 Edit
720p - 1080p
Audio
From
29

Kling 3.0
DISCOUNT
720p - 4K
3 - 15”
Audio
From
19

Sora 2 Pro
720p - 1080p
4 - 20”
Audio
From
80

Wan 2.7
720p - 1080p
10 - 15”
From
23

Veo 3.1
FEATURED
720p - 1080p
4 - 8”
Audio
From
35

Grok Video Edit
480p - 720p
Audio
From
13

WAN 2.7 Edit
720p - 1080p
2 - 10”
Audio
From
23

Runway Aleph 2.0
Audio
From
60

Kling Motion 2.6
720p - 1080p
Audio
From
19

Kling Motion 3.0
720p - 1080p
Audio
From
53

Seedance 1.5 Pro
480p - 1080p
4 - 12”
Audio
From
5

Wan 2.6
720p - 1080p
5 - 15”
Audio
From
23

Kling 2.6
5 - 10”
Audio
From
15

HeyGen V3 Video Agent
From
22

Luma Ray v3.2
720p - 1080p
From
13

Luma Dream Machine
720p - 1080p
From
13

Minimax Hailuo 2.3
720p - 1080p
From
10

PixVerse V6
720p - 1080p
1 - 15”
Audio
From
19

All image models:
Select Model

Best for
Close

Nano Banana Pro
DISCOUNT
From
25

Nano Banana 2
FAST
From
25

Nano Banana
From
13

GPT Image 2
FEATURED
From
20

Seedream 5.0
From
15

Seedream 4.5
TRENDING
From
13

Grok Pro
HOT
From
14

DaVinci Ultra
From
15

Grok
From
10

Flux 2
From
12

Flux 2 Turbo
FAST
LOW COST
From
9

Ideogram 3.0
From
15

Ideogram 4.0
From
15

Recraft V4.1
From
15

Recraft V3
From
13

Recraft V4.1 Pro
From
20

Seedream 4.0
From
15

GPT Image 1
From
9

Flux Pro Kontext
From
11

Qwen Image
From
9

Seedream 5.0 Pro
TRENDING
From
20

Krea 2
From
15

Microsoft MAI Image 2.5
From
15

Qwen Image 2 Pro
From
20

Qwen Image 2
From
15
Nano Banana Pro
Photorealistic visuals ideal for ads and text

Aspect Ratio

1:1
Use Model

<br/>

## 2. Route & file structure

Follow the existing route-group convention (`app/(root)/(routes)/companion/`,
`app/(root)/(routes)/settings/`):

```
app/(root)/(routes)/generate-image/
├── page.tsx                          # server component shell, renders the client component
├── components/
│   ├── GenerateImageClient.tsx       # "use client" - top-level orchestrator
│   ├── ModeSwitch.tsx                # Image / Video segmented toggle
│   ├── ModelSelectorDialog.tsx       # the "Select Model" modal from the screenshots
│   ├── ModelCard.tsx                 # one tile in the model grid
│   ├── GenerationForm.tsx            # prompt input + model-specific options + generate button
│   └── GenerationResultGrid.tsx      # ephemeral gallery of this session's generated media
├── hooks/
│   ├── useGenerateImageHandlers.ts   # handleSelectModel, handleToggleMode, handleGenerate,
│   │                                  # handleDownload, handleSelectPreset
│   └── useSetGenerateImage.ts        # only if something needs an initial fetch on mount - likely NOT
│                                      # needed since the model catalog is static const data, not fetched
├── consts/
│   ├── IMAGE_MODELS.ts               # TGenerationModel[] - see section 3
│   ├── VIDEO_MODELS.ts               # TGenerationModel[] - see section 3
│   └── GENERATION_PRESETS.ts         # TGenerationPreset[] - see section 4's "Why we are different?" subsection
└── store/
    └── useGenerateImage.ts           # zustand, NO persist() - ephemeral by design, so per
                                       # hook-naming-convention this is named without the "Store"
                                       # suffix (persist = Store suffix; no persist = plain useXxx)
```

Note the store's name: `hook-naming-convention` (ESLint) requires `useXxxStore.ts` to call
`persist(...)`. Since this store is intentionally ephemeral (reload = lose everything, that's a
stated feature, not a bug), it must be named `useGenerateImage`, not `useGenerateImageStore`.

<br/>

## 3. Data model

```ts
// consts/IMAGE_MODELS.ts / VIDEO_MODELS.ts
type TModelBadge = "DISCOUNT" | "FAST" | "FEATURED" | "TRENDING" | "HOT" | "LOW COST"

type TGenerationModel = {
  id: string // slug, e.g. "nano-banana-pro"
  name: string // "Nano Banana Pro"
  badges: TModelBadge[] // can have more than one, e.g. Flux 2 Turbo has FAST + LOW COST
  priceFromUsd: number // real USD, e.g. 0.25 - NOT the raw screenshot numbers as-is, see
  // the pricing-scale open question in section 7
  kind: "image" | "video"
  // video-only fields:
  resolutionRange?: string // "480p - 4K"
  durationRangeSec?: string // "4 - 15" (the " character in the screenshots is a typographic
  // quote for seconds, not a literal field name - store as a plain string)
  hasAudio?: boolean
}
```

Two arrays (`IMAGE_MODELS`, `VIDEO_MODELS`), each `as const satisfies TGenerationModel[]`, transcribed
below in full from the model list the user provided - **all 25 image + 26 video entries, none omitted**.
This catalog will drift from whatever the real upstream provider(s) offer - treat it as a starting
snapshot, not a source of truth to keep in sync by hand long-term (see open question in section 6 about
where this list should actually live). `priceFromUsd` is copied verbatim as the raw number from the
source list (9-80) - **not yet a confirmed USD amount**, see open question 7.5, don't treat these as
final prices.

```ts
// consts/IMAGE_MODELS.ts - all 25, in source order
export const IMAGE_MODELS = [
  { id: "nano-banana-pro", name: "Nano Banana Pro", badges: ["DISCOUNT"], priceFromUsd: 25, kind: "image" },
  { id: "nano-banana-2", name: "Nano Banana 2", badges: ["FAST"], priceFromUsd: 25, kind: "image" },
  { id: "nano-banana", name: "Nano Banana", badges: [], priceFromUsd: 13, kind: "image" },
  { id: "gpt-image-2", name: "GPT Image 2", badges: ["FEATURED"], priceFromUsd: 20, kind: "image" },
  { id: "seedream-5-0", name: "Seedream 5.0", badges: [], priceFromUsd: 15, kind: "image" },
  { id: "seedream-4-5", name: "Seedream 4.5", badges: ["TRENDING"], priceFromUsd: 13, kind: "image" },
  { id: "grok-pro-image", name: "Grok Pro", badges: ["HOT"], priceFromUsd: 14, kind: "image" },
  { id: "davinci-ultra", name: "DaVinci Ultra", badges: [], priceFromUsd: 15, kind: "image" },
  { id: "grok-image", name: "Grok", badges: [], priceFromUsd: 10, kind: "image" },
  { id: "flux-2", name: "Flux 2", badges: [], priceFromUsd: 12, kind: "image" },
  { id: "flux-2-turbo", name: "Flux 2 Turbo", badges: ["FAST", "LOW COST"], priceFromUsd: 9, kind: "image" },
  { id: "ideogram-3-0", name: "Ideogram 3.0", badges: [], priceFromUsd: 15, kind: "image" },
  { id: "ideogram-4-0", name: "Ideogram 4.0", badges: [], priceFromUsd: 15, kind: "image" },
  { id: "recraft-v4-1", name: "Recraft V4.1", badges: [], priceFromUsd: 15, kind: "image" },
  { id: "recraft-v3", name: "Recraft V3", badges: [], priceFromUsd: 13, kind: "image" },
  { id: "recraft-v4-1-pro", name: "Recraft V4.1 Pro", badges: [], priceFromUsd: 20, kind: "image" },
  { id: "seedream-4-0", name: "Seedream 4.0", badges: [], priceFromUsd: 15, kind: "image" },
  { id: "gpt-image-1", name: "GPT Image 1", badges: [], priceFromUsd: 9, kind: "image" },
  { id: "flux-pro-kontext", name: "Flux Pro Kontext", badges: [], priceFromUsd: 11, kind: "image" },
  { id: "qwen-image", name: "Qwen Image", badges: [], priceFromUsd: 9, kind: "image" },
  { id: "seedream-5-0-pro", name: "Seedream 5.0 Pro", badges: ["TRENDING"], priceFromUsd: 20, kind: "image" },
  { id: "krea-2", name: "Krea 2", badges: [], priceFromUsd: 15, kind: "image" },
  { id: "microsoft-mai-image-2-5", name: "Microsoft MAI Image 2.5", badges: [], priceFromUsd: 15, kind: "image" },
  { id: "qwen-image-2-pro", name: "Qwen Image 2 Pro", badges: [], priceFromUsd: 20, kind: "image" },
  { id: "qwen-image-2", name: "Qwen Image 2", badges: [], priceFromUsd: 15, kind: "image" },
] as const satisfies TGenerationModel[]

// consts/VIDEO_MODELS.ts - all 26, in source order. Fields left out below (no resolutionRange /
// durationRangeSec / hasAudio) mean the source list didn't show that field for that row - confirm
// against the real provider before shipping, don't guess a value to fill the gap.
export const VIDEO_MODELS = [
  {
    id: "seedance-2-0-fast",
    name: "Seedance 2.0 Fast",
    badges: ["FAST"],
    priceFromUsd: 20,
    kind: "video",
    resolutionRange: "480p - 720p",
    durationRangeSec: "4 - 15",
    hasAudio: true,
  },
  {
    id: "seedance-2-0",
    name: "Seedance 2.0",
    badges: ["TRENDING"],
    priceFromUsd: 29,
    kind: "video",
    resolutionRange: "480p - 4K",
    durationRangeSec: "4 - 15",
    hasAudio: true,
  },
  {
    id: "kling-o3-omni",
    name: "Kling O3 Omni",
    badges: ["HOT"],
    priceFromUsd: 18,
    kind: "video",
    resolutionRange: "720p - 4K",
    durationRangeSec: "3 - 15",
    hasAudio: true,
  },
  {
    id: "gemini-omni-flash",
    name: "Gemini Omni Flash",
    badges: [],
    priceFromUsd: 28,
    kind: "video",
    durationRangeSec: "3 - 10",
    hasAudio: false,
  },
  {
    id: "sora-2",
    name: "Sora 2",
    badges: [],
    priceFromUsd: 30,
    kind: "video",
    resolutionRange: "720p",
    durationRangeSec: "4 - 20",
    hasAudio: true,
  },
  {
    id: "grok-video",
    name: "Grok",
    badges: ["LOW COST"],
    priceFromUsd: 11,
    kind: "video",
    resolutionRange: "480p - 720p",
    durationRangeSec: "3 - 15",
    hasAudio: true,
  },
  {
    id: "veo-3-1-fast",
    name: "Veo 3.1 Fast",
    badges: ["FAST"],
    priceFromUsd: 25,
    kind: "video",
    resolutionRange: "720p - 1080p",
    durationRangeSec: "4 - 8",
    hasAudio: true,
  },
  {
    id: "runway-gen-4-5",
    name: "Runway Gen 4.5",
    badges: [],
    priceFromUsd: 23,
    kind: "video",
    durationRangeSec: "2 - 10",
    hasAudio: true,
  },
  {
    id: "kling-o3-edit",
    name: "Kling O3 Edit",
    badges: [],
    priceFromUsd: 29,
    kind: "video",
    resolutionRange: "720p - 1080p",
    hasAudio: true,
  },
  {
    id: "kling-3-0",
    name: "Kling 3.0",
    badges: ["DISCOUNT"],
    priceFromUsd: 19,
    kind: "video",
    resolutionRange: "720p - 4K",
    durationRangeSec: "3 - 15",
    hasAudio: true,
  },
  {
    id: "sora-2-pro",
    name: "Sora 2 Pro",
    badges: [],
    priceFromUsd: 80,
    kind: "video",
    resolutionRange: "720p - 1080p",
    durationRangeSec: "4 - 20",
    hasAudio: true,
  },
  {
    id: "wan-2-7",
    name: "Wan 2.7",
    badges: [],
    priceFromUsd: 23,
    kind: "video",
    resolutionRange: "720p - 1080p",
    durationRangeSec: "10 - 15",
    hasAudio: false,
  },
  {
    id: "veo-3-1",
    name: "Veo 3.1",
    badges: ["FEATURED"],
    priceFromUsd: 35,
    kind: "video",
    resolutionRange: "720p - 1080p",
    durationRangeSec: "4 - 8",
    hasAudio: true,
  },
  {
    id: "grok-video-edit",
    name: "Grok Video Edit",
    badges: [],
    priceFromUsd: 13,
    kind: "video",
    resolutionRange: "480p - 720p",
    hasAudio: true,
  },
  {
    id: "wan-2-7-edit",
    name: "WAN 2.7 Edit",
    badges: [],
    priceFromUsd: 23,
    kind: "video",
    resolutionRange: "720p - 1080p",
    durationRangeSec: "2 - 10",
    hasAudio: true,
  },
  { id: "runway-aleph-2-0", name: "Runway Aleph 2.0", badges: [], priceFromUsd: 60, kind: "video", hasAudio: true },
  {
    id: "kling-motion-2-6",
    name: "Kling Motion 2.6",
    badges: [],
    priceFromUsd: 19,
    kind: "video",
    resolutionRange: "720p - 1080p",
    hasAudio: true,
  },
  {
    id: "kling-motion-3-0",
    name: "Kling Motion 3.0",
    badges: [],
    priceFromUsd: 53,
    kind: "video",
    resolutionRange: "720p - 1080p",
    hasAudio: true,
  },
  {
    id: "seedance-1-5-pro",
    name: "Seedance 1.5 Pro",
    badges: [],
    priceFromUsd: 5,
    kind: "video",
    resolutionRange: "480p - 1080p",
    durationRangeSec: "4 - 12",
    hasAudio: true,
  },
  {
    id: "wan-2-6",
    name: "Wan 2.6",
    badges: [],
    priceFromUsd: 23,
    kind: "video",
    resolutionRange: "720p - 1080p",
    durationRangeSec: "5 - 15",
    hasAudio: true,
  },
  {
    id: "kling-2-6",
    name: "Kling 2.6",
    badges: [],
    priceFromUsd: 15,
    kind: "video",
    durationRangeSec: "5 - 10",
    hasAudio: true,
  },
  { id: "heygen-v3-video-agent", name: "HeyGen V3 Video Agent", badges: [], priceFromUsd: 22, kind: "video" },
  {
    id: "luma-ray-v3-2",
    name: "Luma Ray v3.2",
    badges: [],
    priceFromUsd: 13,
    kind: "video",
    resolutionRange: "720p - 1080p",
    hasAudio: false,
  },
  {
    id: "luma-dream-machine",
    name: "Luma Dream Machine",
    badges: [],
    priceFromUsd: 13,
    kind: "video",
    resolutionRange: "720p - 1080p",
    hasAudio: false,
  },
  {
    id: "minimax-hailuo-2-3",
    name: "Minimax Hailuo 2.3",
    badges: [],
    priceFromUsd: 10,
    kind: "video",
    resolutionRange: "720p - 1080p",
    hasAudio: false,
  },
  {
    id: "pixverse-v6",
    name: "PixVerse V6",
    badges: [],
    priceFromUsd: 19,
    kind: "video",
    resolutionRange: "720p - 1080p",
    durationRangeSec: "1 - 15",
    hasAudio: true,
  },
] as const satisfies TGenerationModel[]
```

**Rows with a missing `resolutionRange`/`durationRangeSec` above** (Gemini Omni Flash's resolution,
Runway Gen 4.5's resolution, Kling O3 Edit's duration, Grok Video Edit's duration, Runway Aleph 2.0's
resolution+duration, Kling Motion 2.6/3.0's duration, Kling 2.6's resolution, HeyGen V3 Video Agent's
resolution+duration) reflect exactly what was and wasn't present in the source list for that row - don't
backfill a guessed range to make the table look complete. Confirm the real values with the user or the
provider's own docs before `GenerationForm` (section 4) tries to render/parse a field that's actually
`undefined` for these models.

**Two `Grok`-named entries exist** (`grok-pro-image`/`grok-image` in the image list, `grok-video` in the
video list) - the source list itself reuses the bare name "Grok" for both an image model and a video
model with no further disambiguation. The `id` slugs above disambiguate them for code purposes; the
`name` shown in the UI should probably stay exactly "Grok"/"Grok Pro" as given, since `ModelCard`s are
already segmented by mode (image grid vs. video grid) so the duplicate display name isn't actually
ambiguous to a user looking at one grid at a time.

<br/>

## 4. UI components, in depth

### `ModeSwitch`

A two-option segmented control (Image / Video), similar to the existing `variant` toggle in
`UserNotAuthenticatedContent.tsx` (`twMerge` + active/inactive class pattern) - reuse that same
visual pattern rather than inventing a new one.

### `ModelSelectorDialog`

Build on the existing `Dialog`/`DialogContent` (`components/ui/dialog.tsx`) - it already supports
everything the screenshot needs: a header ("Select Model"), a close button (`DialogClose` already
renders one), and scrollable content. Inside:

- A "Best for" filter (screenshots show it as a small pill row at the top) - can be deferred to a v2
  if the model catalog doesn't have per-model "best for" tags yet; don't invent tag data that isn't
  in the source screenshots.
- A responsive grid of `ModelCard` components, one per model in the active mode's array.

### `Badge` (plain pill, not `NoteBadge`)

A small, non-dismissible label pill - visually and functionally different from `NoteBadge` (which is
a whole callout box with an icon and a sentence). This one is just a tag: `px-2 py-1 flex
justify-center items-center rounded`, background a translucent tint of a color, text the color's
solid form. Doesn't exist in this repo yet (`components/ui/badge.tsx` - kebab-case, matching every
other file in that folder - exporting `Badge`).

The `bg-brand/40` in the original ask assumes a `brand` color token that doesn't exist in
`tailwind.config.ts` (this repo's palette is the shadcn default set - see the `NoteBadge` subsection
above for the exact same situation with `info`/`warning`/`danger`). Either add a `brand` token the
same way (CSS custom property in `app/globals.css` + wired into `tailwind.config.ts`), or just use
the existing `primary` token (`bg-primary/40`) if this project doesn't want a whole new brand color
for one badge - a judgment call, not a hard requirement either way.

Reused in two places, so build it generic (a `variant`/`color` prop), not hardcoded to "PRO":

- The `ModelCard` badge pills (`DISCOUNT`/`FAST`/`FEATURED`/`TRENDING`/`HOT`/`LOW COST` from section
  3's `TModelBadge`) - color-code by type (`HOT` red/orange, `FAST` blue, `TRENDING` purple,
  `DISCOUNT` green, `FEATURED` primary, `LOW COST` neutral), each just `<Badge variant="...">HOT</Badge>`.
- The "PRO" badge described below.

### "PRO" badge

A single `<Badge>PRO</Badge>` instance, placed near the page header / balance chip. Communicates that
the user's subscription tier is PRO - and that this is **free for everyone**, not a paywall to clear.
This isn't a new concept - `checkSubscription()` in `lib/subscription.ts` already always returns
`true` app-wide ("the app is free to use for every authenticated user"), and `app/api/stripe/route.ts`
already says as much - this badge just makes that existing, already-true status visible on this page.

Important to get right in the copy/placement so it doesn't contradict section 5: PRO subscription
status being free is a **separate concept** from the real USD balance a user spends per generation -
one is "which tier are you on" (always PRO, always free), the other is "how much does _this specific
generation_ cost" (real money, per the balance system). Placing the "PRO" badge directly next to the
balance chip (e.g. `PRO  ·  Balance: $12.34 · Top up`) makes both facts visible together instead of
one implying the other.

### `ModelCard`

Per card: name, badge pill(s) using the new `Badge` component above (color-code by badge type - e.g.
`HOT` red/orange, `FAST` blue, `TRENDING` purple, `DISCOUNT` green, `FEATURED` primary, `LOW COST`
neutral - pick colors from the existing shadcn palette in `tailwind.config.ts`, don't invent new
color tokens just for these), "From `{formatUsd(priceFromUsd)}`" price (e.g. "From $0.25"), not the
raw number - see section 9 for the formatter. For video models, an extra row: resolution range,
duration range, and an audio icon if `hasAudio`.

### `GenerationForm`

- Prompt `Textarea` (reuse `components/ui/textarea.tsx`)
- Selected model shown as a compact summary chip with a "change" action that reopens
  `ModelSelectorDialog`
- Video-only: duration select and resolution select, options driven by parsing the selected model's
  `durationRangeSec`/`resolutionRange` (or, simpler for v1: free-text ranges shown as read-only info,
  not actually selectable, since the screenshots don't show discrete duration/resolution controls -
  don't invent a slider/stepper UI that isn't evidenced in the source screenshots)
- Generate button, disabled while a request is in flight or no model is selected

### `GenerationResultGrid`

Session-only array of `{ id, url, kind, createdAt }` held in the `useGenerateImage` store. Each tile
gets a download button (`<a download>` or a fetch-to-blob-then-download helper, matching whatever the
provider's returned URL supports - some providers give signed URLs that expire, which affects
whether a direct `<a href>` download works after the fact - confirm this once a provider is chosen).

### `NoteBadge`

The component the user pasted is from a different project (uses `react-icons`, and `bg-info/20`
/`text-warning`/`text-danger-text` classes) - neither `react-icons` nor an `info`/`warning`/`danger`
color scale exist in this repo yet. Before reusing it:

1. Swap the icons to `lucide-react` (already a dependency, used everywhere else in this codebase) -
   `Info`, `AlertTriangle`, `AlertCircle` are the closest equivalents to `FiInfo`/`CiWarning`/
   `IoAlertCircleOutline`.
2. Add `info`/`warning`/`danger` (+ their `-text` foreground variants) as CSS custom properties in
   `app/globals.css` (both `:root` and `.dark` blocks, following the existing `--destructive`/
   `--destructive-foreground` HSL pattern) and wire them into `tailwind.config.ts`'s `colors` object
   the same way `destructive` is wired. Don't skip the dark-mode block - every other color in this
   theme has one.
3. Place the component at `components/ui/note-badge.tsx` (kebab-case, matching every other file in
   that folder) exporting `NoteBadge`.

Needs a 4th `type` beyond the original `"info" | "warning" | "danger"`: a `"dark"` variant for the
hiring note below, which is meant to look visually distinct from the other two (not just a different
tint of the same translucent-pill style) - solid dark background regardless of light/dark theme
(e.g. `bg-zinc-900`, `text-zinc-100`), so it reads as a separate kind of callout, not another warning.
Pick an icon that fits "we're hiring" (`Megaphone` or `Briefcase` from `lucide-react`) rather than
reusing the info/warning/danger icons for it.

Five instances on the page:

- `type="info"`: "This is private and secure - no API requests are made except the one to generate
  your image/video. We don't store what you generate, so reloading this page will lose it - download
  anything you want to keep."
- `type="info"` (or `"warning"` if you want it visually distinct from the privacy note): "Want to
  share what you generate? Turn it into an AI avatar so people can see it **and** talk to it" -
  linking to the existing companion-creation flow at `/companion` (see
  `app/(root)/(routes)/companion/[companionId]/components/companion-form.tsx` - this app's whole
  premise is chatting with AI companions, so this cross-link is the natural on-ramp from a one-off
  image into a persistent character, not a new concept to build).
- `type="info"`, headed "Why we are different?" - see the dedicated subsection right below, this one
  has interactive content (3 buttons) inside `children`, not just static copy.
- `type="info"`, placed near the balance/top-up flow (not grouped with the others) - the billing
  transparency + "how to say thanks" note. See the dedicated subsection below this one - this is
  where the "no markup" message from section 5 actually lives in the UI, plus a second point about
  not doing checkout-time charity nags.
- `type="dark"`: "We're hiring - DM me on Discord" linking to
  `https://discord.com/users/780002958380498955`. Visually separate from the other four (see above) -
  placement should read as its own thing, e.g. bottom of the page or in a corner, not grouped with
  the privacy/cross-sell/differentiator/billing notes.

### "Why we are different?" preset buttons (inside the third `NoteBadge` above)

Three small preset buttons - **Remove background**, **Enhance look**, **Upscale** - rendered as
`children` inside a `type="info"` `NoteBadge` headed "Why we are different?". These are honest,
not a hard sell: clicking one shows a toast (`useToast` from `components/ui/use-toast.ts`, the same
hook used throughout this codebase - e.g. `companion-form.tsx`, `chat-header.tsx`) with copy along
these lines:

> "You can do this for free in ChatGPT. If you'd still like to try it here, go ahead - we don't
> reduce your image's resolution like others do."

This is informational, not a blocker - the toast doesn't prevent the action, it's shown _and_ the
preset still runs (prefills the generation flow for that operation, doesn't require a second click to
confirm). Two implementation details this implies that aren't obvious from "3 buttons":

- These are **image-edit operations** (background removal, upscaling, enhancement), not
  text-to-image generation from an empty prompt - they need a _source_ image to operate on. If the
  user hasn't generated or uploaded one yet in this session, clicking a preset should prompt for an
  upload first (reuse the `ImageUpload`/Cloudinary pattern already in `components/image-upload.tsx`,
  used by `companion-form.tsx`) rather than silently no-op.
- The video model catalog already has edit-specific models (`Kling O3 Edit`, `Grok Video Edit`,
  `WAN 2.7 Edit` in section 3's video array) - check whether any image models in this catalog are
  similarly edit-capable before deciding whether these 3 presets route through the normal
  `generate-media` route with a preset-specific prompt template, or need their own dedicated
  provider call. Don't assume every model in `IMAGE_MODELS` can do background removal just because
  one can.

Data shape:

```ts
type TGenerationPreset = {
  id: "remove-background" | "enhance-look" | "upscale"
  label: string
}

const GENERATION_PRESETS: TGenerationPreset[] = [
  { id: "remove-background", label: "Remove background" },
  { id: "enhance-look", label: "Enhance look" },
  { id: "upscale", label: "Upscale" },
]
```

Handler: `handleSelectPreset` in `useGenerateImageHandlers.ts`, fires the toast, then routes into the
same generation flow as a normal prompt (with a preset-specific prompt/operation), not a parallel
one-off code path - don't build a second, separate "preset generation" pipeline next to the main one.

### Billing transparency note (near the balance/top-up flow)

A `type="info"` `NoteBadge` placed near the balance/top-up UI (not grouped with the privacy/cross-sell
notes above - different topic, different place on the page). Two points in one badge, since they're
both about the same underlying stance (money isn't the point):

1. **No markup** - the platform charges exactly what the provider API call costs, nothing added on
   top (this is the detail from section 5 - that section explains _why_ it matters for the business
   logic, this badge is where the user actually reads about it).
2. **No checkout-time charity nag.** Stripe and Temu (among others) prompt you at checkout to
   contribute a fraction of your payment to carbon removal or plant a tree. This product deliberately
   doesn't do that - not because the owner doesn't support those causes (they do), but because they
   value the user's freedom to choose more than they value collecting a few extra cents. Suggested
   copy:

   > "You may have seen Stripe or Temu ask you to chip in for carbon removal or a tree at checkout.
   > I support causes like that too - but I value your freedom more than your money, so I won't ask
   > you to add anything here. If you'd like to say thanks, either book a free call with me for more
   > value, or donate directly to whoever _you_ feel deserves it."

   Same "book a free call" mechanism as section 5 (linking to `linkedin.com/in/nicitaacom`) - don't
   introduce a second, different contact method for the same offer.

<br/>

## 5. Balance & billing model (confirmed, not cosmetic)

Unlike the placeholder assumption in an earlier draft of this doc, pricing here is **real**, not UI
decoration - generating actually costs money (the underlying provider charges per call), so a user
needs a topped-up balance before they can generate. The differentiator to make visible in the UI:
**no markup** - the platform charges exactly what the provider API call costs, nothing added on top.
If a user wants to say thanks for that, the ask is explicitly _not_ a tip or a fee - it's an invite to
a free 30-minute chat (their choice of topic) over Google Meet, booked via
`linkedin.com/in/nicitaacom`. This lives in its own `NoteBadge` near the balance/top-up UI (see
section 4's "Billing transparency note" subsection for the actual copy) - not buried in the privacy
`NoteBadge`, it's a distinct message from privacy/storage.

This changes the scope of what needs building considerably versus a display-only price:

- **Balance ledger** - two new Supabase tables, already written out in full (DDL + RLS) in
  `dev_readme-supabase-sql.md`: `29_user_balance` (cached running balance, one row per user) and
  `29_balance_transactions` (append-only ledger - `amount_usd` is a signed delta, positive for
  top-up, negative for deduction, so `SUM(amount_usd)` reconciles against the cached balance).
  Neither table has an INSERT/UPDATE/DELETE RLS policy for authenticated users on purpose - balance
  mutations only ever happen server-side via `supabaseAdmin` (service-role key, bypasses RLS). Run
  that SQL against Supabase before writing any code that reads/writes these tables.
- **Top-up flow** - this repo's Stripe integration currently does nothing real (`app/api/stripe/route.ts`
  is a `GET` that returns a static "free to use" message; `checkSubscription()` in
  `lib/subscription.ts` always returns `true`; the webhook only handles a `user_subscription`
  insert/update, and that table itself is marked deprecated). Needs a new checkout-session-creation
  route (e.g. `app/api/balance/checkout/route.ts`) for a balance top-up product, and the existing
  webhook (`app/api/webhook/route.ts`) extended with a new branch that inserts a `"topup"` row into
  `29_balance_transactions` and updates `29_user_balance.balance_usd` on that product's
  `checkout.session.completed` - separate from the existing (deprecated, unused) subscription-insert
  branch, don't repurpose it.
- **Balance display** - current balance shown somewhere persistent in the generate-image UI (e.g. a
  "Balance: $12.34 · Top up" chip near `ModeSwitch`, formatted with `formatUsd` - see the new section
  9 below), not just discovered when a generation fails for insufficient funds.
- **Cost at generation time, not just the catalog estimate** - the "From $N" on each `ModelCard` is a
  minimum/default-settings estimate; for video models where duration/resolution affect provider cost,
  compute and show the actual cost for the user's current selection before they hit generate, and
  charge that real number, not the catalog's static "From $N".
- **Deduction/refund edge case** - decide what happens if the provider call fails _after_ it already
  billed you (many providers charge on submission, not on success) - if so, the user's balance still
  needs to be deducted even on a failed generation, or this platform eats the cost. Confirm this with
  whichever provider gets picked (open question 1 below) before finalizing the deduction logic.

<br/>

## 6. API route(s)

Per `api-folder-requires-api-namespace`, every route needs `API.*` types in the root `api.d.ts`.
Suggested shape, following the `RateLimitReq`/`Resp` pattern already there:

```ts
// api.d.ts additions
type GenerateMediaReq = {
  modelId: string
  kind: "image" | "video"
  prompt: string
}

type GenerateMediaResp = {
  url: string
}

type BalanceResp = {
  balanceUsd: number
}

type BalanceTopupCheckoutReq = {
  topupAmountUsd: number
}

type BalanceTopupCheckoutResp = {
  checkoutUrl: string
}
```

Routes, following this codebase's established pattern (see `app/api/chat/[chatId]/route.ts`,
`app/api/companion/route.ts`):

All three new routes below should declare `export const runtime = "edge"` (see section 10).

**`app/api/generate-media/route.ts`, `POST`:**

1. Auth check (`getSupabaseRouteHandlerClient` - this is a route handler, matches the split already
   used in `app/api/auth/register/route.ts` vs. `app/api/category/route.ts`'s `supabaseServer`).
2. Rate limit via `executeRateLimitRequest` (`lib/rate-limit-core.ts`) using the new `generateMedia`
   entry in `app/consts/RATE_LIMIT.ts` (see step-by-step section 8, step 3).
3. Look up the model by `modelId` in `IMAGE_MODELS`/`VIDEO_MODELS`, 400 if not found.
4. Compute the real cost for this model + the user's selected options (not just the catalog's static
   `priceFromUsd`), read the user's `29_user_balance.balance_usd`, 402/insufficient-funds if
   too low.
5. Call the actual generation provider - **this is the biggest open question, see section 7**.
6. On success: insert a `"deduction"` row into `29_balance_transactions` (negative `amount_usd`)
   and decrement `29_user_balance.balance_usd` by the same amount, both via `supabaseAdmin`
   (service-role key - this must not go through a client-writable RLS path, see section 5).
7. Return `{ url } satisfies API.GenerateMediaResp`.

**`app/api/balance/checkout/route.ts`, `POST`:** creates a Stripe Checkout session for a one-time
balance top-up via a raw `fetch` call to `api.stripe.com` (**not** `lib/stripe.ts`'s SDK client - see
section 10 for why and the exact request shape), returns
`{ checkoutUrl } satisfies API.BalanceTopupCheckoutResp`.

**`app/api/balance/route.ts`, `GET`:** returns the current user's
`{ balanceUsd } satisfies API.BalanceResp`, read from `29_user_balance`.

**`app/api/webhook/route.ts`:** add a new `if` branch (alongside the existing
`checkout.session.completed`/`invoice.payment_succeeded` branches) for the balance top-up product,
inserting a `"topup"` row into `29_balance_transactions` and upserting `29_user_balance.balance_usd`.
This route currently verifies its signature via the `stripe` SDK (`stripe.webhooks.constructEvent`) -
leave that as-is for the existing branches (out of scope for this feature to touch), but see section
10 if this route's Node-runtime/SDK usage ends up blocking the Cloudflare deployment goal.

<br/>

## 7. Open questions to resolve before/during implementation

These need a decision from the user - don't guess and build silently on an assumption for any of
these, they materially change the implementation. (Pricing/balance is **no longer** open - resolved
in section 5: it's real, at-cost, backed by `29_user_balance`/`29_balance_transactions`. There's a
6th question, on deployment scope, in section 10 - resolve it alongside these five.)

1. **Which provider(s) actually generate the images/videos?** The screenshots list ~50 models across
   many vendors (OpenAI, Google, xAI, Black Forest Labs, ByteDance, Kuaishou, Runway, Luma, etc.) -
   that's almost certainly a multi-model gateway (e.g. fal.ai, Replicate, or a similar aggregator)
   rather than 50 direct vendor integrations. Confirm which gateway/API this maps to before writing
   the route - the request/response shape in section 6 is a placeholder until then. This also decides
   whether the provider bills you on submission or only on success, which decides the exact
   deduction/refund logic in section 6 step 6.
2. **Does this require authentication, or is a guest allowed (like guest chat)?** This codebase
   already has a guest-visitor pattern for chat (`lib/chat-visitor.ts`, `lib/guest-chat-store.ts`) -
   but a guest has no `29_user_balance` row to charge, so generation almost certainly requires a real
   account. Confirm before building - don't build a guest path for this by default.
3. ~~Is video generation in scope for v1, or ship image-only first?~~ **Resolved: both, full catalog,
   v1.** The user explicitly confirmed both modes and all 51 models (25 image + 26 video, section 3)
   ship together - don't stage this behind an image-only v1. This raises the bar on question 1: whatever
   gateway is picked needs to cover both modes across the full catalog, not just image models.
4. **Exact route path** - `/generate-image` was named in the request, but if video is in scope too,
   confirm whether it should be `/generate-image` with an in-page mode switch (as described above) or
   two separate routes (`/generate-image`, `/generate-video`) sharing components.
5. **What do the raw screenshot numbers (9, 13, 20, 25, ... 80) actually mean in USD?** Now that
   pricing is a real balance charge (not points), confirm the actual dollar cost per model before
   populating `IMAGE_MODELS`/`VIDEO_MODELS` - don't assume the screenshot's "From 25" means $25.00
   (that would be an unusually high price for a single image generation) without checking against
   real provider pricing once question 1 is answered. This also affects `29_user_balance.balance_usd`'s
   precision (`NUMERIC(12,2)` assumes 2 decimal places is enough - confirm no model prices in
   fractional cents before locking that in).

<br/>

## 8. Step-by-step implementation order (follow exactly, to avoid drift)

Build in this order. **Run `pnpm exec eslint <files you just touched>` and `pnpm exec tsc --noEmit`
after every single step below**, not just at the end - catching a violation immediately, while the
context for why the code looks that way is still fresh, is much cheaper than a cleanup pass at the
end. Don't move to the next step with lint errors outstanding (warnings are fine to batch-fix at the
end; **errors** - i.e. `no-banned-words` - must be fixed immediately, since they fail `pnpm build`).

1. **Read first, write nothing yet**: `dev_readme-eslint.md` (full rule table + the worked examples
   in "Component structure rules", "Import order rule", "Hook naming convention rule"),
   `dev_readme-supabase-sql.md`, and this whole document. Resolve every item in section 7 with the
   user before writing code - don't start scaffolding around an assumed answer.
2. **Get the SQL run.** Give the user the two new `CREATE TABLE` blocks from
   `dev_readme-supabase-sql.md` (`29_user_balance`, `29_balance_transactions`) and the pending
   `instructions -> prompt` rename if it hasn't been run yet either. You (the AI) almost certainly
   don't have Supabase credentials in your sandbox - don't attempt to run it, ask the user to, and
   confirm it's done before step 7 (anything reading/writing those tables).
3. **`app/consts/RATE_LIMIT.ts`**: add the `generateMedia` entry, copying the exact shape of
   `createAICompanion`/`newChatMessage` (same `key()` function signature, same `windowSec`/
   `maxAllowed` field names).
4. **`api.d.ts`**: add all five new types from section 6 in one pass, `Req`/`Resp` suffixed per
   `api-type-req-resp-suffix` (never `Request`/`Response`). Do this _before_ writing any route -
   writing the contract first and the implementation against it prevents the route's actual response
   shape from silently drifting from what's documented.
5. **`consts/IMAGE_MODELS.ts` / `VIDEO_MODELS.ts` / `GENERATION_PRESETS.ts`**: `TGenerationModel`/
   `TModelBadge`/`TGenerationPreset` types (`type-naming-prefix` - exported types need the `T`
   prefix), then the data arrays. Pure data, no logic, so this step should produce zero lint findings
   if the types are right - if it doesn't, stop and fix before moving on rather than carrying a known
   violation forward.
6. **Server-side DB helpers** for balance (e.g. `lib/balance.ts`): `selectDBUserBalance`,
   `insertDBBalanceTransaction`, `updateDBUserBalance` - name them with the `selectDB*`/
   `insertDB*`/`updateDB*` prefixes per `db-redis-verb-naming` even though nothing in this codebase
   violates that rule today (don't be the first).
7. **API routes**: `generate-media`, `balance/checkout`, `balance`, then the webhook branch -
   in that order, since `generate-media` is what exercises the balance-check/deduction helpers from
   step 6 and will surface any type mismatches in `api.d.ts` early. Every awaited Supabase/fetch
   result named per `response-variable-naming` (`response` for a write, `<methodName>Resp` for a
   read) as you write it, not as a cleanup pass after.
8. **`components/ui/badge.tsx` and `components/ui/note-badge.tsx`**: these two small, shared,
   dependency-free primitives first, before anything that uses them. Manually verify all of
   `NoteBadge`'s four visual variants (`info`, `warning`, `danger`, `dark`) and `Badge`'s color
   variants in isolation (e.g. temporarily render them all stacked on the actual page, or in
   Storybook/a scratch route if this project had one) before wiring real copy into them - easier to
   catch a color-token mistake against a blank background than inside the full page layout. Resolve
   the `brand`-vs-`primary` color-token question from section 4's `Badge` subsection here, not later.
9. **UI components bottom-up**: `ModelCard` (now using `Badge` from step 8) → `ModelSelectorDialog` →
   `ModeSwitch` → `GenerationForm` → `GenerationResultGrid` → `GenerateImageClient` → `page.tsx`.
   Every component is a `function Foo()` declaration, never `const Foo = () =>`
   (`arrow-fn-only-for-hooks` - arrows are reserved for `use*` hooks only). No component here should
   have its own `useEffect`; if one seems to need one, that logic belongs in step 10's hooks instead
   (`useSetXxx` pattern) per this project's "components do rendering only" rule.
10. **Hooks**: `store/useGenerateImage.ts` (zustand, no `persist()` - see section 2's note on why it's
    not `...Store.ts`) and `hooks/useGenerateImageHandlers.ts` (every returned function named
    `handleXxx`, always destructured at the call site - never `const handlers = useGenerateImageHandlers()`,
    that's its own lint rule, `no-handlers-variable`).
11. **Wire `page.tsx`** into the route, then do a real manual pass in the browser: both modes, model
    selection, a real generation end-to-end (once the provider is chosen), insufficient-balance path,
    all five `NoteBadge`s render with correct copy and links, and the balance chip shows a properly
    `formatUsd`-formatted amount (see section 9).
12. **Final gate**: `pnpm lint` (must be zero errors, warnings ideally zero too) then `pnpm build`
    (will only fail past the lint/typecheck stage on infra issues like missing env vars, not on code
    you wrote - if it does, that's a real bug, not an environment quirk to shrug off).

If something in these steps conflicts with a rule in `dev_readme-eslint.md` that this document didn't
anticipate, stop and resolve the conflict explicitly (fix the code, or add a scoped
`eslint-disable-next-line` with a one-line reason, per that doc's own convention) - don't silently
work around it in a way that would come back as an unexplained suppression in review.

<br/>

## 9. Currency formatting utility

Every USD amount shown in this feature - model card prices, the balance chip, the top-up form, any
transaction history - must go through one shared formatter, not ad-hoc `$${amount.toFixed(2)}`
scattered across components (inconsistent on large numbers - `toFixed` alone doesn't add thousands
separators). Add it once, reuse everywhere:

```ts
// lib/format-usd.ts
export function formatUsd(amountUsd: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountUsd)
}
```

`Intl.NumberFormat` handles both cases in one call - no separate branch needed for "large" vs.
"small" amounts:

- `formatUsd(4123.45)` → `"$4,123.45"`
- `formatUsd(4.53)` → `"$4.53"`
- `formatUsd(0.25)` → `"$0.25"`

Plain function declaration (`arrow-fn-only-for-hooks` - not a hook, so no arrow), placed in `lib/`
next to the existing `lib/utils.ts` (which already has `cn()` for class merging) rather than inside
the `generate-image` route folder - this is a genuinely reusable formatter, not feature-specific, and
the balance chip/top-up flow may end up used from other parts of the app later.

Two things to get right when wiring it in:

- **Values coming from `29_user_balance.balance_usd`/`29_balance_transactions.amount_usd` arrive from
  Postgres `NUMERIC` as a string over the Supabase JS client**, not a native `number` - `Number(...)`
  or `parseFloat(...)` them before passing to `formatUsd`, don't pass the raw string straight through.
- **Never do currency math in floating point** (`0.1 + 0.2 !== 0.3` territory) - if the deduction
  logic in the `generate-media` route needs to add/subtract USD amounts server-side before writing to
  `29_balance_transactions`, do that arithmetic in integer cents (multiply by 100, do the math, divide
  back), not directly on JS `number`s carrying two decimal places. Don't reach for a decimal-math
  library for this either - see section 10, integer-cents arithmetic with native numbers is enough.

<br/>

## 10. Bundle size & Cloudflare deployment constraint

Stated goal: deploy under Cloudflare's free-tier Workers bundle limit (3 MiB compressed). This has
real implications that go beyond just this new feature - some of them are **pre-existing** in this
codebase, not introduced here, and need a decision before assuming an architecture.

**Pre-existing facts found in this codebase that bear directly on this goal:**

- Three routes already declare `export const runtime = "nodejs"` (`app/api/chat/[chatId]/route.ts`,
  `app/api/rateLimit/route.ts`, `app/api/turnstile/route.ts`). That Next.js option opts into the
  Node.js runtime on platforms that support choosing between runtimes (Vercel) - it is not what
  Cloudflare's Next.js adapters (`@cloudflare/next-on-pages`, `@opennextjs/cloudflare`) run on by
  default. Whether these three need rewriting depends on which adapter is used and whether their
  Node-specific code (if any) has a Workers-compatible equivalent.
- `stripe` (^14.18.0), `@langchain/openai`, `@langchain/pinecone`, and `@pinecone-database/pinecone`
  are already dependencies of the _existing_ chat/companion features (not this new one) - these are
  substantial, Node-API-oriented packages and are far more likely to blow a full-app bundle past
  3 MiB than anything built for `/generate-image` itself.
- No `wrangler.toml` or Cloudflare Pages config exists in this repo yet - Cloudflare deployment isn't
  set up at all currently.

**Open question this raises (in addition to section 7's list): is the goal to deploy the _entire_
Next.js app to Cloudflare (including the existing langchain/pinecone-backed chat), or just this new
`/generate-image` feature as its own lightweight surface** (e.g. a separate Worker/Pages project,
linked from or proxied by the main app)? These are very different amounts of work - the first means
addressing the pre-existing heavy dependencies above first, which is a project of its own, likely
bigger than `/generate-image`; the second means this feature's own routes can be written
Workers-lightweight from day one without touching the existing chat code at all. Don't assume either
scope silently - confirm it before starting section 8.

**For this feature's own new code, regardless of which scope above is chosen, avoid adding SDK weight
anywhere a plain `fetch` call does the same job:**

- **No `stripe` npm package for the new balance/checkout code.** Call Stripe's REST API directly -
  it's just HTTPS with form-encoded bodies, no SDK required:

  ```ts
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      mode: "payment",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(Math.round(topupAmountUsd * 100)),
      "line_items[0][price_data][product_data][name]": "Balance top-up",
      "line_items[0][quantity]": "1",
      success_url: successUrl,
      cancel_url: cancelUrl,
    }),
  })
  ```

- **Webhook signature verification without the SDK.** `stripe.webhooks.constructEvent` (used today in
  `app/api/webhook/route.ts`) does HMAC-SHA256 verification of the `Stripe-Signature` header, which
  is fully reimplementable with the Web Crypto API (`crypto.subtle.importKey` +
  `crypto.subtle.sign("HMAC", ...)`) - Web Crypto runs natively in Cloudflare Workers, no SDK needed.
  Write the new balance top-up webhook branch (section 6) against a hand-rolled verifier, don't add a
  second `stripe`-SDK call site to the file that already has one.
- **No provider SDK for the image/video generation gateway either** (once section 7 question 1 is
  answered) - call its plain REST API with `fetch`, same reasoning as Stripe. This matches how this
  codebase already builds its own SDK wrappers (`RateLimitSDK` in `classes/RateLimit/`, the
  `ProductsSDK` example in `dev_readme-eslint.md`) - plain `fetch` inside a small class, never a
  third-party client library.
- **No date/timezone library** (`moment`, `moment-timezone`, `date-fns-tz`, etc.) - native
  `Intl.DateTimeFormat`/`Date` only, same as `formatUsd` (section 9) and the reset-time formatting
  already in `lib/rate-limit-core.ts`.
- **Set `export const runtime = "edge"`** (not `"nodejs"`) on every new route this feature adds
  (`generate-media`, `balance/checkout`, `balance`), so they're Workers-compatible from the moment
  they're written, rather than defaulting to Node APIs and discovering the incompatibility at deploy
  time.
- **Check bundle size after each major step in section 8, not just once at the end** - run whichever
  Cloudflare adapter's build/size-check command right after adding each new `fetch`-based integration.
  Catching a size regression immediately next to the change that caused it is far cheaper than
  bisecting it out of a 3 MiB-over build once everything is wired together.
