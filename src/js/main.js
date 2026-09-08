(function(){
  // ---- editable settings ----
  var WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/SEULINKAQUI"; // [EDITAR-GRUPO] link de convite do grupo — aparece só no final do formulário
  var WHATSAPP_NUMBER = "5511900000000"; // [EDITAR-WHATSAPP] formato: 55 + DDD + número, só dígitos — usado apenas para enviar o pedido montado no carrinho

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // [EDITAR-PRODUTOS] — cada produto vira uma linha clicável no catálogo e uma página própria.
  // Para adicionar um modelo novo, copie o bloco abaixo e troque a chave (slug) e os dados.
  var PRODUCTS = {
    "espanha-2024-home": {
      slug: "espanha-2024-home",
      name: "Seleção Espanha 24/25 — Home",
      category: "Seleções · Torcedor",
      tags: "Tam. P–2GG · Dry-fit · Personalizável",
      images: [
        { src: "src/img/jersey-full.jpg", alt: "Camisa Seleção Espanha 24/25, vista frontal completa", caption: "Frente" },
        { src: "src/img/jersey-crest.jpg", alt: "Detalhe do escudo da seleção e do logo adidas no peito", caption: "Escudo e logo" },
        { src: "src/img/jersey-sleeve.jpg", alt: "Detalhe do ombro e da gola", caption: "Ombro e gola" }
      ],
      price: [
        { range: "10–29 peças", value: "R$ 42,90", min: 10 },
        { range: "30–59 peças", value: "R$ 39,90", min: 30 },
        { range: "60+ peças", value: "R$ 36,90", min: 60 }
      ],
      sizes: ["P", "M", "G", "GG", "2GG"],
      description: [
        "Tecido dry-fit, mesma qualidade das linhas profissionais.",
        "Personalização com nome e número: +R$ 20 por peça.",
        "Pedido mínimo de 10 peças, grade de tamanhos livre."
      ]
    }
  };

  // [EDITAR-EM-BREVE] — modelos sem foto/preço ainda; aparecem no catálogo como "em breve" e não abrem página própria.
  var COMING_SOON = [];

  // Catálogo importado da exportação do Shopify (src/js/products-catalog.js, carregado antes deste
  // arquivo). Já vem filtrado (só ativos, sem patch/carta/chaveiro/chuteira/pronta-entrega) e ordenado
  // com os times em destaque primeiro. Mesclamos aqui pra virar catálogo de verdade.
  if (window.DA_IMPORTED_PRODUCTS){
    Object.keys(window.DA_IMPORTED_PRODUCTS).forEach(function(slug){
      if (!PRODUCTS[slug]) PRODUCTS[slug] = window.DA_IMPORTED_PRODUCTS[slug];
    });
  }

  // [EDITAR-ENVIADOS] — fotos reais de pedidos entregues. Cada item vira um quadro na seção "Produtos enviados".
  // Deixe a lista vazia (ou com poucos itens) que os quadros restantes aparecem como "em breve".
  var SHIPPED_PHOTOS = [
    { src: "src/img/shipped/shot1.jpg", alt: "Lote de camisas do Corinthians (Nike) embaladas para envio" },
    { src: "src/img/shipped/shot2.jpg", alt: "Lote de camisas da Seleção do Japão (adidas) embaladas para envio" },
    { src: "src/img/shipped/shot3.jpg", alt: "Lote de camisas da Seleção da Itália (adidas) embaladas para envio" },
    { src: "src/img/shipped/shot4.jpg", alt: "Lote de camisas da Seleção da Alemanha (adidas) embaladas para envio" },
    { src: "src/img/shipped/shot5.jpg", alt: "Lote de camisas do Cruzeiro (adidas) embaladas para envio" },
    { src: "src/img/shipped/shot6.jpg", alt: "Lote de camisas do Cruzeiro (adidas) prontas para despacho" },
    { src: "src/img/shipped/shot7.jpg", alt: "Lote de camisas variadas (Sport, Flamengo, Palmeiras) separadas para envio" }
  ];
  var SHIPPED_PHOTOS_TOTAL_SLOTS = 7; // quantos quadros mostrar no total (fotos reais + "em breve")

  // [EDITAR-QUIZ] — perguntas do formulário de 3 passos. Não é enviado a lugar nenhum, só qualifica
  // o interesse antes de mostrar o link do grupo. Para adicionar/mudar perguntas, edite este array.
  var QUIZ_STEPS = [
    {
      question: "Você já revende roupas ou está começando agora?",
      options: ["Já revendo, quero mais fornecedores", "Quero começar a revender", "Só quero comprar pra mim"]
    },
    {
      question: "Quantas peças você pretende comprar por pedido?",
      options: ["Menos de 10 peças", "10 a 29 peças", "30 a 59 peças", "60 peças ou mais"]
    },
    {
      question: "Como você vende (ou pretende vender)?",
      options: ["Loja física", "Loja online / marketplace", "Redes sociais / WhatsApp", "Ainda não vendo"]
    }
  ];

  // ---- build catalog list ----
  // ---- catalog: search + filter + pagination ----
  var CAT_PAGE_SIZE = 12;
  var catState = { query: '', filter: 'all', page: 1 };
  var catEntries = null; // built lazily from PRODUCTS + COMING_SOON

  // menor valor entre as faixas de preço do produto — é o número que cabe num card de grade
  function fromPrice(p){
    var min = null;
    p.price.forEach(function(t){
      var n = brlToNumber(t.value);
      if (min === null || n < min) min = n;
    });
    return min === null ? '' : numberToBrl(min);
  }

  function buildCatEntries(){
    var entries = [];
    Object.keys(PRODUCTS).forEach(function(slug){
      var p = PRODUCTS[slug];
      entries.push({
        type: 'available',
        featured: !!p.featured,
        search: (p.name + ' ' + p.tags).toLowerCase(),
        html: '' +
          '<a class="cat-card-img" href="#/produto/' + p.slug + '"><img src="' + p.images[0].src + '" alt="' + p.images[0].alt + '" loading="lazy" /></a>' +
          '<div class="cat-card-body">' +
            '<a class="cat-card-name-link" href="#/produto/' + p.slug + '"><h3 class="cat-card-name">' + p.name + '</h3></a>' +
            '<div class="cat-card-tags">' + p.tags + '</div>' +
            '<div class="cat-card-price">a partir de <b>' + fromPrice(p) + '</b></div>' +
            '<div class="cat-card-cta">' +
              '<a class="btn btn-outline-dark btn-sm" href="#/produto/' + p.slug + '">Ver produto</a>' +
              '<button type="button" class="btn btn-solid-dark btn-sm js-open-quiz">Pedir</button>' +
            '</div>' +
          '</div>',
        rowClass: 'is-linked'
      });
    });
    COMING_SOON.forEach(function(item){
      entries.push({
        type: 'soon',
        search: item.name.toLowerCase(),
        html: '' +
          '<div class="cat-card-img cat-card-img--soon">Foto em breve</div>' +
          '<div class="cat-card-body">' +
            '<h3 class="cat-card-name">' + item.name + '</h3>' +
            '<div class="cat-card-tags">Catálogo atualizado toda semana</div>' +
            '<div class="cat-card-price">Avise-me quando chegar</div>' +
            '<div class="cat-card-cta"><button type="button" class="btn btn-outline-dark btn-sm js-open-quiz">Avisar</button></div>' +
          '</div>',
        rowClass: 'is-soon'
      });
    });
    return entries;
  }

  function filteredCatEntries(){
    var q = catState.query.trim().toLowerCase();
    return catEntries.filter(function(e){
      if (catState.filter === 'featured' && !e.featured) return false;
      else if (catState.filter !== 'all' && catState.filter !== 'featured' && e.type !== catState.filter) return false;
      if (q && e.search.indexOf(q) === -1) return false;
      return true;
    });
  }

  // Com o catálogo grande (centenas de páginas), listar um botão por página quebraria o
  // layout — mostra só as pontas (1 … e … última) e uma janela ao redor da página atual.
  function renderCatPagination(totalPages){
    var el = document.getElementById('catPagination');
    if (totalPages <= 1){ el.innerHTML = ''; return; }
    var cur = catState.page;
    var pages = [1];
    for (var i = cur - 1; i <= cur + 1; i++){
      if (i > 1 && i < totalPages) pages.push(i);
    }
    if (totalPages > 1) pages.push(totalPages);
    pages = pages.filter(function(v, i, arr){ return arr.indexOf(v) === i; }).sort(function(a, b){ return a - b; });

    var html = '<button type="button" data-page="prev" ' + (cur === 1 ? 'disabled' : '') + ' aria-label="Página anterior">‹</button>';
    var prev = 0;
    pages.forEach(function(p){
      if (p - prev > 1) html += '<span class="cat-page-dots">…</span>';
      html += '<button type="button" data-page="' + p + '" class="' + (p === cur ? 'is-active' : '') + '">' + p + '</button>';
      prev = p;
    });
    html += '<button type="button" data-page="next" ' + (cur === totalPages ? 'disabled' : '') + ' aria-label="Próxima página">›</button>';
    el.innerHTML = html;
  }

  function renderCatalog(){
    if (!catEntries) catEntries = buildCatEntries();
    var list = document.getElementById('catalogList');
    var empty = document.getElementById('catEmpty');
    var filtered = filteredCatEntries();

    var totalPages = Math.max(Math.ceil(filtered.length / CAT_PAGE_SIZE), 1);
    if (catState.page > totalPages) catState.page = totalPages;
    var start = (catState.page - 1) * CAT_PAGE_SIZE;
    var pageItems = filtered.slice(start, start + CAT_PAGE_SIZE);

    empty.hidden = filtered.length > 0;
    list.innerHTML = pageItems.map(function(e){
      return '<article class="cat-card ' + e.rowClass + ' reveal is-visible">' + e.html + '</article>';
    }).join('');

    renderCatPagination(totalPages);
  }

  function buildCatalog(){ renderCatalog(); }

  // ---- build "produtos enviados" proof grid ----
  var proofIconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 15l4.5-4.5a2 2 0 0 1 2.8 0L15 15"/><path d="M13 13l1.7-1.7a2 2 0 0 1 2.8 0L21 15"/><circle cx="8" cy="9" r="1.3"/></svg>';
  function buildProofGrid(){
    var grid = document.getElementById('proofGrid');
    var html = '';
    SHIPPED_PHOTOS.forEach(function(photo, i){
      var featured = i === 0 ? ' is-featured' : '';
      html += '' +
        '<div class="proof-tile is-photo' + featured + '">' +
          '<img src="' + photo.src + '" alt="' + photo.alt + '" loading="lazy" />' +
          '<div class="proof-caption">' + photo.alt + '</div>' +
        '</div>';
    });
    var remaining = Math.max(SHIPPED_PHOTOS_TOTAL_SLOTS - SHIPPED_PHOTOS.length, 0);
    for (var i = 0; i < remaining; i++){
      html += '<div class="proof-tile is-empty">' + proofIconSvg + '<span>Foto em breve</span></div>';
    }
    grid.innerHTML = html;
  }

  // ---- product page rendering ----
  var galleryState = { images: [], index: 0 };

  function renderProduct(p){
    document.getElementById('productCategory').textContent = p.category;
    document.getElementById('productName').textContent = p.name;
    document.getElementById('productTags').textContent = p.tags;

    document.getElementById('productPriceBox').innerHTML = p.price.map(function(t){
      return '<div class="tier"><span>' + t.range + '</span><b>' + t.value + '</b></div>';
    }).join('');

    document.getElementById('productDesc').innerHTML = p.description.map(function(d){
      return '<li>' + d + '</li>';
    }).join('');

    renderSizePicker(p);

    galleryState.images = p.images;
    galleryState.index = 0;
    renderGalleryMain();

    var thumbs = document.getElementById('galleryThumbs');
    thumbs.innerHTML = p.images.map(function(img, i){
      return '<button type="button" data-idx="' + i + '" aria-label="' + img.caption + '"><img src="' + img.src + '" alt="" /></button>';
    }).join('');
    thumbs.querySelectorAll('button').forEach(function(btn){
      btn.addEventListener('click', function(){
        galleryState.index = parseInt(btn.getAttribute('data-idx'), 10);
        renderGalleryMain();
      });
    });
  }

  // ---- price tier lookup + BRL parsing ----
  function tierForQty(product, qty){
    var tiers = product.price;
    var chosen = tiers[0];
    for (var i = 0; i < tiers.length; i++){
      if (qty >= tiers[i].min) chosen = tiers[i];
    }
    return chosen;
  }
  function brlToNumber(v){
    return parseFloat(v.replace('R$', '').trim().replace(/\./g, '').replace(',', '.')) || 0;
  }
  function numberToBrl(n){
    return 'R$ ' + n.toFixed(2).replace('.', ',');
  }

  // ---- product page: size/quantity picker ----
  var sizePickerState = {};
  function renderSizePicker(p){
    sizePickerState = {};
    p.sizes.forEach(function(s){ sizePickerState[s] = 0; });
    var wrap = document.getElementById('productSizePicker');
    wrap.innerHTML = p.sizes.map(function(s){
      return '' +
        '<div class="size-stepper" data-size="' + s + '">' +
          '<span class="size-label">' + s + '</span>' +
          '<button type="button" class="step-btn" data-dir="-1" aria-label="Diminuir ' + s + '">–</button>' +
          '<span class="step-qty">0</span>' +
          '<button type="button" class="step-btn" data-dir="1" aria-label="Aumentar ' + s + '">+</button>' +
        '</div>';
    }).join('');
    updateSizePickerTotal(p);

    wrap.querySelectorAll('.step-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        var stepper = btn.closest('.size-stepper');
        var size = stepper.getAttribute('data-size');
        var dir = parseInt(btn.getAttribute('data-dir'), 10);
        sizePickerState[size] = Math.max(0, (sizePickerState[size] || 0) + dir);
        stepper.querySelector('.step-qty').textContent = sizePickerState[size];
        updateSizePickerTotal(p);
      });
    });

    var addBtn = document.getElementById('productAddToCart');
    addBtn.onclick = function(){
      var sizes = {};
      var total = 0;
      Object.keys(sizePickerState).forEach(function(s){
        if (sizePickerState[s] > 0){ sizes[s] = sizePickerState[s]; total += sizePickerState[s]; }
      });
      if (total === 0) return;
      addToCart(p, sizes);
      p.sizes.forEach(function(s){ sizePickerState[s] = 0; });
      wrap.querySelectorAll('.step-qty').forEach(function(el){ el.textContent = '0'; });
      updateSizePickerTotal(p);
      openCartDrawer();
    };
  }
  function updateSizePickerTotal(p){
    var total = 0;
    Object.keys(sizePickerState).forEach(function(s){ total += sizePickerState[s]; });
    var tier = tierForQty(p, total);
    var totalEl = document.getElementById('productOrderTotal');
    totalEl.innerHTML = total === 0
      ? '0 peças selecionadas'
      : '<b>' + total + '</b> peça' + (total > 1 ? 's' : '') + ' selecionada' + (total > 1 ? 's' : '') + ' · ' + tier.value + ' cada';
    document.getElementById('productAddToCart').disabled = total === 0;
  }

  // ---- cart ----
  var cart = {}; // slug -> { name, image, price, sizes: {P:qty,...} }

  function addToCart(product, sizes){
    if (!cart[product.slug]){
      cart[product.slug] = { name: product.name, image: product.images[0].src, price: product.price, sizes: {} };
    }
    Object.keys(sizes).forEach(function(s){
      cart[product.slug].sizes[s] = (cart[product.slug].sizes[s] || 0) + sizes[s];
    });
    renderCart();
  }
  function removeCartItem(slug){
    delete cart[slug];
    renderCart();
  }
  function cartItemTotalQty(item){
    return Object.keys(item.sizes).reduce(function(sum, s){ return sum + item.sizes[s]; }, 0);
  }
  function cartTotalPieces(){
    return Object.keys(cart).reduce(function(sum, slug){ return sum + cartItemTotalQty(cart[slug]); }, 0);
  }

  function renderCart(){
    var slugs = Object.keys(cart);
    var badge = document.getElementById('cartBadge');
    var count = cartTotalPieces();
    badge.textContent = count;
    badge.hidden = count === 0;

    var body = document.getElementById('cartBody');
    var footer = document.getElementById('cartFooter');
    if (slugs.length === 0){
      body.innerHTML = '<p class="cart-empty">Seu pedido está vazio. Escolha um modelo no catálogo e monte a grade de tamanhos.</p>';
      footer.hidden = true;
      return;
    }

    var grandTotal = 0;
    var html = slugs.map(function(slug){
      var item = cart[slug];
      var qty = cartItemTotalQty(item);
      var tier = tierForQty(item, qty);
      var subtotal = brlToNumber(tier.value) * qty;
      grandTotal += subtotal;
      var sizesHtml = Object.keys(item.sizes).map(function(s){
        return '<span>' + s + ' × ' + item.sizes[s] + '</span>';
      }).join('');
      return '' +
        '<div class="cart-item">' +
          '<img src="' + item.image + '" alt="" />' +
          '<div class="cart-item-info">' +
            '<div class="cart-item-name">' + item.name + '</div>' +
            '<div class="cart-item-sizes">' + sizesHtml + '</div>' +
            '<div class="cart-item-price">' + qty + ' peças · ' + tier.value + ' cada · <b>' + numberToBrl(subtotal) + '</b></div>' +
          '</div>' +
          '<button type="button" class="cart-item-remove" data-slug="' + slug + '" aria-label="Remover">&times;</button>' +
        '</div>';
    }).join('');
    body.innerHTML = html;
    footer.hidden = false;
    document.getElementById('cartGrandTotal').textContent = numberToBrl(grandTotal);
    document.getElementById('cartGrandQty').textContent = cartTotalPieces();

    body.querySelectorAll('.cart-item-remove').forEach(function(btn){
      btn.addEventListener('click', function(){ removeCartItem(btn.getAttribute('data-slug')); });
    });
  }

  function buildCartWhatsAppText(){
    var lines = ['Olá! Quero fechar este pedido no atacado da DA Sports:', ''];
    var grandTotal = 0;
    Object.keys(cart).forEach(function(slug){
      var item = cart[slug];
      var qty = cartItemTotalQty(item);
      var tier = tierForQty(item, qty);
      var subtotal = brlToNumber(tier.value) * qty;
      grandTotal += subtotal;
      var sizesText = Object.keys(item.sizes).map(function(s){ return s + ' x' + item.sizes[s]; }).join(', ');
      lines.push('• ' + item.name + ' — ' + sizesText + ' (' + qty + ' peças, ' + tier.value + ' cada = ' + numberToBrl(subtotal) + ')');
    });
    lines.push('');
    lines.push('Total: ' + cartTotalPieces() + ' peças — ' + numberToBrl(grandTotal));
    return lines.join('\n');
  }

  var cartDrawer = document.getElementById('cartDrawer');
  function openCartDrawer(){
    cartDrawer.hidden = false;
    requestAnimationFrame(function(){ cartDrawer.classList.add('is-open'); });
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onCartKeydown);
  }
  function closeCartDrawer(){
    cartDrawer.classList.remove('is-open');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onCartKeydown);
    setTimeout(function(){ cartDrawer.hidden = true; }, 320);
  }
  function onCartKeydown(e){ if (e.key === 'Escape') closeCartDrawer(); }

  document.getElementById('cartToggle').addEventListener('click', openCartDrawer);
  document.getElementById('cartClose').addEventListener('click', closeCartDrawer);
  cartDrawer.addEventListener('click', function(e){ if (e.target === cartDrawer) closeCartDrawer(); });
  document.getElementById('cartCheckout').addEventListener('click', function(){
    if (Object.keys(cart).length === 0) return;
    var text = buildCartWhatsAppText();
    window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
  });

  function renderGalleryMain(){
    var img = galleryState.images[galleryState.index];
    var mainImg = document.getElementById('galleryMainImg');
    mainImg.src = img.src;
    mainImg.alt = img.alt;
    document.querySelectorAll('#galleryThumbs button').forEach(function(btn, i){
      btn.classList.toggle('is-active', i === galleryState.index);
    });
  }

  // ---- lightbox ----
  function openLightbox(){
    var root = document.getElementById('lightboxRoot');
    var img = galleryState.images[galleryState.index];
    root.innerHTML = '' +
      '<div class="lightbox" id="lightboxEl">' +
        '<button class="lightbox-close" id="lbClose" aria-label="Fechar">&times;</button>' +
        (galleryState.images.length > 1 ? '<button class="lightbox-prev" id="lbPrev" aria-label="Anterior"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg></button>' : '') +
        '<img src="' + img.src + '" alt="' + img.alt + '" />' +
        '<span class="lightbox-caption">' + img.caption + '</span>' +
        (galleryState.images.length > 1 ? '<button class="lightbox-next" id="lbNext" aria-label="Próxima"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></button>' : '') +
      '</div>';
    var el = document.getElementById('lightboxEl');
    el.addEventListener('click', function(e){ if (e.target === el) closeLightbox(); });
    document.getElementById('lbClose').addEventListener('click', closeLightbox);
    var prevBtn = document.getElementById('lbPrev');
    var nextBtn = document.getElementById('lbNext');
    if (prevBtn) prevBtn.addEventListener('click', function(){ step(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function(){ step(1); });
    document.addEventListener('keydown', onLbKeydown);
  }
  function step(dir){
    galleryState.index = (galleryState.index + dir + galleryState.images.length) % galleryState.images.length;
    renderGalleryMain();
    openLightbox();
  }
  function onLbKeydown(e){
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  }
  function closeLightbox(){
    document.getElementById('lightboxRoot').innerHTML = '';
    document.removeEventListener('keydown', onLbKeydown);
  }

  // ---- mobile nav ----
  var navToggle = document.getElementById('navToggle');
  var mobileNav = document.getElementById('mobileNav');
  var navToggleIcon = document.getElementById('navToggleIcon');
  var ICON_MENU = '<path d="M4 7h16M4 12h16M4 17h16"/>';
  var ICON_CLOSE = '<path d="M6 6l12 12M18 6L6 18"/>';
  function setNavOpen(open){
    mobileNav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navToggleIcon.innerHTML = open ? ICON_CLOSE : ICON_MENU;
  }
  navToggle.addEventListener('click', function(){
    setNavOpen(!mobileNav.classList.contains('is-open'));
  });
  mobileNav.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){ setNavOpen(false); });
  });
  window.addEventListener('resize', function(){
    if (window.innerWidth > 760) setNavOpen(false);
  });

  // ---- grupo: quiz modal ----
  var quizModal = document.getElementById('quizModal');
  var quizProgress = document.getElementById('quizProgress');
  var quizBody = document.getElementById('quizBody');
  var quizState = { step: 0, answers: [] }; // step 0..2 = perguntas, 3 = resultado
  var groupIconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
  var checkIconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
  var backIconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>';

  function renderQuizProgress(){
    var html = '';
    for (var i = 0; i < QUIZ_STEPS.length; i++){
      var cls = quizState.step > i ? 'is-done' : (quizState.step === i ? 'is-active' : '');
      html += '<span class="' + cls + '"><i></i></span>';
    }
    quizProgress.innerHTML = html;
    quizProgress.style.display = quizState.step >= QUIZ_STEPS.length ? 'none' : 'flex';
  }

  function priceHintForAnswer(qtyIdx){
    var p = PRODUCTS['espanha-2024-home'];
    if (!p) return '';
    if (qtyIdx === 1) return 'Nessa faixa (10–29 peças) o preço fica ' + p.price[0].value + ' a peça.';
    if (qtyIdx === 2) return 'Nessa faixa (30–59 peças) o preço cai pra ' + p.price[1].value + ' a peça.';
    if (qtyIdx === 3) return 'Nessa faixa (60+ peças) o preço cai pra ' + p.price[2].value + ' a peça.';
    return 'Sem mínimo alto pra conhecer o catálogo — comece do seu jeito.';
  }

  function renderQuizStep(){
    renderQuizProgress();

    if (quizState.step >= QUIZ_STEPS.length){
      var hint = priceHintForAnswer(quizState.answers[1]);
      quizBody.innerHTML = '' +
        '<div class="quiz-card quiz-result">' +
          '<div class="quiz-badge">' + checkIconSvg + '</div>' +
          '<h2>Você tá dentro!</h2>' +
          '<p>Clique abaixo pra entrar no grupo de ofertas da DA Sports no WhatsApp.</p>' +
          '<div class="quiz-hint">' + hint + '</div>' +
          '<a class="btn btn-primary" id="quizGroupLink" href="' + WHATSAPP_GROUP_LINK + '" target="_blank" rel="noopener">' + groupIconSvg + ' Entrar no grupo agora</a>' +
        '</div>';
      return;
    }

    var step = QUIZ_STEPS[quizState.step];
    var optionsHtml = step.options.map(function(opt, i){
      var picked = quizState.answers[quizState.step] === i;
      return '<button type="button" class="quiz-option' + (picked ? ' is-picked' : '') + '" data-idx="' + i + '">' + opt + '<span class="quiz-check"></span></button>';
    }).join('');

    quizBody.innerHTML = '' +
      '<div class="quiz-card">' +
        '<span class="quiz-eyebrow eyebrow">Pergunta ' + (quizState.step + 1) + ' de ' + QUIZ_STEPS.length + '</span>' +
        '<h2>' + step.question + '</h2>' +
        '<div class="quiz-options">' + optionsHtml + '</div>' +
        (quizState.step > 0 ? '<button type="button" class="quiz-back" id="quizBack">' + backIconSvg + ' Voltar</button>' : '') +
      '</div>';

    quizBody.querySelectorAll('.quiz-option').forEach(function(btn){
      btn.addEventListener('click', function(){
        quizState.answers[quizState.step] = parseInt(btn.getAttribute('data-idx'), 10);
        setTimeout(function(){
          quizState.step++;
          renderQuizStep();
        }, 260);
        quizBody.querySelectorAll('.quiz-option').forEach(function(o){ o.classList.remove('is-picked'); });
        btn.classList.add('is-picked');
      });
    });
    var backBtn = document.getElementById('quizBack');
    if (backBtn) backBtn.addEventListener('click', function(){ quizState.step--; renderQuizStep(); });
  }

  function openQuizModal(){
    quizState = { step: 0, answers: [] };
    renderQuizStep();
    quizModal.hidden = false;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onQuizKeydown);
  }
  function closeQuizModal(){
    quizModal.hidden = true;
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onQuizKeydown);
  }
  function onQuizKeydown(e){ if (e.key === 'Escape') closeQuizModal(); }

  // delegated: cobre também os botões "Pedir"/"Avisar" gerados depois pelo buildCatalog()
  document.addEventListener('click', function(e){
    var trigger = e.target.closest('.js-open-quiz');
    if (trigger){ e.preventDefault(); openQuizModal(); }
  });
  document.getElementById('quizClose').addEventListener('click', closeQuizModal);
  quizModal.addEventListener('click', function(e){ if (e.target === quizModal) closeQuizModal(); });

  // ---- router ----
  var homeView = document.getElementById('homeView');
  var productView = document.getElementById('productView');

  function showView(name){
    homeView.hidden = name !== 'home';
    productView.hidden = name !== 'product';
  }

  function route(){
    var hash = window.location.hash;
    var m = hash.match(/^#\/produto\/([a-z0-9-]+)/i);
    if (m && PRODUCTS[m[1]]){
      renderProduct(PRODUCTS[m[1]]);
      showView('product');
      window.scrollTo(0, 0);
    } else {
      showView('home');
      var id = hash.replace(/^#\/?/, '');
      if (id){
        var el = document.getElementById(id);
        if (el){
          requestAnimationFrame(function(){
            el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
          });
        }
      } else {
        window.scrollTo(0, 0);
      }
    }
  }

  window.addEventListener('hashchange', route);

  // ---- catalog toolbar wiring ----
  var catSearchInput = document.getElementById('catSearch');
  var catSearchTimer = null;
  catSearchInput.addEventListener('input', function(){
    clearTimeout(catSearchTimer);
    catSearchTimer = setTimeout(function(){
      catState.query = catSearchInput.value;
      catState.page = 1;
      renderCatalog();
    }, 180);
  });
  document.getElementById('catFilter').addEventListener('click', function(e){
    var btn = e.target.closest('button[data-filter]');
    if (!btn) return;
    document.querySelectorAll('#catFilter button').forEach(function(b){ b.classList.remove('is-active'); });
    btn.classList.add('is-active');
    catState.filter = btn.getAttribute('data-filter');
    catState.page = 1;
    renderCatalog();
  });
  document.getElementById('catPagination').addEventListener('click', function(e){
    var btn = e.target.closest('button[data-page]');
    if (!btn || btn.disabled) return;
    var val = btn.getAttribute('data-page');
    if (val === 'prev') catState.page -= 1;
    else if (val === 'next') catState.page += 1;
    else catState.page = parseInt(val, 10);
    renderCatalog();
    document.getElementById('catalogo').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });

  // ---- hero deck (carrossel de destaque) ----
  // Com 2+ produtos cadastrados, cada slide é um modelo. Com só um produto,
  // o deck passa pelas fotos desse modelo — assim o carrossel já nasce funcionando
  // e vira vitrine de modelos automaticamente quando o catálogo crescer.
  var DECK_INTERVAL = 5000;

  function cheapestPrice(p){
    var min = null;
    p.price.forEach(function(t){
      var n = brlToNumber(t.value);
      if (min === null || n < min) min = n;
    });
    return min === null ? '' : numberToBrl(min);
  }

  // Com o catálogo grande, o deck do hero não vira "um slide por produto" — isso ficaria
  // gigante e lento. Ele mostra só uma vitrine curta com os primeiros modelos do catálogo
  // (que já vêm ordenados com os times em destaque na frente).
  var DECK_MAX_SLIDES = 8;

  function buildDeckSlides(){
    var slugs = Object.keys(PRODUCTS);
    var slides = [];
    if (slugs.length > 1){
      slugs.slice(0, DECK_MAX_SLIDES).forEach(function(slug){
        var p = PRODUCTS[slug];
        slides.push({ slug: p.slug, img: p.images[0], tag: 'No catálogo', name: p.name, sub: p.category, price: cheapestPrice(p), caption: p.name });
      });
    } else if (slugs.length === 1){
      var p = PRODUCTS[slugs[0]];
      var price = cheapestPrice(p);
      p.images.forEach(function(img, i){
        slides.push({
          slug: p.slug, img: img,
          tag: i === 0 ? 'Nova temporada' : img.caption,
          name: p.name, sub: p.category, price: price,
          caption: img.caption
        });
      });
    }
    return slides;
  }

  function initDeck(){
    var deck = document.getElementById('heroDeck');
    var viewport = document.getElementById('deckViewport');
    if (!deck || !viewport) return;

    var slides = buildDeckSlides();
    if (!slides.length){ deck.hidden = true; return; }

    viewport.innerHTML = slides.map(function(s, i){
      return '' +
        '<div class="deck-slide' + (i === 0 ? ' is-active' : '') + '" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' de ' + slides.length + '"' + (i === 0 ? '' : ' aria-hidden="true"') + '>' +
          '<a class="jersey-card-link" href="#/produto/' + s.slug + '" aria-label="Ver detalhes de ' + s.name + '">' +
            '<div class="jersey-card">' +
              '<span class="jersey-tag">' + s.tag + '</span>' +
              '<img src="' + s.img.src + '" alt="' + s.img.alt + '"' + (i === 0 ? '' : ' loading="lazy"') + ' draggable="false" />' +
              '<div class="jersey-chip">' +
                '<div><div class="name">' + s.name + '</div><div class="sub">' + s.sub + '</div></div>' +
                '<div class="price">a partir de ' + s.price + '</div>' +
              '</div>' +
            '</div>' +
          '</a>' +
        '</div>';
    }).join('');

    var slideEls = viewport.querySelectorAll('.deck-slide');
    var prevBtn = document.getElementById('deckPrev');
    var nextBtn = document.getElementById('deckNext');
    var dotsWrap = document.getElementById('deckDots');
    var index = 0;
    var timer = null;
    var multi = slides.length > 1;

    deck.style.setProperty('--deck-dur', DECK_INTERVAL + 'ms');

    if (!multi){
      deck.classList.add('no-autoplay');
    } else {
      prevBtn.hidden = false;
      nextBtn.hidden = false;
      dotsWrap.hidden = false;
      deck.classList.add('is-grabbable');
      dotsWrap.innerHTML = slides.map(function(s, i){
        return '<button type="button" role="tab" aria-label="Ver ' + s.caption + '"' +
          (i === 0 ? ' class="is-active" aria-selected="true"' : ' aria-selected="false"') + ' data-i="' + i + '"><i></i></button>';
      }).join('');
    }

    var dots = dotsWrap.querySelectorAll('button');

    function goTo(next){
      if (!multi) return;
      index = (next + slides.length) % slides.length;
      slideEls.forEach(function(el, i){
        var on = i === index;
        el.classList.toggle('is-active', on);
        if (on) el.removeAttribute('aria-hidden');
        else el.setAttribute('aria-hidden', 'true');
      });
      dots.forEach(function(d, i){
        var on = i === index;
        d.classList.remove('is-active');
        d.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on){
          void d.offsetWidth; // reinicia a animação da barrinha de progresso
          d.classList.add('is-active');
        }
      });
    }

    function play(){
      if (!multi || reduceMotion) return;
      stop();
      timer = setInterval(function(){ goTo(index + 1); }, DECK_INTERVAL);
      deck.classList.remove('is-paused');
    }
    function stop(){
      if (timer){ clearInterval(timer); timer = null; }
      deck.classList.add('is-paused');
    }

    if (multi){
      prevBtn.addEventListener('click', function(){ goTo(index - 1); play(); });
      nextBtn.addEventListener('click', function(){ goTo(index + 1); play(); });
      dotsWrap.addEventListener('click', function(e){
        var b = e.target.closest('button[data-i]');
        if (!b) return;
        goTo(parseInt(b.getAttribute('data-i'), 10));
        play();
      });

      deck.addEventListener('mouseenter', stop);
      deck.addEventListener('mouseleave', play);
      deck.addEventListener('focusin', stop);
      deck.addEventListener('focusout', play);
      deck.addEventListener('keydown', function(e){
        if (e.key === 'ArrowLeft'){ goTo(index - 1); play(); }
        else if (e.key === 'ArrowRight'){ goTo(index + 1); play(); }
      });
      document.addEventListener('visibilitychange', function(){
        if (document.hidden) stop(); else play();
      });

      // arrastar com o dedo (mobile) ou com o mouse (desktop)
      var dragX = 0, dragging = false, moved = 0;
      // o navegador tenta "arrastar" a imagem/link nativamente e isso cancelava o gesto
      viewport.addEventListener('dragstart', function(e){ e.preventDefault(); });
      viewport.addEventListener('pointerdown', function(e){
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        dragging = true; dragX = e.clientX; moved = 0;
        deck.classList.add('is-dragging');
        try { viewport.setPointerCapture(e.pointerId); } catch(_){}
        stop();
      });
      viewport.addEventListener('pointermove', function(e){
        if (!dragging) return;
        moved = e.clientX - dragX;
        var active = slideEls[index];
        active.style.transform = 'translateX(' + (moved * 0.35) + 'px)';
      });
      function endDrag(){
        if (!dragging) return;
        dragging = false;
        deck.classList.remove('is-dragging');
        slideEls[index].style.transform = '';
        if (Math.abs(moved) > 45) goTo(index + (moved < 0 ? 1 : -1));
        play();
      }
      viewport.addEventListener('pointerup', endDrag);
      viewport.addEventListener('pointercancel', endDrag);
      viewport.addEventListener('pointerleave', endDrag);
      // um arrasto não deve virar clique no link do produto
      viewport.addEventListener('click', function(e){
        if (Math.abs(moved) > 8){ e.preventDefault(); e.stopPropagation(); }
      }, true);

      // só roda enquanto o hero está na tela
      if ('IntersectionObserver' in window){
        new IntersectionObserver(function(entries){
          entries.forEach(function(en){ if (en.isIntersecting) play(); else stop(); });
        }, { threshold: 0.25 }).observe(deck);
      } else {
        play();
      }
    }
  }

  // ---- init ----
  buildCatalog();
  buildProofGrid();
  renderCart();
  initDeck();
  route();

  var galleryMain = document.getElementById('galleryMain');
  galleryMain.addEventListener('click', openLightbox);
  galleryMain.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(); } });

  // sticky header shadow
  var header = document.getElementById('siteHeader');
  var onScroll = function(){
    if (window.scrollY > 8) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // scroll reveal
  if (!reduceMotion && 'IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('is-visible'); });
  }

  // inclinação 3D do deck acompanhando o mouse (desktop, sem arrasto em curso)
  var deckEl = document.getElementById('heroDeck');
  var deckView = document.getElementById('deckViewport');
  if (deckEl && deckView && !reduceMotion && window.matchMedia('(pointer:fine)').matches){
    deckEl.addEventListener('mousemove', function(e){
      if (deckEl.classList.contains('is-dragging')) return;
      var r = deckEl.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      deckView.style.transform = 'rotateY(' + (px * 9) + 'deg) rotateX(' + (py * -9) + 'deg)';
    });
    deckEl.addEventListener('mouseleave', function(){
      deckView.style.transform = '';
    });
  }

  // magnetic hover on the main CTAs — desktop / fine pointer only
  if (!reduceMotion && window.matchMedia('(pointer:fine)').matches){
    document.querySelectorAll('.btn-primary').forEach(function(el){
      el.addEventListener('mousemove', function(e){
        var r = el.getBoundingClientRect();
        var mx = (e.clientX - r.left - r.width / 2) * 0.28;
        var my = (e.clientY - r.top - r.height / 2) * 0.28;
        el.style.transform = 'translate(' + mx + 'px,' + (my - 2) + 'px)';
      });
      el.addEventListener('mouseleave', function(){ el.style.transform = ''; });
    });
  }

  // cursor-tracked spotlight glow on .glow cards (ship-card, ship-step) — desktop / fine pointer only
  if (window.matchMedia('(pointer:fine)').matches){
    document.querySelectorAll('.glow').forEach(function(el){
      el.addEventListener('mousemove', function(e){
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
    });
  }

  // stagger the reveal of sibling cards/rows so grids animate in sequence
  document.querySelectorAll('.benefit-grid, .step-grid, .catalog-list, .proof-grid, .ship-steps').forEach(function(group){
    Array.prototype.forEach.call(group.children, function(child, i){
      if (child.classList && child.classList.contains('reveal')){
        child.style.transitionDelay = Math.min(i * 60, 300) + 'ms';
      }
    });
  });
})();
