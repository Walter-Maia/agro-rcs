# Marca TCA Enterprise — vetor (Rodada G)

O vetor foi reconstruído sobre `rodada-G/G1-logo-traco-encorpado.png` (2048 px, gerado por IA) pelo agente principal em 23/10/2026.

**Status: aguardando aprovação do Walter.** Enquanto não houver aprovação, os paths podem mudar. Os nomes das classes e a estrutura dos arquivos **não** mudam.

## Arquivos

| Arquivo | Uso |
|---|---|
| `tca-logo.svg` | **Sprite para o site e a animação.** Tem `<symbol id="tca-logo">` (logo completo, viewBox `0 0 1373 687`) e `<symbol id="tca-simbolo">` (só o T, `0 0 515 574`). As peças são separadas e as cores vêm de variáveis. |
| `tca-logo-positivo.svg` / `.png` | Arte-final sobre fundo claro: Floresta + Trigo, só preenchimentos, sem traços. PNG com 2400 px de largura e fundo transparente. |
| `tca-logo-negativo.svg` / `.png` | Arte-final para fundo Floresta ou escuro: Algodão + Trigo. |
| `tca-simbolo.svg` | Só o T, para avatar, selo e marca-d'água. |
| `favicon.svg` | O T, Floresta no tema claro e Algodão no escuro (`prefers-color-scheme`). |
| `favicon-32.png` | Favicon em PNG. |
| `apple-touch-icon.png` | O T sobre Algodão, 180 px. |

**Prova de fidelidade:** `../../qa/vetor/comparacao.png` (PNG × vetor × diferença).

## Peças do `<symbol id="tca-logo">`

A ordem abaixo é a ordem de pintura.

| Classe | Tipo | Observação |
|---|---|---|
| `.lg-t` | grupo | O T inteiro (símbolo). |
| `.lg-raizes` > `.lg-raiz.lg-raiz-1/2/3` | **traço**, `pathLength="1"` | Começam na junção (eixo, y = 342 no viewBox) e crescem para fora, da esquerda para a direita. As pontas ficam sob os anéis. |
| `.lg-haste` | **traço** de 54 px, `pathLength="1"` | Vai da junção até o hub: cresce **de baixo para cima**. |
| `.lg-hub` | preenchimento | Corpo do drone, 100 × 84,5 px, topo com raio 40 e base com raio 30. Origem de transformação sugerida: `257.5px 108px`. |
| `.lg-folha.lg-folha-esq/-dir` | preenchimento, `evenodd` | Folhas-hélice com o furo. Para "desenhar", aplique um traço fino sobre o mesmo path e depois o preenchimento (técnica do "Alecrim"). Origem para abrir a partir do hub: `257.5px 100px`. |
| `.lg-aneis` > `.lg-anel.lg-anel-1/2/3` | **traço** Trigo, `pathLength="1"` | O desenho começa às 3 h (sentido horário). Para começar onde a raiz chega, gire o círculo com `transform`. Para estourar com mola, use `transform-box: fill-box; transform-origin: center`. |
| `.lg-c` | preenchimento | C geométrico: duas elipses rotacionadas e cortes retos. |
| `.lg-a` | preenchimento, `evenodd` | A geométrico: polígono simétrico de topo reto. |
| `.lg-enterprise` > `.lg-l` (×10) | preenchimento Trigo | Montserrat **Bold** em contorno, entreletra uniforme. Cada letra tem `style="--i:n"` (0–9) para o escalonamento. |

O `<symbol id="tca-simbolo">` repete as peças de `.lg-t` com o mesmo sistema de coordenadas.

## Cores

As cores vêm por variável, então o mesmo sprite serve no positivo e no negativo:

```css
.marca          { --lg-ink: #0F3D2E; --lg-accent: #C9A227; }  /* positivo (padrão) */
.marca--negativo{ --lg-ink: #F4F1E8; }                         /* sobre Floresta */
```

Uso estático: `<svg class="marca" viewBox="0 0 1373 687" role="img" aria-label="TCA Enterprise"><use href="assets/marca/tca-logo.svg#tca-logo"/></svg>`.

**Para animar as peças, copie os paths inline.** O CSS da página não entra no conteúdo de um `<use>`, então `stroke-dashoffset` e as classes não alcançam as peças através dele. O traço com `pathLength="1"` foi conferido inline no Edge: `stroke-dasharray: 1; stroke-dashoffset: 1 → 0`.

## Decisões da reconstrução

| Peça | Como foi construída | IoU com o PNG |
|---|---|---|
| T | Simétrico no eixo x = 566,5 do PNG. Folhas traçadas da média do PNG com o próprio espelho; hub, haste, raízes (40,1°) e anéis (R 46, r 22,8) geométricos. | 0,985 |
| C | Elipses ajustadas aos contornos e cortes medidos. | 0,985 |
| A | Polígono simétrico, com as medidas do PNG. | 0,987 |
| Anéis | — | 0,963 |
| ENTERPRISE | **Montserrat Bold** (a haste do I mede 19 px, igual à Bold). A IA desenhou R, P e S um pouco diferentes; o vetor usa a fonte verdadeira, com espaçamento uniforme. | 0,77 |

Cada IoU mede a área em comum entre o vetor e o PNG.

Tipografia da marca: Montserrat ExtraBold nos títulos, **Bold** no ENTERPRISE (correção: antes estava SemiBold) e Source Sans 3 no texto corrido.
