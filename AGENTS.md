# Package Manager Instructions

Always use pnpm instead of npm for all package management tasks:

- Use `pnpm install` instead of `npm install`
- Use `pnpm add <package>` instead of `npm install <package>`
- Use `pnpm add -D <package>` instead of `npm install --save-dev <package>`
- Use `pnpm remove <package>` instead of `npm uninstall <package>`
- Use `pnpm run <script>` instead of `npm run <script>`
- Use `pnpm <command>` for any other npm commands
- Use `pnpm dlx <command>` instead of `npx <command>`
- Use `pnpm create <template>` instead of `npm create <template>`

## Project-Specific Scripts

When running scripts from package.json, always use:

- `pnpm dev` for development server
- `pnpm build` for production build
- `pnpm run test` for running tests
- `pnpm lint` for linting
- `pnpm typecheck` for type checking
- `pnpm format` for code formatting

## Database Commands

For database-related tasks:

- `pnpm db.generate` to generate database migrations
- `pnpm db.local.migrate` to apply local migrations
- `pnpm db.prod.migrate` to apply production migrations

## Use pnpm

Never use npm, yarn, or any other package manager in this project. All package
operations should be performed with pnpm.

## Tech Stack

This project uses TanStack Start. The root route is at `src/route/__root.tsx`.

Here's the tech stack:

- framework: TanStack Start (`@tanstack/start`) with `react`
- router: TanStack Router (`@tanstack/router`)
- ui: `shadcn/ui`

# Tests

We use `vitest` for the tests.

All tests are in `__test__/`.
