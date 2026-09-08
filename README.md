# DA Sports — Landing Page de Atacado

## Estrutura do projeto

```
da-sports-atacado/
├── index.html              → estrutura da página (HTML puro)
└── src/
    ├── css/
    │   ├── tailwind.css    → utilitários do Tailwind já compilados (ver seção abaixo)
    │   └── style.css       → todo o estilo (cores, tipografia, layout, animações)
    ├── js/
    │   └── main.js         → toda a lógica (catálogo, carrinho, galeria, formulário/modal, roteamento)
    ├── fonts/
    │   ├── poppins-regular.woff2, poppins-semibold.woff2, poppins-bold.woff2, poppins-extrabold.woff2
    │   └── relidux.woff2   → ver aviso de licença abaixo
    └── img/
        ├── logo-white.png
        ├── favicon.png
        ├── jersey-full.jpg
        ├── jersey-crest.jpg
        ├── jersey-sleeve.jpg
        └── shipped/
            ├── shot1.jpg … shot7.jpg   → fotos reais de pedidos enviados
```

Não tem build, bundler nem dependências — é HTML/CSS/JS puro. Pra rodar local,
é só abrir o `index.html` direto no navegador, ou (recomendado, evita
bloqueios de segurança do navegador com `file://`) subir um servidor simples
na pasta do projeto:

```bash
cd da-sports-atacado
python3 -m http.server 8000
# depois abra http://localhost:8000
```

Pra publicar, é só subir a pasta inteira (`index.html` + `src/`) num
hosting qualquer (Vercel, Netlify, GitHub Pages, hospedagem comum) — todos
os caminhos de imagem/fonte/CSS/JS são relativos, não precisa mudar nada.

## Tailwind

O `src/css/tailwind.css` é Tailwind de verdade, já compilado e com tree-shaking
(≈3 KB — só as classes que a página realmente usa). Não é o script de CDN:
não depende de internet, não tem flash de conteúdo sem estilo e pode ir pra
produção como está. Duas decisões importantes:

- **Preflight desligado.** O reset do Tailwind sobrescreveria o estilo próprio
  da página. Aqui ele entra só como camada de utilitários.
- **Cores ligadas às variáveis do tema.** `bg-ink`, `text-paper`, `border-line`
  etc. apontam pras variáveis CSS do `style.css`, então seguem o modo
  claro/escuro sozinhas.

O Tailwind está aplicado nas partes novas (a comparação de frete usa
`grid`, `gap-4`, `md:grid-cols-[1.12fr_1fr]`, `md:mb-20`). O resto da página
continua no CSS próprio — misturar os dois é proposital: utilitário pra
layout, CSS nomeado pras superfícies da marca.

Se você adicionar classes novas do Tailwind no HTML/JS, é preciso recompilar
(uma vez só, na sua máquina, com Node instalado):

```bash
npm install -D tailwindcss@3
npx tailwindcss -i input.css -o src/css/tailwind.css --minify
```

O `tailwind.config.js` e o `input.css` já estão na raiz do projeto, prontos —
é só rodar os dois comandos acima de dentro da pasta. Enquanto você não mexer
nas classes, não precisa rodar nada: o arquivo compilado já está aqui. Esses
dois arquivos e a pasta `node_modules` (se você instalar) são só de
desenvolvimento — na hora de publicar, só `index.html` + `src/` importam.

## Carrossel do hero

O card de lançamento virou um carrossel (`initDeck()` no `main.js`):

- **Com um produto só** no `PRODUCTS`, ele passa pelas fotos desse produto.
- **Com dois ou mais**, cada slide vira um modelo do catálogo — automático,
  não precisa cadastrar nada além do produto.
- Passa sozinho a cada 5s (`DECK_INTERVAL`), com barrinha de progresso nos
  indicadores; pausa no hover, no foco, quando a aba sai de foco e quando o
  hero sai da tela.
- Arrasta com o dedo no celular e com o mouse no desktop, tem setas, dots e
  navegação por seta do teclado.

## ⚠️ Licença da fonte Relidux

A `Relidux.otf` que você enviou (e que virou `src/fonts/relidux.woff2`, usada
nos títulos grandes) é distribuída pela Chequered Ink sob uma licença
**não-comercial por padrão** — o próprio zip que você mandou inclui um atalho
"Get Commercial License" apontando para `https://chequered.ink/font-license/`.
Como essa é a página comercial da DA Sports, vale confirmar se vocês já têm
(ou vão comprar) a licença comercial antes de publicar no ar — eu segui em
frente e apliquei a fonte porque foi o que você pediu, mas não é uma
avaliação jurídica, então essa checagem final é com vocês. Se preferirem não
comprar, é só trocar o `@font-face` de `Relidux` no topo do `src/css/style.css`
por outra fonte de título (ex.: `Anton`, do Google Fonts, que é gratuita para
uso comercial e era a que estava no lugar antes).

## O que editar

Todo o conteúdo real do negócio fica em `src/js/main.js`, perto do topo:

- `WHATSAPP_NUMBER` — número usado **só** para o botão "Enviar pedido no
  WhatsApp" do carrinho (formato `55` + DDD + número, só dígitos).
- `WHATSAPP_GROUP_LINK` — link de convite do grupo, que só aparece no final
  do formulário de 3 perguntas. Fora esses dois pontos (carrinho e formulário
  respondido), não existe nenhum botão de WhatsApp direto na página.
- `PRODUCTS` — objeto com os produtos do catálogo. Pra adicionar um modelo
  novo, copie o bloco `espanha-2024-home` (nome, imagens, tamanhos,
  descrição). Em `price`, cada faixa tem `range` (texto mostrado), `value`
  (preço por peça) e `min` (quantidade mínima da faixa, usado pelo carrinho
  pra calcular automaticamente qual preço aplicar). O card do catálogo e a
  página do produto são gerados automaticamente a partir daqui.
- `COMING_SOON` — lista de slots "novo modelo em breve" no catálogo.
- `SHIPPED_PHOTOS` — fotos reais da seção "Produtos enviados". Pra trocar ou
  adicionar, coloque o arquivo em `src/img/shipped/` e aponte o `src` pra
  ele (ex.: `"src/img/shipped/shot8.jpg"`).
- `QUIZ_STEPS` — as 3 perguntas do formulário qualificador.
- `CAT_PAGE_SIZE` (em `src/js/main.js`) — quantos modelos aparecem por
  página no catálogo antes de precisar paginar (padrão: 12 — o catálogo
  importado é grande, então a paginação usa janela com "…" em vez de listar
  todas as páginas).

Preços, prazos e mínimos mostrados na página (fora o catálogo importado) são
**exemplos de referência** — troque pelos números reais direto no
`PRODUCTS`/`QUIZ_STEPS`.

## Catálogo importado do Shopify

`src/js/products-catalog.js` (carregado antes do `main.js`) traz o catálogo
gerado a partir da sua exportação de produtos do Shopify — **2.382 modelos**,
já filtrados e ordenados:

- Só produtos com status **ativo** (rascunho, arquivado e suspenso ficam de fora).
- Removidos: patches, cartas/cartas Fifa, chaveiros, chuteiras e qualquer
  título ou tag com "pronta entrega".
- Sem controle de estoque — mostra nome, fotos e o preço de venda cadastrado
  no Shopify, um valor só por modelo (sem faixa de atacado, já que a
  planilha não tinha isso).
- As fotos continuam hospedadas no CDN do Shopify (`cdn.shopify.com`) — a
  página só referencia a URL, não baixou nem duplicou nenhuma imagem. Isso
  mantém o projeto leve, mas depende da loja Shopify continuar no ar; se um
  dia ela sair do ar, essas imagens específicas param de carregar (as fotos
  próprias em `src/img/` não dependem disso).
- **Times em destaque primeiro**: Flamengo, Corinthians, Palmeiras, Real
  Madrid, Barcelona, Milan, PSG e Manchester United aparecem no topo do
  catálogo, e dentro disso os modelos de temporada mais recente (26/27,
  25/26, 2026) vêm antes dos demais. O filtro "Times em destaque" no
  catálogo mostra só esses.

Pra reprocessar depois de uma nova exportação do Shopify (Admin → Produtos →
Exportar → todos os produtos → CSV por e-mail):

```bash
cd tools
# salve o CSV exportado aqui do lado, renomeado para products_export.csv
python3 build_products.py
```

Isso reescreve o `src/js/products-catalog.js` do zero. O script está em
`tools/build_products.py` — os critérios de exclusão e a lista de times em
destaque ficam no topo do arquivo, é só editar as listas `FEATURED_CLUBS` e
as expressões `EXCLUDE_KW`/`PRONTA_ENTREGA` se quiser ajustar.

## Funcionalidades novas

- **Busca e filtro** no catálogo (`Buscar por nome...` + botões Todos/Times
  em destaque), com paginação automática quando há mais modelos do que
  cabem em uma página.
- **Monte seu pedido**: na página de cada produto, dá pra escolher a
  quantidade por tamanho e adicionar ao carrinho. O ícone de carrinho no
  cabeçalho abre um painel lateral com o resumo, preço por faixa de
  quantidade calculado automaticamente, total geral e um botão para enviar
  o pedido pronto direto no WhatsApp (usando o `WHATSAPP_NUMBER` acima).
