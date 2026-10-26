# TcaEnterprise: landing page (v0.3.1)

Página estática, sem build, com a identidade aprovada na Rodada G e uma abertura animada derivada da geometria da marca. O briefing está em `../PROMPT-CLAUDE-TCA-LANDING-PAGE.md`.

**Estado em 26/10/2026:**
- **Fase 0 (vetor da marca): aprovada pelo Walter.** Foi feita pelo agente principal em `assets/marca/` e `qa/vetor/`.
- **Fase 2 (página): pronta e testada localmente.**
- **Fase 1 (abertura "o broto que acende"): refeita em 26/10 na versão noturna e testada localmente.** O Walter achou a primeira versão (fundo Algodão, 23/10) fraca demais. Na revisão do mesmo dia (v0.3.1), ele achou feios o pulo do T e o anel que saía dele: os dois saíram e a abertura ficou mais limpa.
- **No ar:** a **v0.3.1** (abertura noturna, versão limpa) foi publicada no GitHub Pages em 26/10, com o ok do Walter (`Walter-Maia/agro-rcs`, https://walter-maia.github.io/agro-rcs/). Antes dela, de 23/10 a 26/10, esteve no ar a **v0.2.0**, com a abertura clara.

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

## Abertura (Fase 1): "o broto que acende", versão noturna

**Conceito.** É noite no campo, visto de cima pelo drone: curvas de nível de um relevo cobrem a tela. Uma semente Trigo acende no horizonte. Embaixo da terra, as raízes de circuito ligam. A luz corre por elas até os anéis, que acendem (a tecnologia está na raiz). A energia sobe pela haste, o hub estoura e as folhas-hélice se armam. C e A se escrevem, o horizonte se recolhe e ENTERPRISE assenta: a logo fica sozinha e parada. Então amanhece: um círculo de luz com aro Trigo abre a partir da semente e entrega a página, que já está entrando.

São três atos e uma passagem:
1. **Mistério:** mapa, semente e raízes.
2. **Construção:** o broto-drone.
3. **Assinatura:** CA e ENTERPRISE.
4. **Amanhecer:** a saída.

**Por que mudou** (decisões de design de 26/10, fora do briefing original; a v0.2.0 tinha seguido o briefing ao pé da letra):

| Briefing / v0.2.0 | v0.3.1 | Motivo |
|---|---|---|
| Fundo Algodão liso | Floresta, com degradê para o Floresta funda e vinheta | Contraste e luz: o Trigo brilha no escuro, e a logo negativa, que é oficial (`tca-logo-negativo.svg`), tem mais presença. O Algodão sobre Algodão deixava a abertura apagada. |
| Duas curvas finas (linha do campo) | Mapa de curvas de nível (12 níveis de um relevo, com curvas mestras) + horizonte, que se recolhe quando a assinatura se forma | O mapa enche a tela de textura, conversa com a foto-placeholder da hero (curvas de nível sobre Floresta) e é o ponto de vista do drone. O horizonte é o chão da semente durante a construção; na pose final ele cortaria o CA na meia altura, como um risco. |
| Halo Trigo a 0,3 | Luz na semente, cometas Trigo correndo nas raízes e na haste, brilho nos anéis | Cada ato ganha um acontecimento de luz. É o "acender" do símbolo. |
| Logo de até 560 px | Até 760 px (`clamp(300px, 26vw + 330px, 760px)`) | Presença de cena. Ainda cabe em 360 × 640 e em 900 × 500. |
| Saída: palco sobe 14 px e some com o fundo | Amanhecer: o fundo abre em círculo a partir da semente, com aro Trigo; a logo ainda sobe 14 px e some | Do escuro para o claro, um esmaecimento simples passaria por um verde sujo. O círculo resolve a passagem e devolve a página onde o broto nasceu. |
| Decolagem de −3 % | **Sem decolagem e sem pulso** (a v0.3.0 tinha −4,5 % com um anel Folha saindo da semente) | O Walter achou feio (26/10). Como designer, concordo: a logo deve chegar e ficar parada. O pulo levava junto as raízes (que estão "embaixo da terra") e o anel, uma elipse em perspectiva sobre um mapa visto de cima, era a única peça Folha e cruzava o C e o A no instante da leitura. O gesto drone fica nas folhas-hélice, que se armam com mola. |
| C, A e folhas: preenchimento por esmaecimento | Preenchimento por **varredura** atrás do contorno: do hub para fora nas folhas, da esquerda para a direita no C e no A | O esmaecimento passava por um cinza-esverdeado sujo no meio do caminho. A varredura só mostra contorno ou Algodão chapado, e segue o sentido do desenho e da leitura. |

Ficou igual ao briefing:
- a ordem dos atos;
- as raízes da junção para baixo e a haste do chão ao hub;
- hub com mola e folhas ±24° → 0;
- C e A em contorno → preenchimento, 80 ms entre elas (o preenchimento agora varre, em vez de esmaecer);
- ENTERPRISE com entreletra assentando, 8 ms por letra;
- os paths oficiais;
- a entrada em partes do cabeçalho;
- a mecânica e todas as proteções.

**Roteiro final** (tempos absolutos; a mesma tabela está no topo do `intro.css`):

| Tempo (s) | Peça | Técnica | Easing |
|---|---|---|---|
| 0,05–0,55 | Semente (ponto Trigo, com brilho) | Estoura no horizonte; some 1,00–1,25 | mola |
| 0,10–1,20 | Curvas de nível altas (topos) | Surgem crescendo a partir da semente (`scale` .78 → 1) | `--ease-out` |
| 0,24–1,44 | Curvas baixas (encostas) | Idem, 140 ms depois; depois as duas derivam até 1,04 até a saída | `--ease-out` / linear |
| 0,18–1,18 | Luz Trigo na semente | `opacity` + `scale` .45 → 1 (opacidade ≤ 0,26) | `--ease-out` |
| 0,30–1,20 | Horizonte | Risca a partir da semente para os dois lados e passa por trás da logo; some 1,90–2,40 | (.3,.1,.25,1) |
| 0,40–1,00 | Raízes 1, 2 e 3 | Traço Algodão da junção para baixo, 60 ms entre elas; um cometa Trigo corre na ponta e se apaga ao chegar | `--ease-draw` |
| 0,76–1,78 | Brilho dos anéis | Acende forte e assenta em 0,42 | ease-out |
| 0,80–1,24 | Anéis | `scale` 0 → 1, 60 ms entre eles | mola |
| 0,70–1,25 | Haste | Traço do chão até o hub, com o cometa subindo | `--ease-draw` |
| 1,20–1,46 | Hub | Estoura | mola (.34,1.56,.64,1) |
| 1,28–1,88 | Folhas-hélice | Contorno do hub para fora + abertura ±24° → 0 no hub; o preenchimento varre do hub para fora 1,44–1,80 e o contorno some 1,80–1,95 | `--ease-draw` / mola / `--ease-in-out` |
| 1,40–2,47 | C e A | Contorno letra a letra (80 ms); o Algodão varre da esquerda para a direita atrás dele (1,70–2,22) e o contorno some 2,14–2,47 | `--ease-draw` / `--ease-in-out` |
| 1,92–2,49 | ENTERPRISE | Letras Trigo; a entreletra assenta por `translateX`, 8 ms por letra | `--ease-out` |
| 2,49–2,80 | Pausa | A logo negativa oficial, inteira e parada | — |
| 2,80–3,40 | Amanhecer (saída) | O fundo abre num círculo a partir da semente, com aro Trigo; a logo sobe 14 px e some em 0,42 s (Esc/Enter: o mesmo em 0,36 s) | (.62,0,.3,1) |
| no amanhecer | Cabeçalho e hero | O T cresce da base (+0,18), CA vem da direita (+0,32), os anéis acendem (+0,45), ENTERPRISE aparece (+0,55), menu e CTA descem 16 px; H1 linha a linha e foto revelada | — |

**Mecânica** (a da Pousada Alecrim):
- **Dois tempos:**
  - `.is-playing` (t = 0) anima só `transform` e `opacity` em camadas HTML: mapa, horizonte, luz e semente.
  - `.is-growing` entra 0,40 s depois, ou quando o `site.js` montou a página e a Montserrat chegou (tolerância de 1,2 s por etapa). Ele cuida dos traços e das varreduras em SVG e do recolhimento do horizonte.
- **Logo:** o palco usa os **paths oficiais** do sprite aprovado, nada redesenhado.
  - O contorno das folhas é cortado do próprio path no encosto com o hub, para "desenhar do hub para fora".
  - Os cometas repetem a geometria oficial das raízes e da haste.
  - A varredura é um `clip-path: inset()` animado em cada preenchimento. No fim ele sobra 2 % para fora da letra, para não comer o serrilhado da borda. Sem suporte a `clip-path`, fica o esmaecimento antigo.
- **Mapa:** o `intro.js` calcula as curvas de nível (marching squares sobre um relevo de quatro morros e uma ondulação) e as desenha **uma vez** em dois `<canvas>`, já com o vão da logo apagado.
  - O cálculo leva cerca de 8 ms no desktop e acontece entre as duas pinturas que antecedem a animação.
  - Os canvas só animam `transform` e `opacity`. Como SVG, os ~3.800 trechos eram repintados a cada quadro e derrubavam a abertura para 10–30 quadros/s.
  - Se o canvas falhar, a abertura segue sem o mapa.
  - Num `resize` o mapa é redesenhado.
- **Amanhecer:**
  - É uma `mask-image` radial no overlay, com o raio numa propriedade registrada (`@property --it-r`, não herdada). O aro Trigo é uma camada com a mesma máscara em anel.
  - O centro e o raio (até o canto mais distante) são medidos no palco real no `finish()`.
  - Sem `@property` (navegador antigo), o círculo não cresce aos poucos: o fundo some de uma vez no meio da saída.
- **Página atrás:** fica **pausada** no primeiro quadro enquanto existe `html.intro-active` e entra no `finish()`, revelada pelo círculo. Se a pessoa pular, a página entra no instante do pulo, sem tela vazia.
- **Pular:**
  - Esc e Enter fazem o amanhecer rápido de 0,36 s.
  - Tab libera na hora e o foco segue para "Pular para o conteúdo".
  - Roda, toque e clique pulam com `preventDefault`, então o gesto que pula não rola a página. Os eventos seguintes de uma rajada já rolam: o contrato devolve a rolagem no início da saída.
  - Aba oculta, ou movimento reduzido ligado no meio, libera na hora.
  - Não há botão visível de pular.
- **Proteções:**
  - Decisão no `<head>` antes da 1ª pintura: uma vez por sessão (gravada no começo); nunca com `#âncora`, página rolada, aba oculta, movimento reduzido ou `?fx=0`.
  - Failsafe só em CSS, de 6,5 s. O fundo do failsafe também é Floresta funda.
  - `onerror` no `<script>` libera na hora se o `intro.js` não carregar.
  - Sem o `intro.css`, o overlay não fica fixo e a abertura não roda.
  - Duas pinturas (rAF duplo) antes de animar, mais um `setTimeout` de 250 ms de reserva.
  - Trava de 4,4 s contada do início da animação: 1 s de folga sobre o roteiro de 3,4 s, para um celular lento ainda ver a logo inteira.
  - O `theme-color` fica Floresta funda durante a abertura e volta.
  - O overlay não prende foco nem rolagem e sai do DOM.
- **Traços e tamanhos:**
  - Nenhum traço abaixo de ~1 px de tela: o contorno é reforçado abaixo de 900 e de 600 px de largura e de 500 px de altura.
  - As curvas do mapa têm 1,25 px de tela, e as mestras 1,9 px.
  - O palco se mede por `--iw`. O mapa se mede por `max(--iw, 62vh)`, para não ficar miúdo num celular em pé.
  - Não há `vector-effect: non-scaling-stroke`.
  - Só as folhas-hélice giram; C, A e ENTERPRISE nunca giram nem esticam.

**Logo do cabeçalho:** é uma **cópia inline** dos paths, em grupos (`lg-t`, `lg-aneis`, `lg-ca`, `lg-enterprise`), para entrar em partes. O rodapé continua com `<use>` e cai para o nome em texto se o sprite não renderizar.

### Manutenção da abertura

Se o vetor mudar, rode `node qa/ferramentas/montar-marca-inline.js`. Ele regrava a partir do `assets/marca/tca-logo.svg`:
- o palco em `intro.js`, entre `/*PALCO:INICIO*/` e `/*PALCO:FIM*/`, com a logo, os cometas, o brilho e as camadas de cenário;
- a logo inline do `index.html`, entre `<!-- LOGO-INLINE:INICIO -->` e `<!-- LOGO-INLINE:FIM -->`.

**Não edite esses trechos à mão.** Onde mexer em cada coisa:
- **Roteiro (tempos e easings):** só no `intro.css`.
- **Relevo do mapa:** nas constantes `MORROS`, níveis e grade do `intro.js`, que são escritas à mão.

**Para ver a abertura sem abrir o navegador:**
- `node qa/ferramentas/filmar-abertura.js 1440x900` grava um MP4 quadro a quadro, com relógio controlado, em `qa/fase1/abertura-<largura>.mp4`.

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
| 2 | Hero | Algodão + curvas de nível finas ao pé (continuam o horizonte da abertura) | **02** no H1, **04** na foto. |
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
node qa/ferramentas/capturar-quadros.js abertura-1440 0,0.85,1.7,2.55,3.4 1440x900   # folha de quadros (0/25/50/75/100 %)
node qa/ferramentas/filmar-abertura.js 1440x900 [fps] [fim]                         # MP4 da abertura, relógio controlado
node qa/ferramentas/contraste.js  ·  node qa/ferramentas/copy.js  ·  node qa/ferramentas/espiar.js 390x844
```

Por padrão, as sessões de teste nascem com a abertura já "vista" (só a Fase 1 pede `intro: true`). Cada sessão abre um Edge headless com perfil próprio no TEMP e o fecha com `Browser.close`, pelo próprio CDP. Até 26/10 o `cdp.js` só matava o lançador: o navegador de verdade ficava órfão, e sobraram 164 processos e 3,9 GB de perfis, o que encheu o disco C:.

**Resultado da v0.3.1** (26/10, Edge headless, `qa/fase1/resultados.json`):
- **Fim natural:** a saída começa 2,9 s depois do início, e a abertura sai do DOM em 3,6 s. Em 1440 e em 390, a mediana de quadro é 16,7 ms e o p95 fica em 17–18 ms; quadros lentos só na carga da página.
- **Recarregar:** não repete. `?intro=1` força; `#contato` não toca.
- **Pular:** Esc, Enter, clique, roda e toque saem em 0,4–0,5 s e não rolam a página; uma rajada de roda rola, como previsto. Tab e aba oculta liberam na hora.
- **JS:** bloqueado, libera na hora; vazio, o failsafe libera aos 6,5 s.
- **CPU 4× (celular):** a abertura termina pelo roteiro, não pela trava. O p95 oscila entre 34 e 134 ms de uma rodada para outra (na v0.3.0, 50 ms), com os quadros longos na carga da página e no começo da saída.
- **Tamanhos:** 360 × 640, 390 × 844, 900 × 500, 1440 × 900 e 1920 × 1080 cabem, com contorno ≥ 1,27 px.
- **Pose final × sprite oficial:** a geometria é idêntica (clone × oficial: diferença máxima 3/255); a abertura congelada difere em 0,46 % dos pixels em 1440 e em 1,0 % em 390, só no antisserrilhado e no brilho (na v0.2.0 eram 1,1 %).
- **Evidências:** `qa/fase1/abertura-1440.mp4`, `qa/fase1/abertura-390.mp4` e as folhas `abertura-1440`, `abertura-390`, `roteiro-1440` e `entrega-1440`.

**Não testado:**
- Safari, Firefox e celular físico (o "celular" foi emulação no Edge headless).
- Aba oculta de verdade (foi simulada por `visibilitychange`).
- Leitor de tela real.
- Um olhar humano assistindo à abertura em tempo real: a análise foi por quadros congelados, pelos vídeos montados quadro a quadro e por sondas de tempo.
- Desempenho com GPU de verdade: o headless compõe as camadas na CPU, o que é mais pessimista. A máscara do amanhecer é repintada a cada quadro, e é o trecho mais caro num aparelho fraco.
