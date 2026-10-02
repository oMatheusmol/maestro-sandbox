# maestro-sandbox

Loja de mentira usada como alvo de testes do [maestro](https://github.com/oMatheusmol/maestro). Contém defeitos de propósito; o catálogo fica no repositório do maestro, não aqui, para que a correção parta só do contexto da issue, como num projeto real.

```bash
pnpm install
pnpm typecheck && pnpm test
SENTRY_DSN=... pnpm trigger <cenário> [repetições]
```

Carts reject quantities that are not positive integers.