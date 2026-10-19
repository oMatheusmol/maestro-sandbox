# Contributing

## Installation

Clone the repository and install dependencies:

```bash
pnpm install
```

## Running the shop locally

Start the development server:

```bash
pnpm dev
```

The shop runs at `http://localhost:5173/` with two main screens:

- **Checkout**: Available at `/`, where you can browse products and complete purchases.
- **Voice note recorder**: Available at `/recorder.html`, for recording voice notes with permissions to microphone and camera.

## Running tests

### Unit tests

Run the unit tests with:

```bash
pnpm test
```

Type checking is included; run before committing:

```bash
pnpm typecheck && pnpm test
```

### UI tests

UI tests run on both phone and desktop viewports using Playwright. First, install Chromium (once only):

```bash
pnpm exec playwright install chromium
```

Then run the UI tests:

```bash
pnpm test:ui
```

This runs every test on a phone viewport (375×812) and a desktop viewport (1280×800).

To run only some spec files, pass their paths; each one still runs on both viewports:

```bash
pnpm test:ui e2e/coupon.spec.ts
```

## Triggering Sentry scenarios

To send one of the Sentry error scenarios to your Sentry project, use:

```bash
SENTRY_DSN=<your-sentry-dsn> pnpm trigger <scenario> [repetitions]
```

Replace `<your-sentry-dsn>` with your Sentry DSN and `<scenario>` with the scenario name. You can optionally specify how many times to repeat the scenario.
