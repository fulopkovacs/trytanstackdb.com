# trytanstackdb.com

An interactive guide for taking the first steps with
[`@tanstack/tanstack-db`](https://tanstack.com/db/latest/docs/overview) by
[fuko](fulop.dev/).

[trytanstackdb.com](https://trytanstackdb.com)

## Database

Databases are expensive, so instead of running one on a server this app uses a
local Postgres instance in WASM via [PGlite](https://pglite.dev/).

For educational purposes, I had to make it possible to inspect `fetch` requests
in the browser. That is achieved by a service worker that proxies http requests
between front end and the API handlers (which are also part of the front end).

## Development

See [DEVELOPMENT.md](./DEVELOPMENT.md).
