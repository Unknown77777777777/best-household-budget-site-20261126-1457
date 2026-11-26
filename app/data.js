// Duit Kita — data contoh November 2026 (semua angka Rupiah, konsisten).
// State terpusat di sini; app.js membaca/mengubahnya, charts.js menggambarnya.

export const STORAGE_KEY = 'duitkita-v1';

export const CATEGORIES = [
  'Dapur & belanja',
  'Transport & bensin',
  'Listrik, air & internet',
  'Sekolah & buku',
  'Cicilan motor',
  'Kesehatan & asuransi',
  'Hiburan & jajan',
];

export const CATEGORY_COLORS = {
  'Dapur & belanja': '#1d5c3f',
  'Transport & bensin': '#e9a13b',
  'Listrik, air & internet': '#3b7d9e',
  'Sekolah & buku': '#7a5c9e',
  'Cicilan motor': '#c4553b',
  'Kesehatan & asuransi': '#4a9e6d',
  'Hiburan & jajan': '#d97b4f',
};

export function sampleData() {
  return {
    month: 'November 2026',
    family: 'Bima & Sari',
    city: 'Bandung',
    income: [
      { id: 'in-1', name: 'Gaji Bima', amount: 8500000, date: '2026-11-01' },
      { id: 'in-2', name: 'Usaha online Sari', amount: 2300000, date: '2026-11-05' },
    ],
    budgets: {
      'Dapur & belanja': 2500000,
      'Transport & bensin': 1000000,
      'Listrik, air & internet': 800000,
      'Sekolah & buku': 1200000,
      'Cicilan motor': 1150000,
      'Kesehatan & asuransi': 650000,
      'Hiburan & jajan': 600000,
    },
    expenses: [
      { id: 'ex-01', date: '2026-11-01', desc: 'SPP anak pertama', category: 'Sekolah & buku', amount: 450000 },
      { id: 'ex-02', date: '2026-11-01', desc: 'SPP anak kedua', category: 'Sekolah & buku', amount: 400000 },
      { id: 'ex-03', date: '2026-11-02', desc: 'Belanja mingguan pasar', category: 'Dapur & belanja', amount: 600000 },
      { id: 'ex-04', date: '2026-11-03', desc: 'Bensin motor', category: 'Transport & bensin', amount: 250000 },
      { id: 'ex-05', date: '2026-11-04', desc: 'BPJS & asuransi', category: 'Kesehatan & asuransi', amount: 400000 },
      { id: 'ex-06', date: '2026-11-05', desc: 'Listrik PLN', category: 'Listrik, air & internet', amount: 350000 },
      { id: 'ex-07', date: '2026-11-06', desc: 'Air PDAM', category: 'Listrik, air & internet', amount: 150000 },
      { id: 'ex-08', date: '2026-11-07', desc: 'Internet rumah', category: 'Listrik, air & internet', amount: 250000 },
      { id: 'ex-09', date: '2026-11-08', desc: 'Langganan streaming', category: 'Hiburan & jajan', amount: 200000 },
      { id: 'ex-10', date: '2026-11-09', desc: 'Belanja mingguan pasar', category: 'Dapur & belanja', amount: 600000 },
      { id: 'ex-11', date: '2026-11-10', desc: 'Cicilan motor (sisa 14 bulan)', category: 'Cicilan motor', amount: 1150000 },
      { id: 'ex-12', date: '2026-11-11', desc: 'Parkir & tol', category: 'Transport & bensin', amount: 150000 },
      { id: 'ex-13', date: '2026-11-14', desc: 'Buku & alat tulis', category: 'Sekolah & buku', amount: 250000 },
      { id: 'ex-14', date: '2026-11-15', desc: 'Nonton & jajan keluarga', category: 'Hiburan & jajan', amount: 300000 },
      { id: 'ex-15', date: '2026-11-16', desc: 'Belanja mingguan pasar', category: 'Dapur & belanja', amount: 600000 },
      { id: 'ex-16', date: '2026-11-17', desc: 'Bensin motor', category: 'Transport & bensin', amount: 250000 },
      { id: 'ex-17', date: '2026-11-18', desc: 'Obat & vitamin', category: 'Kesehatan & asuransi', amount: 200000 },
      { id: 'ex-18', date: '2026-11-20', desc: 'Ojek online', category: 'Transport & bensin', amount: 250000 },
      { id: 'ex-19', date: '2026-11-23', desc: 'Belanja mingguan pasar', category: 'Dapur & belanja', amount: 600000 },
    ],
    savings: [
      { id: 'sv-1', name: 'Dana darurat', target: 30000000, saved: 12400000, monthly: 1200000 },
      { id: 'sv-2', name: 'Liburan keluarga', target: 8000000, saved: 3100000, monthly: 500000 },
      { id: 'sv-3', name: 'Pendidikan anak', target: 15000000, saved: 5600000, monthly: 500000 },
    ],
  };
}

// ---- turunan (dihitung dari data, supaya selalu konsisten) ----

export function totalIncome(state) {
  return state.income.reduce((s, i) => s + i.amount, 0);
}

export function totalExpense(state) {
  return state.expenses.reduce((s, e) => s + e.amount, 0);
}

export function totalBudget(state) {
  return CATEGORIES.reduce((s, c) => s + (state.budgets[c] || 0), 0);
}

export function spentByCategory(state) {
  const out = {};
  for (const c of CATEGORIES) out[c] = 0;
  for (const e of state.expenses) {
    if (out[e.category] === undefined) out[e.category] = 0;
    out[e.category] += e.amount;
  }
  return out;
}

export function savedThisMonth(state) {
  return state.savings.reduce((s, g) => s + g.monthly, 0);
}

export function freeFund(state) {
  return totalIncome(state) - totalExpense(state) - savedThisMonth(state);
}

// ---- penyimpanan: localStorage kunci duitkita-v1, fallback memori ----

let memoryStore = null;

export function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.income) && Array.isArray(parsed.expenses) && Array.isArray(parsed.savings) && parsed.budgets) {
        return parsed;
      }
    }
  } catch (_err) {
    // localStorage tidak tersedia / data rusak -> pakai data contoh
  }
  if (memoryStore) return memoryStore;
  return sampleData();
}

export function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_err) {
    memoryStore = state;
  }
}

export function resetState() {
  const fresh = sampleData();
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  } catch (_err) {
    memoryStore = fresh;
  }
  return fresh;
}

export function formatRupiah(n) {
  return 'Rp' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatJuta(n) {
  const juta = n / 1000000;
  const s = juta % 1 === 0 ? String(juta) : juta.toFixed(1).replace('.', ',');
  return 'Rp' + s + ' jt';
}

export function formatDateId(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return d + ' Nov ' + y;
}
