/* ============================================================
   ANTIGRAVITY PRO – main.js
   ============================================================ */

/* ---------- PARTICLES BACKGROUND ---------- */
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  const COLORS = ['rgba(124,58,237,', 'rgba(6,182,212,', 'rgba(232,121,249,', 'rgba(255,255,255,'];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.8 + 0.3,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.5 + 0.1,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: 80 }, createParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.alpha + ')';
      ctx.fill();

      p.x += p.dx;
      p.y += p.dy;
      if (p.x < 0 || p.x > W) p.dx *= -1;
      if (p.y < 0 || p.y > H) p.dy *= -1;
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  init();
  draw();
})();

/* ---------- NAVBAR SCROLL ---------- */
(function initNavbar() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
})();

/* ---------- HAMBURGER MENU ---------- */
(function initHamburger() {
  const btn   = document.getElementById('hamburger');
  const links = document.getElementById('nav-links');
  if (!btn || !links) return;

  btn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  });

  // Close on link click
  links.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', () => links.classList.remove('open'));
  });
})();

/* ---------- ANIMATED COUNTERS ---------- */
(function initCounters() {
  const els = document.querySelectorAll('.stat-num[data-target]');
  if (!els.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el  = entry.target;
      const end = parseInt(el.dataset.target, 10);
      const dur = 1800;
      const step = 16;
      const inc  = end / (dur / step);
      let cur = 0;
      const timer = setInterval(() => {
        cur = Math.min(cur + inc, end);
        el.textContent = Math.floor(cur).toLocaleString('vi-VN');
        if (cur >= end) clearInterval(timer);
      }, step);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });

  els.forEach(el => obs.observe(el));
})();

/* ---------- CATEGORY FILTER ---------- */
(function initFilter() {
  const tabs  = document.querySelectorAll('.tab-btn');
  const cards = document.querySelectorAll('.product-card');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.cat;
      cards.forEach(card => {
        const show = cat === 'all' || card.dataset.cat === cat;
        card.style.display = show ? '' : 'none';
        if (show) card.style.animation = 'none', requestAnimationFrame(() => card.style.animation = '');
      });
    });
  });
})();

/* ---------- MODAL SYSTEM ---------- */
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('open');
  document.body.style.overflow = '';
}

function switchModal(fromId, toId) {
  closeModal(fromId);
  setTimeout(() => openModal(toId), 250);
}

function openContactModal() {
  // Redirect to contact section
  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

// ESC key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => closeModal(m.id));
    closeCart();
  }
});

/* ---------- CART SYSTEM ---------- */
let cart = [];

function openCart() {
  document.getElementById('cart-sidebar')?.classList.add('open');
  document.getElementById('cart-overlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-sidebar')?.classList.remove('open');
  document.getElementById('cart-overlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

function addToCart(name, price) {
  const existing = cart.find(i => i.name === name);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  renderCart();
  openCart();
  showToast(`✅ Đã thêm "${name}" vào giỏ hàng!`);
}

function removeFromCart(name) {
  cart = cart.filter(i => i.name !== name);
  renderCart();
}

function renderCart() {
  const itemsEl   = document.getElementById('cart-items');
  const totalEl   = document.getElementById('cart-total');
  const countEl   = document.getElementById('cart-count');
  if (!itemsEl) return;

  const totalQty   = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.price * i.qty, 0);

  countEl.textContent = totalQty;
  countEl.style.display = totalQty > 0 ? 'flex' : 'none';
  totalEl.textContent = totalPrice.toLocaleString('vi-VN') + 'đ';

  if (cart.length === 0) {
    itemsEl.innerHTML = '<p class="cart-empty"><i class="fas fa-shopping-cart"></i><br/>Giỏ hàng trống</p>';
    return;
  }

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <span class="cart-item-name">${item.name}${item.qty > 1 ? ` ×${item.qty}` : ''}</span>
      <span class="cart-item-price">${(item.price * item.qty).toLocaleString('vi-VN')}đ</span>
      <button class="cart-item-del" onclick="removeFromCart('${item.name}')" title="Xoá"><i class="fas fa-trash-alt"></i></button>
    </div>
  `).join('');
}

function checkout() {
  if (cart.length === 0) { showToast('⚠️ Giỏ hàng đang trống!', 'warn'); return; }
  closeCart();
  openModal('login-modal');
  showToast('🔐 Vui lòng đăng nhập để thanh toán');
}

/* ---------- CHAT WIDGET ---------- */
const BOT_REPLIES = [
  'Xin chào! Bạn cần hỗ trợ về sản phẩm nào? 😊',
  'Vui lòng cho biết tên tài khoản game của bạn để chúng tôi hỗ trợ tốt hơn nhé!',
  'Bạn có thể liên hệ trực tiếp qua Zalo hoặc Telegram để được hỗ trợ nhanh hơn! 🚀',
  'Shop hoạt động 24/7, chúng tôi sẽ phản hồi sớm nhất có thể!',
  'Cảm ơn bạn đã tin tưởng AntiGravity Pro! ⚡',
];
let botIdx = 0;

function toggleChat() {
  const widget = document.getElementById('chat-widget');
  widget?.classList.toggle('open');
}

function sendChat() {
  const input = document.getElementById('chat-input');
  const msgs  = document.getElementById('chat-messages');
  const text  = input?.value.trim();
  if (!text || !msgs) return;

  // User message
  msgs.innerHTML += `<div class="chat-msg user"><div class="msg-bubble">${escapeHtml(text)}</div></div>`;
  input.value = '';
  msgs.scrollTop = msgs.scrollHeight;

  // Bot reply after delay
  setTimeout(() => {
    msgs.innerHTML += `<div class="chat-msg bot"><div class="msg-bubble">${BOT_REPLIES[botIdx % BOT_REPLIES.length]}</div></div>`;
    botIdx++;
    msgs.scrollTop = msgs.scrollHeight;
  }, 900);
}

/* ---------- DASHBOARD TABS ---------- */
function switchDashTab(btn, tabId) {
  document.querySelectorAll('.dash-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.dash-tab-content').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(tabId)?.classList.add('active');
}

/* ---------- COPY REFERRAL LINK ---------- */
function copyRef() {
  const link = document.getElementById('ref-link')?.textContent;
  if (!link) return;
  navigator.clipboard.writeText(link).then(() => {
    showToast('📋 Đã copy link giới thiệu!');
  });
}

/* ---------- TOAST NOTIFICATIONS ---------- */
function showToast(message, type = 'success') {
  const existing = document.getElementById('ag-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'ag-toast';
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '90px',
    left: '50%',
    transform: 'translateX(-50%) translateY(20px)',
    background: type === 'warn'
      ? 'rgba(245,158,11,0.95)'
      : 'linear-gradient(135deg, rgba(124,58,237,0.97), rgba(6,182,212,0.97))',
    color: '#fff',
    padding: '12px 28px',
    borderRadius: '50px',
    fontSize: '0.88rem',
    fontWeight: '600',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    zIndex: '9999',
    backdropFilter: 'blur(12px)',
    transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
    opacity: '0',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  });

  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

/* ---------- SCROLL REVEAL ---------- */
(function initReveal() {
  const els = document.querySelectorAll('.product-card, .feature-card, .recharge-card, .contact-card');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = entry.target.style.transform.replace('translateY(30px)', 'translateY(0)');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    obs.observe(el);
  });
})();

/* ---------- SMOOTH ACTIVE NAV ---------- */
(function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let cur = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 100) cur = sec.id;
    });
    links.forEach(a => {
      a.classList.toggle('active-link', a.getAttribute('href') === '#' + cur);
    });
  }, { passive: true });
})();

/* ---------- HELPERS ---------- */
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ---------- INIT CART COUNT ---------- */
renderCart();
