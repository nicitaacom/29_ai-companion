## General Information

This project is an AI companion app built with `Next.js` `TypeScript` `Tailwind` `Supabase`. It lets users sign in with Google, GitHub, or email/password, create companions and chat with them.

The app is now free to use. Pricing and upgrade UI still exist in the codebase for compatibility, but the product flow should treat every authenticated user as fully enabled.

<br/>

## Architecture

<details> <summary><b>What lives where</b></summary>

- `components/` contains shared UI and feature-level interface pieces.
- `app/` contains route groups, server actions, and API routes.
- `lib/` contains Supabase, Stripe, memory, and helper integrations.
- `app/interfaces/` contains the generated database types.
- `app/utils/` contains small shared helpers such as auth and URL utilities.

</details>

<details> <summary><b>Backend model</b></summary>

- Supabase handles auth and user session ownership.
- Server routes write to the database using the service role client where needed.
- Companion creation and updates are routed through the server.
- Stripe billing is currently disabled in product flow, so the app behaves like a free product.

</details>

<br/>

## SEO And Public Assets

<details> <summary><b>Current setup</b></summary>

- Favicon is served from `public/favicon.png`.
- Metadata lives in `app/layout.tsx`.
- `robots.ts` and `sitemap.ts` are app-router files.
- `app/not-found.tsx` provides the custom 404 page.

</details>

<br/>

## Notes For AI Changes

<details> <summary><b>Style reminders</b></summary>

- Prefer thin routes and small helpers.
- Use early returns when possible.
- Keep auth and billing code readable and server-first.
- Match existing Tailwind patterns instead of introducing a new visual language.

</details>
