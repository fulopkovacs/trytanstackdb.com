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

# Errors

## `crypto.randomUUID is not a function. (In 'crypto.randomUUID()', 'crypto.randomUUID' is undefined)`

- this error appears when you run the app on the network and try to access it
  through an address like `http://192.168.1.26:3542`
- reason: the
  [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
  is only available in secure contexts.
- Solve it by following these steps:
  - use a local tunnel with a service like `ngrok`
  - update the list of the enabled hosts in your `vite.config.ts` temporarily:

```typescript
  server: {
    allowedHosts: true,
  },
```
