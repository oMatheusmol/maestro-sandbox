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
