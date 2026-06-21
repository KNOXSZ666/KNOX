/* ==========================================================================
   ANTIGRAVITY PRO — MAIN SCRIPT
   Mock data only — replace fetchProducts()/API calls with real backend later.
   ========================================================================== */

(() => {
  "use strict";

  /* ---------- 1. MOCK PRODUCT DATA ---------- */
  /* category keys: mod-game | script-roblox | khac */
  const PRODUCTS = [
    {
      id: "mod-skill",
      category: "mod-game",
      icon: "fa-solid fa-bolt",
      title: "Mod Skill",
      desc: "Câu Cá Vạn Cân — Mở khoá toàn bộ kỹ năng đặc biệt, tăng tốc cần câu.",
      price: 10000,
      unit: "/ lượt",
      badge: null,
    },
    {
      id: "mod-ca",
      category: "mod-game",
      icon: "fa-solid fa-fish",
      title: "Mod Cá",
      desc: "Câu Cá Vạn Cân — Spawn đa dạng loài cá hiếm, tỉ lệ cá quý tăng mạnh.",
      price: 20000,
      unit: "/ lượt",
      badge: "Hot",
    },
    {
      id: "mod-level",
      category: "mod-game",
      icon: "fa-solid fa-chart-line",
      title: "Mod Level",
      desc: "Câu Cá Vạn Cân — Tăng cấp độ nhân vật nhanh chóng, an toàn.",
      price: 10000,
      unit: "/ lượt",
      badge: null,
    },
    {
      id: "mod-item",
      category: "mod-game",
      icon: "fa-solid fa-box-open",
      title: "Mod Item",
      desc: "Câu Cá Vạn Cân — Trang bị item full set, hiệu ứng độc quyền.",
      price: 20000,
      unit: "/ lượt",
      badge: null,
    },
    {
      id: "mod-pet",
      category: "mod-game",
      icon: "fa-solid fa-paw",
      title: "Mod Pet",
      desc: "Câu Cá Vạn Cân — Sở hữu pet hiếm, buff stats toàn diện.",
      price: 20000,
      unit: "/ lượt",
      badge: null,
    },
    {
      id: "mod-kc",
      category: "mod-game",
      icon: "fa-solid fa-gem",
      title: "Mod Kim Cương",
      desc: "Câu Cá Vạn Cân — Nạp Kim Cương số lượng lớn, giá tốt nhất thị trường.",
      price: 30000,
      unit: "/ 1 triệu KC",
      badge: "Hot",
    },
    {
      id: "mod-full",
      category: "mod-game",
      icon: "fa-solid fa-layer-group",
      title: "Gói Full Combo",
      desc: "Câu Cá Vạn Cân — Trọn bộ Skill + Cá + Level + Item + Pet. Tối ưu chi phí.",
      price: null,
      unit: "Liên hệ",
      badge: "Combo",
    },
    {
      id: "script-sniper",
      category: "script-roblox",
      icon: "fa-solid fa-crosshairs",
      title: "Sniper Arena",
      desc: "Script Roblox — Aim hỗ trợ, ESP, auto-farm điểm. Cập nhật liên tục.",
      price: 15000,
      unit: "/ tuần",
      badge: "New",
    },
    {
      id: "self-mod",
      category: "khac",
      icon: "fa-solid fa-screwdriver-wrench",
      title: "Bản Mod Tự Mod",
      desc: "Theo yêu cầu riêng — Mod game theo ý bạn, custom tính năng độc quyền.",
      price: 85000,
      unit: "/ bản",
      badge: null,
    },
    {
      id: "cau-chung",
      category: "khac",
      icon: "fa-solid fa-clock",
      title: "Câu Chung Theo Giờ",
      desc: "Trải nghiệm cùng admin, hỗ trợ trực tiếp trong phiên câu cá.",
      price: 20000,
      unit: "/ giờ",
      badge: null,
    },
  ];

  const CATEGORY_LABELS = {
    all: "Tất cả",
    "mod-game": "Mod Game",
    "script-roblox": "Script Roblox",
    khac: "Sản phẩm khác",
  };

  const fmtPrice = (val, unit) => {
    if (val === null) return `<span class="product-card__price">Liên hệ</span>`;
    return `<span class="product-card__price">${val.toLocaleString("vi-VN")}đ <span>${unit}</span></span>`;
  };

  const badgeClass = (badge) => {
    if (badge === "Hot") return "badge--hot";
    if (badge === "New") return "badge--new";
    if (badge === "Combo") return "badge--combo";
    return "";
  };

  function renderProductCard(p) {
    return `
      <article class="product-card" data-category="${p.category}">
        ${p.badge ? `<span class="product-card__badge ${badgeClass(p.badge)}">${p.badge}</span>` : ""}
        <div class="product-card__icon"><i class="${p.icon}"></i></div>
        <h3 class="product-card__title">${p.title}</h3>
        <p class="product-card__desc">${p.desc}</p>
        <div class="product-card__footer">
          ${fmtPrice(p.price, p.unit)}
          <button class="btn btn-primary btn-sm" data-buy="${p.id}">
            <i class="fa-solid fa-cart-shopping"></i> Mua ngay
          </button>
        </div>
      </article>
    `;
  }

  function renderProducts(filter = "all") {
    const grid = document.getElementById("productGrid");
    if (!grid) return;
    const list = filter === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === filter);
    grid.innerHTML = list.map(renderProductCard).join("");
  }

  function initCategoryTabs() {
    const tabs = document.querySelectorAll(".category-tab");
    if (!tabs.length) return;
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("is-active"));
        tab.classList.add("is-active");
        renderProducts(tab.dataset.filter);
      });
    });
  }

  /* ---------- 2. BUY BUTTON (mock — hook up to real checkout later) ---------- */
  function initBuyButtons() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-buy]");
      if (!btn) return;
      const product = PRODUCTS.find((p) => p.id === btn.dataset.buy);
      if (!product) return;
      openChat(
        `Mình muốn mua "${product.title}" — bạn xác nhận giúp mình giá ${
          product.price ? product.price.toLocaleString("vi-VN") + "đ" : "liên hệ"
        } nhé!`
      );
    });
  }

  /* ---------- 3. NAVBAR — mobile toggle ---------- */
  function initMobileNav() {
    const toggle = document.getElementById("navToggle");
    const links = document.getElementById("navLinks");
    if (!toggle || !links) return;
    toggle.addEventListener("click", () => {
      const isOpen = links.classList.toggle("is-open");
      toggle.innerHTML = isOpen
        ? '<i class="fa-solid fa-xmark"></i>'
        : '<i class="fa-solid fa-bars"></i>';
    });
  }

  /* ---------- 4. NAVBAR — shrink/scroll style (subtle, perf-friendly) ---------- */
  function initNavScroll() {
    const nav = document.querySelector(".navbar");
    if (!nav) return;
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          nav.style.boxShadow = window.scrollY > 10 ? "0 8px 24px -16px rgba(0,0,0,0.5)" : "none";
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  /* ---------- 5. HERO PARALLAX (antigravity mouse-follow) ---------- */
  function initHeroParallax() {
    const visual = document.querySelector(".hero__visual");
    if (!visual) return;
    const cards = visual.querySelectorAll(".orbit-card");
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let frame = null;
    visual.addEventListener("pointermove", (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const rect = visual.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width - 0.5;
        const relY = (e.clientY - rect.top) / rect.height - 0.5;
        cards.forEach((card, i) => {
          const depth = (i + 1) * 6;
          card.style.setProperty("--parallax-x", `${relX * depth}px`);
          card.style.setProperty("--parallax-y", `${relY * depth}px`);
          card.style.transform = `translate(${relX * depth}px, ${relY * depth}px)`;
        });
        frame = null;
      });
    });

    visual.addEventListener("pointerleave", () => {
      cards.forEach((card) => {
        card.style.transform = "translate(0, 0)";
      });
    });
  }

  /* ---------- 6. SUPPORT CHAT WIDGET ---------- */
  function openChat(prefillMsg) {
    const widget = document.getElementById("chatWidget");
    if (!widget) return;
    widget.classList.add("is-open");
    if (prefillMsg) {
      const input = document.getElementById("chatInput");
      if (input) input.value = prefillMsg;
    }
  }

  function initChatWidget() {
    const fabChat = document.getElementById("fabChat");
    const widget = document.getElementById("chatWidget");
    const closeBtn = document.getElementById("chatClose");
    const sendBtn = document.getElementById("chatSend");
    const input = document.getElementById("chatInput");
    const body = document.getElementById("chatBody");

    if (!widget) return;

    fabChat?.addEventListener("click", () => widget.classList.toggle("is-open"));
    closeBtn?.addEventListener("click", () => widget.classList.remove("is-open"));

    const sendMessage = () => {
      const text = input.value.trim();
      if (!text) return;
      const userMsg = document.createElement("div");
      userMsg.className = "chat-msg chat-msg--user";
      userMsg.textContent = text;
      body.appendChild(userMsg);
      input.value = "";
      body.scrollTop = body.scrollHeight;

      // Mock auto-reply — replace with real support/chat API later
      setTimeout(() => {
        const botMsg = document.createElement("div");
        botMsg.className = "chat-msg chat-msg--bot";
        botMsg.textContent =
          "Cảm ơn bạn! Admin sẽ phản hồi trong vài phút. Bạn cũng có thể nhắn nhanh qua Zalo/Telegram ở góc phải màn hình.";
        body.appendChild(botMsg);
        body.scrollTop = body.scrollHeight;
      }, 700);
    };

    sendBtn?.addEventListener("click", sendMessage);
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendMessage();
    });
  }

  /* ---------- 7. REFERRAL CODE COPY ---------- */
  function initReferralCopy() {
    const btn = document.getElementById("copyReferral");
    const codeEl = document.getElementById("referralCodeText");
    if (!btn || !codeEl) return;
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(codeEl.textContent.trim());
        const icon = btn.querySelector("i");
        const original = icon.className;
        icon.className = "fa-solid fa-check";
        setTimeout(() => (icon.className = original), 1500);
      } catch (err) {
        console.warn("Copy failed:", err);
      }
    });
  }

  /* ---------- 8. ANIMATE ON SCROLL (lightweight, no library) ---------- */
  function initRevealOnScroll() {
    const targets = document.querySelectorAll(".product-card, .feature-card, .deposit-card");
    if (!("IntersectionObserver" in window) || !targets.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    targets.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(16px)";
      el.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      observer.observe(el);
    });
  }

  /* ---------- 9. INIT ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    renderProducts("all");
    initCategoryTabs();
    initBuyButtons();
    initMobileNav();
    initNavScroll();
    initHeroParallax();
    initChatWidget();
    initReferralCopy();
    initRevealOnScroll();
  });

  // Expose for other inline usages if needed
  window.AntiGravityPro = { openChat, PRODUCTS };
})();
