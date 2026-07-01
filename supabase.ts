import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lsievokkismxxaiezdlm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzaWV2b2traXNteHhhaWV6ZGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MjY0NzgsImV4cCI6MjA5NzAwMjQ3OH0.TZ6_NlpDIrl6xDucsc8S4hqA23RQVWsVLrQRjtr6YmQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const ADMIN_USERNAME = 'admin';
export const ADMIN_PASSWORD = 'nguyenmm2803';

export const SHOP_INFO = {
  name: 'KNOX Shop',
  owner: 'Tr Nguyn',
  bank: 'Vietcombank',
  accountNumber: '1064291846',
  accountName: 'NGUYEN TRUNG NGUYEN',
  transferContent: 'NAP',
  zalo: '0564721862',
  zaloLink: 'https://zalo.me/0564721862',
  telegram: '@ngonthe666',
  telegramLink: 'https://t.me/ngonthe666',
  email: 'n799903@gmail.com',
  hours: '8:00 - 22:00',
};

export const SERVICES = [
  { id: 'mod_skill', name: 'Mod Skill - Câu Cá Vạn Cân', price: 10000, game: 'Câu Cá Vạn Cân' },
  { id: 'mod_ca', name: 'Mod Cá - Câu Cá Vạn Cân', price: 20000, game: 'Câu Cá Vạn Cân' },
  { id: 'mod_level', name: 'Mod Level - Câu Cá Vạn Cân', price: 10000, game: 'Câu Cá Vạn Cân' },
  { id: 'mod_item', name: 'Mod Item - Câu Cá Vạn Cân', price: 20000, game: 'Câu Cá Vạn Cân' },
  { id: 'mod_pet', name: 'Mod Pet - Câu Cá Vạn Cân', price: 20000, game: 'Câu Cá Vạn Cân' },
  { id: 'mod_diamond', name: 'Mod Kim Cương (1tr KC) - Câu Cá Vạn Cân', price: 30000, game: 'Câu Cá Vạn Cân' },
  { id: 'mod_full', name: 'Câu Cá Vạn Cân Full - Liên hệ', price: 0, game: 'Câu Cá Vạn Cân' },
  { id: 'ban_mod', name: 'Bản Mod (Tự Mod)', price: 85000, game: 'Câu Cá Vạn Cân' },
  { id: 'cau_chung', name: 'Câu Chung (Theo Giờ)', price: 20000, game: 'Câu Cá Vạn Cân' },
];

export const VIP_LEVELS = [
  { level: 'NEW', min: 0, discount: 0 },
  { level: 'VIP 1', min: 100000, discount: 5 },
  { level: 'VIP 2', min: 500000, discount: 10 },
  { level: 'VIP 3', min: 1000000, discount: 15 },
  { level: 'VIP 4', min: 5000000, discount: 20 },
];

export const CARD_TELCOS = ['Viettel', 'Mobifone', 'Vinaphone', 'Vietnamobile'];
export const CARD_AMOUNTS = [10000, 20000, 30000, 50000, 100000, 200000, 500000, 1000000];
export const CARD_DISCOUNT = 0.13; // 13% average discount

export function formatPrice(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ';
}

export function generateCode(prefix: string): string {
  return prefix + Math.floor(100000 + Math.random() * 900000);
}

export function getVipLevel(totalDeposited: number) {
  let result = VIP_LEVELS[0];
  for (const vip of VIP_LEVELS) {
    if (totalDeposited >= vip.min) result = vip;
  }
  return result;
}

export function getNextVipLevel(totalDeposited: number) {
  for (const vip of VIP_LEVELS) {
    if (totalDeposited < vip.min) return vip;
  }
  return null;
}

export function maskUsername(username: string): string {
  if (username.length <= 3) return username + '***';
  return username.substring(0, 3) + '***';
}

export function getDeviceInfo() {
  const ua = navigator.userAgent;
  let device = 'Unknown';
  let browser = 'Unknown';
  if (/Android/i.test(ua)) device = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) device = 'iOS';
  else if (/Windows/i.test(ua)) device = 'Windows';
  else if (/Mac/i.test(ua)) device = 'Mac';
  else if (/Linux/i.test(ua)) device = 'Linux';

  if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) browser = 'Chrome';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Edge/i.test(ua)) browser = 'Edge';
  else if (/Opera|OPR/i.test(ua)) browser = 'Opera';

  return { device, browser };
}

export async function getIP(): Promise<string> {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip || 'Unknown';
  } catch {
    return 'Unknown';
  }
}
