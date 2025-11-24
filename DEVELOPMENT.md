WIP

# Deployment

Deploy the app with

```sh
pnpm build && pnpm run deploy
```

# DB

- Delete the indexedDB (in Firefox: `Storage`->`Indexed DB`) when the schema
  changes
- then: `pnpm db.generate`
