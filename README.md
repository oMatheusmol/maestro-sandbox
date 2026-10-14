# maestro-sandbox

Loja de mentira usada como alvo de testes do [maestro](https://github.com/oMatheusmol/maestro). Contém defeitos de propósito; o catálogo fica no repositório do maestro, não aqui, para que a correção parta só do contexto da issue, como num projeto real.

```bash
pnpm install
pnpm typecheck && pnpm test
pnpm dev                                # a loja: o checkout em /, a nota de voz em /recorder.html
pnpm exec playwright install chromium   # uma vez: o navegador dos testes de interface
pnpm test:ui                            # testes de interface (Playwright), num celular e num desktop
SENTRY_DSN=... pnpm trigger <cenário> [repetições]
```

## Money

`Money` from `src/money.ts` stores amounts as integer cents in its readonly
`cents` property. Construct it with cents, or parse a Brazilian real amount
with `Money.fromBRL`. Use `toBRL()` to format an amount for display.

```ts
import { Money } from "./src/money.js";

const price = new Money(1250);
price.cents; // 1250
price.toBRL(); // "R$ 12,50"

const parsed = Money.fromBRL("R$ 1.234,56");
parsed.cents; // 123456
parsed.toBRL(); // "R$ 1.234,56"

Money.fromBRL("-R$ 12,50").toBRL(); // "R$ -12,50"
```

The constructor rejects fractional cents. `fromBRL` rounds parsed amounts to
the nearest cent and throws for invalid amounts such as `"invalid"`.

`add`, `subtract`, `multiplyBy`, and `allocate` return new `Money` instances,
leaving their operands unchanged. Multiplication rounds the result to integer
cents and requires a finite quantity. `allocate(parts)` splits the cents into
`parts` shares whose cents sum to the original; the earliest shares receive the
remainder, and `parts` must be a positive safe integer.

```ts
const fee = new Money(250);
const total = price.add(fee);
total.toBRL(); // "R$ 15,00"
total === price; // false

price.subtract(fee).toBRL(); // "R$ 10,00"
price.multiplyBy(3).toBRL(); // "R$ 37,50"
new Money(101).multiplyBy(0.5).cents; // 51
new Money(10).allocate(3).map((s) => s.cents); // [4, 3, 3]

price.cents; // 1250 (unchanged)
fee.cents; // 250 (unchanged)
```
