import * as Sentry from "@sentry/node";
import { checkoutSummary } from "../src/cart.js";
import { Money } from "../src/money.js";
import { getPage } from "../src/paginate.js";
import { reconcile } from "../src/report.js";
import { fetchShippingQuote } from "../src/upstream.js";
import { displayName } from "../src/user.js";

const scenarios: Record<string, () => unknown> = {
  checkout: () =>
    checkoutSummary([
      { productCode: "TV", unitPrice: Money.fromBRL("1.234,56"), quantity: 1 },
    ]),
  "last-page": () => getPage(Array.from({ length: 11 }, (_, i) => i), 3, 5),
  "display-name": () => displayName({ id: "42", name: "Bruno Lima" }),
  "carrier-timeout": () =>
    fetchShippingQuote("01000-000", 10, () => new Promise((r) => setTimeout(() => r(1), 50))),
  reconcile: () =>
    reconcile(
      [
        {
          id: "o1",
          lines: [
            { productCode: "A", unitPrice: Money.fromBRL("0,10"), quantity: 1 },
            { productCode: "B", unitPrice: Money.fromBRL("0,20"), quantity: 1 },
          ],
        },
      ],
      { orderIds: ["o1"], paidOut: Money.fromBRL("0,30") },
    ),
};

const [name, repeatArg] = process.argv.slice(2);
const scenario = name ? scenarios[name] : undefined;
if (!scenario) {
  console.error(`usage: pnpm trigger <${Object.keys(scenarios).join("|")}> [repeat]`);
  process.exit(2);
}

const dsn = process.env.SENTRY_DSN;
if (dsn) {
  Sentry.init({ dsn, environment: "sandbox", release: process.env.SENTRY_RELEASE });
} else {
  console.warn("SENTRY_DSN not set: the error is printed but not reported");
}

const repeat = Number(repeatArg ?? 1);
for (let i = 0; i < repeat; i++) {
  try {
    await scenario();
    console.log(`${name}: no error`);
  } catch (error) {
    if (dsn) Sentry.captureException(error);
    else console.error(error);
  }
}
if (dsn) {
  await Sentry.flush(5000);
  console.log(`${name}: reported ${repeat}x to Sentry`);
}
