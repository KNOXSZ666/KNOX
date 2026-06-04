// ======================================================
// 📚 1. DỮ LIỆU SẢN PHẨM (Database Mockup)
// ======================================================
const MOD_DATA = [
    { id: 1, name: "Câu Cá Vạn Cân", price: 0, description: "Tăng tỷ lệ rơi vàng và vật phẩm hiếm.", image: "assets/mod_ca_van_can.jpg" },
    { id: 2, name: "Mod Skill Mạnh Mẽ", price: 75000, description: "Tăng cấp độ kỹ năng tối đa và hiệu quả tấn công.", image: "assets/mod_skill.jpg" },
    { id: 3, name: "Mod Cấp Độ", price: 30000, description: "Tăng cấp trong game.", image: "assets/mod_lv.jpg" },
    { id: 4, name: "Mod Item VIP", price: 20000, description: "Tự động nhận bộ trang bị cao cấp nhất.", image: "assets/mod_item.jpg" },
    { id: 5, name: "Mod Pet Hỗ Trợ", price: 20000, description: "Thuê pet mạnh giúp farm và chiến đấu.", image: "assets/mod_pet.jpg" },
    { id: 6, name: "Mod Kim Cương Tím", price: 30000, description: "Gói nâng cấp toàn diện, bao gồm mọi thứ.", image: "assets/mod_kim_duong.jpg" },
];

// ======================================================
// 🛒 2. CART & ORDER LOGIC
// ======================================================
let cart = [];

// Hàm render sản phẩm lên giao diện
function renderProducts() {
    const container = document.getElementById('mod-container');
    if (!container) return;

    container.innerHTML = MOD_DATA.map(mod => `
        <div class="mod-card" data-id="${mod.id}" data-price="${mod.price}">
            <img src="${mod.image || 'assets/placeholder.jpg'}" alt="${mod.name}">
            <h4>${mod.name}</h4>
            <p>${mod.description}</p>
            <div class="mod-price">${mod.price.toLocaleString('vi-VN')} VNĐ</div>
            <button class="btn btn-primary add-to-cart" data-id="${mod.id}">Thêm vào Giỏ</button>
        </div>
    `).join('');

    // Gắn sự kiện click cho nút thêm vào giỏ
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            const mod = MOD_DATA.find(m => m.id === id);
            if (mod) {
                addToCart(mod);
            }
        });
    });
}

// Thêm sản phẩm vào giỏ
function addToCart(mod) {
    const existingItem = cart.find(item => item.id === mod.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...mod, quantity: 1 });
    }
    updateCartDisplay();
    alert(`${mod.name} đã được thêm vào giỏ hàng!`);
}

// Cập nhật hiển thị giỏ hàng
function updateCartDisplay() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const summaryEl = document.getElementById('cart-summary');
    if (summaryEl) {
        summaryEl.innerHTML = `🛒 Giỏ hàng: ${totalItems} sản phẩm | Tổng: ${totalPrice.toLocaleString('vi-VN')} VNĐ`;
    }
}

// ======================================================
// ⚙️ 3. UI/UX CONTROLS (TAB & MODAL)
// ======================================================

// --- Tab Payment ---
function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tab-btn");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

// --- Modal Auth ---
const modal = document.getElementById("authModal");
const modalTitle = document.getElementById("modal-title");
const authForm = document.getElementById("auth-form");
const btnToggle = document.getElementById("btn-toggle-auth");

function openModal() {
    modal.style.display = "block";
}
function closeModal() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        closeModal();
    }
}

// Logic chuyển đổi giữa Đăng nhập và Đăng ký
btnToggle.addEventListener('click', function() {
    const isLogin = modalTitle.textContent.includes('Đăng Nhập');
    if (isLogin) {
        // Chuyển sang Đăng Ký
        modalTitle.textContent = "Đăng Ký Tài Khoản Mới";
        btnToggle.textContent = "Quay về Đăng Nhập";
        // (Thêm logic trường cho Đăng Ký nếu cần)
    } else {
        // Quay về Đăng Nhập
        modalTitle.textContent = "Đăng Nhập Tài Khoản";
        btnToggle.textContent = "Đăng Ký";
    }
});

// ======================================================
// 🧩 4. FORM SUBMISSION & BACKEND MOCKUP
// ======================================================

// Xử lý Form Đăng Nhập/Đăng Ký
authForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;

    // --- MOCK API CALL ---
    console.log(`Đang thực hiện ${modalTitle.textContent.includes('Đăng Nhập') ? 'Đăng Nhập' : 'Đăng Ký'} với: ${username}`);

    if (modalTitle.textContent.includes('Đăng Nhập')) {
        // Logic kiểm tra đơn giản
        if (username === "admin" && password === "123456") {
             alert("Đăng nhập thành công! Chào mừng trở lại KNOX!");
             closeModal();
        } else {
             alert("Tên đăng nhập hoặc mật khẩu sai. Vui lòng thử lại.");
        }
    } else {
        // Logic đăng ký
        alert("Đăng ký thành công! Tài khoản đã được tạo tạm thời.");
        closeModal();
    }
});

// Xử lý các Form Thanh Toán
document.getElementById('form-card-payment').addEventListener('submit', function(e) {
    e.preventDefault();
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    alert(`[THÀNH CÔNG] Thanh toán Card: Đã gửi yêu cầu thanh toán cho tổng số: ${total.toLocaleString('vi-VN')} VNĐ. Chờ xác nhận từ KNOX.`);
    // Reset cart
    cart = [];
    updateCartDisplay();
});

// ... (Thêm logic tương tự cho form scratch và các form khác)

// ======================================================
// 🚀 KICKOFF: KHỞI TẠO TẤT CẢ CHỨC NĂNG KHI PAGE LOAD
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Hiển thị sản phẩm
    renderProducts();

    // 2. Cập nhật giỏ hàng ban đầu
    updateCartDisplay();

    // 3. Thêm sự kiện cho các nút quan trọng (Ví dụ: mở modal từ Header)
    document.querySelector('.main-header').addEventListener('click', function(e) {
        if (e.target.closest('.logo') || e.target.closest('.main-nav')) {
            // Giả sử nút Login/Register được đặt ở góc phải header
            // Nếu bạn có nút Login riêng, hãy kích hoạt nó ở đây.
            // Ví dụ: document.getElementById('login-btn').addEventListener('click', openModal);
        }
    });
});
