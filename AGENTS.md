# Repository Guidelines

## Project Structure & Module Organization

- `src/main.ts` owns the browser UI, interaction state, rendering, and local journal behavior.
- `src/astronomy.ts` is the calculation boundary around `astronomy-engine`; keep astronomical math out of UI code.
- `src/catalogue.ts` contains the curated local object catalogue and observing metadata.
- `src/types.ts` defines shared domain types; `src/styles.css` contains the responsive dark observing interface.
- `README.md`, `plan.md`, `architecture.md`, and `current_state.md` document scope, design, roadmap, and verified progress.
- `dist/` and `node_modules/` are generated and must not be committed.

## Build, Test, and Development Commands

Run from the repository root:

```bash
npm install       # install declared dependencies
npm run dev       # start Vite locally at 127.0.0.1:5173
npm run check     # run TypeScript's strict no-emit check
npm run build     # type-check and produce a production build in dist/
npm run preview   # serve the production build locally
```

There is not yet an automated test suite. Before a behavior change is complete, run `npm run check`, `npm run build`, and exercise the affected browser flow manually.

## Coding Style & Naming Conventions

Use strict TypeScript, two-space indentation, single quotes, semicolons, and small pure helpers where practical. Use `camelCase` for variables/functions, `PascalCase` for types, and kebab-case for DOM data attributes and file names. Preserve the calculation/UI separation and avoid adding dependencies without a clear local-first benefit.

## Testing Guidelines

Verify time and location changes, selected-object updates, horizon/twilight status, journal persistence, and desktop/mobile layouts. Check known invariants such as Polaris altitude tracking observer latitude. Record meaningful verification results in `current_state.md`.

## Commit & Pull Request Guidelines

Use concise imperative conventional-style subjects such as `feat:`, `fix:`, or `docs:`. Keep commits focused and include documentation when behavior or scientific limitations change. Pull requests should describe the user-visible change, verification commands/results, scientific assumptions, and screenshots for meaningful UI changes.

## Security & Configuration

Keep the application local-first. Never commit secrets or `.env` files; document future variables in `.env.example`. Do not claim practical visibility from geometric altitude alone: preserve the existing twilight and visibility caveats.
