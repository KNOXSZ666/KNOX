import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase, ADMIN_USERNAME, ADMIN_PASSWORD, SHOP_INFO, SERVICES, VIP_LEVELS, CARD_TELCOS, CARD_AMOUNTS, CARD_DISCOUNT, formatPrice, generateCode, getVipLevel, getNextVipLevel, maskUsername, getDeviceInfo, getIP } from './lib/supabase';
import { useStore, User } from './lib/store';

// ============== TYPES ==============
interface Order { id: number; order_code: string; username: string; service: string; payment: string; note: string; price: number; status: string; progress: number; download_link: string; rating: number; game_username: string; game_password: string; reject_reason: string; created_at: string; }
interface Deposit { id: number; deposit_code: string; username: string; amount: number; method: string; note: string; status: string; created_at: string; }
interface CardDeposit { id: number; card_code: string; username: string; telco: string; serial: string; code: string; amount: number; actual_amount: number; status: string; admin_note: string; created_at: string; }
interface Script { id: number; name: string; game: string; price: number; active: boolean; created_at: string; }
interface HotDeal { id: number; product_name: string; original_price: number; discount_percent: number; description: string; active: boolean; created_at: string; }
interface Voucher { id: number; code: string; discount_percent: number; max_uses: number; used_count: number; expires_at: string; active: boolean; created_at: string; }
interface Review { id: number; username: string; service: string; rating: number; comment: string; created_at: string; }
interface Ticket { id: number; ticket_code: string; username: string; subject: string; message: string; admin_reply: string; status: string; created_at: string; }
interface Notification { id: number; username: string; title: string; message: string; type: string; read: boolean; created_at: string; }
interface LoginHistoryItem { id: number; username: string; ip: string; device: string; browser: string; success: boolean; created_at: string; }
interface Broadcast { id: number; title: string; message: string; created_at: string; }
interface AdminLog { id: number; action: string; target: string; details: string; created_at: string; }

// ============== GALAXY BACKGROUND ==============
function GalaxyBg() {
  const stars = useMemo(() => Array.from({length: 50}, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 2 + 1,
    dur: Math.random() * 3 + 2,
    delay: Math.random() * 3,
  })), []);
  const particles = useMemo(() => Array.from({length: 10}, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    dur: Math.random() * 6 + 6,
    dx: (Math.random() - 0.5) * 60,
    dy: -(Math.random() * 100 + 50),
    dx2: (Math.random() - 0.5) * 80,
    dy2: -(Math.random() * 150 + 100),
    dx3: (Math.random() - 0.5) * 60,
    dy3: -(Math.random() * 200 + 100),
  })), []);
  return (
    <>
      <div className="galaxy-bg" />
      <div className="stars">
        {stars.map(s => (
          <div key={s.id} className="star" style={{
            left: s.left + '%', top: s.top + '%',
            width: s.size, height: s.size,
            ['--dur' as string]: s.dur + 's',
            animationDelay: s.delay + 's',
          }} />
        ))}
      </div>
      {particles.map(p => (
        <div key={p.id} className="particle" style={{
          left: p.left + '%', top: p.top + '%',
          ['--dur' as string]: p.dur + 's',
          ['--dx' as string]: p.dx + 'px',
          ['--dy' as string]: p.dy + 'px',
          ['--dx2' as string]: p.dx2 + 'px',
          ['--dy2' as string]: p.dy2 + 'px',
          ['--dx3' as string]: p.dx3 + 'px',
          ['--dy3' as string]: p.dy3 + 'px',
        }} />
      ))}
    </>
  );
}

// ============== TOAST CONTAINER ==============
function ToastContainer() {
  const toasts = useStore(s => s.toasts);
  const removeToast = useStore(s => s.removeToast);
  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 max-w-[320px]">
      {toasts.map(t => (
        <div key={t.id} className={`toast-enter px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm cursor-pointer text-sm font-medium ${
          t.type === 'success' ? 'bg-green-900/80 border border-green-500/30 text-green-300' :
          t.type === 'error' ? 'bg-red-900/80 border border-red-500/30 text-red-300' :
          'bg-cyan-900/80 border border-cyan-500/30 text-cyan-300'
        }`} onClick={() => removeToast(t.id)}>
          {t.type === 'success' ? '✅ ' : t.type === 'error' ? '❌ ' : 'ℹ️ '}{t.message}
        </div>
      ))}
    </div>
  );
}

// ============== MODAL COMPONENT ==============
function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${wide ? 'max-w-[700px]' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg text-cyber-teal">{title}</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white text-xl">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ============== SKELETON LOADER ==============
function _Skeleton({ h = 20, w = '100%', className = '' }: { h?: number; w?: string | number; className?: string }) {
  return <div className={`skeleton ${className}`} style={{ height: h, width: w }} />;
}
void _Skeleton;

// ============== STAR RATING ==============
function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`star-btn text-xl ${i <= value ? 'active' : 'inactive'} ${readonly ? 'cursor-default' : ''}`}
          onClick={() => !readonly && onChange?.(i)}>★</span>
      ))}
    </div>
  );
}

// ============== STATUS BADGE ==============
function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold status-${status}`}>
      {status === 'pending' ? '⏳ Chờ' : status === 'completed' ? '✅ Xong' : status === 'rejected' ? '❌ Từ chối' : status === 'processing' ? '🔄 Đang xử lý' : status === 'cancelled' ? '🚫 Đã hủy' : status === 'open' ? '📩 Mở' : status === 'answered' ? '💬 Đã trả lời' : status === 'closed' ? '🔒 Đóng' : status}
    </span>
  );
}

// ============== COPY BUTTON ==============
function CopyBtn({ text }: { text: string }) {
  const addToast = useStore(s => s.addToast);
  return (
    <button className="text-xs text-cyber-teal hover:text-white ml-1" onClick={() => {
      navigator.clipboard.writeText(text);
      addToast('Đã sao chép!', 'success');
    }}>📋</button>
  );
}

// ============== MAIN APP ==============
export default function App() {
  const { user, setUser, isAdmin, setAdmin, lang, setLang, addToast, t } = useStore();
  const [page, setPage] = useState<'home' | 'admin'>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState<string | null>(null);
  const [_loading, _setLoading] = useState(false);
  void _loading; void _setLoading;

  // Data states
  const [scripts, setScripts] = useState<Script[]>([]);
  const [hotDeals, setHotDeals] = useState<HotDeal[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [cardDeposits, setCardDeposits] = useState<CardDeposit[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [topDepositors, setTopDepositors] = useState<{username: string; total: number}[]>([]);
  const [referredCount, setReferredCount] = useState(0);

  // Auth form states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authConfirmPw, setAuthConfirmPw] = useState('');
  const [authReferral, setAuthReferral] = useState('');

  // Purchase form
  const [buyService, setBuyService] = useState('');
  const [buyGameUser, setBuyGameUser] = useState('');
  const [buyGamePass, setBuyGamePass] = useState('');
  const [buyVoucher, setBuyVoucher] = useState('');
  const [buyNote, setBuyNote] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherApplied, setVoucherApplied] = useState(false);

  // Deposit form
  const [depAmount, setDepAmount] = useState(0);
  const [depMethod, setDepMethod] = useState('VCB');

  // Card deposit form
  const [cardTelco, setCardTelco] = useState('Viettel');
  const [cardSerial, setCardSerial] = useState('');
  const [cardCode, setCardCode] = useState('');
  const [cardAmount, setCardAmount] = useState(10000);

  // Change password
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmNewPw, setConfirmNewPw] = useState('');

  // Ticket form
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');

  // Review form
  const [reviewService, setReviewService] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Notification panel
  const [showNotifs, setShowNotifs] = useState(false);

  // Chat widget
  const [chatOpen, setChatOpen] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);

  // PWA install
  const [showInstall, setShowInstall] = useState(false);
  const deferredPrompt = useRef<any>(null);

  // Balance animation
  const [balancePulse, setBalancePulse] = useState(false);
  const _prevBalance = useRef(0);
  void _prevBalance;

  // Admin states
  const [adminTab, setAdminTab] = useState('dashboard');
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allDeposits, setAllDeposits] = useState<Deposit[]>([]);
  const [allCardDeposits, setAllCardDeposits] = useState<CardDeposit[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [allScripts, setAllScripts] = useState<Script[]>([]);
  const [allVouchers, setAllVouchers] = useState<Voucher[]>([]);
  const [allHotDeals, setAllHotDeals] = useState<HotDeal[]>([]);
  const [allLoginHistory, setAllLoginHistory] = useState<LoginHistoryItem[]>([]);
  const [allAdminLogs, setAllAdminLogs] = useState<AdminLog[]>([]);
  const [allBroadcasts, setAllBroadcasts] = useState<Broadcast[]>([]);
  const [adminSearch, setAdminSearch] = useState('');

  // Admin form states
  const [newScriptName, setNewScriptName] = useState('');
  const [newScriptGame, setNewScriptGame] = useState('');
  const [newScriptPrice, setNewScriptPrice] = useState('');
  const [newDealName, setNewDealName] = useState('');
  const [newDealPrice, setNewDealPrice] = useState('');
  const [newDealDiscount, setNewDealDiscount] = useState('');
  const [newDealDesc, setNewDealDesc] = useState('');
  const [newVoucherCode, setNewVoucherCode] = useState('');
  const [newVoucherDiscount, setNewVoucherDiscount] = useState('');
  const [newVoucherMaxUses, setNewVoucherMaxUses] = useState('');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  // Admin stats
  const [adminStats, setAdminStats] = useState({
    totalOrders: 0, pendingOrders: 0, completedOrders: 0,
    pendingDeposits: 0, pendingCards: 0, openTickets: 0,
    totalUsers: 0, lockedUsers: 0, revenue: 0,
  });

  // Chart
  const [chartPeriod, setChartPeriod] = useState<'7d'|'30d'|'12m'>('7d');
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  // ============== INIT & AUTO REFRESH ==============
  useEffect(() => {
    // Check saved session
    const savedUser = localStorage.getItem('knox_user');
    const savedAdmin = localStorage.getItem('knox_admin');
    if (savedAdmin === 'true') {
      setAdmin(true);
      setPage('admin');
    } else if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setUser(u);
      } catch {}
    }
    loadPublicData();

    // Chat widget delay
    setTimeout(() => setChatVisible(true), 2000);

    // PWA install
    const handleInstall = (e: any) => {
      e.preventDefault();
      deferredPrompt.current = e;
      const dismissed = localStorage.getItem('knox_pwa_dismissed');
      if (!dismissed) {
        setTimeout(() => setShowInstall(true), 3000);
      }
    };
    window.addEventListener('beforeinstallprompt', handleInstall);

    // Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    return () => window.removeEventListener('beforeinstallprompt', handleInstall);
  }, []);

  // Auto refresh balance every 1s
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      const { data } = await supabase.from('users').select('balance,total_deposited,total_spent,is_locked').eq('username', user.username).single();
      if (data) {
        if (data.balance !== user.balance) {
          setBalancePulse(true);
          setTimeout(() => setBalancePulse(false), 600);
          if (data.balance > user.balance) {
            addToast(`+${formatPrice(data.balance - user.balance)} đã được cộng vào ví!`, 'success');
          }
        }
        if (data.is_locked) {
          addToast('Tài khoản đã bị khóa!', 'error');
          handleLogout();
          return;
        }
        setUser({ ...user, balance: data.balance, total_deposited: data.total_deposited, total_spent: data.total_spent });
        localStorage.setItem('knox_user', JSON.stringify({ ...user, balance: data.balance, total_deposited: data.total_deposited, total_spent: data.total_spent }));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [user]);

  // Load notifications
  useEffect(() => {
    if (!user) return;
    const loadNotifs = async () => {
      const { data } = await supabase.from('notifications').select('*').eq('username', user.username).order('created_at', { ascending: false }).limit(50);
      if (data) setNotifications(data);
    };
    loadNotifs();
    const interval = setInterval(loadNotifs, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ============== DATA LOADING ==============
  async function loadPublicData() {
    const [scriptsRes, dealsRes, reviewsRes] = await Promise.all([
      supabase.from('scripts').select('*').eq('active', true).order('created_at', { ascending: false }),
      supabase.from('hot_deals').select('*').eq('active', true).order('created_at', { ascending: false }),
      supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(20),
    ]);
    if (scriptsRes.data) setScripts(scriptsRes.data);
    if (dealsRes.data) setHotDeals(dealsRes.data);
    if (reviewsRes.data) setReviews(reviewsRes.data);
    loadTopDepositors();
  }

  async function loadTopDepositors() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data } = await supabase.from('deposits').select('username, amount').eq('status', 'completed').gte('created_at', startOfMonth);
    if (data) {
      const map: Record<string, number> = {};
      data.forEach((d: any) => { map[d.username] = (map[d.username] || 0) + d.amount; });
      const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([username, total]) => ({ username, total }));
      setTopDepositors(sorted);
    }
  }

  async function loadUserData() {
    if (!user) return;
    const [ordersRes, depsRes, cardsRes, ticketsRes] = await Promise.all([
      supabase.from('orders').select('*').eq('username', user.username).order('created_at', { ascending: false }),
      supabase.from('deposits').select('*').eq('username', user.username).order('created_at', { ascending: false }),
      supabase.from('card_deposits').select('*').eq('username', user.username).order('created_at', { ascending: false }),
      supabase.from('tickets').select('*').eq('username', user.username).order('created_at', { ascending: false }),
    ]);
    if (ordersRes.data) setOrders(ordersRes.data);
    if (depsRes.data) setDeposits(depsRes.data);
    if (cardsRes.data) setCardDeposits(cardsRes.data);
    if (ticketsRes.data) setTickets(ticketsRes.data);
    // Referral count
    const { data: refData } = await supabase.from('users').select('id').eq('referred_by', user.referral_code);
    if (refData) setReferredCount(refData.length);
  }

  useEffect(() => { if (user) loadUserData(); }, [user]);

  // ============== AUTH FUNCTIONS ==============
  async function handleLogin() {
    if (!authUsername || !authPassword) { addToast('Vui lòng điền đầy đủ', 'error'); return; }

    // Admin check
    if (authUsername.toLowerCase() === ADMIN_USERNAME) {
      if (authPassword === ADMIN_PASSWORD) {
        const ip = await getIP();
        const { device, browser } = getDeviceInfo();
        await supabase.from('login_history').insert({ username: 'admin', ip, device, browser, success: true });
        setAdmin(true);
        setPage('admin');
        localStorage.setItem('knox_admin', 'true');
        setModal(null);
        addToast('Đăng nhập Admin thành công!', 'success');
        return;
      } else {
        addToast('Mật khẩu Admin sai!', 'error');
        const ip = await getIP();
        const { device, browser } = getDeviceInfo();
        await supabase.from('login_history').insert({ username: 'admin', ip, device, browser, success: false });
        return;
      }
    }

    // Check username exists
    const { data: userRow } = await supabase.from('users').select('*').eq('username', authUsername).single();
    if (!userRow) { addToast('Tên đăng nhập không tồn tại!', 'error'); return; }

    // Check password
    if (userRow.password !== authPassword) {
      addToast('Mật khẩu sai!', 'error');
      const ip = await getIP();
      const { device, browser } = getDeviceInfo();
      await supabase.from('login_history').insert({ username: authUsername, ip, device, browser, success: false });
      return;
    }

    // Check locked
    if (userRow.is_locked) { addToast('Tài khoản đã bị khóa! Liên hệ Admin.', 'error'); return; }

    // Success
    const ip = await getIP();
    const { device, browser } = getDeviceInfo();
    await Promise.all([
      supabase.from('login_history').insert({ username: authUsername, ip, device, browser, success: true }),
      supabase.from('users').update({ last_login: new Date().toISOString(), last_ip: ip, last_device: device + '/' + browser }).eq('username', authUsername),
    ]);
    setUser(userRow);
    localStorage.setItem('knox_user', JSON.stringify(userRow));
    setModal(null);
    setAuthUsername('');
    setAuthPassword('');
    addToast(`Chào mừng ${userRow.username}!`, 'success');
  }

  async function handleRegister() {
    if (authUsername.length < 3) { addToast('Username >= 3 ký tự', 'error'); return; }
    if (authUsername.toLowerCase() === 'admin') { addToast('Không được đăng ký tên "admin"', 'error'); return; }
    if (authPassword.length < 6) { addToast('Mật khẩu >= 6 ký tự', 'error'); return; }
    if (authPassword !== authConfirmPw) { addToast('Mật khẩu xác nhận không khớp', 'error'); return; }

    // Check username exists
    const { data: existing } = await supabase.from('users').select('id').eq('username', authUsername).single();
    if (existing) { addToast('Username đã tồn tại!', 'error'); return; }

    // Check referral code
    let referredBy = '';
    if (authReferral) {
      const { data: refUser } = await supabase.from('users').select('username').eq('referral_code', authReferral).single();
      if (!refUser) { addToast('Mã giới thiệu không hợp lệ', 'error'); return; }
      referredBy = authReferral;
    }

    const referralCode = 'REF' + Math.floor(100000 + Math.random() * 900000);
    const depositCode = 'NAP' + Math.floor(10000 + Math.random() * 20001);

    const { data: newUser, error } = await supabase.from('users').insert({
      username: authUsername,
      password: authPassword,
      email: authEmail,
      referral_code: referralCode,
      referred_by: referredBy,
      deposit_code: depositCode,
    }).select().single();

    if (error) { addToast('Lỗi đăng ký: ' + error.message, 'error'); return; }

    await supabase.from('notifications').insert({
      username: authUsername,
      title: 'Chào mừng!',
      message: `Chào mừng bạn đến KNOX Shop! Mã giới thiệu của bạn: ${referralCode}`,
      type: 'info',
    });

    setUser(newUser);
    localStorage.setItem('knox_user', JSON.stringify(newUser));
    setModal(null);
    setAuthUsername('');
    setAuthPassword('');
    setAuthEmail('');
    setAuthConfirmPw('');
    setAuthReferral('');
    addToast('Đăng ký thành công!', 'success');
  }

  function handleLogout() {
    setUser(null);
    setAdmin(false);
    setPage('home');
    localStorage.removeItem('knox_user');
    localStorage.removeItem('knox_admin');
    setMenuOpen(false);
    addToast('Đã đăng xuất', 'info');
  }

  async function handleChangePassword() {
    if (!user) return;
    const { data } = await supabase.from('users').select('password').eq('username', user.username).single();
    if (!data || data.password !== oldPw) { addToast('Mật khẩu cũ sai!', 'error'); return; }
    if (newPw.length < 6) { addToast('Mật khẩu mới >= 6 ký tự', 'error'); return; }
    if (newPw !== confirmNewPw) { addToast('Xác nhận mật khẩu không khớp', 'error'); return; }
    await supabase.from('users').update({ password: newPw }).eq('username', user.username);
    await supabase.from('notifications').insert({
      username: user.username, title: 'Đổi mật khẩu', message: 'Mật khẩu đã được thay đổi thành công.', type: 'info',
    });
    setModal(null);
    setOldPw(''); setNewPw(''); setConfirmNewPw('');
    addToast('Đổi mật khẩu thành công!', 'success');
  }

  // ============== PURCHASE ==============
  function getServicePrice(serviceId: string): number {
    const svc = SERVICES.find(s => s.id === serviceId);
    if (svc) return svc.price;
    const scr = scripts.find(s => s.name === serviceId);
    if (scr) return scr.price;
    return 0;
  }

  function getServiceName(serviceId: string): string {
    const svc = SERVICES.find(s => s.id === serviceId);
    if (svc) return svc.name;
    const scr = scripts.find(s => s.name === serviceId);
    if (scr) return `${scr.name} - ${scr.game}`;
    return serviceId;
  }

  async function applyVoucher() {
    if (!buyVoucher) return;
    const { data } = await supabase.from('vouchers').select('*').eq('code', buyVoucher.toUpperCase()).eq('active', true).single();
    if (!data) { addToast('Mã giảm giá không hợp lệ', 'error'); return; }
    if (data.used_count >= data.max_uses) { addToast('Mã đã hết lượt sử dụng', 'error'); return; }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { addToast('Mã đã hết hạn', 'error'); return; }
    setVoucherDiscount(data.discount_percent);
    setVoucherApplied(true);
    addToast(`Áp dụng mã ${data.code}: giảm ${data.discount_percent}%`, 'success');
  }

  async function handlePurchase() {
    if (!user || !buyService) { addToast('Chọn dịch vụ', 'error'); return; }
    const basePrice = getServicePrice(buyService);
    const isContactService = basePrice === 0;

    if (!isContactService) {
      if (buyGameUser.length < 3) { addToast('Tài khoản game >= 3 ký tự', 'error'); return; }
      if (buyGamePass.length < 3) { addToast('Mật khẩu game >= 3 ký tự', 'error'); return; }
    }

    // Calculate VIP discount
    const vip = getVipLevel(user.total_deposited);
    let finalPrice = basePrice;
    let discountText = '';

    if (vip.discount > 0 && !isContactService) {
      finalPrice = Math.round(finalPrice * (1 - vip.discount / 100));
      discountText += `VIP -${vip.discount}% `;
    }
    if (voucherApplied && voucherDiscount > 0 && !isContactService) {
      finalPrice = Math.round(finalPrice * (1 - voucherDiscount / 100));
      discountText += `Voucher -${voucherDiscount}%`;
    }

    if (!isContactService && user.balance < finalPrice) {
      addToast(`Không đủ số dư! Cần ${formatPrice(finalPrice)}`, 'error');
      setTimeout(() => setModal('deposit'), 1500);
      return;
    }

    const orderCode = generateCode('KNX-');
    const { error } = await supabase.from('orders').insert({
      order_code: orderCode,
      username: user.username,
      service: getServiceName(buyService),
      price: finalPrice,
      payment: 'wallet',
      note: buyNote + (discountText ? ` (${discountText.trim()})` : ''),
      game_username: buyGameUser,
      game_password: buyGamePass,
      status: isContactService ? 'pending' : 'pending',
    });

    if (error) { addToast('Lỗi tạo đơn: ' + error.message, 'error'); return; }

    if (!isContactService) {
      await supabase.from('users').update({
        balance: user.balance - finalPrice,
        total_spent: user.total_spent + finalPrice,
      }).eq('username', user.username);
      setUser({ ...user, balance: user.balance - finalPrice, total_spent: user.total_spent + finalPrice });
    }

    // Update voucher usage
    if (voucherApplied && buyVoucher) {
      try {
        await supabase.rpc('increment_voucher_usage', { voucher_code: buyVoucher.toUpperCase() });
      } catch {
        const { data: v } = await supabase.from('vouchers').select('used_count').eq('code', buyVoucher.toUpperCase()).single();
        if (v) await supabase.from('vouchers').update({ used_count: v.used_count + 1 }).eq('code', buyVoucher.toUpperCase());
      }
    }

    await supabase.from('notifications').insert({
      username: user.username,
      title: 'Đơn hàng mới',
      message: `Đơn ${orderCode}: ${getServiceName(buyService)} - ${formatPrice(finalPrice)}`,
      type: 'order',
    });

    setModal(null);
    setBuyService(''); setBuyGameUser(''); setBuyGamePass(''); setBuyNote(''); setBuyVoucher('');
    setVoucherDiscount(0); setVoucherApplied(false);
    loadUserData();
    addToast(`Đặt hàng thành công! Mã: ${orderCode}`, 'success');
  }

  // ============== DEPOSIT ==============
  async function handleBankDeposit() {
    if (!user || depAmount <= 0) { addToast('Chọn số tiền nạp', 'error'); return; }
    const depositCode = generateCode('NAP-');
    await supabase.from('deposits').insert({
      deposit_code: depositCode,
      username: user.username,
      amount: depAmount,
      method: depMethod,
      note: user.deposit_code,
    });
    await supabase.from('notifications').insert({
      username: user.username,
      title: 'Yêu cầu nạp tiền',
      message: `Đã tạo yêu cầu nạp ${formatPrice(depAmount)} qua ${depMethod}. Mã: ${depositCode}`,
      type: 'deposit',
    });
    setModal('deposit_confirm');
    loadUserData();
    addToast('Đã gửi yêu cầu nạp!', 'success');
  }

  async function handleCardDeposit() {
    if (!user) return;
    if (!cardSerial || !cardCode) { addToast('Nhập đầy đủ thông tin thẻ', 'error'); return; }
    const code = generateCode('CARD-');
    const actualAmount = Math.round(cardAmount * (1 - CARD_DISCOUNT));
    await supabase.from('card_deposits').insert({
      card_code: code,
      username: user.username,
      telco: cardTelco,
      serial: cardSerial,
      code: cardCode,
      amount: cardAmount,
      actual_amount: actualAmount,
    });
    await supabase.from('notifications').insert({
      username: user.username,
      title: 'Nạp thẻ cào',
      message: `Đã gửi thẻ ${cardTelco} ${formatPrice(cardAmount)}. Số nhận: ${formatPrice(actualAmount)}`,
      type: 'deposit',
    });
    setCardSerial(''); setCardCode('');
    setModal(null);
    loadUserData();
    addToast(`Đã gửi thẻ cào! Mã: ${code}`, 'success');
  }

  // ============== ORDER ACTIONS ==============
  async function cancelOrder(order: Order) {
    if (order.status !== 'pending') { addToast('Chỉ hủy được đơn đang chờ', 'error'); return; }
    if (!user) return;
    await supabase.from('orders').update({ status: 'cancelled', reject_reason: 'Người dùng tự hủy' }).eq('id', order.id);
    if (order.price > 0) {
      await supabase.from('users').update({
        balance: user.balance + order.price,
        total_spent: user.total_spent - order.price,
      }).eq('username', user.username);
      setUser({ ...user, balance: user.balance + order.price, total_spent: user.total_spent - order.price });
    }
    await supabase.from('notifications').insert({
      username: user.username,
      title: 'Đơn đã hủy',
      message: `Đơn ${order.order_code} đã hủy. Hoàn ${formatPrice(order.price)} vào ví.`,
      type: 'order',
    });
    loadUserData();
    addToast('Đã hủy đơn & hoàn tiền', 'success');
  }

  async function rateOrder(order: Order, rating: number, comment: string) {
    await supabase.from('orders').update({ rating }).eq('id', order.id);
    await supabase.from('reviews').insert({
      username: user!.username,
      service: order.service,
      rating,
      comment,
    });
    loadUserData();
    loadPublicData();
    addToast('Đánh giá thành công!', 'success');
  }

  // ============== TICKET ==============
  async function createTicket() {
    if (!user || !ticketSubject || !ticketMessage) { addToast('Điền đầy đủ thông tin', 'error'); return; }
    const code = generateCode('TKT-');
    await supabase.from('tickets').insert({
      ticket_code: code,
      username: user.username,
      subject: ticketSubject,
      message: ticketMessage,
    });
    setTicketSubject(''); setTicketMessage('');
    setModal(null);
    loadUserData();
    addToast(`Đã tạo ticket! Mã: ${code}`, 'success');
  }

  // ============== REVIEW ==============
  async function submitReview() {
    if (!user || !reviewService || !reviewComment) { addToast('Điền đầy đủ thông tin', 'error'); return; }
    await supabase.from('reviews').insert({
      username: user.username,
      service: reviewService,
      rating: reviewRating,
      comment: reviewComment,
    });
    setReviewService(''); setReviewComment(''); setReviewRating(5);
    setModal(null);
    loadPublicData();
    addToast('Đánh giá thành công!', 'success');
  }

  // ============== MARK NOTIFICATIONS READ ==============
  async function markNotifsRead() {
    if (!user) return;
    const unread = notifications.filter(n => !n.read);
    if (unread.length > 0) {
      await supabase.from('notifications').update({ read: true }).eq('username', user.username).eq('read', false);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    }
  }

  // ============== PWA INSTALL ==============
  async function handleInstallPWA() {
    if (deferredPrompt.current) {
      deferredPrompt.current.prompt();
      await deferredPrompt.current.userChoice;
    }
    setShowInstall(false);
  }

  // ============== ADMIN FUNCTIONS ==============
  async function loadAdminData() {
    const [o, d, cd, u, t, r, s, v, hd, lh, al, bc] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('deposits').select('*').order('created_at', { ascending: false }),
      supabase.from('card_deposits').select('*').order('created_at', { ascending: false }),
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('tickets').select('*').order('created_at', { ascending: false }),
      supabase.from('reviews').select('*').order('created_at', { ascending: false }),
      supabase.from('scripts').select('*').order('created_at', { ascending: false }),
      supabase.from('vouchers').select('*').order('created_at', { ascending: false }),
      supabase.from('hot_deals').select('*').order('created_at', { ascending: false }),
      supabase.from('login_history').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('broadcasts').select('*').order('created_at', { ascending: false }),
    ]);
    if (o.data) setAllOrders(o.data);
    if (d.data) setAllDeposits(d.data);
    if (cd.data) setAllCardDeposits(cd.data);
    if (u.data) setAllUsers(u.data as any);
    if (t.data) setAllTickets(t.data);
    if (r.data) setAllReviews(r.data);
    if (s.data) setAllScripts(s.data);
    if (v.data) setAllVouchers(v.data);
    if (hd.data) setAllHotDeals(hd.data);
    if (lh.data) setAllLoginHistory(lh.data);
    if (al.data) setAllAdminLogs(al.data);
    if (bc.data) setAllBroadcasts(bc.data);

    // Stats
    const orders = o.data || [];
    const deps = d.data || [];
    const cards = cd.data || [];
    const tickets = t.data || [];
    const users = u.data || [];
    const revenue = deps.filter((x: any) => x.status === 'completed').reduce((s: number, x: any) => s + x.amount, 0)
      + cards.filter((x: any) => x.status === 'completed').reduce((s: number, x: any) => s + x.actual_amount, 0);
    setAdminStats({
      totalOrders: orders.length,
      pendingOrders: orders.filter((x: any) => x.status === 'pending').length,
      completedOrders: orders.filter((x: any) => x.status === 'completed').length,
      pendingDeposits: deps.filter((x: any) => x.status === 'pending').length,
      pendingCards: cards.filter((x: any) => x.status === 'pending').length,
      openTickets: tickets.filter((x: any) => x.status === 'open').length,
      totalUsers: users.length,
      lockedUsers: users.filter((x: any) => x.is_locked).length,
      revenue,
    });
  }

  useEffect(() => {
    if (isAdmin && page === 'admin') {
      loadAdminData();
      const interval = setInterval(loadAdminData, 5000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, page]);

  async function adminLog(action: string, target: string, details: string) {
    await supabase.from('admin_logs').insert({ action, target, details });
  }

  async function approveDeposit(dep: Deposit) {
    await supabase.from('deposits').update({ status: 'completed' }).eq('id', dep.id);
    const { data: userData } = await supabase.from('users').select('balance, total_deposited, referred_by').eq('username', dep.username).single();
    if (userData) {
      const newBalance = userData.balance + dep.amount;
      const newTotalDep = userData.total_deposited + dep.amount;
      const newVip = getVipLevel(newTotalDep);
      await supabase.from('users').update({
        balance: newBalance,
        total_deposited: newTotalDep,
        vip_level: newVip.level,
      }).eq('username', dep.username);

      // Referral bonus on first deposit
      if (userData.referred_by && userData.total_deposited === 0) {
        const { data: referrer } = await supabase.from('users').select('username, balance').eq('referral_code', userData.referred_by).single();
        if (referrer) {
          await supabase.from('users').update({ balance: referrer.balance + 10000 }).eq('username', referrer.username);
          await supabase.from('notifications').insert({
            username: referrer.username,
            title: 'Thưởng giới thiệu',
            message: `Bạn nhận +10.000đ vì ${dep.username} đã nạp tiền lần đầu!`,
            type: 'referral',
          });
        }
      }
    }
    await supabase.from('notifications').insert({
      username: dep.username,
      title: 'Nạp tiền thành công',
      message: `+${formatPrice(dep.amount)} đã được cộng vào ví!`,
      type: 'deposit',
    });
    await adminLog('Duyệt nạp', dep.username, `${dep.deposit_code}: +${formatPrice(dep.amount)}`);
    loadAdminData();
    addToast('Đã duyệt nạp tiền!', 'success');
  }

  async function rejectDeposit(dep: Deposit) {
    await supabase.from('deposits').update({ status: 'rejected' }).eq('id', dep.id);
    await supabase.from('notifications').insert({
      username: dep.username,
      title: 'Nạp tiền bị từ chối',
      message: `Yêu cầu nạp ${formatPrice(dep.amount)} đã bị từ chối.`,
      type: 'deposit',
    });
    await adminLog('Từ chối nạp', dep.username, dep.deposit_code);
    loadAdminData();
    addToast('Đã từ chối', 'info');
  }

  async function approveCard(card: CardDeposit) {
    await supabase.from('card_deposits').update({ status: 'completed' }).eq('id', card.id);
    const { data: userData } = await supabase.from('users').select('balance, total_deposited, referred_by').eq('username', card.username).single();
    if (userData) {
      const newBalance = userData.balance + card.actual_amount;
      const newTotalDep = userData.total_deposited + card.actual_amount;
      const newVip = getVipLevel(newTotalDep);
      await supabase.from('users').update({
        balance: newBalance,
        total_deposited: newTotalDep,
        vip_level: newVip.level,
      }).eq('username', card.username);

      if (userData.referred_by && userData.total_deposited === 0) {
        const { data: referrer } = await supabase.from('users').select('username, balance').eq('referral_code', userData.referred_by).single();
        if (referrer) {
          await supabase.from('users').update({ balance: referrer.balance + 10000 }).eq('username', referrer.username);
          await supabase.from('notifications').insert({
            username: referrer.username, title: 'Thưởng giới thiệu',
            message: `Bạn nhận +10.000đ vì ${card.username} đã nạp tiền lần đầu!`, type: 'referral',
          });
        }
      }
    }
    await supabase.from('notifications').insert({
      username: card.username, title: 'Thẻ cào duyệt',
      message: `+${formatPrice(card.actual_amount)} từ thẻ ${card.telco} ${formatPrice(card.amount)}`, type: 'deposit',
    });
    await adminLog('Duyệt thẻ cào', card.username, `${card.card_code}: +${formatPrice(card.actual_amount)}`);
    loadAdminData();
    addToast('Đã duyệt thẻ cào!', 'success');
  }

  async function rejectCard(card: CardDeposit) {
    const reason = prompt('Nhập lý do từ chối:');
    if (!reason) return;
    await supabase.from('card_deposits').update({ status: 'rejected', admin_note: reason }).eq('id', card.id);
    await supabase.from('notifications').insert({
      username: card.username, title: 'Thẻ cào bị từ chối',
      message: `Thẻ ${card.telco} ${formatPrice(card.amount)} bị từ chối. Lý do: ${reason}`, type: 'deposit',
    });
    await adminLog('Từ chối thẻ', card.username, `${card.card_code}: ${reason}`);
    loadAdminData();
    addToast('Đã từ chối thẻ cào', 'info');
  }

  async function updateOrderStatus(order: Order, newStatus: string) {
    if (newStatus === 'rejected' || newStatus === 'cancelled') {
      const reason = prompt('Nhập lý do từ chối/hủy:');
      if (!reason) return;
      await supabase.from('orders').update({ status: newStatus, reject_reason: reason }).eq('id', order.id);
      // Refund
      if (order.price > 0) {
        const { data: userData } = await supabase.from('users').select('balance, total_spent').eq('username', order.username).single();
        if (userData) {
          await supabase.from('users').update({
            balance: userData.balance + order.price,
            total_spent: userData.total_spent - order.price,
          }).eq('username', order.username);
        }
      }
      await supabase.from('notifications').insert({
        username: order.username, title: 'Đơn bị từ chối',
        message: `Đơn ${order.order_code} bị từ chối. Lý do: ${reason}. Hoàn ${formatPrice(order.price)}.`,
        type: 'order',
      });
      await adminLog('Từ chối đơn', order.username, `${order.order_code}: ${reason}, hoàn ${formatPrice(order.price)}`);
    } else {
      await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
      await supabase.from('notifications').insert({
        username: order.username, title: 'Cập nhật đơn hàng',
        message: `Đơn ${order.order_code} chuyển sang: ${newStatus}`, type: 'order',
      });
      await adminLog('Cập nhật đơn', order.username, `${order.order_code}: ${newStatus}`);
    }
    loadAdminData();
    addToast('Đã cập nhật đơn!', 'success');
  }

  async function updateOrderProgress(order: Order, progress: number) {
    await supabase.from('orders').update({ progress }).eq('id', order.id);
    loadAdminData();
  }

  async function updateOrderDownload(order: Order, link: string) {
    await supabase.from('orders').update({ download_link: link }).eq('id', order.id);
    loadAdminData();
  }

  async function adminReplyTicket(ticket: Ticket) {
    const reply = prompt('Nhập câu trả lời:');
    if (!reply) return;
    await supabase.from('tickets').update({ admin_reply: reply, status: 'answered' }).eq('id', ticket.id);
    await supabase.from('notifications').insert({
      username: ticket.username, title: 'Ticket đã trả lời',
      message: `Ticket ${ticket.ticket_code}: ${reply}`, type: 'ticket',
    });
    await adminLog('Trả lời ticket', ticket.username, ticket.ticket_code);
    loadAdminData();
    addToast('Đã trả lời ticket!', 'success');
  }

  async function adminModifyBalance(u: User) {
    const input = prompt(`Cộng/trừ/đặt tiền cho ${u.username}.\nNhập số dương để cộng, âm để trừ, =xxx để đặt:`);
    if (!input) return;
    let newBalance = u.balance;
    if (input.startsWith('=')) {
      newBalance = parseInt(input.substring(1));
    } else {
      newBalance = u.balance + parseInt(input);
    }
    if (isNaN(newBalance)) { addToast('Số không hợp lệ', 'error'); return; }
    await supabase.from('users').update({ balance: Math.max(0, newBalance) }).eq('id', u.id);
    await supabase.from('notifications').insert({
      username: u.username, title: 'Cập nhật số dư',
      message: `Số dư mới: ${formatPrice(Math.max(0, newBalance))}`, type: 'balance',
    });
    await adminLog('Sửa số dư', u.username, `${formatPrice(u.balance)} → ${formatPrice(Math.max(0, newBalance))}`);
    loadAdminData();
    addToast('Đã cập nhật số dư!', 'success');
  }

  async function adminResetPassword(u: User) {
    const newPw = prompt(`Nhập mật khẩu mới cho ${u.username}:`);
    if (!newPw || newPw.length < 6) { addToast('Mật khẩu >= 6 ký tự', 'error'); return; }
    await supabase.from('users').update({ password: newPw }).eq('id', u.id);
    await supabase.from('notifications').insert({
      username: u.username, title: 'Reset mật khẩu',
      message: 'Mật khẩu đã được reset bởi Admin.', type: 'info',
    });
    await adminLog('Reset MK', u.username, '');
    loadAdminData();
    addToast('Đã reset mật khẩu!', 'success');
  }

  async function adminToggleLock(u: User) {
    const newLocked = !u.is_locked;
    await supabase.from('users').update({ is_locked: newLocked }).eq('id', u.id);
    await supabase.from('notifications').insert({
      username: u.username, title: newLocked ? 'Tài khoản bị khóa' : 'Tài khoản đã mở',
      message: newLocked ? 'Tài khoản của bạn đã bị khóa.' : 'Tài khoản đã được mở khóa.', type: 'info',
    });
    await adminLog(newLocked ? 'Khóa user' : 'Mở khóa user', u.username, '');
    loadAdminData();
    addToast(newLocked ? 'Đã khóa tài khoản' : 'Đã mở khóa', 'success');
  }

  async function adminDeleteUser(u: User) {
    if (!confirm(`Xóa user ${u.username}?`)) return;
    await supabase.from('users').delete().eq('id', u.id);
    await adminLog('Xóa user', u.username, '');
    loadAdminData();
    addToast('Đã xóa user!', 'success');
  }

  async function adminAddScript() {
    if (!newScriptName || !newScriptGame || !newScriptPrice) return;
    await supabase.from('scripts').insert({ name: newScriptName, game: newScriptGame, price: parseInt(newScriptPrice) });
    setNewScriptName(''); setNewScriptGame(''); setNewScriptPrice('');
    await adminLog('Thêm script', newScriptName, '');
    loadAdminData();
    loadPublicData();
    addToast('Đã thêm script!', 'success');
  }

  async function adminToggleScript(s: Script) {
    await supabase.from('scripts').update({ active: !s.active }).eq('id', s.id);
    loadAdminData();
    loadPublicData();
  }

  async function adminDeleteScript(s: Script) {
    await supabase.from('scripts').delete().eq('id', s.id);
    loadAdminData();
    loadPublicData();
    addToast('Đã xóa script!', 'success');
  }

  async function adminAddDeal() {
    if (!newDealName || !newDealPrice || !newDealDiscount) return;
    await supabase.from('hot_deals').insert({
      product_name: newDealName, original_price: parseInt(newDealPrice),
      discount_percent: parseInt(newDealDiscount), description: newDealDesc,
    });
    setNewDealName(''); setNewDealPrice(''); setNewDealDiscount(''); setNewDealDesc('');
    loadAdminData();
    loadPublicData();
    addToast('Đã thêm deal!', 'success');
  }

  async function adminToggleDeal(d: HotDeal) {
    await supabase.from('hot_deals').update({ active: !d.active }).eq('id', d.id);
    loadAdminData();
    loadPublicData();
  }

  async function adminDeleteDeal(d: HotDeal) {
    await supabase.from('hot_deals').delete().eq('id', d.id);
    loadAdminData();
    loadPublicData();
    addToast('Đã xóa deal!', 'success');
  }

  async function adminAddVoucher() {
    if (!newVoucherCode || !newVoucherDiscount || !newVoucherMaxUses) return;
    await supabase.from('vouchers').insert({
      code: newVoucherCode.toUpperCase(),
      discount_percent: parseInt(newVoucherDiscount),
      max_uses: parseInt(newVoucherMaxUses),
    });
    setNewVoucherCode(''); setNewVoucherDiscount(''); setNewVoucherMaxUses('');
    loadAdminData();
    addToast('Đã tạo voucher!', 'success');
  }

  async function adminToggleVoucher(v: Voucher) {
    await supabase.from('vouchers').update({ active: !v.active }).eq('id', v.id);
    loadAdminData();
  }

  async function adminDeleteVoucher(v: Voucher) {
    await supabase.from('vouchers').delete().eq('id', v.id);
    loadAdminData();
    addToast('Đã xóa voucher!', 'success');
  }

  async function adminDeleteReview(r: Review) {
    await supabase.from('reviews').delete().eq('id', r.id);
    loadAdminData();
    loadPublicData();
    addToast('Đã xóa đánh giá!', 'success');
  }

  async function adminBroadcast() {
    if (!broadcastTitle || !broadcastMessage) return;
    // Get all users
    const { data: users } = await supabase.from('users').select('username');
    if (users) {
      const notifs = users.map((u: any) => ({
        username: u.username,
        title: broadcastTitle,
        message: broadcastMessage,
        type: 'broadcast',
      }));
      if (notifs.length > 0) await supabase.from('notifications').insert(notifs);
    }
    await supabase.from('broadcasts').insert({ title: broadcastTitle, message: broadcastMessage });
    await adminLog('Broadcast', '', broadcastTitle);
    setBroadcastTitle(''); setBroadcastMessage('');
    loadAdminData();
    addToast('Đã gửi broadcast!', 'success');
  }

  async function adminBackup() {
    const tables = ['users', 'orders', 'deposits', 'card_deposits', 'scripts', 'hot_deals', 'vouchers', 'reviews', 'tickets', 'notifications'];
    const backup: Record<string, any> = {};
    for (const table of tables) {
      const { data } = await supabase.from(table).select('*');
      backup[table] = data || [];
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knox-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    await adminLog('Backup', '', 'Full database backup');
    addToast('Backup đã tải xuống!', 'success');
  }

  async function adminExportExcel() {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      const wsOrders = XLSX.utils.json_to_sheet(allOrders);
      XLSX.utils.book_append_sheet(wb, wsOrders, 'Orders');
      const wsDeposits = XLSX.utils.json_to_sheet(allDeposits);
      XLSX.utils.book_append_sheet(wb, wsDeposits, 'Deposits');
      XLSX.writeFile(wb, `knox-orders-${new Date().toISOString().split('T')[0]}.xlsx`);
      await adminLog('Export Excel', '', 'Orders + Deposits');
      addToast('Đã xuất Excel!', 'success');
    } catch (e) {
      addToast('Lỗi xuất Excel', 'error');
    }
  }

  // Chart rendering
  useEffect(() => {
    if (adminTab !== 'dashboard' || !chartRef.current || !isAdmin) return;
    renderChart();
  }, [adminTab, chartPeriod, allDeposits, isAdmin]);

  async function renderChart() {
    if (!chartRef.current) return;
    const Chart = (await import('chart.js/auto')).default;
    if (chartInstance.current) chartInstance.current.destroy();

    const completedDeps = allDeposits.filter(d => d.status === 'completed');
    const now = new Date();
    let labels: string[] = [];
    let data: number[] = [];

    if (chartPeriod === '7d') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        labels.push(d.getDate() + '/' + (d.getMonth() + 1));
        data.push(completedDeps.filter(dep => dep.created_at.startsWith(key)).reduce((s, dep) => s + dep.amount, 0));
      }
    } else if (chartPeriod === '30d') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        labels.push(d.getDate() + '');
        data.push(completedDeps.filter(dep => dep.created_at.startsWith(key)).reduce((s, dep) => s + dep.amount, 0));
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        labels.push(`T${d.getMonth() + 1}`);
        data.push(completedDeps.filter(dep => dep.created_at.startsWith(key)).reduce((s, dep) => s + dep.amount, 0));
      }
    }

    chartInstance.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Doanh thu',
          data,
          borderColor: '#00ffd5',
          backgroundColor: 'rgba(0,255,213,0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#00ffd5',
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#e0e0e0' } } },
        scales: {
          x: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#888', callback: (v: any) => formatPrice(v) }, grid: { color: 'rgba(255,255,255,0.05)' } },
        },
      },
    });
  }

  // ============== COMPUTED VALUES ==============
  const vipInfo = user ? getVipLevel(user.total_deposited) : VIP_LEVELS[0];
  const nextVip = user ? getNextVipLevel(user.total_deposited) : VIP_LEVELS[1];
  const allServiceOptions = useMemo(() => {
    const opts = [...SERVICES];
    scripts.forEach(s => {
      opts.push({ id: s.name, name: `${s.name} - ${s.game}`, price: s.price, game: s.game });
    });
    return opts;
  }, [scripts]);

  const selectedServicePrice = useMemo(() => {
    if (!buyService) return 0;
    const svc = allServiceOptions.find(s => s.id === buyService);
    return svc?.price || 0;
  }, [buyService, allServiceOptions]);

  const finalBuyPrice = useMemo(() => {
    let p = selectedServicePrice;
    if (user && vipInfo.discount > 0) p = Math.round(p * (1 - vipInfo.discount / 100));
    if (voucherApplied && voucherDiscount > 0) p = Math.round(p * (1 - voucherDiscount / 100));
    return p;
  }, [selectedServicePrice, vipInfo, voucherApplied, voucherDiscount, user]);

  // ============== RENDER ==============
  if (page === 'admin' && isAdmin) {
    return (
      <div className="min-h-screen bg-space-black relative">
        <GalaxyBg />
        <ToastContainer />
        {/* Admin Navbar */}
        <nav className="sticky top-0 z-40 backdrop-blur-lg bg-space-black/80 border-b border-cyan-500/10">
          <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="font-heading text-lg holo-text cursor-pointer" onClick={() => { setPage('home'); }}>
              ⚡ KNOX Admin
            </h1>
            <div className="flex items-center gap-2">
              <button onClick={adminBackup} className="text-xs px-3 py-1.5 bg-cyan-900/30 text-cyan-300 rounded-lg hover:bg-cyan-800/40">
                💾 Backup
              </button>
              <button onClick={adminExportExcel} className="text-xs px-3 py-1.5 bg-purple-900/30 text-purple-300 rounded-lg hover:bg-purple-800/40">
                📊 Excel
              </button>
              <button onClick={handleLogout} className="text-xs px-3 py-1.5 bg-red-900/30 text-red-300 rounded-lg hover:bg-red-800/40">
                🚪 Logout
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-[1400px] mx-auto px-4 py-4 relative z-10">
          {/* Admin Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Tổng đơn', value: adminStats.totalOrders, icon: '📦', color: 'cyan' },
              { label: 'Đơn chờ', value: adminStats.pendingOrders, icon: '⏳', color: 'yellow' },
              { label: 'Hoàn thành', value: adminStats.completedOrders, icon: '✅', color: 'green' },
              { label: 'Nạp chờ', value: adminStats.pendingDeposits, icon: '💰', color: 'orange' },
              { label: 'Thẻ chờ', value: adminStats.pendingCards, icon: '💳', color: 'pink' },
              { label: 'Ticket mở', value: adminStats.openTickets, icon: '🎫', color: 'purple' },
              { label: `Users (${adminStats.lockedUsers} khóa)`, value: adminStats.totalUsers, icon: '👥', color: 'blue' },
              { label: 'Doanh thu', value: formatPrice(adminStats.revenue), icon: '💎', color: 'cyan' },
            ].map((s, i) => (
              <div key={i} className="cyber-card p-3">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-xs text-white/50 mb-1">{s.label}</div>
                <div className="font-heading text-lg text-cyber-teal">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Admin Tabs */}
          <div className="flex flex-wrap gap-1 mb-4 overflow-x-auto pb-2">
            {[
              { id: 'dashboard', label: '📊 Dashboard' },
              { id: 'orders', label: '📦 Đơn hàng', badge: adminStats.pendingOrders },
              { id: 'deposits', label: '💰 Nạp tiền', badge: adminStats.pendingDeposits },
              { id: 'cards', label: '💳 Thẻ cào', badge: adminStats.pendingCards },
              { id: 'tickets', label: '🎫 Tickets', badge: adminStats.openTickets },
              { id: 'users', label: '👥 Users' },
              { id: 'scripts', label: '💻 Scripts' },
              { id: 'deals', label: '🔥 Hot Deals' },
              { id: 'vouchers', label: '🎁 Vouchers' },
              { id: 'reviews', label: '⭐ Reviews' },
              { id: 'broadcast', label: '📢 Broadcast' },
              { id: 'loginHistory', label: '📋 Login Log' },
              { id: 'adminLogs', label: '🔒 Admin Log' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setAdminTab(tab.id)}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  adminTab === tab.id ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30' : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}>
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{tab.badge}</span>
                )}
              </button>
            ))}
          </div>

          {/* Admin Content */}
          <div className="cyber-card p-4">
            {adminTab === 'dashboard' && (
              <div>
                <div className="flex gap-2 mb-4">
                  {(['7d','30d','12m'] as const).map(p => (
                    <button key={p} onClick={() => setChartPeriod(p)}
                      className={`px-3 py-1 rounded text-sm ${chartPeriod === p ? 'bg-cyber-teal/20 text-cyber-teal' : 'bg-white/5 text-white/50'}`}>
                      {p === '7d' ? '7 ngày' : p === '30d' ? '30 ngày' : '12 tháng'}
                    </button>
                  ))}
                </div>
                <canvas ref={chartRef} className="w-full" style={{maxHeight: 300}} />
              </div>
            )}

            {adminTab === 'orders' && (
              <div>
                <input className="cyber-input mb-3" placeholder="Tìm kiếm..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} />
                <div className="overflow-x-auto">
                  <table className="admin-table">
                    <thead><tr>
                      <th>Mã</th><th>KH</th><th>Dịch vụ</th><th>Giá</th><th>Game</th><th>Tiến độ</th><th>Link</th><th>Thời gian</th><th>Trạng thái</th><th>Hành động</th>
                    </tr></thead>
                    <tbody>
                      {allOrders.filter(o => !adminSearch || JSON.stringify(o).toLowerCase().includes(adminSearch.toLowerCase())).map(o => (
                        <tr key={o.id}>
                          <td className="font-mono text-xs text-cyber-teal">{o.order_code}</td>
                          <td>{o.username}</td>
                          <td className="max-w-[120px] truncate">{o.service}</td>
                          <td>{formatPrice(o.price)}</td>
                          <td>
                            <div className="text-xs">
                              <span className="text-white/60">U:</span> {o.game_username} <CopyBtn text={o.game_username} />
                              <br /><span className="text-white/60">P:</span> {o.game_password} <CopyBtn text={o.game_password} />
                            </div>
                          </td>
                          <td>
                            <input type="number" min="0" max="100" value={o.progress}
                              onChange={e => updateOrderProgress(o, parseInt(e.target.value) || 0)}
                              className="cyber-input w-16 text-xs p-1" />
                          </td>
                          <td>
                            <input type="text" placeholder="Link..." value={o.download_link}
                              onChange={e => updateOrderDownload(o, e.target.value)}
                              className="cyber-input w-24 text-xs p-1" />
                          </td>
                          <td className="text-xs text-white/50">{new Date(o.created_at).toLocaleString('vi')}</td>
                          <td><StatusBadge status={o.status} /></td>
                          <td>
                            <select className="cyber-input text-xs p-1" value={o.status}
                              onChange={e => updateOrderStatus(o, e.target.value)}>
                              <option value="pending">Chờ</option>
                              <option value="processing">Đang xử lý</option>
                              <option value="completed">Hoàn thành</option>
                              <option value="rejected">Từ chối</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {adminTab === 'deposits' && (
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead><tr><th>Mã</th><th>KH</th><th>Số tiền</th><th>PT</th><th>Nội dung CK</th><th>Thời gian</th><th>TT</th><th>Hành động</th></tr></thead>
                  <tbody>
                    {allDeposits.map(d => (
                      <tr key={d.id}>
                        <td className="font-mono text-xs text-cyber-teal">{d.deposit_code}</td>
                        <td>{d.username}</td>
                        <td className="text-cyber-teal font-semibold">{formatPrice(d.amount)}</td>
                        <td>{d.method}</td>
                        <td className="font-mono text-yellow-300">{d.note} <CopyBtn text={d.note} /></td>
                        <td className="text-xs text-white/50">{new Date(d.created_at).toLocaleString('vi')}</td>
                        <td><StatusBadge status={d.status} /></td>
                        <td>
                          {d.status === 'pending' && (
                            <div className="flex gap-1">
                              <button onClick={() => approveDeposit(d)} className="px-2 py-1 bg-green-900/40 text-green-300 rounded text-xs hover:bg-green-800/50">✅</button>
                              <button onClick={() => rejectDeposit(d)} className="px-2 py-1 bg-red-900/40 text-red-300 rounded text-xs hover:bg-red-800/50">❌</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {adminTab === 'cards' && (
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead><tr><th>Mã</th><th>KH</th><th>NM</th><th>Mệnh giá</th><th>Seri</th><th>Mã thẻ</th><th>Nhận</th><th>Thời gian</th><th>TT</th><th>Hành động</th></tr></thead>
                  <tbody>
                    {allCardDeposits.map(c => (
                      <tr key={c.id}>
                        <td className="font-mono text-xs text-cyber-teal">{c.card_code}</td>
                        <td>{c.username}</td>
                        <td>{c.telco}</td>
                        <td>{formatPrice(c.amount)}</td>
                        <td className="font-mono text-xs">{c.serial} <CopyBtn text={c.serial} /></td>
                        <td className="font-mono text-xs">{c.code} <CopyBtn text={c.code} /></td>
                        <td className="text-cyber-teal">{formatPrice(c.actual_amount)}</td>
                        <td className="text-xs text-white/50">{new Date(c.created_at).toLocaleString('vi')}</td>
                        <td><StatusBadge status={c.status} /></td>
                        <td>
                          {c.status === 'pending' && (
                            <div className="flex gap-1">
                              <button onClick={() => approveCard(c)} className="px-2 py-1 bg-green-900/40 text-green-300 rounded text-xs">✅</button>
                              <button onClick={() => rejectCard(c)} className="px-2 py-1 bg-red-900/40 text-red-300 rounded text-xs">❌</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {adminTab === 'tickets' && (
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead><tr><th>Mã</th><th>KH</th><th>Tiêu đề</th><th>Nội dung</th><th>Trả lời</th><th>TT</th><th>Hành động</th></tr></thead>
                  <tbody>
                    {allTickets.map(t => (
                      <tr key={t.id}>
                        <td className="font-mono text-xs text-cyber-teal">{t.ticket_code}</td>
                        <td>{t.username}</td>
                        <td>{t.subject}</td>
                        <td className="max-w-[200px] truncate">{t.message}</td>
                        <td className="max-w-[200px] truncate text-purple-300">{t.admin_reply || '-'}</td>
                        <td><StatusBadge status={t.status} /></td>
                        <td>
                          {t.status !== 'closed' && (
                            <button onClick={() => adminReplyTicket(t)} className="px-2 py-1 bg-purple-900/40 text-purple-300 rounded text-xs">💬 Trả lời</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {adminTab === 'users' && (
              <div>
                <input className="cyber-input mb-3" placeholder="Tìm user..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} />
                <div className="overflow-x-auto">
                  <table className="admin-table">
                    <thead><tr><th>ID</th><th>User</th><th>Email</th><th>Số dư</th><th>Đã nạp</th><th>Đã chi</th><th>MK</th><th>Login</th><th>Hành động</th></tr></thead>
                    <tbody>
                      {allUsers.filter(u => !adminSearch || JSON.stringify(u).toLowerCase().includes(adminSearch.toLowerCase())).map(u => (
                        <tr key={u.id}>
                          <td>{u.id}</td>
                          <td>
                            <span className={u.is_locked ? 'text-red-400 line-through' : ''}>{u.username}</span>
                          </td>
                          <td className="text-xs">{u.email}</td>
                          <td className="text-cyber-teal">{formatPrice(u.balance)}</td>
                          <td>{formatPrice(u.total_deposited)}</td>
                          <td>{formatPrice(u.total_spent)}</td>
                          <td><code className="text-xs bg-black/30 px-1 rounded">{(u as any).password}</code></td>
                          <td className="text-xs text-white/50">{(u as any).last_ip}<br/>{(u as any).last_login ? new Date((u as any).last_login).toLocaleString('vi') : '-'}</td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              <button onClick={() => adminModifyBalance(u)} className="px-1.5 py-0.5 bg-cyan-900/40 text-cyan-300 rounded text-[10px]">💰</button>
                              <button onClick={() => adminResetPassword(u)} className="px-1.5 py-0.5 bg-yellow-900/40 text-yellow-300 rounded text-[10px]">🔑</button>
                              <button onClick={() => adminToggleLock(u)} className="px-1.5 py-0.5 bg-orange-900/40 text-orange-300 rounded text-[10px]">{u.is_locked ? '🔓' : '🔒'}</button>
                              <button onClick={() => adminDeleteUser(u)} className="px-1.5 py-0.5 bg-red-900/40 text-red-300 rounded text-[10px]">🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {adminTab === 'scripts' && (
              <div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <input className="cyber-input" placeholder="Tên script" value={newScriptName} onChange={e => setNewScriptName(e.target.value)} />
                  <input className="cyber-input" placeholder="Game" value={newScriptGame} onChange={e => setNewScriptGame(e.target.value)} />
                  <div className="flex gap-2">
                    <input className="cyber-input" placeholder="Giá" type="number" value={newScriptPrice} onChange={e => setNewScriptPrice(e.target.value)} />
                    <button onClick={adminAddScript} className="holo-btn px-4 text-sm whitespace-nowrap">+ Thêm</button>
                  </div>
                </div>
                <table className="admin-table">
                  <thead><tr><th>Tên</th><th>Game</th><th>Giá</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
                  <tbody>
                    {allScripts.map(s => (
                      <tr key={s.id}>
                        <td>{s.name}</td><td>{s.game}</td><td>{formatPrice(s.price)}</td>
                        <td>{s.active ? '🟢 Active' : '🔴 Paused'}</td>
                        <td>
                          <div className="flex gap-1">
                            <button onClick={() => adminToggleScript(s)} className="px-2 py-1 bg-yellow-900/40 text-yellow-300 rounded text-xs">{s.active ? '⏸️' : '▶️'}</button>
                            <button onClick={() => adminDeleteScript(s)} className="px-2 py-1 bg-red-900/40 text-red-300 rounded text-xs">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {adminTab === 'deals' && (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  <input className="cyber-input" placeholder="Tên SP" value={newDealName} onChange={e => setNewDealName(e.target.value)} />
                  <input className="cyber-input" placeholder="Giá gốc" type="number" value={newDealPrice} onChange={e => setNewDealPrice(e.target.value)} />
                  <input className="cyber-input" placeholder="% giảm" type="number" value={newDealDiscount} onChange={e => setNewDealDiscount(e.target.value)} />
                  <div className="flex gap-2">
                    <input className="cyber-input" placeholder="Mô tả" value={newDealDesc} onChange={e => setNewDealDesc(e.target.value)} />
                    <button onClick={adminAddDeal} className="holo-btn px-4 text-sm whitespace-nowrap">+</button>
                  </div>
                </div>
                <table className="admin-table">
                  <thead><tr><th>Sản phẩm</th><th>Giá gốc</th><th>Giảm</th><th>Mô tả</th><th>TT</th><th>Hành động</th></tr></thead>
                  <tbody>
                    {allHotDeals.map(d => (
                      <tr key={d.id}>
                        <td>{d.product_name}</td><td>{formatPrice(d.original_price)}</td>
                        <td className="text-red-400">-{d.discount_percent}%</td><td>{d.description}</td>
                        <td>{d.active ? '🟢' : '🔴'}</td>
                        <td>
                          <div className="flex gap-1">
                            <button onClick={() => adminToggleDeal(d)} className="px-2 py-1 bg-yellow-900/40 text-yellow-300 rounded text-xs">{d.active ? '⏸️' : '▶️'}</button>
                            <button onClick={() => adminDeleteDeal(d)} className="px-2 py-1 bg-red-900/40 text-red-300 rounded text-xs">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {adminTab === 'vouchers' && (
              <div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <input className="cyber-input" placeholder="Code (VD: SALE50)" value={newVoucherCode} onChange={e => setNewVoucherCode(e.target.value)} />
                  <input className="cyber-input" placeholder="% giảm" type="number" value={newVoucherDiscount} onChange={e => setNewVoucherDiscount(e.target.value)} />
                  <div className="flex gap-2">
                    <input className="cyber-input" placeholder="Số lượt" type="number" value={newVoucherMaxUses} onChange={e => setNewVoucherMaxUses(e.target.value)} />
                    <button onClick={adminAddVoucher} className="holo-btn px-4 text-sm whitespace-nowrap">+</button>
                  </div>
                </div>
                <table className="admin-table">
                  <thead><tr><th>Code</th><th>Giảm</th><th>Đã dùng/Max</th><th>TT</th><th>Hành động</th></tr></thead>
                  <tbody>
                    {allVouchers.map(v => (
                      <tr key={v.id}>
                        <td className="font-mono text-cyber-teal">{v.code}</td><td>-{v.discount_percent}%</td>
                        <td>{v.used_count}/{v.max_uses}</td><td>{v.active ? '🟢' : '🔴'}</td>
                        <td>
                          <div className="flex gap-1">
                            <button onClick={() => adminToggleVoucher(v)} className="px-2 py-1 bg-yellow-900/40 text-yellow-300 rounded text-xs">{v.active ? '⏸️' : '▶️'}</button>
                            <button onClick={() => adminDeleteVoucher(v)} className="px-2 py-1 bg-red-900/40 text-red-300 rounded text-xs">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {adminTab === 'reviews' && (
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead><tr><th>User</th><th>Sản phẩm</th><th>Sao</th><th>Bình luận</th><th>Ngày</th><th>Xóa</th></tr></thead>
                  <tbody>
                    {allReviews.map(r => (
                      <tr key={r.id}>
                        <td>{r.username}</td><td>{r.service}</td>
                        <td><StarRating value={r.rating} readonly /></td>
                        <td>{r.comment}</td>
                        <td className="text-xs text-white/50">{new Date(r.created_at).toLocaleDateString('vi')}</td>
                        <td><button onClick={() => adminDeleteReview(r)} className="px-2 py-1 bg-red-900/40 text-red-300 rounded text-xs">🗑️</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {adminTab === 'broadcast' && (
              <div>
                <div className="space-y-3 mb-4">
                  <input className="cyber-input" placeholder="Tiêu đề thông báo" value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} />
                  <textarea className="cyber-input" rows={3} placeholder="Nội dung thông báo" value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} />
                  <button onClick={adminBroadcast} className="holo-btn px-6 py-2 text-sm">📢 Gửi cho tất cả</button>
                </div>
                <h4 className="font-heading text-sm text-white/60 mb-2">Lịch sử Broadcast</h4>
                <table className="admin-table">
                  <thead><tr><th>Tiêu đề</th><th>Nội dung</th><th>Thời gian</th></tr></thead>
                  <tbody>
                    {allBroadcasts.map(b => (
                      <tr key={b.id}>
                        <td>{b.title}</td><td>{b.message}</td>
                        <td className="text-xs text-white/50">{new Date(b.created_at).toLocaleString('vi')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {adminTab === 'loginHistory' && (
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead><tr><th>User</th><th>IP</th><th>Thiết bị</th><th>Browser</th><th>Thời gian</th><th>KQ</th></tr></thead>
                  <tbody>
                    {allLoginHistory.map(l => (
                      <tr key={l.id}>
                        <td>{l.username}</td><td className="font-mono text-xs">{l.ip}</td>
                        <td>{l.device}</td><td>{l.browser}</td>
                        <td className="text-xs text-white/50">{new Date(l.created_at).toLocaleString('vi')}</td>
                        <td>{l.success ? '✅' : '❌'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {adminTab === 'adminLogs' && (
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead><tr><th>Hành động</th><th>Đối tượng</th><th>Chi tiết</th><th>Thời gian</th></tr></thead>
                  <tbody>
                    {allAdminLogs.map(l => (
                      <tr key={l.id}>
                        <td className="text-cyber-teal">{l.action}</td><td>{l.target}</td><td>{l.details}</td>
                        <td className="text-xs text-white/50">{new Date(l.created_at).toLocaleString('vi')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============== USER PAGE ==============
  return (
    <div className="min-h-screen bg-space-black relative">
      <GalaxyBg />
      <ToastContainer />

      {/* Navbar */}
      <nav className="sticky top-0 z-40 backdrop-blur-lg bg-space-black/80 border-b border-cyan-500/10">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-heading text-xl holo-text font-bold cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
            ⚡ KNOX
          </h1>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-4">
            <a href="#products" className="text-white/70 hover:text-cyber-teal text-sm font-medium transition-colors">{t('products')}</a>
            <a href="#hot-deals" className="text-white/70 hover:text-cyber-teal text-sm font-medium transition-colors">{t('hotDeals')}</a>
            <a href="#top-depositors" className="text-white/70 hover:text-cyber-teal text-sm font-medium transition-colors">{t('topUp')}</a>
            <a href="#reviews" className="text-white/70 hover:text-cyber-teal text-sm font-medium transition-colors">{t('reviews')}</a>
          </div>

          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
              className="text-xs px-2 py-1 bg-white/5 rounded-lg text-white/60 hover:text-white">
              {lang === 'vi' ? '🇬🇧 EN' : '🇻🇳 VI'}
            </button>

            {/* Notification bell */}
            {user && (
              <button className="relative p-2 text-white/60 hover:text-white" onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markNotifsRead(); }}>
                🔔
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </button>
            )}

            {/* Desktop user info */}
            {user && !isAdmin && (
              <div className="hidden md:flex items-center gap-2">
                <span className={`font-heading text-sm text-cyber-teal ${balancePulse ? 'balance-pulse' : ''}`}>
                  {formatPrice(user.balance)}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${vipInfo.level === 'VIP 4' ? 'vip4-badge bg-gradient-to-r from-yellow-600 to-pink-600 text-white' : 'bg-cyan-900/30 text-cyan-300'}`}>
                  {vipInfo.level}
                </span>
              </div>
            )}

            {isAdmin && (
              <button onClick={() => { setPage('admin'); }} className="holo-btn px-3 py-1.5 text-xs">
                🛡️ Admin
              </button>
            )}

            {!user && !isAdmin && (
              <button onClick={() => { setAuthMode('login'); setModal('auth'); }} className="holo-btn px-4 py-1.5 text-sm">
                {t('login')}
              </button>
            )}

            {/* Hamburger */}
            <button className="md:hidden p-2 text-white/70" onClick={() => { setMenuOpen(!menuOpen); if (!menuOpen) document.body.classList.add('menu-open'); else document.body.classList.remove('menu-open'); }}>
              {menuOpen ? '✕' : '☰'}
            </button>

            {/* Desktop user menu */}
            {user && (
              <div className="hidden md:block relative group">
                <button className="text-sm text-white/70 hover:text-white flex items-center gap-1">
                  👤 {user.username} ▾
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 cyber-card p-2 hidden group-hover:block">
                  <button onClick={() => setModal('dashboard')} className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-cyber-teal hover:bg-white/5 rounded">📊 Dashboard</button>
                  <button onClick={() => setModal('deposit')} className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-cyber-teal hover:bg-white/5 rounded">💰 Nạp tiền</button>
                  <button onClick={() => setModal('buy')} className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-cyber-teal hover:bg-white/5 rounded">🛒 Mua hàng</button>
                  <button onClick={() => setModal('history')} className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-cyber-teal hover:bg-white/5 rounded">📋 Lịch sử</button>
                  <button onClick={() => setModal('ticket')} className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-cyber-teal hover:bg-white/5 rounded">🎫 Hỗ trợ</button>
                  <button onClick={() => setModal('referral')} className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-cyber-teal hover:bg-white/5 rounded">👥 Giới thiệu</button>
                  <button onClick={() => setModal('changePw')} className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-cyber-teal hover:bg-white/5 rounded">🔑 Đổi MK</button>
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-white/5 rounded">🚪 Đăng xuất</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden hamburger-menu bg-space-dark border-t border-cyan-500/10 px-4 py-4">
            {user && (
              <div className="mb-4 p-3 cyber-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white">👤 {user.username}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${vipInfo.level === 'VIP 4' ? 'vip4-badge bg-gradient-to-r from-yellow-600 to-pink-600 text-white' : 'bg-cyan-900/30 text-cyan-300'}`}>
                    {vipInfo.level}
                  </span>
                </div>
                <div className={`font-heading text-lg text-cyber-teal mb-2 ${balancePulse ? 'balance-pulse' : ''}`}>
                  💎 {formatPrice(user.balance)}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setModal('deposit'); setMenuOpen(false); document.body.classList.remove('menu-open'); }} className="holo-btn py-2 text-xs rounded-lg">💰 Nạp tiền</button>
                  <button onClick={() => { setModal('buy'); setMenuOpen(false); document.body.classList.remove('menu-open'); }} className="holo-btn py-2 text-xs rounded-lg">🛒 Mua hàng</button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <a href="#products" onClick={() => { setMenuOpen(false); document.body.classList.remove('menu-open'); }} className="block px-3 py-2 text-white/70 hover:text-cyber-teal rounded-lg hover:bg-white/5">🎮 {t('products')}</a>
              <a href="#hot-deals" onClick={() => { setMenuOpen(false); document.body.classList.remove('menu-open'); }} className="block px-3 py-2 text-white/70 hover:text-cyber-teal rounded-lg hover:bg-white/5">🔥 {t('hotDeals')}</a>
              <a href="#top-depositors" onClick={() => { setMenuOpen(false); document.body.classList.remove('menu-open'); }} className="block px-3 py-2 text-white/70 hover:text-cyber-teal rounded-lg hover:bg-white/5">🏆 {t('topUp')}</a>
              <a href="#reviews" onClick={() => { setMenuOpen(false); document.body.classList.remove('menu-open'); }} className="block px-3 py-2 text-white/70 hover:text-cyber-teal rounded-lg hover:bg-white/5">⭐ {t('reviews')}</a>

              {user && (
                <>
                  <hr className="border-white/10 my-2" />
                  <button onClick={() => { setModal('dashboard'); setMenuOpen(false); document.body.classList.remove('menu-open'); }} className="w-full text-left px-3 py-2 text-white/70 hover:text-cyber-teal rounded-lg hover:bg-white/5">📊 Dashboard</button>
                  <button onClick={() => { setModal('history'); setMenuOpen(false); document.body.classList.remove('menu-open'); }} className="w-full text-left px-3 py-2 text-white/70 hover:text-cyber-teal rounded-lg hover:bg-white/5">📋 {t('history')}</button>
                  <button onClick={() => { setModal('ticket'); setMenuOpen(false); document.body.classList.remove('menu-open'); }} className="w-full text-left px-3 py-2 text-white/70 hover:text-cyber-teal rounded-lg hover:bg-white/5">🎫 {t('support')}</button>
                  <button onClick={() => { setModal('referral'); setMenuOpen(false); document.body.classList.remove('menu-open'); }} className="w-full text-left px-3 py-2 text-white/70 hover:text-cyber-teal rounded-lg hover:bg-white/5">👥 {t('referral')}</button>
                  <button onClick={() => { setModal('changePw'); setMenuOpen(false); document.body.classList.remove('menu-open'); }} className="w-full text-left px-3 py-2 text-white/70 hover:text-cyber-teal rounded-lg hover:bg-white/5">🔑 {t('changePassword')}</button>
                  <button onClick={() => { handleLogout(); setMenuOpen(false); document.body.classList.remove('menu-open'); }} className="w-full text-left px-3 py-2 text-red-400 rounded-lg hover:bg-white/5">🚪 {t('logout')}</button>
                </>
              )}

              {!user && (
                <>
                  <hr className="border-white/10 my-2" />
                  <button onClick={() => { setAuthMode('login'); setModal('auth'); setMenuOpen(false); document.body.classList.remove('menu-open'); }} className="w-full text-left px-3 py-2 text-cyber-teal rounded-lg hover:bg-white/5">🔑 {t('login')}</button>
                  <button onClick={() => { setAuthMode('register'); setModal('auth'); setMenuOpen(false); document.body.classList.remove('menu-open'); }} className="w-full text-left px-3 py-2 text-cyber-teal rounded-lg hover:bg-white/5">📝 {t('register')}</button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Notification Panel */}
      {showNotifs && user && (
        <div className="fixed top-16 right-2 z-50 w-80 max-h-96 overflow-y-auto cyber-card p-3 shadow-2xl">
          <h4 className="font-heading text-sm text-cyber-teal mb-2">🔔 {t('notifications')}</h4>
          {notifications.length === 0 ? (
            <p className="text-white/40 text-sm">{t('noData')}</p>
          ) : (
            notifications.slice(0, 20).map(n => (
              <div key={n.id} className={`p-2 mb-1 rounded-lg text-xs ${n.read ? 'bg-white/3' : 'bg-cyan-900/20 border border-cyan-500/10'}`}>
                <div className="font-semibold text-white/80">{n.title}</div>
                <div className="text-white/50 mt-0.5">{n.message}</div>
                <div className="text-white/30 mt-0.5">{new Date(n.created_at).toLocaleString('vi')}</div>
              </div>
            ))
          )}
          <button onClick={() => setShowNotifs(false)} className="w-full mt-2 text-center text-xs text-white/40 hover:text-white">{t('close')}</button>
        </div>
      )}

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="py-16 md:py-24 text-center px-4">
          <h1 className="font-heading text-4xl md:text-6xl font-black holo-text mb-4 gravity-drop">
            {t('heroTitle')}
          </h1>
          <p className="font-heading text-lg md:text-xl text-cyber-teal mb-2">{t('heroSubtitle')}</p>
          <p className="text-white/50 mb-8 max-w-md mx-auto">{t('heroDesc')}</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => user ? setModal('buy') : setModal('auth')} className="holo-btn px-8 py-3 text-sm font-heading rounded-xl">
              🎮 {t('buyNow')}
            </button>
            <a href="#products" className="px-8 py-3 text-sm font-heading rounded-xl border border-cyber-teal/30 text-cyber-teal hover:bg-cyber-teal/10 transition-colors">
              📋 {t('products')}
            </a>
          </div>

          {/* Quick stats */}
          <div className="flex justify-center gap-6 mt-12">
            <div className="text-center">
              <div className="font-heading text-2xl text-cyber-teal">24/7</div>
              <div className="text-xs text-white/40">{t('support')}</div>
            </div>
            <div className="text-center">
              <div className="font-heading text-2xl text-cyber-teal">100%</div>
              <div className="text-xs text-white/40">Uy tín</div>
            </div>
            <div className="text-center">
              <div className="font-heading text-2xl text-cyber-teal">VIP</div>
              <div className="text-xs text-white/40">Giảm 20%</div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section id="products" className="py-12 px-4">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="font-heading text-2xl md:text-3xl text-center holo-text mb-8">🎮 {t('products')}</h2>

            {/* Mod Game Cards */}
            <h3 className="font-heading text-lg text-cyber-teal mb-4">🎣 Câu Cá Vạn Cân</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {SERVICES.map((svc, i) => (
                <div key={svc.id} className="cyber-card hud-corners p-4 gravity-drop" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="hud-corner-br" />
                  <div className="text-2xl mb-2">
                    {svc.id.includes('skill') ? '⚔️' : svc.id.includes('ca') ? '🐟' : svc.id.includes('level') ? '📈' : svc.id.includes('item') ? '🎒' : svc.id.includes('pet') ? '🐾' : svc.id.includes('diamond') ? '💎' : svc.id.includes('full') ? '🌟' : svc.id.includes('ban') ? '📦' : '⏰'}
                  </div>
                  <h4 className="font-heading text-sm text-white mb-1">{svc.name.split(' - ')[0]}</h4>
                  <p className="text-xs text-white/40 mb-3">{svc.game}</p>
                  <div className="font-heading text-lg text-cyber-teal mb-3">
                    {svc.price === 0 ? '💬 Liên hệ' : formatPrice(svc.price)}
                    {svc.id === 'cau_chung' && <span className="text-xs text-white/40">/giờ</span>}
                    {svc.id === 'mod_diamond' && <span className="text-xs text-white/40">/1tr KC</span>}
                  </div>
                  <button onClick={() => {
                    if (!user) { setModal('auth'); return; }
                    setBuyService(svc.id);
                    setModal('buy');
                  }} className="w-full holo-btn py-2 text-xs rounded-lg">
                    {svc.price === 0 ? '💬 Liên hệ' : `🛒 ${t('buyNow')}`}
                  </button>
                </div>
              ))}
            </div>

            {/* Scripts */}
            {scripts.length > 0 && (
              <>
                <h3 className="font-heading text-lg text-cyber-teal mb-4">💻 Script Roblox</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                  {scripts.map((scr, i) => (
                    <div key={scr.id} className="cyber-card hud-corners p-4 gravity-drop" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div className="hud-corner-br" />
                      <div className="text-2xl mb-2">💻</div>
                      <h4 className="font-heading text-sm text-white mb-1">{scr.name}</h4>
                      <p className="text-xs text-white/40 mb-3">{scr.game}</p>
                      <div className="font-heading text-lg text-cyber-teal mb-3">{formatPrice(scr.price)}</div>
                      <button onClick={() => {
                        if (!user) { setModal('auth'); return; }
                        setBuyService(scr.name);
                        setModal('buy');
                      }} className="w-full holo-btn py-2 text-xs rounded-lg">🛒 {t('buyNow')}</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Hot Deals Section */}
        {hotDeals.length > 0 && (
          <section id="hot-deals" className="py-12 px-4">
            <div className="max-w-[1200px] mx-auto">
              <h2 className="font-heading text-2xl md:text-3xl text-center holo-text mb-8">🔥 {t('hotDeals')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {hotDeals.map((deal, i) => (
                  <div key={deal.id} className="cyber-card p-4 relative gravity-drop" style={{ animationDelay: `${i * 0.1}s` }}>
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">-{deal.discount_percent}%</span>
                    <div className="text-2xl mb-2">🔥</div>
                    <h4 className="font-heading text-sm text-white mb-1">{deal.product_name}</h4>
                    <p className="text-xs text-white/40 mb-2">{deal.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 line-through text-sm">{formatPrice(deal.original_price)}</span>
                      <span className="font-heading text-lg text-cyber-teal">{formatPrice(Math.round(deal.original_price * (1 - deal.discount_percent / 100)))}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* VIP Section */}
        <section className="py-12 px-4">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="font-heading text-2xl md:text-3xl text-center holo-text mb-8">🏆 VIP Levels</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {VIP_LEVELS.map((vip, i) => (
                <div key={i} className={`cyber-card p-4 text-center ${user && vipInfo.level === vip.level ? 'border-cyber-teal/50' : ''}`}>
                  <div className={`font-heading text-lg mb-1 ${vip.level === 'VIP 4' ? 'holo-text' : 'text-cyber-teal'}`}>{vip.level}</div>
                  <div className="text-xs text-white/40 mb-1">{vip.min > 0 ? `${formatPrice(vip.min)}+` : 'Miễn phí'}</div>
                  <div className="text-sm text-white/60">Giảm {vip.discount}%</div>
                  {user && vipInfo.level === vip.level && (
                    <div className="mt-2 text-xs text-cyber-teal">✓ Hiện tại</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Top Depositors */}
        <section id="top-depositors" className="py-12 px-4">
          <div className="max-w-[600px] mx-auto">
            <h2 className="font-heading text-2xl md:text-3xl text-center holo-text mb-8">🏆 {t('topDepositors')}</h2>
            <div className="cyber-card p-4">
              {topDepositors.length === 0 ? (
                <p className="text-white/40 text-center text-sm">{t('noData')}</p>
              ) : (
                topDepositors.map((d, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                      <span className="text-sm text-white/70">{maskUsername(d.username)}</span>
                    </div>
                    <span className="font-heading text-sm text-cyber-teal">{formatPrice(d.total)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section id="reviews" className="py-12 px-4">
          <div className="max-w-[800px] mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-heading text-2xl md:text-3xl holo-text">⭐ {t('reviews')}</h2>
              {user && (
                <button onClick={() => setModal('review')} className="holo-btn px-4 py-2 text-xs rounded-lg">✍️ Đánh giá</button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((r, i) => (
                <div key={r.id} className="cyber-card p-4 gravity-drop" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/70">👤 {r.username}</span>
                    <StarRating value={r.rating} readonly />
                  </div>
                  <p className="text-xs text-white/50 mb-1">{r.service}</p>
                  <p className="text-sm text-white/70">{r.comment}</p>
                  <p className="text-xs text-white/30 mt-2">{new Date(r.created_at).toLocaleDateString('vi')}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact / Footer */}
        <footer className="py-12 px-4 border-t border-cyan-500/10">
          <div className="max-w-[800px] mx-auto text-center">
            <h2 className="font-heading text-xl holo-text mb-6">📞 Liên Hệ</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <a href={SHOP_INFO.zaloLink} target="_blank" className="cyber-card p-4 hover:border-cyber-teal/40">
                <div className="text-2xl mb-1">💬</div>
                <div className="text-xs text-white/50">Zalo</div>
                <div className="text-sm text-cyber-teal">{SHOP_INFO.zalo}</div>
              </a>
              <a href={SHOP_INFO.telegramLink} target="_blank" className="cyber-card p-4 hover:border-cyber-teal/40">
                <div className="text-2xl mb-1">✈️</div>
                <div className="text-xs text-white/50">Telegram</div>
                <div className="text-sm text-cyber-teal">{SHOP_INFO.telegram}</div>
              </a>
              <div className="cyber-card p-4">
                <div className="text-2xl mb-1">📧</div>
                <div className="text-xs text-white/50">Email</div>
                <div className="text-sm text-cyber-teal break-all">{SHOP_INFO.email}</div>
              </div>
              <div className="cyber-card p-4">
                <div className="text-2xl mb-1">🕐</div>
                <div className="text-xs text-white/50">{t('workingHours')}</div>
                <div className="text-sm text-cyber-teal">{SHOP_INFO.hours}</div>
              </div>
            </div>
            <p className="text-white/30 text-sm">{t('footerText')}</p>
          </div>
        </footer>
      </main>

      {/* ============== MODALS ============== */}

      {/* Auth Modal */}
      <Modal open={modal === 'auth'} onClose={() => setModal(null)} title={authMode === 'login' ? t('login') : t('register')}>
        <div className="space-y-3">
          <input className="cyber-input" placeholder={t('username')} value={authUsername} onChange={e => setAuthUsername(e.target.value)} />
          {authMode === 'register' && (
            <input className="cyber-input" placeholder={t('email')} type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
          )}
          <input className="cyber-input" placeholder={t('password')} type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && authMode === 'login') handleLogin(); }} />
          {authMode === 'register' && (
            <>
              <input className="cyber-input" placeholder={t('confirmPassword')} type="password" value={authConfirmPw} onChange={e => setAuthConfirmPw(e.target.value)} />
              <input className="cyber-input" placeholder={t('referralCode')} value={authReferral} onChange={e => setAuthReferral(e.target.value)} />
            </>
          )}
          <button onClick={authMode === 'login' ? handleLogin : handleRegister} className="w-full holo-btn py-3 text-sm rounded-lg">
            {authMode === 'login' ? t('loginBtn') : t('registerBtn')}
          </button>
          <div className="flex justify-between text-xs">
            <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-cyber-teal hover:underline">
              {authMode === 'login' ? t('register') : t('login')}
            </button>
            {authMode === 'login' && (
              <button onClick={() => setModal('forgotPw')} className="text-white/50 hover:text-white">{t('forgotPassword')}</button>
            )}
          </div>
        </div>
      </Modal>

      {/* Forgot Password Modal */}
      <Modal open={modal === 'forgotPw'} onClose={() => setModal(null)} title={t('forgotPassword')}>
        <div className="text-center space-y-4">
          <p className="text-white/60 text-sm">Liên hệ Admin để được reset mật khẩu:</p>
          <div className="grid grid-cols-2 gap-3">
            <a href={SHOP_INFO.zaloLink} target="_blank" className="cyber-card p-4 hover:border-cyber-teal/40 text-center">
              <div className="text-2xl mb-1">💬</div>
              <div className="text-sm text-cyber-teal">Zalo</div>
              <div className="text-xs text-white/50">{SHOP_INFO.zalo}</div>
            </a>
            <a href={SHOP_INFO.telegramLink} target="_blank" className="cyber-card p-4 hover:border-cyber-teal/40 text-center">
              <div className="text-2xl mb-1">✈️</div>
              <div className="text-sm text-cyber-teal">Telegram</div>
              <div className="text-xs text-white/50">{SHOP_INFO.telegram}</div>
            </a>
          </div>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal open={modal === 'changePw'} onClose={() => setModal(null)} title={t('changePassword')}>
        <div className="space-y-3">
          <input className="cyber-input" placeholder={t('oldPassword')} type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} />
          <input className="cyber-input" placeholder={t('newPassword')} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} />
          <input className="cyber-input" placeholder={t('confirmPassword')} type="password" value={confirmNewPw} onChange={e => setConfirmNewPw(e.target.value)} />
          <button onClick={handleChangePassword} className="w-full holo-btn py-3 text-sm rounded-lg">{t('save')}</button>
        </div>
      </Modal>

      {/* Dashboard Modal */}
      <Modal open={modal === 'dashboard'} onClose={() => setModal(null)} title="📊 Dashboard" wide>
        {user && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div className="cyber-card p-3 text-center">
                <div className="text-xs text-white/50">💎 {t('balance')}</div>
                <div className="font-heading text-lg text-cyber-teal">{formatPrice(user.balance)}</div>
              </div>
              <div className="cyber-card p-3 text-center">
                <div className="text-xs text-white/50">📥 {t('totalDeposited')}</div>
                <div className="font-heading text-lg text-green-400">{formatPrice(user.total_deposited)}</div>
              </div>
              <div className="cyber-card p-3 text-center">
                <div className="text-xs text-white/50">📤 {t('totalSpent')}</div>
                <div className="font-heading text-lg text-yellow-400">{formatPrice(user.total_spent)}</div>
              </div>
              <div className="cyber-card p-3 text-center">
                <div className="text-xs text-white/50">📦 Đơn hàng</div>
                <div className="font-heading text-lg text-white">{orders.length}</div>
              </div>
              <div className="cyber-card p-3 text-center">
                <div className="text-xs text-white/50">✅ Hoàn thành</div>
                <div className="font-heading text-lg text-green-400">{orders.filter(o => o.status === 'completed').length}</div>
              </div>
              <div className="cyber-card p-3 text-center">
                <div className="text-xs text-white/50">🏆 {t('vipLevel')}</div>
                <div className={`font-heading text-lg ${vipInfo.level === 'VIP 4' ? 'holo-text' : 'text-cyber-teal'}`}>{vipInfo.level}</div>
              </div>
            </div>

            {/* VIP Progress */}
            {nextVip && (
              <div className="cyber-card p-3 mb-4">
                <div className="flex justify-between text-xs text-white/50 mb-1">
                  <span>{vipInfo.level} (Giảm {vipInfo.discount}%)</span>
                  <span>{nextVip.level} (Giảm {nextVip.discount}%)</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min(100, (user.total_deposited / nextVip.min) * 100)}%` }} />
                </div>
                <p className="text-xs text-white/40 mt-1">{t('needMore')}: {formatPrice(nextVip.min - user.total_deposited)}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Purchase Modal */}
      <Modal open={modal === 'buy'} onClose={() => setModal(null)} title={`🛒 ${t('buyNow')}`}>
        <div className="space-y-3">
          <select className="cyber-input" value={buyService} onChange={e => { setBuyService(e.target.value); setVoucherApplied(false); setVoucherDiscount(0); }}>
            <option value="">{t('selectService')}</option>
            <optgroup label="🎣 Câu Cá Vạn Cân">
              {SERVICES.map(s => (
                <option key={s.id} value={s.id}>{s.name} - {s.price === 0 ? 'Liên hệ' : formatPrice(s.price)}</option>
              ))}
            </optgroup>
            {scripts.length > 0 && (
              <optgroup label="💻 Scripts">
                {scripts.map(s => (
                  <option key={s.id} value={s.name}>{s.name} - {s.game} - {formatPrice(s.price)}</option>
                ))}
              </optgroup>
            )}
          </select>

          {selectedServicePrice > 0 && (
            <>
              <input className="cyber-input" placeholder={t('gameAccount')} value={buyGameUser} onChange={e => setBuyGameUser(e.target.value)} />
              <input className="cyber-input" placeholder={t('gamePassword')} value={buyGamePass} onChange={e => setBuyGamePass(e.target.value)} />

              <div className="flex gap-2">
                <input className="cyber-input flex-1" placeholder={t('voucherCode')} value={buyVoucher} onChange={e => setBuyVoucher(e.target.value)} />
                <button onClick={applyVoucher} className="px-4 py-2 bg-cyber-teal/20 text-cyber-teal rounded-lg text-sm hover:bg-cyber-teal/30">{t('applyVoucher')}</button>
              </div>

              <textarea className="cyber-input" rows={2} placeholder={t('note')} value={buyNote} onChange={e => setBuyNote(e.target.value)} />

              <div className="cyber-card p-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/50">Giá gốc:</span>
                  <span>{formatPrice(selectedServicePrice)}</span>
                </div>
                {vipInfo.discount > 0 && (
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/50">{vipInfo.level} (-{vipInfo.discount}%):</span>
                    <span className="text-green-400">-{formatPrice(Math.round(selectedServicePrice * vipInfo.discount / 100))}</span>
                  </div>
                )}
                {voucherApplied && voucherDiscount > 0 && (
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/50">Voucher (-{voucherDiscount}%):</span>
                    <span className="text-green-400">-{voucherDiscount}%</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold border-t border-white/10 pt-1 mt-1">
                  <span className="text-white">{t('totalPrice')}:</span>
                  <span className="text-cyber-teal font-heading text-lg">{formatPrice(finalBuyPrice)}</span>
                </div>
              </div>
            </>
          )}

          {selectedServicePrice === 0 && buyService && (
            <div className="cyber-card p-3 text-center">
              <p className="text-white/60 text-sm mb-2">Dịch vụ này cần liên hệ trực tiếp</p>
              <div className="flex gap-2 justify-center">
                <a href={SHOP_INFO.zaloLink} target="_blank" className="px-4 py-2 bg-blue-900/30 text-blue-300 rounded-lg text-sm">💬 Zalo</a>
                <a href={SHOP_INFO.telegramLink} target="_blank" className="px-4 py-2 bg-blue-900/30 text-blue-300 rounded-lg text-sm">✈️ Telegram</a>
              </div>
              <textarea className="cyber-input mt-3" rows={2} placeholder={t('note')} value={buyNote} onChange={e => setBuyNote(e.target.value)} />
              <input className="cyber-input mt-2" placeholder={t('gameAccount')} value={buyGameUser} onChange={e => setBuyGameUser(e.target.value)} />
              <input className="cyber-input mt-2" placeholder={t('gamePassword')} value={buyGamePass} onChange={e => setBuyGamePass(e.target.value)} />
            </div>
          )}

          <button onClick={handlePurchase} className="w-full holo-btn py-3 text-sm rounded-lg">
            {selectedServicePrice === 0 ? '💬 Gửi yêu cầu' : `🛒 ${t('confirmPurchase')}`}
          </button>

          {user && (
            <p className="text-xs text-white/40 text-center">💎 Số dư: {formatPrice(user.balance)}</p>
          )}
        </div>
      </Modal>

      {/* Deposit Modal */}
      <Modal open={modal === 'deposit'} onClose={() => setModal(null)} title={`💰 ${t('deposit')}`}>
        <div className="space-y-4">
          {/* Bank Deposit */}
          <div className="cyber-card p-4">
            <h4 className="font-heading text-sm text-cyber-teal mb-3">🏦 {t('depositBank')}</h4>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[10000, 20000, 50000, 100000, 200000, 500000].map(a => (
                <button key={a} onClick={() => setDepAmount(a)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all ${depAmount === a ? 'bg-cyber-teal/20 text-cyber-teal border border-cyber-teal/30' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
                  {formatPrice(a)}
                </button>
              ))}
            </div>
            <select className="cyber-input mb-3" value={depMethod} onChange={e => setDepMethod(e.target.value)}>
              <option value="VCB">Vietcombank (0% phí)</option>
              <option value="GCoin">GCoin (Liên hệ tỷ giá)</option>
            </select>
            <button onClick={handleBankDeposit} className="w-full holo-btn py-2.5 text-sm rounded-lg">{t('submitDeposit')}</button>
          </div>

          {/* Card Deposit */}
          <div className="cyber-card p-4">
            <h4 className="font-heading text-sm text-cyber-teal mb-3">💳 {t('depositCard')}</h4>
            <select className="cyber-input mb-2" value={cardTelco} onChange={e => setCardTelco(e.target.value)}>
              {CARD_TELCOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="cyber-input mb-2" value={cardAmount} onChange={e => setCardAmount(parseInt(e.target.value))}>
              {CARD_AMOUNTS.map(a => <option key={a} value={a}>{formatPrice(a)}</option>)}
            </select>
            <input className="cyber-input mb-2" placeholder={t('cardSerial')} value={cardSerial} onChange={e => setCardSerial(e.target.value)} />
            <input className="cyber-input mb-2" placeholder={t('cardCode')} value={cardCode} onChange={e => setCardCode(e.target.value)} />
            <div className="text-xs text-white/50 mb-3">
              Chiết khấu 12-15% → Nhận: <span className="text-cyber-teal font-semibold">{formatPrice(Math.round(cardAmount * (1 - CARD_DISCOUNT)))}</span>
            </div>
            <button onClick={handleCardDeposit} className="w-full holo-btn py-2.5 text-sm rounded-lg">📤 Gửi thẻ cào</button>
          </div>
        </div>
      </Modal>

      {/* Deposit Confirm Modal */}
      <Modal open={modal === 'deposit_confirm'} onClose={() => { setModal(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} title="✅ Hướng dẫn chuyển khoản">
        {user && (
          <div className="space-y-3">
            <div className="cyber-card p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">Ngân hàng:</span>
                  <span className="text-white font-semibold">{SHOP_INFO.bank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">STK:</span>
                  <span className="text-cyber-teal font-mono font-semibold">{SHOP_INFO.accountNumber} <CopyBtn text={SHOP_INFO.accountNumber} /></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Chủ TK:</span>
                  <span className="text-white">{SHOP_INFO.accountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Nội dung CK:</span>
                  <span className="text-yellow-300 font-mono font-bold">{user.deposit_code} <CopyBtn text={user.deposit_code} /></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Số tiền:</span>
                  <span className="text-cyber-teal font-heading text-lg">{formatPrice(depAmount)}</span>
                </div>
              </div>
            </div>
            <div className="text-xs text-yellow-300/70 text-center">
              ⚠️ Chuyển khoản ĐÚNG nội dung để được duyệt nhanh nhất!
            </div>
            <button onClick={() => { setModal(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="w-full holo-btn py-3 text-sm rounded-lg">✅ Đã hiểu</button>
          </div>
        )}
      </Modal>

      {/* History Modal */}
      <Modal open={modal === 'history'} onClose={() => setModal(null)} title={`📋 ${t('history')}`} wide>
        {user && (
          <div className="space-y-4">
            {/* Orders */}
            <div>
              <h4 className="font-heading text-sm text-cyber-teal mb-2">📦 {t('orderHistory')}</h4>
              {orders.length === 0 ? <p className="text-white/40 text-sm">{t('noData')}</p> : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {orders.map(o => (
                    <div key={o.id} className="cyber-card p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs text-cyber-teal">{o.order_code}</span>
                        <StatusBadge status={o.status} />
                      </div>
                      <div className="text-sm text-white/70">{o.service}</div>
                      <div className="text-xs text-white/50">💰 {formatPrice(o.price)} • {new Date(o.created_at).toLocaleString('vi')}</div>
                      {o.game_username && (
                        <div className="text-xs text-white/40 mt-1">
                          🎮 TK: {o.game_username} <CopyBtn text={o.game_username} /> | MK: {o.game_password} <CopyBtn text={o.game_password} />
                        </div>
                      )}
                      {o.reject_reason && (
                        <div className="text-xs text-red-400 mt-1">❌ Lý do: {o.reject_reason}</div>
                      )}
                      {o.progress > 0 && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-white/40 mb-1">
                            <span>Tiến độ</span><span>{o.progress}%</span>
                          </div>
                          <div className="progress-bar"><div className="progress-fill" style={{ width: `${o.progress}%` }} /></div>
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        {o.download_link && (
                          <a href={o.download_link} target="_blank" className="text-xs px-2 py-1 bg-cyan-900/30 text-cyan-300 rounded">📥 {t('download')}</a>
                        )}
                        {o.status === 'pending' && (
                          <button onClick={() => cancelOrder(o)} className="text-xs px-2 py-1 bg-red-900/30 text-red-300 rounded">🚫 {t('cancelOrder')}</button>
                        )}
                        {o.status === 'completed' && o.rating === 0 && (
                          <button onClick={() => {
                            const rating = parseInt(prompt('Đánh giá (1-5 sao):') || '0');
                            const comment = prompt('Nhận xét:') || '';
                            if (rating >= 1 && rating <= 5) rateOrder(o, rating, comment);
                          }} className="text-xs px-2 py-1 bg-yellow-900/30 text-yellow-300 rounded">⭐ {t('rate')}</button>
                        )}
                        {o.rating > 0 && <span className="text-xs text-yellow-300">⭐ {o.rating}/5</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Deposits */}
            <div>
              <h4 className="font-heading text-sm text-cyber-teal mb-2">💰 {t('depositHistory')}</h4>
              {deposits.length === 0 ? <p className="text-white/40 text-sm">{t('noData')}</p> : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {deposits.map(d => (
                    <div key={d.id} className="cyber-card p-2 flex items-center justify-between">
                      <div>
                        <span className="font-mono text-xs text-cyber-teal">{d.deposit_code}</span>
                        <span className="text-sm ml-2">{formatPrice(d.amount)}</span>
                        <span className="text-xs text-white/40 ml-2">{d.method}</span>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Card Deposits */}
            <div>
              <h4 className="font-heading text-sm text-cyber-teal mb-2">💳 {t('cardHistory')}</h4>
              {cardDeposits.length === 0 ? <p className="text-white/40 text-sm">{t('noData')}</p> : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {cardDeposits.map(c => (
                    <div key={c.id} className="cyber-card p-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-xs text-cyber-teal">{c.card_code}</span>
                          <span className="text-sm ml-2">{c.telco} {formatPrice(c.amount)}</span>
                        </div>
                        <StatusBadge status={c.status} />
                      </div>
                      {c.admin_note && <p className="text-xs text-red-400 mt-1">Note: {c.admin_note}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Ticket Modal */}
      <Modal open={modal === 'ticket'} onClose={() => setModal(null)} title={`🎫 ${t('support')}`} wide>
        {user && (
          <div className="space-y-4">
            <div className="cyber-card p-4">
              <h4 className="font-heading text-sm text-cyber-teal mb-3">{t('createTicket')}</h4>
              <input className="cyber-input mb-2" placeholder={t('ticketSubject')} value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} />
              <textarea className="cyber-input mb-2" rows={3} placeholder={t('ticketMessage')} value={ticketMessage} onChange={e => setTicketMessage(e.target.value)} />
              <button onClick={createTicket} className="w-full holo-btn py-2 text-sm rounded-lg">{t('createTicket')}</button>
            </div>

            {tickets.length > 0 && (
              <div>
                <h4 className="font-heading text-sm text-white/60 mb-2">Tickets của bạn</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {tickets.map(t => (
                    <div key={t.id} className="cyber-card p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs text-cyber-teal">{t.ticket_code}</span>
                        <StatusBadge status={t.status} />
                      </div>
                      <div className="text-sm font-semibold text-white/80">{t.subject}</div>
                      <div className="text-xs text-white/50 mt-1">{t.message}</div>
                      {t.admin_reply && (
                        <div className="mt-2 p-2 bg-purple-900/20 rounded-lg border border-purple-500/10">
                          <span className="text-xs text-purple-300">💬 Admin: </span>
                          <span className="text-xs text-white/70">{t.admin_reply}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Referral Modal */}
      <Modal open={modal === 'referral'} onClose={() => setModal(null)} title={`👥 ${t('referral')}`}>
        {user && (
          <div className="space-y-4 text-center">
            <div className="cyber-card p-4">
              <p className="text-xs text-white/50 mb-2">{t('yourReferralCode')}</p>
              <div className="font-heading text-2xl text-cyber-teal mb-2">{user.referral_code}</div>
              <button onClick={() => { navigator.clipboard.writeText(user.referral_code); addToast(t('copied'), 'success'); }}
                className="px-4 py-2 bg-cyber-teal/20 text-cyber-teal rounded-lg text-sm">{t('copy')}</button>
            </div>
            <div className="cyber-card p-4">
              <p className="text-xs text-white/50 mb-1">{t('referredCount')}</p>
              <div className="font-heading text-3xl text-white">{referredCount}</div>
            </div>
            <p className="text-sm text-yellow-300/70">🎁 {t('referralBonus')}</p>
          </div>
        )}
      </Modal>

      {/* Review Modal */}
      <Modal open={modal === 'review'} onClose={() => setModal(null)} title={`⭐ ${t('rate')}`}>
        <div className="space-y-3">
          <select className="cyber-input" value={reviewService} onChange={e => setReviewService(e.target.value)}>
            <option value="">Chọn sản phẩm...</option>
            {SERVICES.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            {scripts.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/50">Đánh giá:</span>
            <StarRating value={reviewRating} onChange={setReviewRating} />
          </div>
          <textarea className="cyber-input" rows={3} placeholder="Nhận xét..." value={reviewComment} onChange={e => setReviewComment(e.target.value)} />
          <button onClick={submitReview} className="w-full holo-btn py-3 text-sm rounded-lg">⭐ Gửi đánh giá</button>
        </div>
      </Modal>

      {/* Chat Widget */}
      {chatVisible && (
        <div className="fixed bottom-4 right-4 z-50">
          {chatOpen && (
            <div className="mb-3 cyber-card p-4 w-64 shadow-2xl">
              <h4 className="font-heading text-sm text-cyber-teal mb-3">💬 Chat hỗ trợ</h4>
              <div className="space-y-2">
                <a href={SHOP_INFO.zaloLink} target="_blank" className="flex items-center gap-2 p-3 bg-blue-900/20 rounded-lg hover:bg-blue-900/30 transition-colors">
                  <span className="text-xl">💬</span>
                  <div>
                    <div className="text-sm font-semibold text-white">Zalo</div>
                    <div className="text-xs text-white/50">{SHOP_INFO.zalo}</div>
                  </div>
                </a>
                <a href={SHOP_INFO.telegramLink} target="_blank" className="flex items-center gap-2 p-3 bg-blue-900/20 rounded-lg hover:bg-blue-900/30 transition-colors">
                  <span className="text-xl">✈️</span>
                  <div>
                    <div className="text-sm font-semibold text-white">Telegram</div>
                    <div className="text-xs text-white/50">{SHOP_INFO.telegram}</div>
                  </div>
                </a>
              </div>
              <p className="text-xs text-white/30 mt-2 text-center">🕐 {SHOP_INFO.hours}</p>
            </div>
          )}
          <button onClick={() => setChatOpen(!chatOpen)}
            className="chat-pulse relative w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xl shadow-lg hover:scale-110 transition-transform">
            {chatOpen ? '✕' : '💬'}
          </button>
        </div>
      )}

      {/* PWA Install Banner */}
      {showInstall && (
        <div className="fixed bottom-20 left-4 right-4 z-50 cyber-card p-4 max-w-md mx-auto shadow-2xl">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📱</span>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-white">{t('installApp')}</h4>
              <p className="text-xs text-white/50">{t('installDesc')}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleInstallPWA} className="flex-1 holo-btn py-2 text-xs rounded-lg">{t('installBtn')}</button>
            <button onClick={() => { setShowInstall(false); localStorage.setItem('knox_pwa_dismissed', 'true'); }}
              className="flex-1 py-2 text-xs bg-white/5 rounded-lg text-white/50 hover:bg-white/10">{t('notNow')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
