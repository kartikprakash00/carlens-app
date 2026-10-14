## Local development

Use the project-pinned Node runtime before installing or starting the app:

```sh
nvm use
npm ci --legacy-peer-deps
npm run dev
```

This project is verified with Node 22.22.2 (`.nvmrc`). Node 26 stalled during Next.js startup on the development machine; `nvm use` selects the working version. If it is not installed, run `nvm install` first.

Development uses Webpack because Turbopack stalled while compiling the homepage on the development machine. A `Ready` message only confirms the server is listening; the first page request still needs compilation.

## Performance checks

```sh
npm run test
npm run lint
npm run build
PERFORMANCE_LOGGING=1 npm start
# In another terminal:
npm run benchmark
```

The benchmark reports first-request and three warm-request timings, status, and HTML bytes. Set `BENCHMARK_CAR_ID` to an existing inventory ID to include a detail page. Protected pages require a local `BENCHMARK_COOKIE` environment variable; without it, their results measure sign-in redirects only. Do not commit cookies or benchmark HTML. Database timing logs contain operation names and durations, never SQL or query arguments.

Filter metadata is revalidated every 60 seconds and immediately expired by inventory mutations. Personalized data is only deduplicated within a server render. Next's time-based cache can serve stale metadata while background revalidation completes after changes made outside this app.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
