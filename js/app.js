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
  if (!photo) return 'images/placeholder.jpg';
  return `images/records/${photo}`;
}

function formatPrice(price) {
  const n = parseFloat(price);
  if (isNaN(n)) return price;
  return '$' + n.toFixed(2);
}

function buildCard(item) {
  const card = document.createElement('div');
  card.className = 'card' + (item.sold ? ' sold' : '');
  card.dataset.category = getCategory(item.format, item.folder);

  card.innerHTML = `
    <div class="card-img-wrap">
      <img src="${imgSrc(item.photo)}" alt="${escHtml(item.title)}" loading="lazy"
           onerror="this.src='images/placeholder.jpg'">
      ${item.sold ? '<div class="sold-badge">Sold</div>' : ''}
    </div>
    <div class="card-info">
      <div class="card-artist">${escHtml(item.artist)}</div>
      <div class="card-title">${escHtml(item.title)}</div>
      <div class="card-footer">
        <span class="card-format">${escHtml(item.format)}</span>
        <span class="card-price">${formatPrice(item.price)}</span>
      </div>
    </div>
  `;

  card.addEventListener('click', () => openModal(item));
  return card;
}

function escHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Modal ──
const overlay   = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');

function openModal(item) {
  document.getElementById('modal-img').src = imgSrc(item.photo);
  document.getElementById('modal-img').onerror = function() { this.src = 'images/placeholder.jpg'; };
  document.getElementById('modal-img').alt = item.title;
  document.getElementById('modal-title').textContent = item.title;
  document.getElementById('modal-artist').textContent = item.artist;
  document.getElementById('modal-format').textContent = item.format;

  const soldBadge = document.getElementById('modal-sold-badge');
  soldBadge.style.display = item.sold ? '' : 'none';
  if (item.sold) {
    document.getElementById('modal-img').style.filter = 'saturate(0.25) brightness(0.7)';
  } else {
    document.getElementById('modal-img').style.filter = '';
  }

  setMeta('modal-label-row', 'modal-label', item.label);
  setMeta('modal-year-row',  'modal-year',  item.year);
  setMeta('modal-media-row', 'modal-media', item.mediaCondition);
  setMeta('modal-sleeve-row','modal-sleeve', item.sleeveCondition);

  document.getElementById('modal-price').textContent = formatPrice(item.price);

  const notesEl = document.getElementById('modal-notes');
  if (item.notes) {
    notesEl.textContent = item.notes;
    notesEl.style.display = '';
  } else {
    notesEl.style.display = 'none';
  }

  const paypalEl = document.getElementById('modal-paypal');
  if (!item.sold) {
    paypalEl.innerHTML = buildPaypalButton(item);
  } else {
    paypalEl.innerHTML = '';
  }

  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function setMeta(rowId, valId, value) {
  const row = document.getElementById(rowId);
  if (value) {
    document.getElementById(valId).textContent = value;
    row.style.display = '';
  } else {
    row.style.display = 'none';
  }
}

function buildPaypalButton(item) {
  const itemName = encodeURIComponent(`${item.artist} - ${item.title} (${item.format})`);
  const price = parseFloat(item.price).toFixed(2);
  return `
    <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank">
      <input type="hidden" name="cmd" value="_xclick">
      <input type="hidden" name="business" value="${escHtml(PAYPAL_EMAIL)}">
      <input type="hidden" name="item_name" value="${escHtml(decodeURIComponent(itemName))}">
      <input type="hidden" name="amount" value="${price}">
      <input type="hidden" name="currency_code" value="USD">
      <input type="hidden" name="no_shipping" value="2">
      <button type="submit" style="
        background: #f0a500;
        border: none;
        border-radius: 4px;
        color: #111;
        cursor: pointer;
        font-family: 'Inter', sans-serif;
        font-size: 0.9rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        padding: 0.7rem 1.5rem;
        text-transform: uppercase;
        transition: background 0.15s;
      " onmouseover="this.style.background='#f5b830'" onmouseout="this.style.background='#f0a500'">
        Buy Now via PayPal
      </button>
    </form>
  `;
}

function closeModal() {
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── Filter ──
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

// ── Load catalog ──
fetch('data/catalog.json')
  .then(r => r.json())
  .then(items => {
    const grid = document.getElementById('catalog-grid');
    if (!items.length) {
      document.getElementById('empty-msg').style.display = '';
      return;
    }
    items.forEach(item => grid.appendChild(buildCard(item)));
    applyFilter();
  })
  .catch(() => {
    document.getElementById('empty-msg').textContent = 'Could not load catalog.';
    document.getElementById('empty-msg').style.display = '';
  });
