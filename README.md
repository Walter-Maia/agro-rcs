# agro-rcs: TcaEnterprise

Identidade visual (Rodada G) e landing page da **TcaEnterprise**, empresa de tecnologia para o agronegócio.

| Pasta | O que é |
|---|---|
| [`rodada-G/`](rodada-G/) | Rodada G da identidade, a aprovada. Traz o logo oficial em positivo (`G1-logo-traco-encorpado.png`), o negativo, a variante de traço original (`G2`) e simulações de uso (site, camisa polo, boné). PNGs de 2048 px gerados por IA; as aplicações são simulações. |
| [`apresentacao-rodada-G/`](apresentacao-rodada-G/) | Página de apresentação da Rodada G (`index.html` + `img/`). Abre direto no navegador. |
| [`landing-page/`](landing-page/) | Landing page estática com abertura animada ("o broto que decola"), v0.2.0. A arte-final vetorial da marca está em `landing-page/assets/marca/`. |

## No ar (GitHub Pages)

- **Landing page:** https://walter-maia.github.io/agro-rcs/ (a raiz redireciona para `landing-page/`; `?intro=1` força a abertura).
- **Apresentação da Rodada G:** https://walter-maia.github.io/agro-rcs/apresentacao-rodada-G/

As duas páginas têm `noindex`: os buscadores não as indexam enquanto forem prévia.

## Abrir a landing page localmente

A logo do rodapé é um `<use>` de SVG externo, que precisa de HTTP: abrir pelo `file://` não mostra a logo.

```
cd landing-page
node qa/ferramentas/servidor.js     # http://127.0.0.1:4410/   (Node ≥ 22; ou: npx http-server . -p 8080)
```

- **Abertura:** toca uma vez por sessão. `?intro=1` força a abertura e `?fx=0` mostra a página estática.
- **Detalhes:** decisões, efeitos, testes e pendências estão em [`landing-page/README.md`](landing-page/README.md).

**Prévia:**
- A copy é provisória.
- Contatos e áreas de atuação estão marcados `[A CONFIRMAR]`.
- As fotos são espaços reservados.
- A página tem `noindex`.
