# ⚡ AntiGravity Pro – Shop Mod & Script

Giao diện website shop mod game & script chuyên nghiệp với phong cách Deep Space + Neon.

## 📁 Cấu Trúc File

```
antigravity-pro/
├── index.html          # Trang chủ chính
├── css/
│   └── style.css       # Toàn bộ stylesheet (design tokens, components, responsive)
├── js/
│   └── main.js         # JavaScript: particles, modal, cart, chat, filter...
└── README.md
```

## 🎨 Design System

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| `--void` | `#06060f` | Background chính |
| `--space` | `#0a0a1a` | Background section |
| `--violet` | `#7c3aed` | Accent chính, button |
| `--cyan` | `#06b6d4` | Accent phụ, giá |
| `--pink` | `#e879f9` | Premium, badge |
| `--gold` | `#f59e0b` | Ultimate, referral |
| Font display | Orbitron | Logo, tiêu đề |
| Font body | Inter | Nội dung |

## 🚀 Tính Năng

- ✅ Particles background động
- ✅ Floating card animations (zero-gravity feel)
- ✅ Glassmorphism cards + glow effects
- ✅ Animated hero counters
- ✅ Category filter (Tất cả / Câu Cá / Roblox / Khác)
- ✅ Modal system: Đăng nhập, Đăng ký, Dashboard
- ✅ Dashboard với tabs: Lịch sử mua, Lịch sử nạp, Referral
- ✅ Giỏ hàng sidebar + toast notifications
- ✅ Live chat widget với bot reply
- ✅ FAB buttons: Zalo, Telegram, Chat
- ✅ Nạp tiền: VCB QR, Thẻ cào, GCoin
- ✅ Referral system (link + copy)
- ✅ Scroll reveal animations
- ✅ Responsive hoàn hảo (mobile/tablet/desktop)
- ✅ Reduced motion support

## 🛒 Sản Phẩm

### Mod Câu Cá Vạn Cân
| Sản phẩm | Giá |
|----------|-----|
| Mod Skill | 10.000đ |
| Mod Cá | 20.000đ |
| Mod Level | 10.000đ |
| Mod Item | 20.000đ |
| Mod Pet | 20.000đ |
| Mod Kim Cương | 30.000đ / 1tr KC |
| Gói Full | Liên hệ |

### Script Roblox
| Sản phẩm | Giá |
|----------|-----|
| Sniper Arena | 15.000đ |

### Sản Phẩm Khác
| Sản phẩm | Giá |
|----------|-----|
| Bản Mod Tự Mod | 85.000đ |
| Câu Chung Theo Giờ | 20.000đ/h |

## 🔧 Tuỳ Chỉnh Nhanh

### Đổi link Zalo/Telegram
Tìm và thay `https://zalo.me/0000000000` và `https://t.me/antigravitypro` trong `index.html`.

### Đổi thông tin ngân hàng
Tìm phần `<!-- QR Modal -->` trong `index.html`, cập nhật số tài khoản và tên chủ tài khoản.

### Thêm sản phẩm mới
Copy một block `.product-card` trong `index.html`, thay nội dung và đặt `data-cat` phù hợp.

### Đổi màu accent
Chỉnh `--violet`, `--cyan`, `--pink` trong `:root` của `style.css`.

## 📱 Responsive Breakpoints
- Desktop: 1200px+
- Tablet: 768px – 1199px
- Mobile: < 768px
- Small mobile: < 480px

## 🔗 CDN Dependencies (không cần cài đặt)
- Font Awesome 6.5.0
- Google Fonts: Orbitron + Inter
