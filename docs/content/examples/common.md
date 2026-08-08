# 1. Welcome page

The application in `examples/welcome`. It is the JavaScript starter — what `ness new my-app --template javascript` scaffolds — with the pieces a larger application grows: a shared `app/routes/layout.jsx` around every page, route middleware that stamps a `server-timing` header on the response, file-based API routes under `app/routes/api`, and a route action beside the loader in `page.server.js`. The `error`, `loading` and `not-found` boundaries, the cached loader, and the NestJS health controller are not additions — every official starter ships those. Each page declares its own metadata with `Meta`, `Title`, and `Description` from `@nessframework/components`.

`ness new` without `--template` scaffolds the TypeScript starter instead.

If you want to create a new application with this example, you can deploy on Vercel by clicking the "Deploy" button below.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fleroyanders%2FNess.js%2Ftree%2Fmaster%2Fexamples%2Fwelcome)
