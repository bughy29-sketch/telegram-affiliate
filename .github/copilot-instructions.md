# Copilot instructions

## Build, run, and checks

- `npm run dev` starts the Express server with Vite middleware for the React app.
- `npm run build` runs `tsc` and then creates the production frontend bundle with Vite.
- `npm run lint` runs `tsc --noEmit`; it is a type check, not a separate style linter.
- `npm start` starts the server. For production, run `npm run build` first and set `NODE_ENV=production`; the server then serves `dist`.
- `npm run preview` starts Vite's frontend preview server on port 3000.
- There is currently no test script, test suite, or configured single-test command in this repository.

The TypeScript configuration includes `src` only. The current `lint` and `build` type-check the frontend, not `server.ts`.

## Architecture

This is a React dashboard and Express API in one Node process. `server.ts` serves the frontend and owns the `/api` routes; in development it mounts Vite in middleware mode, and in production it serves the built `dist` assets. The browser calls the API on the same origin.

`src/App.tsx` coordinates dashboard state and API calls. Its feature components under `src/components/` render the feed, composer and Telegram preview, automation controls, history, and settings. Shared frontend data shapes are declared in `src/types.ts`.

On the server, `server.ts` parses RSS/XML feeds into product records, using built-in sample products when no usable feed is supplied. It generates post copy through Gemini when a valid key is configured and otherwise uses a template fallback. The same server handles Telegram tests and publishing; absent Telegram credentials, publishing is recorded as a simulation. Publish history and automation settings are held in process memory, so they do not persist across server restarts. The schedule endpoint currently sets a timer whose callback does not run the automation pipeline.

## Repository-specific conventions

- Product records use snake_case for feed fields (`image_url`, `affiliate_url`); publication history uses camelCase. Keep those API shapes consistent with the frontend types and server definitions.
- API endpoints and their client calls are paired in `server.ts` and `src/App.tsx`. When changing a route or response shape, update both sides and any affected feature component.
- Feed parsing and the complete automated publish flow are server-side; do not duplicate those operations in the browser.
- The project uses strict TypeScript and React JSX, with Tailwind CSS v4 loaded through `src/index.css` and the Vite plugin.
- Runtime credentials and defaults are read from environment variables documented in `README.md` and `.env.example`; do not put secret values in frontend code.
