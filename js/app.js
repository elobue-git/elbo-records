const PAYPAL_EMAIL = 'YOUR_PAYPAL_EMAIL';

const CATEGORY_MAP = {
  vinyl: ['lp', '12"', '10"', '7"', 'vinyl', 'ep', 'single'],
  cds: ['cd'],
  gear: ['gear', 'equipment', 'turntable', 'amplifier', 'amp', 'speaker', 'headphone', 'cassette', 'tape'],
};

function getCategory(format = '', folder = '') {
  const f = (format + ' ' + folder).toLowerCase();
  if (CATEGORY_MAP.cds.some(k => f.includes(k))) return 'cds';
  if (CATEGORY_MAP.gear.some(k => f.includes(k))) return 'gear';
  if (CATEGORY_MAP.vinyl.some(k => f.includes(k))) return 'vinyl';
  return 'other';
}

function imgSrc(photo) {
  if (!photo) return 'images/placeholder.svg';
  return `images/records/${photo}`;
}

function formatPrice(price) {
  const n = parseFloat(price);
  if (isNaN(n)) return price;
  return '$' + n.toFixed(2);
}

function escHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Cart ──────────────────────────────────────────────────────────────────────

let cart = [];  // [{item, qty}]

function cartKey(item) {
  return item.release_id || `${item.artist}|${item.title}`;
}

function cartAdd(item) {
  const key = cartKey(item);
  const existing = cart.find(e => cartKey(e.item) === key);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ item, qty: 1 });
  }
  cartSave();
  cartRender();
  openCartDrawer();
}

function cartRemove(key) {
  cart = cart.filter(e => cartKey(e.item) !== key);
  cartSave();
  cartRender();
}

function cartTotal() {
  return cart.reduce((sum, e) => sum + parseFloat(e.item.price) * e.qty, 0);
}

function cartSave() {
  try { localStorage.setItem('elbo-cart', JSON.stringify(cart)); } catch {}
}

function cartLoad() {
  try {
    const raw = localStorage.getItem('elbo-cart');
    if (raw) cart = JSON.parse(raw);
  } catch {}
}

function cartRender() {
  const count = cart.reduce((s, e) => s + e.qty, 0);
  const countEl = document.getElementById('cart-count');
  countEl.textContent = count;
  countEl.hidden = count === 0;

  const itemsEl  = document.getElementById('cart-items');
  const footerEl = document.getElementById('cart-footer');
  const emptyEl  = document.getElementById('cart-empty-msg');

  if (cart.length === 0) {
    itemsEl.innerHTML = '';
    footerEl.style.display = 'none';
    emptyEl.style.display = '';
    return;
  }

  emptyEl.style.display = 'none';
  footerEl.style.display = '';

  itemsEl.innerHTML = cart.map(({ item, qty }) => `
    <div class="cart-item">
      <img class="cart-item-img" src="${imgSrc(item.photo)}" alt=""
           onerror="this.src='images/placeholder.svg'">
      <div class="cart-item-info">
        <div class="cart-item-title">${escHtml(item.title)}</div>
        <div class="cart-item-artist">${escHtml(item.artist)}</div>
        <div class="cart-item-format">${escHtml(item.format)}</div>
        <div class="cart-item-price">${formatPrice(item.price)}${qty > 1 ? ` &times; ${qty}` : ''}</div>
      </div>
      <button class="cart-item-remove" aria-label="Remove" data-key="${escHtml(cartKey(item))}">&times;</button>
    </div>
  `).join('');

  document.getElementById('cart-total-price').textContent = formatPrice(cartTotal());

  itemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', () => cartRemove(btn.dataset.key));
  });
}

// ── Cart drawer ───────────────────────────────────────────────────────────────

const cartDrawer  = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');

function openCartDrawer() {
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
  cartOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
  cartOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

document.getElementById('cart-btn').addEventListener('click', openCartDrawer);
document.getElementById('cart-close').addEventListener('click', closeCartDrawer);
cartOverlay.addEventListener('click', closeCartDrawer);

// ── PayPal multi-item checkout ────────────────────────────────────────────────

document.getElementById('checkout-btn').addEventListener('click', () => {
  if (!cart.length) return;

  const form = document.getElementById('paypal-cart-form');
  form.innerHTML = '';

  const add = (name, value) => {
    const inp = document.createElement('input');
    inp.type = 'hidden';
    inp.name = name;
    inp.value = value;
    form.appendChild(inp);
  };

  add('cmd', '_cart');
  add('upload', '1');
  add('business', PAYPAL_EMAIL);
  add('currency_code', 'USD');
  add('no_shipping', '2');

  let n = 1;
  cart.forEach(({ item, qty }) => {
    const name = `${item.artist} - ${item.title} (${item.format})`;
    add(`item_name_${n}`, name);
    add(`amount_${n}`, parseFloat(item.price).toFixed(2));
    add(`quantity_${n}`, qty);
    n++;
  });

  form.submit();
});

// ── Item detail modal ─────────────────────────────────────────────────────────

const overlay    = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');

function openModal(item) {
  document.getElementById('modal-img').src = imgSrc(item.photo);
  document.getElementById('modal-img').onerror = function() { this.src = 'images/placeholder.svg'; };
  document.getElementById('modal-img').alt = item.title;
  document.getElementById('modal-title').textContent = item.title;
  document.getElementById('modal-artist').textContent = item.artist;
  document.getElementById('modal-format').textContent = item.format;

  const soldBadge = document.getElementById('modal-sold-badge');
  soldBadge.style.display = item.sold ? '' : 'none';
  document.getElementById('modal-img').style.filter = item.sold
    ? 'saturate(0.25) brightness(0.7)' : '';

  setMeta('modal-label-row',  'modal-label',  item.label);
  setMeta('modal-year-row',   'modal-year',   item.year);
  setMeta('modal-media-row',  'modal-media',  item.mediaCondition);
  setMeta('modal-sleeve-row', 'modal-sleeve', item.sleeveCondition);

  document.getElementById('modal-price').textContent = formatPrice(item.price);

  const notesEl = document.getElementById('modal-notes');
  if (item.notes) { notesEl.textContent = item.notes; notesEl.style.display = ''; }
  else { notesEl.style.display = 'none'; }

  const actionsEl = document.getElementById('modal-actions');
  if (item.sold) {
    actionsEl.innerHTML = '<p class="sold-notice">This item has been sold.</p>';
  } else {
    const inCart = cart.some(e => cartKey(e.item) === cartKey(item));
    actionsEl.innerHTML = `
      <button class="add-to-cart-btn" id="modal-add-btn">
        ${inCart ? '✓ Added to Cart' : 'Add to Cart'}
      </button>
    `;
    document.getElementById('modal-add-btn').addEventListener('click', () => {
      cartAdd(item);
      closeModal();
    });
  }

  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function setMeta(rowId, valId, value) {
  const row = document.getElementById(rowId);
  if (value) { document.getElementById(valId).textContent = value; row.style.display = ''; }
  else { row.style.display = 'none'; }
}

function closeModal() {
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeCartDrawer(); } });

// ── Filter ────────────────────────────────────────────────────────────────────

let currentFilter = 'all';

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    applyFilter();
  });
});

function applyFilter() {
  const cards = document.querySelectorAll('.card');
  let visible = 0;
  cards.forEach(card => {
    const show = currentFilter === 'all' || card.dataset.category === currentFilter;
    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  document.getElementById('empty-msg').style.display = visible === 0 ? '' : 'none';
}

// ── Card builder ──────────────────────────────────────────────────────────────

function buildCard(item) {
  const card = document.createElement('div');
  card.className = 'card' + (item.sold ? ' sold' : '');
  card.dataset.category = getCategory(item.format, item.folder);

  card.innerHTML = `
    <div class="card-img-wrap">
      <img src="${imgSrc(item.photo)}" alt="${escHtml(item.title)}" loading="lazy"
           onerror="this.src='images/placeholder.svg'">
      ${item.sold ? '<div class="sold-badge">Sold</div>' : ''}
    </div>
    <div class="card-info">
      <div class="card-artist">${escHtml(item.artist)}</div>
      <div class="card-title">${escHtml(item.title)}</div>
      <div class="card-footer">
        <span class="card-format">${escHtml(item.format)}</span>
        <span class="card-price">${item.sold ? '<span class="sold-label">Sold</span>' : formatPrice(item.price)}</span>
      </div>
    </div>
  `;

  card.addEventListener('click', () => openModal(item));
  return card;
}

// ── Init ──────────────────────────────────────────────────────────────────────

cartLoad();
cartRender();

fetch('data/catalog.json')
  .then(r => r.json())
  .then(items => {
    const grid = document.getElementById('catalog-grid');
    if (!items.length) { document.getElementById('empty-msg').style.display = ''; return; }
    items.forEach(item => grid.appendChild(buildCard(item)));
    applyFilter();
  })
  .catch(() => {
    document.getElementById('empty-msg').textContent = 'Could not load catalog.';
    document.getElementById('empty-msg').style.display = '';
  });
