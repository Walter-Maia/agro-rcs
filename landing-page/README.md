# TcaEnterprise: landing page (v0.2.0)

Página estática, sem build, com a identidade aprovada na Rodada G e uma abertura animada derivada da geometria da marca. O briefing está em `../PROMPT-CLAUDE-TCA-LANDING-PAGE.md`.

**Estado em 23/10/2026:**
- **Fase 0 (vetor da marca): aprovada pelo Walter.** Foi feita pelo agente principal em `assets/marca/` e `qa/vetor/`.
- **Fase 2 (página): pronta e testada localmente.**
- **Fase 1 (abertura "o broto que decola"): pronta e testada localmente.**
- Nada foi publicado nem versionado (sem commit ou push).

## Como abrir localmente

A logo do rodapé é um `<use>` externo, que só funciona por HTTP: pelo `file://` ela não aparece. Esta máquina não tem Python, então o projeto traz um servidor em Node, sem dependências:

```
node qa/ferramentas/servidor.js            # http://127.0.0.1:4410/
# ou, onde houver:  npx http-server . -p 8080   |   python -m http.server 8080
```

A abertura toca **uma vez por sessão**. Parâmetros de teste:
- `?intro=1`: força a abertura, mesmo já vista na sessão.
- `?fx=0`: modo estático, igual ao movimento reduzido. Sem abertura e sem efeitos.

## Arquivos

```
index.html               conteúdo; bloco "COPY PROVISÓRIA" no topo; decisão da abertura no <head>
assets/css/intro.css     ROTEIRO DA ABERTURA (tabela no topo) + keyframes + failsafe
assets/css/site.css      tokens, layout, visual de todos os efeitos da página, movimento reduzido
assets/js/intro.js       liga, encerra e limpa a abertura (o palco é gerado; ver Manutenção)
assets/js/site.js        Lenis, ScrollTrigger, títulos, fotos, marquee, magnético, raízes, menu
assets/fonts/            Montserrat (400–800) e Source Sans 3 (400–600), woff2 latin, OFL 1.1
assets/marca/            Fase 0 (agente principal): sprite tca-logo.svg e favicons; não editar daqui
assets/img/              vazio; as fotos ainda não existem (ver Pendências)
qa/ferramentas/          servidor, cliente CDP (Edge headless), testes e o gerador da marca inline
qa/fase1/                abertura: folhas de quadros, capturas, resultados.json
qa/fase2/                página: resultados.json, contraste.json, copy.json, capturas/, folha-larguras-hero.jpg
qa/vetor/                prova do vetor (agente principal)
```

## Abertura (Fase 1): "o broto que decola"

**Conceito.** A abertura segue o espírito da Pousada Alecrim, mas a geometria é a do T-broto-drone. São três atos:
1. **Mistério:** a linha do campo se revela e as raízes de circuito acendem embaixo da terra.
2. **Construção:** o broto sobe, o hub estoura, as folhas-hélice se armam e o T dá uma decolagem mínima.
3. **Assinatura:** C e A se escrevem e ENTERPRISE assenta.

Depois, o palco sobe e entrega a página.

**Roteiro final** (tempos absolutos; a mesma tabela está no topo do `intro.css`):

| Tempo (s) | Peça | Técnica | Easing |
|---|---|---|---|
| 0,15–0,95 | Linha do campo (Floresta 27 % e 40 %), na altura da junção das raízes | Cortina da esquerda para a direita, borda suave | (.3,.1,.25,1) |
| 0,30–1,00 | Halo Trigo (opacidade 0,3) onde o broto nasce | `opacity` + `scale` .6 → 1 | ease-out |
| 0,40–1,00 | Raízes 1, 2 e 3 | `stroke-dashoffset` da junção para baixo, 60 ms entre elas | `--ease-draw` |
| 0,55–1,25 | Haste | Traço do chão até o hub | `--ease-draw` |
| 0,85–1,25 | Anéis | `scale` 0 → 1, 60 ms entre eles | mola |
| 1,15–1,40 | Hub | Estoura | mola (.34,1.56,.64,1) |
| 1,25–1,80 | Folhas-hélice | Contorno do hub para fora + abertura ±20° → 0 no hub; preenchimento 1,50–1,75 | `--ease-draw` / mola |
| 1,75–2,10 | O T inteiro | `translateY` −3 % (≈ 6 px no desktop) e volta | ease-in-out |
| 1,50–2,33 | C e A | Contorno letra a letra (70 ms), depois o preenchimento Floresta | `--ease-draw` |
| 2,10–2,65 | ENTERPRISE | Letras Trigo; a entreletra assenta por `translateX`, 8 ms por letra | `--ease-out` |
| 2,30–2,60 | Linha do campo e halo | Somem; a pose final é a logo oficial | ease |
| 2,70–3,20 | Saída | O palco sobe 14 px e some com o fundo (Esc/Enter: 0,32 s) | (.45,0,.55,1) |
| depois | Cabeçalho e hero | O T cresce da base (+0,18), CA vem da direita (+0,32), os anéis acendem (+0,45), ENTERPRISE aparece (+0,55), menu e CTA descem 16 px; H1 linha a linha e foto revelada | — |

**Mecânica** (a da Pousada Alecrim):
- **Dois tempos:**
  - `.is-playing` (t = 0) anima só `transform` e `opacity` em camadas HTML: a linha do campo e o halo.
  - `.is-growing` entra 0,40 s depois, ou quando o `site.js` montou a página e a Montserrat chegou (tolerância de 1,2 s por etapa). Ele cuida dos traços em SVG.
- **Logo:** o palco usa os **paths oficiais** do sprite aprovado, nada redesenhado. A única derivação é o contorno das folhas, cortado do próprio path no encosto com o hub para "desenhar do hub para fora".
- **Página atrás:** fica **pausada** no primeiro quadro enquanto existe `html.intro-active` e entra no `finish()`. No horário, isso é o `--rise-start: 2,7 s` do briefing; se a pessoa pular, a página entra no instante do pulo, sem tela vazia.
- **Pular:**
  - Esc e Enter fazem a saída rápida de 0,32 s.
  - Tab libera na hora e o foco segue para "Pular para o conteúdo".
  - Roda, toque e clique pulam com `preventDefault`, então o gesto que pula não rola a página. Os eventos seguintes de uma rajada já rolam: o contrato devolve a rolagem no início da saída.
  - Aba oculta, ou movimento reduzido ligado no meio, libera na hora.
  - Não há botão visível de pular.
- **Proteções:**
  - Decisão no `<head>` antes da 1ª pintura: uma vez por sessão (gravada no começo); nunca com `#âncora`, página rolada, aba oculta, movimento reduzido ou `?fx=0`.
  - Failsafe só em CSS, de 6,5 s.
  - `onerror` no `<script>` libera na hora se o `intro.js` não carregar.
  - Sem o `intro.css`, o overlay não fica fixo e a abertura não roda.
  - Duas pinturas (rAF duplo) antes de animar, mais um `setTimeout` de 250 ms de reserva.
  - Trava de 4 s contada do início da animação.
  - O `theme-color` acompanha o fundo e volta.
  - O overlay não prende foco nem rolagem e sai do DOM.
- **Traços e tamanhos:**
  - Nenhum traço abaixo de ~1 px de tela: o contorno é reforçado abaixo de 900 e de 600 px de largura e de 500 px de altura.
  - O palco se mede por `--iw`.
  - Não há `vector-effect: non-scaling-stroke`.
  - Só as folhas-hélice giram; C, A e ENTERPRISE nunca giram nem esticam.

**Logo do cabeçalho:** é uma **cópia inline** dos paths, em grupos (`lg-t`, `lg-aneis`, `lg-ca`, `lg-enterprise`), para entrar em partes. O rodapé continua com `<use>` e cai para o nome em texto se o sprite não renderizar.

### Manutenção da abertura

Se o vetor mudar, rode `node qa/ferramentas/montar-marca-inline.js`. Ele regrava o palco em `intro.js` (entre `/*PALCO:INICIO*/` e `/*PALCO:FIM*/`) e a logo inline do `index.html` (entre `<!-- LOGO-INLINE:INICIO -->` e `<!-- LOGO-INLINE:FIM -->`), a partir do `assets/marca/tca-logo.svg`.

**Não edite esses trechos à mão.** O roteiro (tempos e easings) fica só no `intro.css`.

## Identidade aplicada

**Cores:**
- Tokens obrigatórios no `:root`: Floresta, Trigo, Algodão, Grafite e Folha.
- Derivados documentados:
  - `--floresta-funda #0A2A20`: o rodapé.
  - Algodão a 80 %: texto secundário sobre Floresta.
  - Filetes a 14–16 %.
- Trigo só aparece como acento e nunca como fundo de seção.

**Tipografia:**
- Montserrat 800 nos títulos.
- Montserrat 600 com 0,3 em nos eyebrows e rótulos, como no briefing.
- O ENTERPRISE do vetor é **Bold (700)**. Para o eco exato, troque o token `--peso-rotulo` para 700.
- Source Sans 3 no texto corrido.
- As fontes são woff2 do próprio projeto, com `font-display: swap` e preload da Montserrat.
- Origem da Montserrat: copiada de `landing page siteflux/assets/fonts`.
- Origem da Source Sans 3: Google Fonts, baixada em 23/10/2026.

**Tom:** sem mascote, cursor lúdico, neon, glass, brilho girando ou serifa.

## Seções

| # | Seção | Fundo | Movimento |
|---|---|---|---|
| 1 | Cabeçalho fixo | Algodão translúcido ao rolar (blur 14 px; fallback sólido) | Logo em partes; menu e CTA descem 16 px (atrasados por `--rise-start`). |
| 2 | Hero | Algodão + curvas de nível (as mesmas da linha do campo da abertura) | **02** no H1, **04** na foto. |
| 3 | Faixa de atuação | Floresta | **06** marquee, com separador em anel Trigo. |
| 4 | Soluções (lista editorial alternada, 4 itens) | Algodão | **04** em cada foto + **11** zoom interno (só com ponteiro fino). |
| 5 | Como funciona: "Do campo ao dado" | Floresta | Raízes do logo desenhadas pela rolagem (assinatura) + **02** no título. |
| 6 | Sobre | Algodão | **02** no título; o texto não anima. |
| 7 | CTA final | Floresta | **07** magnético + press com mola. |
| 8 | Rodapé | Floresta funda | Estático. |

## Efeitos usados

São 5 efeitos visíveis mais a base, dentro da regra "3–5 bem-feitos". Em todos, o visual mora no CSS (classes `is-armado` e `is-dentro`) e o JS só decide quando ligar.

- **01 Lenis 1.1.14:** `lerp 0.1`, ligado ao ticker do GSAP e ao `ScrollTrigger.update`.
  - As âncoras usam `lenis.scrollTo` com o desconto da altura do cabeçalho e passam o foco para o destino.
  - **O Lenis 1.1.14 não existe no cdnjs (404).** A mesma versão fixa vem do jsDelivr. O GSAP 3.12.5 e o ScrollTrigger vêm do cdnjs.
  - A abertura não usa GSAP nem Lenis.
- **02 Texto linha a linha:**
  - Cada palavra fica numa máscara, e o atraso de cada uma é o da linha em que ela caiu (medido com a Montserrat carregada).
  - No H1, é uma animação CSS que espera a abertura.
  - Nos títulos de seção, é uma transição disparada por ScrollTrigger.
- **04 Foto com máscara:** `clip-path` de baixo para cima com zoom interno de 1,35 → 1 numa camada própria.
- **11 Zoom no hover:** 1,06 na camada de baixo, só com ponteiro fino.
- **06 Marquee:**
  - 42 px/s; acelera até 7× e inverte o sentido com a rolagem.
  - Pausa fora da tela, em aba oculta e pelo **botão Pausar/Retomar**, que o briefing não pedia e entra por causa do WCAG 2.2.2.
- **07 Magnético:** só no CTA final e só com ponteiro fino. O `<a>` recebe o ímã, a face o press e o rótulo o deslocamento menor.
- **Raízes desenhadas pela rolagem:**
  - A haste e as diagonais seguem o ângulo do símbolo (40,1°), e o scrub de `stroke-dashoffset` usa ScrollTrigger.
  - Os anéis acendem com mola quando a raiz chega, e a histerese de 0,03 impede que pisquem.
  - Abaixo de 720 px, vira um traço vertical.

## Efeitos descartados

| Efeito | Motivo |
|---|---|
| 03 rastro de imagens no cursor | Lúdico; quebra a seriedade pedida. |
| 05 tipografia esticada | Passaria do limite de efeitos. |
| 08 galeria horizontal | Não há portfólio. |
| 09 preloader com contador | Seria um contador falso; a abertura já cumpre o papel. |
| 10 cortina | É uma página só. |
| 12 menu em tela cheia | O menu do celular é um overlay simples (Esc fecha, o resto fica `inert`, o foco volta ao botão). |
| 13 estética terminal | Tom errado. |
| Blob, glass, 3D, shader | Fora do tom. |

## Acessibilidade e desempenho

- **Movimento reduzido ou `?fx=0`** (`html.rm`, decidido no `<head>` e acompanhado ao vivo):
  - Sem abertura, Lenis, marquee e magnético.
  - A página nasce no estado final: raízes desenhadas, anéis acesos, títulos no lugar.
- **Sem JS:** sem abertura e com todo o conteúdo legível.
- **JS da abertura bloqueado:** libera na hora pelo `onerror`; se o arquivo carregar e falhar, o failsafe em CSS libera em 6,5 s.
- **Foco:** anel Floresta sobre o claro e Trigo sobre o Floresta, com "Pular para o conteúdo".
- **Toque:** sem hover nem magnético.
- **Propriedades animadas:** só `transform`, `opacity`, `clip-path` e `stroke-dashoffset`, e nunca `transition: all`.
- **Contraste:** todos os pares de texto e de interface passam AA (`qa/fase2/contraste.json`). O hover do botão Trigo clareia em vez de escurecer.

## Copy provisória

- Todos os textos estão no bloco `COPY PROVISÓRIA` do topo do `index.html` (41 chaves). Cada elemento tem `data-copy="chave"` e o comentário `<!-- COPY PROVISÓRIA -->`.
- **Para trocar um texto, edite os dois lugares e rode `node qa/ferramentas/copy.js`.** O script confere a correspondência, a marca e a acentuação.
- O botão do CTA final ainda não tem destino:
  - Ao ser clicado, ele **não envia nada** e mostra "Prévia: o canal de contato ainda será confirmado. Nada foi enviado."
  - Quando o canal for definido, troque o `href` pelo link real e apague o `data-destino-pendente`.

## Pendências com o cliente

1. **Copy:** todos os textos são provisórios.
2. **Áreas de atuação [A CONFIRMAR]:** monitoramento por drone, irrigação inteligente, sensores de solo, telemetria e gestão de safra.
3. **Contatos [A CONFIRMAR]:** WhatsApp, e-mail, endereço e o destino do botão do CTA final.
4. **Fotos:** a página usa espaços reservados na proporção final. Faltam estas cinco:
   - lavoura com drone em voo, para a hero (1:1 no desktop, 4:3 no celular);
   - drone em voo;
   - pivô de irrigação;
   - sensor no solo;
   - equipe no campo (as quatro das soluções em 3:2).

   O Higgsfield pode gerá-las (`gpt_image_2_5`, high, 2k, sem texto e sem logotipos) **só com autorização dos créditos pelo Walter**. Se forem geradas, serão marcadas como **ilustrativas**, em WebP com `srcset`, e nenhuma pessoa recebe nome, cargo ou depoimento. Quando entrarem: `width`/`height`, `loading="lazy"` abaixo da dobra e `fetchpriority="high"` na hero.
5. **Seções que não entraram por falta de dados reais:** números, depoimentos e logos de clientes ou parceiros.
6. **Na publicação** (não autorizada ainda):
   - tirar o `noindex`;
   - definir `og:image` e a URL canônica;
   - subir o `?v=` dos assets.

## Testes

Com o servidor rodando (Node ≥ 22; nesta máquina, `%LOCALAPPDATA%\nvm\v24.6.0\node.exe`):

```
node qa/ferramentas/fase2.js [caso]                 # página: larguras, menu, âncoras, raízes, marquee, magnético, reduzido, sem JS, teclado, CPU 4×
node qa/ferramentas/fase1.js [caso]                 # abertura: natural, âncora, pular, jsBloqueado, cpu4, semAbertura, tamanhos, poseFinal
node qa/ferramentas/capturar-quadros.js abertura-1440 0,0.8,1.6,2.4,3.2 1440x900   # folha de quadros
node qa/ferramentas/contraste.js  ·  node qa/ferramentas/copy.js  ·  node qa/ferramentas/espiar.js 390x844
```

Por padrão, as sessões de teste nascem com a abertura já "vista" (só a Fase 1 pede `intro: true`).

**Não testado:**
- Safari, Firefox e celular físico (o "celular" foi emulação no Edge headless).
- Aba oculta de verdade (foi simulada por `visibilitychange`).
- Leitor de tela real.
- Um olhar humano assistindo à abertura em tempo real: a análise foi por quadros congelados e por sondas de tempo.
