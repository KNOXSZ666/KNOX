// ======================================================
//  1. DỮ LIỆU SẢN PHẨM (Database Mockup)
// ======================================================
const MOD_DATA = [
    { id: 1, name: "Cá Vạn Cân", price: 0, description: "Tăng tỷ lệ rơi vàng và vật phẩm hiếm.", image: "assets/mod_ca_van_can.jpg" },
    { id: 2, name: "Mod Skill Mạnh Mẽ", price: 10000, description: "Tăng cấp độ kỹ năng tối đa và hiệu quả tấn công.", image: "assets/mod_skill.jpg" },
    { id: 3, name: "Mod Tăng Cấp Độ", price: 30000, description: "Tăng tốc độ lên cấp trong game.", image: "assets/mod_lv.jpg" },
    { id: 4, name: "Mod Item VIP", price: 20000, description: "Tự động nhận bộ trang bị cao cấp nhất.", image: "assets/mod_item.jpg" },
    { id: 5, name: "Mod Pet Hỗ Trợ", price: 30000, description: "Thuê pet mạnh giúp farm và chiến đấu.", image: "assets/mod_pet.jpg" },
    { id: 6, name: "Mod Kim Cương", price: 30000, description: "Gói nâng cấp toàn diện, bao gồm mọi thứ.", image: "assets/mod_kim_duong.jpg" },
];

// ======================================================
//  2. CART & ORDER LOGIC
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
    // Tự động mở Modal nếu chưa mở
    if (!modal.style.display || modal.style.display === 'none') {
        openModal();
    }
    alert(`${mod.name} đã được thêm vào giỏ hàng!`);
}

// Cập nhật hiển thị giỏ hàng
function updateCartDisplay() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const summaryEl = document.getElementById('cart-summary');
    if (summaryEl) {
        summaryEl.innerHTML = ` Giỏ hàng: ${totalItems} sản phẩm | Tổng: ${totalPrice.toLocaleString('vi-VN')} VNĐ`;
    }
}

// ======================================================
//  3. UI/UX CONTROLS (TAB & MODAL)
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
const authUsernameInput = document.getElementById('auth-username');
const authPasswordInput = document.getElementById('auth-password');
const authRoleSelect = document.getElementById('auth-role'); // Đã được thêm

function openModal() {
    modal.style.display = "block";
    // Đảm bảo luôn hiển thị giao diện đăng nhập khi mở lần đầu
    updateAuthInterface('login');
}
function closeModal() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        closeModal();
    }
}

// Hàm cập nhật giao diện Modal (Login vs Register)
function updateAuthInterface(type) {
    if (type === 'login') {
        modalTitle.textContent = "Đăng Nhập Tài Khoản";
        btnToggle.textContent = "Đăng Ký";
        document.getElementById('btn-auth').textContent = "Đăng Nhập";

        // Giữ nguyên là trường nhập liệu đơn giản cho User/Admin
        authUsernameInput.placeholder = "Tên đăng nhập (KNOX666 hoặc user_name)";
        authPasswordInput.placeholder = "Mật khẩu";

        // Đảm bảo có trường Role để phân biệt
        if (!authRoleSelect) {
             console.error("Lỗi: Element #auth-role không được tìm thấy.");
        }
    } else { // Register
        modalTitle.textContent = "Đăng Ký Tài Khoản Mới";
        btnToggle.textContent = "Quay về Đăng Nhập";
        document.getElementById('btn-auth').textContent = "Đăng Ký";

        authUsernameInput.placeholder = "Tên mong muốn";
        authPasswordInput.placeholder = "Mật khẩu bảo mật";
        // Trong chế độ Register, Role mặc định là User
        if(authRoleSelect) authRoleSelect.value = 'user';
    }
}

// Logic chuyển đổi giữa Đăng nhập và Đăng ký
btnToggle.addEventListener('click', function() {
    const isLogin = modalTitle.textContent.includes('Đăng Nhập');
    if (isLogin) {
        updateAuthInterface('register');
    } else {
        updateAuthInterface('login');
    }
});

// ======================================================
//  4. FORM SUBMISSION & BACKEND MOCKUP
// ======================================================

authForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = authUsernameInput.value.trim();
    const password = authPasswordInput.value;

    // Lấy Role. Nếu không có select, mặc định là user.
    let role = 'user';
    if (authRoleSelect) {
        role = authRoleSelect.value;
    }

    // --- CẤU HÌNH ADMIN MỚI ---
    const ADMIN_USERNAME = 'KNOX666';
    const ADMIN_PASSWORD = 'nguyenmk2';
    // ---------------------------

    let isLoggedIn = false;
    let userRole = 'user';

    // 1. Kiểm tra Admin
    if (role === 'admin' && username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        isLoggedIn = true;
        userRole = 'admin';
    }
    // 2. Kiểm tra User (Giả định bất kỳ cặp nào hợp lệ đều là user)
    else if (username && password) {
        isLoggedIn = true;
        userRole = 'user';
    }
    // 3. Lỗi
    else {
         alert(`❌ THẤT BẠI: Thông tin đăng nhập không hợp lệ. (Admin: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD})`);
         return;
    }

    // --- XỬ LÝ THÀNH CÔNG ---
    if (isLoggedIn) {
        alert(`✅ THÀNH CÔNG! Bạn đã đăng nhập với vai trò: ${userRole.toUpperCase()}.`);

        // Tùy chỉnh hành vi dựa trên vai trò
        if (userRole === 'admin') {
            console.log("ADMIN ACCESS GRANTED: Mở dashboard quản trị...");
            // Ở đây bạn sẽ gọi hàm để hiển thị bảng điều khiển Admin
        } else {
            console.log("USER ACCESS GRANTED: Bắt đầu mua sắm...");
            // Ở đây bạn có thể thực hiện logic cho User
        }

        closeModal();
    }
});

// Xử lý các Form Thanh Toán (Giữ nguyên)
document.getElementById('form-card-payment').addEventListener('submit', function(e) {
    e.preventDefault();
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Kiểm tra quyền admin trước khi thanh toán nếu cần
    // if (userRole === 'admin') { /* ... */ }

    alert(`[THÀNH CÔNG] Thanh toán Card: Đã gửi yêu cầu thanh toán cho tổng số: ${total.toLocaleString('vi-VN')} VNĐ. Chờ xác nhận từ KNOX.`);
    // Reset cart
    cart = [];
    updateCartDisplay();
});

// ======================================================
//  KICKOFF: KHỞI TẠO TẤT CẢ CHỨC NĂNG KHI PAGE LOAD
// ======================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Hiển thị sản phẩm
    renderProducts();

    // 2. Cập nhật giỏ hàng ban đầu
    updateCartDisplay();

    // Gắn sự kiện mở Modal (Đảm bảo bạn đã có nút với ID này trong HTML)
    const triggerButton = document.getElementById('btn-login-trigger');
    if(triggerButton) {
         triggerButton.addEventListener('click', openModal);
    }
});
