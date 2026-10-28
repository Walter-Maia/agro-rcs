# TcaEnterprise: landing page (v0.6.4)

Página estática, sem build, com a identidade aprovada na Rodada G e uma abertura animada derivada da geometria da marca. O briefing está em `../PROMPT-CLAUDE-TCA-LANDING-PAGE.md`.

**Estado em 28/10/2026:**
- **Fase 0 (vetor da marca): aprovada pelo Walter.** Foi feita pelo agente principal em `assets/marca/` e `qa/vetor/`.
- **Fase 2 (página): pronta e testada localmente.**
- **Fase 1 (abertura "o broto que acende"): refeita em 26/10 na versão noturna e testada localmente.** O Walter achou a primeira versão (fundo Algodão, 23/10) fraca demais. Na revisão do mesmo dia (v0.3.1), ele achou feios o pulo do T e o anel que saía dele: os dois saíram e a abertura ficou mais limpa.
- **No ar:** a **v0.6.4** (travessias da linha suaves, contatos confirmados, e com ela as v0.6.0 a v0.6.3), publicada em 28/10 a pedido do Walter ("sobe no git"). Antes, a **v0.5.0** (hero com o broto em 3D, menu refeito), publicada em 27/10. Antes dela, no mesmo dia, a **v0.4.0** (serviços de gestão rural, solo em carrossel, menu em tela cheia), e antes a **v0.3.1** (abertura noturna, versão limpa) foi publicada no GitHub Pages em 26/10, com o ok do Walter (`Walter-Maia/agro-rcs`, https://walter-maia.github.io/agro-rcs/). Antes dela, de 23/10 a 26/10, esteve no ar a **v0.2.0**, com a abertura clara.

**v0.6.4 (28/10/2026, publicada no GitHub Pages):** o Walter achou rápidas demais as partes em que a linha dos serviços vai para a diagonal e pediu que fossem mais limpas e suaves; tirou o endereço do contato, passou o WhatsApp e o e-mail e pediu testes de bugs (web e celular), otimização e responsividade.
- **Linha dos serviços, a velocidade:** a ponta seguia a linha de 62 % da tela pela altura, então nas travessias (345 px de lado em ~60 px de altura) andava até 11 px de traço por pixel rolado e atravessava num estalo. O comprimento desenhado por altura agora passa por duas médias móveis de ±140 px (núcleo triangular): a ponta começa a travessia um pouco antes, cruza a no máximo ~1,9× a rolagem (2,1× em 2560) e alcança a linha logo depois. Os anéis acendem quando a ponta passa por eles, como antes.
- **Linha dos serviços, o desenho:** a travessia era uma cúbica espremida no vão entre a ficha de um serviço e a foto do seguinte, com as duas dobras quase em ângulo reto (raio de ~2 px no fim). Agora pode começar mais cedo e chegar mais tarde dentro dos corredores, e o `site.js` escolhe, entre ~2.600 combinações de começo, chegada e alças, a de menor curvatura máxima que passa a 14 px de tudo: em 1440, travessias de 65 → 124 px de altura e dobras de raio 16; a última chega deitada no anel do fim (raio 2 → 17). Em 1024 o vão é baixo e o raio fica em 8. A escolha roda só na carga e quando a seção muda de tamanho (nenhuma montagem durante a rolagem) e leva alguns ms: a montagem inteira mediu 7 ms em 1440, com a máquina carregada.
- **Contato:** WhatsApp (34) 98409-3888 (`wa.me/5534984093888`) e e-mail Enterprise.tca@gmail.com, os dois como links; o endereço saiu e os canais ficaram em duas colunas (uma abaixo de 600 px). O botão "Fale com a TCA" abre o WhatsApp numa aba nova; o aviso de prévia e o código do botão sem destino saíram.
- **Bug achado nos testes (de antes desta versão):** com movimento reduzido, abrir o menu não levava o foco do teclado ao primeiro link. A regra global de transição de .01ms pegava também o `visibility` (a propriedade padrão é "all"), e no quadro da abertura o link ainda estava "hidden". O menu ficou sem transições no `html.rm`.
- **Testes** (Chrome headless; `qa/ferramentas/regressao.js`, novo):
  - 320, 360, 390, 768, 1024, 1280, 1440, 1920 e 2560 px, e 390 e 1440 com movimento reduzido: sem estouro lateral, sem erro de console, exceção ou 404, vídeos sem erro, imagens carregadas (menos a logo de reserva do hero, que só aparece sem WebGL), menu abrindo com o foco no 1º link e fechando com Esc, contatos e botão com os links certos, alvos de toque de 112 × 39 e 187 × 39 px.
  - `copy.js`: as 54 chaves conferem e nenhuma palavra sem acento.
  - Lighthouse 12: desktop 100/100/100 (FCP 0,5 s, LCP 0,8 s, TBT 10 ms, CLS 0); celular 87/96/100 (FCP 2,1 s, LCP 3,6 s, TBT 120 ms, CLS 0). O 96 é o contraste do botão do hero lido no fim do fade de entrada (4,45:1 com o botão a 92 % de opacidade, logo depois da abertura); em repouso ele tem 5,03:1. Na rodada anterior, o mesmo teste passou.
  - `desempenho.js` em 1440: quadros iguais aos da auditoria (p99 4,3 ms, nenhum acima de 17 ms fora da carga e da rolagem), sem montagens da linha durante a rolagem. O fio principal mediu de 25 a 40 % a mais em todas as janelas, inclusive nas que não mudaram (hero parado): a máquina estava com 48 % de CPU ocupada por outros processos.

**v0.6.3 (28/10/2026, publicada junto com a v0.6.4):** o Walter achou as animações do menu datadas, lentas para aparecer e pouco limpas (pediu os desenhos prontos e animados), pediu o desenho em linha no fundo dos serviços (que tinham muito espaço vazio) e mais linhas, mais dinâmicas, no fim do CTA.
- **Menu, cenas prontas e vivas:** o Walter testou uma vitrine de fotos no lugar das cenas e achou feia; as cenas em vetor voltaram, mas já chegam desenhadas (o traçado na hora, de até 3 s por cena, saiu) e ficam vivas enquanto estão em cena (roteiro em `site.js`, `CENAS`):
  - Início: os anéis numa órbita, um ponto Trigo orbitando, um halo pontilhado girando ao contrário, ondas saindo do anel do meio e os anéis respirando;
  - Serviços: três curvas de nível andando, cada uma no seu passo, com uma boia Trigo que flutua e pulsa;
  - Como funciona: pulsos de luz descendo pela haste e pelas raízes, e cada anel acendendo quando o seu chega;
  - Sobre: o broto com as folhas balançando fora de fase, o nó respirando e grãos de luz subindo;
  - Contato: traços Trigo correndo pelas linhas até o pino, ondas no pino e os pontos do mapa piscando.
  - A troca é um cruzamento com zoom de 0,94 para 1 (CSS); a cena que sai segue viva até sumir e, se voltar antes, continua de onde estava. Com o menu fechado, nenhuma animação de cena roda. A legenda troca rolando numa máscara.
- **Menu, abertura:** véu em 0,35 s, camadas em cascata, links por máscara sem o giro, a cena subindo e assentando; fechar em 0,5 s. O véu ficou opaco, com uma luz baixa atrás das cenas (o texto do hero aparecia por trás como um fantasma). O foco do teclado é a própria faixa dourada; o contorno, recortado pela máscara da linha, virava duas barras soltas. No Edge headless, o clique custa ~3 ms de JS e os quadros seguintes, 2 a 5 ms.
- **Serviços, desenho em linha no fundo** (`site.js`, "trilha"):
  - um traço só desce pelo corredor entre foto e texto de cada serviço, cruza de lado no vão até o próximo e termina num anel sobre a nota do fim;
  - a ponta (um ponto Trigo com halo) vai a 62 % da altura da tela, então o traço se desenha com a rolagem e acende um anel da marca na altura de cada título;
  - atrás, quatro "morros" de curvas de nível (6 anéis irregulares, um Trigo) ocupam o vão do lado do texto, se desenham ao entrar e andam com a rolagem (paralaxe só por `transform`);
  - tudo é medido no layout real e refeito quando a seção muda de tamanho; abaixo de 820 px, só os morros, quase todos fora da tela, nos vãos;
  - o vão entre os serviços caiu de 96–176 px para 88–148 px.
- **CTA, as linhas do fim:** as duas curvas pequenas do meio saíram e, no fim da seção, de borda a borda e encostadas no rodapé, entraram 8 curvas (uma Trigo). Elas nascem achatadas e afundadas e abrem conforme a página chega ao fim (as da frente sobem mais), levantam 1,6× mais com a força da rolagem e, com mouse, seguem o ponteiro em profundidade.
- **Movimento reduzido:** o traço inteiro com os anéis acesos, os morros prontos, as linhas paradas e abertas, e o menu sem animação.
- **Auditoria de desempenho** (28/10, pedida pelo Walter junto com as cenas; `qa/ferramentas/desempenho.js` e Lighthouse 12):
  - **O broto era desenhado duas vezes por quadro, desde a v0.5.0.** Sem a abertura (toda visita depois da primeira na sessão, link com âncora ou página já rolada), `nascer()` pedia o primeiro quadro antes da linha `var raf = 0`, que apagava esse pedido; o `medir()` pedia outro, e as duas cadeias de rAF seguiam juntas para sempre, cada uma zerando a trava da outra. O estado do laço agora é declarado antes da entrada: 1 desenho por quadro (no topo, 965 → 724 pedidos de rAF/s a 240 Hz).
  - **O sol e o convite para rolar animavam escondidos.** Os três laços em CSS do hero seguiam sob a cortina e sob o menu, com um recálculo de estilo por quadro. Agora param com `.broto.is-fora` (o mesmo IntersectionObserver do broto, e o evento do menu). Parado no meio da página, o fio principal caiu de 129 para 23 ms/s; no fim, de 162 para 115; trocando as cenas do menu, de 193 para 164.
  - **O laço do broto não lê mais o layout.** Ele pedia `getBoundingClientRect()` da seção e da cortina a cada quadro, depois de o GSAP já ter escrito estilos (um recálculo forçado por quadro: 852 vezes, 685 ms, num perfil do celular com CPU 4×). As duas posições na página são medidas no `medir()` (ResizeObserver no palco e na seção), e o quadro só desconta a rolagem; o progresso confere com o antigo em 5 posições e depois de redimensionar.
  - **Fotos dos serviços em 720 e 1200 px**, além de 900 e 1600, e `sizes` do tamanho real da foto (era `56vw` / `100vw`): 90vw no celular (a tela menos as margens), 52vw até 1300 px, 670 px de 1300 a 1920 (o envoltório para de crescer) e 35vw acima. Um desktop 1× pede a de 720. Um celular 2× pede a de 720 (37–52 KB, eram 52–83); um 3×, a de 1200 (78–135 KB, eram 124–231). Feitas do JPEG de 1600 com o `webp.js` no Chrome, qualidade 0,72 (o mesmo peso das atuais).
  - **A logo de reserva do hero** (só aparece sem WebGL) passou a `loading="lazy"`: um pedido a menos na carga.
  - **Não mexido, de propósito:** no celular, na primeira visita, o LCP é o título do hero, que só aparece quando a abertura termina (3,1–3,7 s no Lighthouse; 88 % disso é espera de desenho, não de rede); é uma decisão de desenho, não um defeito. O link dos shaders trava o fio principal ~43 ms na carga (`KHR_parallel_shader_compile` tiraria isso, mas mexe na inicialização do hero). As linhas do fim do CTA seguem custando quadro a quadro enquanto estão na tela, como pedido.
  - **O que estava errado na medição:** o Edge headless desta máquina põe a aba em "hidden" 10 a 14 s depois de abrir (até numa página em branco, e mesmo sem o cálculo de oclusão): o rAF vai a zero, a roda do mouse deixa de responder e, minutos depois, o JS para. Toda medição mais longa saía errada ou travava (foi o que prendeu a auditoria anterior por 46 min, e o "LCP de 8,3 s" que ela viu no desktop). O `cdp.js` passou a usar o Chrome quando ele está instalado, com o Edge como reserva.

**v0.6.2 (28/10/2026, publicada junto com a v0.6.4):** o Walter aprovou o hero e pediu um sol com animação e efeito de rolagem, hover nas fotos (o produtor escrevendo, a lavoura se mexendo), hover dourado no menu, o menu mais leve e mais detalhes.
- **Sol no hero:**
  - **Posição:** `.broto__ceu` refaz em CSS o `object-fit: cover` da foto (largura = a maior entre a da tela e a altura × proporção; mesmo `object-position`, com `cqw/cqh`). Assim o sol fica preso ao céu da imagem em qualquer tela.
  - **Recorte:** o disco e os raios ficam num `clip-path` com a silhueta das colinas, medida na própria foto (maior queda de luminância coluna a coluna). O halo fica livre.
  - **Animação:** chega com a foto, o halo respira (7 s) e os raios giram muito devagar (180 s), em `screen`.
  - **Rolagem:** o sol desce e se põe atrás das colinas antes de a câmera chegar ao alto. Ele acompanha o mouse um pouco mais que a foto.
  - **Contraluz do broto:** é o sol (`u_sol` no shader) e apaga junto com ele.
  - **Foto em pé:** o sol fica à esquerda do céu, para não cair sob o botão Menu, e a foto passou para `object-position: 50% 12%` (mais céu num tablet em pé).
- **Fotos que ganham vida:**
  - Quatro cinemagraphs gerados no Higgsfield (MiniMax H3 Max, com o mesmo quadro no início e no fim, 12,5 créditos cada), a partir das próprias fotos: o produtor escrevendo, a soja ao vento com poeira na luz, as vacas e a neblina, a poeira no galpão.
  - Comprimidos com ffmpeg em H.264 de 960 px, sem o último quadro (igual ao primeiro): 330 a 510 KB cada, em `assets/video/`.
  - **Com mouse:** pré-carregam quando o serviço chega perto da tela e tocam no hover da linha. Só aparecem, por cruzamento sobre a foto, quando já estão tocando.
  - **No toque:** tocam enquanto a foto está a 60 % à vista, e só o que aparece carrega.
  - Nada carrega com economia de dados nem com movimento reduzido.
- **Hover dos serviços:**
  - um passe-partout Trigo que se desenha para dentro;
  - a foto e o vídeo a 1,045;
  - a ficha sobe 8 px (`translate`, separado da entrada) com a sombra mais aberta;
  - os anéis da lista acendem em cascata.
- **Menu:**
  - **Hover dourado:** uma faixa Trigo entra pela esquerda, de borda a borda do painel. Texto, número, anel e seta ficam Floresta funda (6:1). Ao sair, a faixa recolhe para a direita. O `li` passou de `overflow: hidden` para `clip-path: inset(0 -240px)`, que recorta só em cima e embaixo.
  - **Mais rápido:** o véu entra em 0,3 s, as camadas em 0,6 s (cascata de 0,05 s), os links começam aos 0,08 s e a saída leva 0,45 s.
  - **Montado e escondido:** o menu fica montado e escondido (`.is-fechado`, `visibility`), em vez de `hidden`/`display: none`. Abrir não recalcula layout; no Edge headless, o pior quadro ao abrir caiu de 20,8 ms para 4,3 ms.
- **Detalhes:** seta nos botões Trigo, que anda no hover, e um fio Trigo de progresso da leitura no alto do cabeçalho.

**v0.6.1 (28/10/2026, publicada junto com a v0.6.4):** o Walter achou o broto 3D feio e o menu ainda "lagado".
- **Broto "porcelana e ouro"** (`broto.js`): a geometria e o material foram refeitos. Agora é uma pequena escultura de pé sobre o mapa de curvas de nível (o chão desceu para a altura dos anéis):
  - caule de porcelana Algodão que afina para cima;
  - botão em gota;
  - folhas em concha, numa grade de 48 × 12 com normais próprias, com fio de ouro na borda, nervura de ouro que afina e veias gravadas (antisserrilhadas com `fwidth`, pela extensão `OES_standard_derivatives`);
  - raízes curvas (Bézier) que afinam e viram ouro antes dos anéis, que agora são um fio fino;
  - uma semente de ouro na junção, a primeira peça a nascer, como na abertura.
- **Material:** o esmalte da porcelana e o ouro refletem um ambiente igual ao da foto (chão verde, faixa dourada no horizonte, céu escuro), com Fresnel e tom ACES. A contraluz Trigo vaza pelas folhas.
- **Pulso de luz:** a cada 7 s, depois que o broto nasceu, um pulso sobe dos anéis pelas raízes, acende a semente, sobe o caule e corre pelos fios de ouro das folhas.
- **Malha:** ~18,7 mil triângulos (eram 9,7 mil), ainda num desenho só por passe.
- **Menu sem lag:** o main thread não era o problema (Edge headless: mediana de 4,2 ms por quadro ao abrir e fechar, com ou sem as mudanças). As causas atacadas foram:
  1. **O ease "main" (.65, .01, .05, .99):** quase parado no primeiro terço e depois um salto. O clique parecia não responder. Entrada e saída usam agora a curva de saída do site (.16, 1, .3, 1): o painel anda já no primeiro quadro. A entrada foi para 0,8 s, com cascata de 0,07 s e links a partir de 0,14 s; a saída, para 0,5 s.
  2. **O `backdrop-filter: blur(12px)` do véu:** por cima do canvas do hero, a GPU refazia o desfoque da tela inteira a cada quadro. O véu agora é Floresta funda a 95,5 %, sem desfoque.
  3. **Trabalho por trás do véu:** com o menu aberto, o broto e as curvas de solo param (evento `tca:menu`).
  4. **Disputa pelo primeiro quadro:** o `inert` da página sai do primeiro quadro (vai para o seguinte) e a primeira cena começa 0,3 s depois, quando as camadas já passaram.
  5. **Isolamento:** `contain: layout paint` no painel e no palco das cenas.
  6. **Botão "Menu":** perdeu o `--ease-main` (o token saiu do CSS).
- **Não medido:** o ganho na GPU. O Chrome desta máquina estava em segundo plano (o rAF fica limitado a 1 quadro/s) e o headless compõe sem GPU. O menu foi conferido no Chrome: abre e fecha, a cena toca, o foco volta ao botão, o broto e as curvas param e voltam, sem erros no console.

**v0.6.0 (28/10/2026, publicada junto com a v0.6.4):** o Walter pediu um hero mais bonito nas cores do site, animações limpas e harmônicas, o site otimizado e responsivo em qualquer resolução.
- **Hero sobre o campo ao anoitecer:**
  - O broto 3D agora fica sobre uma foto gerada no Higgsfield (`gpt_image_2_5`, high, 2k): colinas em curvas de nível com o horizonte dourado.
  - Na paisagem, o lado esquerdo é escuro para o texto. No celular entra uma versão vertical (`<picture>`, `orientation: portrait`).
  - No quadro "Visto de cima", a foto passa para o campo visto de cima.
  - As três fotos foram puxadas para a paleta (laranja → Trigo, verde → Floresta) com `hue-rotate(5deg) saturate(.88)` na conversão. Um véu escurece o lado do texto, o alto e o pé da tela.
- **Broto mais rico** (`broto.js`):
  - Lua fria pela frente e contraluz Trigo por trás (o horizonte), que vaza pelas folhas.
  - Nervura e base mais escura nas folhas.
  - Brilho que respira no chão, como a luz das raízes.
  - As curvas de nível do chão viraram filetes Trigo translúcidos, mais fracos para fora.
  - Os anéis pulsam de leve.
- **Lugar do broto pelo layout:** o centro e o tamanho em cada quadro saem do espaço que o texto deixa livre: ao lado (deitado) ou acima (em pé), acima da frase do quadro 1 e na posição real do T da logo do cabeçalho. Não há mais números por resolução (`QUADROS_ALTO` saiu).
- **Entrega sem tela vazia:**
  - Antes, o fundo clareava para o Algodão e sobrava uma tela creme inteira, vazia.
  - Agora o broto encolhe até o T da logo sobre o fundo escuro, com o cabeçalho sem fundo enquanto o palco está por baixo (`.topo--palco`).
  - Na última meia tela, a faixa de solo e os serviços sobem por cima do palco como uma folha (a "cortina": cantos arredondados e sombra para cima). A foto sobe e escurece por baixo dela.
  - O hero passou de 2,3 para 2,6 telas.
- **Movimento:**
  - Uma escala só de durações no `:root` (`--dur-rapida` .35 s, `--dur-media` .7 s, `--dur-entrada` 1 s, `--dur-lenta` 1,3 s) nas entradas, nos reveals, nas fotos, nas fichas e no cabeçalho.
  - O texto do hero sai só com opacidade e translação; o `blur()`, que repintava a cada quadro, saiu.
  - Sem quique nem elástico: o ímã do CTA volta com `power3.out`, o pino do menu cai sem `bounce` e as folhas abrem com `back.out(1.3)`.
  - A faixa de solo ficou mais calma: 20 a 54 px/s, 0,25 a 0,7 px por px rolado, impulso de até 3,5× (era 10×) e relevo até 1,3×. O sentido vira devagar, sem tranco.
- **Otimização:**
  - Fotos dos serviços em WebP com o JPEG de reserva (`<picture>`): 1,7 MB → 1,1 MB. O hero pesa 17 a 90 KB por tamanho.
  - A foto de cima só carrega depois do `load` ou na primeira rolagem.
  - A Source Sans entra com preload.
  - O CustomEase saiu (a curva "main" do menu é uma Bézier resolvida no `site.js`): um pedido a menos ao CDN.
  - No laço do broto:
    - a luz é um disco fixo movido só por `transform` (antes mudava largura e altura a cada quadro);
    - o DOM só é escrito quando o valor muda;
    - o canvas tem um teto de ~5 milhões de pixels;
    - o laço para quando a cortina cobre o palco;
    - a rolagem só pede quadro com o hero à vista.
  - O cabeçalho é recalculado no máximo uma vez por quadro.
  - O botão secundário perdeu o `backdrop-filter`.
- **Responsivo em qualquer resolução:**
  - A coluna do conteúdo vai de 1280 a 1600 px (`--envoltorio`) e o texto base de 16 a 18 px em telas grandes.
  - O H1 do hero cresce com a largura, mas nunca passa de 8,4 % da altura.
  - Há um corte para celular deitado (`max-height: 560px`).
  - Abaixo de 360 px, os botões do hero ficam empilhados.
  - Os dois botões do hero têm a mesma altura: a regra de 60 px do CTA final vazava para o hero.
  - O fundo do documento e o `theme-color` são Floresta funda.
- **Conferido** (Chrome a 120 Hz e Edge headless):
  - 320 × 640, 360 × 640, 390 × 844, 844 × 390, 768 × 1024, 1366 × 657, 1912 × 867 e 2560 × 1440: sem vazamento horizontal e sem erros no console.
  - Rolando pelo hero, a mediana de quadro é 8,3 ms e o p95 fica em 8,5 ms, sem tarefas longas.
  - Abertura (`?intro=1`), modo estático (`?fx=0`) e menu: ok.
  - `copy.js`: as 56 chaves batem.
  - O `fase2.js` não foi rodado: regravaria as evidências versionadas em `qa/fase2/`, e vários casos dele já estavam obsoletos desde a v0.4.0.
- **Ferramentas novas:**
  - `qa/ferramentas/webp.js` converte para WebP em várias larguras, com o codificador do próprio Edge, e aceita um filtro de cor.
  - `qa/ferramentas/hero.js` fotografa os três quadros e a cortina num tamanho de tela.

**v0.5.0 (27/10/2026, publicada no GitHub Pages no mesmo dia, a pedido do Walter):**
- **Backup:** antes da troca do hero, a página inteira (v0.4.0 com os grafismos do menu da primeira versão) foi copiada para `backup/`, que funciona sozinha (`backup/LEIA-ME.md`).
- **Hero = o broto em 3D** (`assets/js/broto.js`, WebGL puro, sem biblioteca; formato adaptado do componente "Lycoris Specimen" que o Walter mandou, sem React). O broto é modelado por código com as proporções do símbolo: caule, nó, duas folhas-hélice com nervura e torção, três raízes a 120° que terminam em anéis Trigo deitados no solo e três curvas de nível no chão. Nasce na ordem de uma planta (chão, raízes, anéis, caule de baixo para cima, nó e folhas abrindo com mola), depois de a abertura terminar, e balança devagar (arrastar gira). A rolagem conduz três quadros num palco preso à tela (2,3 telas): capa (texto à esquerda), "Visto de cima" (as folhas viram hélice sobre as curvas de nível) e entrega (o fundo clareia para o Algodão e o broto encolhe até o lugar da logo do cabeçalho, que some no hero e reaparece nessa hora). Sem WebGL ou sem JS: a logo negativa. Movimento reduzido: uma tela só, broto pronto e parado. O Higgsfield não foi preciso: o 3D é gerado no próprio navegador (~8,5 mil triângulos).
- **Menu refeito:** o Walter achou as animações quebradas. Causas encontradas: `vector-effect: non-scaling-stroke` junto com `pathLength` (o Chrome desconta o tracejado e o desenho sai cortado), cenas por cima dos links e do botão, e foco e mouse brigando pela cena (aparecia a cena errada). Agora as cenas moram num palco próprio à esquerda do painel (telas largas, com o fundo desfocado), há um só item em cena (mouse, senão teclado, senão a seção que está na tela, marcada com um anel Trigo), a troca é um cruzamento de 0,35 s, e escala e giro só acontecem em `<g>` com `svgOrigin` explícito. Cada cena tem uma legenda.

**v0.4.0 (27/10/2026, publicada no GitHub Pages no mesmo dia, com o ok do Walter):** o Walter passou os serviços reais da empresa e pediu um site mais vivo, com mais elementos em linha como a curva de solo da hero.
- **Serviços:** a página fala só dos quatro serviços que a TCA faz hoje (decisão do Walter: saem drone, irrigação e sensores): controle de custos e contabilidade rural; resultado da safra e lucro por cultura; gestão da pecuária leiteira; estoque e planejamento de compras. Os títulos e textos dos quatro vieram do cliente. Hero, faixa, "Como funciona" (Anotar → Organizar → Decidir), Sobre e CTA foram reescritos para esse posicionamento.
- **Solo em carrossel:** curvas de nível periódicas (geradas no `site.js`) que andam em x com a rolagem e uma deriva lenta, cada uma na sua velocidade, e dão a volta sem emenda. Estão no lugar da antiga faixa de texto (logo abaixo da hero: 4 curvas, uma Trigo), na divisa entre Serviços e Como funciona e ao fundo do CTA. A dinâmica é a do marquee que saiu: andam sozinhas (até 42 px/s), aceleram até 7× com a rolagem e invertem o sentido quando ela volta. Depois, o Walter pediu mais força: agora as curvas derivam de 34 a 90 px/s, são arrastadas junto com a rolagem (0,45 a 1,3 px por px rolado), ganham impulso de até 10× e o relevo "levanta" até 1,5× (scaleY) e assenta. O botão de pausa saiu, também a pedido dele. Atenção: sem o botão, o movimento contínuo não atende o WCAG 2.2.2 (quem liga o "reduzir movimento" no sistema recebe as linhas paradas). Os rótulos "01/04" dos serviços também saíram.
- **Cabeçalho e menu (27/10):** logo no meio e um só botão "Menu" à direita, adaptado do componente "kinetic navigation" que o Walter mandou (React + GSAP), reescrito em JS puro com o GSAP da página e o CustomEase do cdnjs. O painel entra pela direita em três camadas (Trigo, Floresta, Floresta funda), os links (Início, Serviços, Como funciona, Sobre, Contato) sobem com giro e levam às seções, e cada link acende no fundo um grafismo em linha da marca (anéis, curvas de nível, raízes, folha, pontos). A barra muda de cor conforme a seção que está logo abaixo dela: sobre as seções escuras, a logo vira o negativo e o fundo fica Floresta, numa transição feita com `@property`. Sem GSAP ou com movimento reduzido, o menu só aparece e some. Os casos de menu do `fase2.js` ficaram obsoletos.
- **Grafismos do menu e linhas do CTA (27/10, depois da publicação):** o Walter achou os grafismos "jogados". Cada link agora conta uma cena com ordem e um detalhe vivo (roteiro no `site.js`, `CENAS`): Início (órbita, anéis em cascata, pulso e ponto orbitando), Serviços (2 curvas de nível andando sozinhas com um marcador que boia na curva Trigo), Como funciona (haste, raízes, anéis e pulsos de luz correndo pelas raízes), Sobre (chão, raízes, caule de baixo para cima e, com o caule firme, o nó e as folhas se abrindo, que depois balançam) e Contato (pontos, linhas até o pino, pino caindo com ondas e tracejado correndo até ele). No fim do CTA, as linhas grandes do fundo deram lugar a 2 curvas pequenas, no mesmo movimento da faixa de solo.
- **Fichas:** quadros de exemplo, em linha, sobre cada foto (planilha, gráfico receita × custo com o ponto de equilíbrio, produção de leite, barras de estoque). Os traços se desenham e os números contam ao entrar. Todos levam a etiqueta "Exemplo" e um `aria-label` com os valores, e a página avisa que fotos e números são ilustrativos.
- **Hero:** foto aérea de lavoura em curvas de nível, com paralaxe na rolagem (`--p`), ficha de lucro por cultura e atalhos para os quatro serviços.
- **Fotos:** cinco, geradas no Higgsfield (`gpt_image_2_5`, high, 2k) com o ok do Walter, em `assets/img/` como JPEG (esta máquina não tem conversor para WebP), cada uma em duas larguras com `srcset`.
- **QA:** `fase2.js` e `copy.js` foram ajustados para as novas seções, mas não rodaram: o Node não está mais nesta máquina. A conferência foi feita no Chrome (desktop, 390 px em iframe, `?intro=1`, `?fx=0`): sem erros no console, sem vazamento horizontal, e as chaves de copy batem com a página. Os casos do marquee no `fase2.js` (faixa, pausa, leitores) ficaram obsoletos e precisam ser reescritos para a faixa de solo (sonda `TCA.solo()`).

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
assets/img/              fotos ilustrativas (Higgsfield, 27–28/10): serviços em WebP + JPEG de reserva, hero só em WebP
qa/ferramentas/          servidor, cliente CDP (Chrome headless, ou Edge), testes, gerador da marca inline, webp.js, hero.js, desempenho.js e regressao.js
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
| 1 | Cabeçalho fixo: logo no meio, menu à direita | Algodão translúcido ao rolar; Floresta sobre as seções escuras | Logo em partes; o botão desce 16 px; a cor segue a seção; menu em tela cheia em camadas. |
| 2 | Hero (v0.6.0) | Floresta funda + foto do campo | Broto 3D em palco preso (capa → de cima → entrega no T da logo), **02** no H1, foto que se aproxima e acompanha o mouse, cortina dos serviços por cima. |
| 3 | Faixa de solo (no lugar do marquee, a pedido do Walter em 27/10) | Algodão | 4 curvas de nível em carrossel, com a dinâmica do antigo **06**, e botão Pausar/Retomar. |
| 4 | Serviços (lista editorial alternada, 4 itens, foto + ficha + texto) | Algodão + solo na divisa | **04** em cada foto + **11** zoom interno (só com ponteiro fino); fichas desenhadas e números contados. |
| 5 | Como funciona: "Do caderno ao resultado" | Floresta | Raízes do logo desenhadas pela rolagem (assinatura) + **02** no título. |
| 6 | Sobre | Algodão | **02** no título; o texto sobe ao entrar. |
| 7 | CTA final | Floresta + solo claro ao fundo | **07** magnético + press com mola. |
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

- Todos os textos estão no bloco `COPY PROVISÓRIA` do topo do `index.html` (54 chaves). Cada elemento tem `data-copy="chave"` e o comentário `<!-- COPY PROVISÓRIA -->`.
- **Para trocar um texto, edite os dois lugares e rode `node qa/ferramentas/copy.js`.** O script confere a correspondência, a marca e a acentuação.
- **Contatos (confirmados pelo Walter em 28/10):** o WhatsApp e o e-mail estão no bloco do topo e nos links de `#contato-canais`; o botão do CTA final aponta para o mesmo WhatsApp. Para trocar o número, mude os três (o texto e os dois `href`).

## Pendências com o cliente

1. **Copy:** todos os textos são provisórios.
2. **Serviços:** confirmados pelo Walter em 27/10 (os quatro da v0.4.0). Os números das fichas são exemplos inventados e devem continuar marcados assim, ou ser trocados por dados reais com autorização.
3. **Contatos:** confirmados em 28/10 (WhatsApp (34) 98409-3888 e Enterprise.tca@gmail.com; o botão do CTA abre o WhatsApp). O endereço saiu a pedido do Walter.
4. **Fotos:** as cinco atuais são ilustrativas (Higgsfield, 27/10). Fotos reais da operação, quando houver, entram nos mesmos lugares e proporções (hero 4:5 no desktop e 4:3 no celular; serviços 3:2). Fotos novas: converter com `node qa/ferramentas/webp.js` (WebP feito na v0.6.0).
5. **Seções que não entraram por falta de dados reais:** números, depoimentos e logos de clientes ou parceiros.
6. **Na publicação** (não autorizada ainda):
   - tirar o `noindex`;
   - definir `og:image` e a URL canônica;
   - subir o `?v=` dos assets.

## Testes

Com o servidor rodando (Node ≥ 22; nesta máquina, `%LOCALAPPDATA%\nvm\v24.6.0\node.exe`):

```
node qa/ferramentas/regressao.js [filtro] [pasta]    # página inteira em 11 tamanhos: estouro, imagens, erros, contatos, linha dos serviços, menu
node qa/ferramentas/fase2.js [caso]                 # página: larguras, menu, âncoras, raízes, marquee, magnético, reduzido, sem JS, teclado, CPU 4× (menu de celular, âncoras, marquee e reduzido procuram peças que saíram na v0.4.0)
node qa/ferramentas/fase1.js [caso]                 # abertura: natural, âncora, pular, jsBloqueado, cpu4, semAbertura, tamanhos, poseFinal
node qa/ferramentas/capturar-quadros.js abertura-1440 0,0.85,1.7,2.55,3.4 1440x900   # folha de quadros (0/25/50/75/100 %)
node qa/ferramentas/filmar-abertura.js 1440x900 [fps] [fim]                         # MP4 da abertura, relógio controlado
node qa/ferramentas/contraste.js  ·  node qa/ferramentas/copy.js  ·  node qa/ferramentas/espiar.js 390x844
node qa/ferramentas/desempenho.js 1440x900 [cpu] [cabo|4g] [pasta]                   # carga, hero parado, rolagem, meio/fim parados, menu
```

Por padrão, as sessões de teste nascem com a abertura já "vista" (só a Fase 1 pede `intro: true`). Cada sessão abre um Chrome headless (ou, sem Chrome, o Edge; `BROWSER` escolhe outro) com perfil próprio no TEMP e o fecha com `Browser.close`, pelo próprio CDP. Desde 28/10 o Chrome vem antes: o Edge headless põe a aba em "hidden" depois de 10 a 14 s, e as medições mais longas que isso saíam erradas. Até 26/10 o `cdp.js` só matava o lançador: o navegador de verdade ficava órfão, e sobraram 164 processos e 3,9 GB de perfis, o que encheu o disco C:.

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
