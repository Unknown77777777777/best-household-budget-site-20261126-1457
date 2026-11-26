// Duit Kita — logika aplikasi: routing hash, render, form, slider, filter.
import {
  CATEGORIES, CATEGORY_COLORS, loadState, saveState, resetState,
  totalIncome, totalExpense, totalBudget, spentByCategory, savedThisMonth,
  freeFund, formatRupiah, formatJuta, formatDateId,
} from './data.js';
import { drawDonut, drawBars } from './charts.js';

const ROUTES = ['dasbor', 'pemasukan', 'pengeluaran', 'anggaran', 'tabungan', 'laporan'];
const TITLES = {
  dasbor: 'Duit Kita — Dasbor',
  pemasukan: 'Duit Kita — Pemasukan',
  pengeluaran: 'Duit Kita — Pengeluaran',
  anggaran: 'Duit Kita — Anggaran',
  tabungan: 'Duit Kita — Tabungan',
  laporan: 'Duit Kita — Laporan',
};

let state = loadState();
let filterCategory = 'Semua kategori';
let uidCounter = 100;

const $ = (id) => document.getElementById(id);

function uid(prefix) {
  uidCounter += 1;
  return prefix + '-' + Date.now().toString(36) + '-' + uidCounter;
}

function currentRoute() {
  const h = (window.location.hash || '').replace(/^#\/?/, '');
  return ROUTES.includes(h) ? h : 'dasbor';
}

function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  window.setTimeout(() => t.classList.remove('show'), 3000);
}

// ---------- render: dasbor ----------
function renderDashboard() {
  const masuk = totalIncome(state);
  const keluar = totalExpense(state);
  const tabung = savedThisMonth(state);
  const bebas = freeFund(state);
  $('summaryCards').innerHTML = [
    ['Masuk', masuk, 'Gaji Bima + usaha online Sari'],
    ['Keluar', keluar, '7 kategori belanja keluarga'],
    ['Ditabung', tabung, 'Dana darurat, liburan, pendidikan'],
    ['Dana bebas', bebas, 'Sisa setelah belanja & tabungan'],
  ].map(([label, value, note]) => `
    <div class="card"><div class="label">${label}</div>
    <div class="big">${formatRupiah(value)}</div>
    <div class="note">${note}</div></div>`).join('');

  const spent = spentByCategory(state);
  drawDonut($('donutChart'), spent);
  $('donutLegend').innerHTML = CATEGORIES.map((c) => {
    const v = spent[c] || 0;
    const pct = keluar ? Math.round((v / keluar) * 100) : 0;
    return `<li><span class="dot" style="background:${CATEGORY_COLORS[c]}"></span>${c}
      <span class="amt">${formatRupiah(v)}</span><span class="pct">${pct}%</span></li>`;
  }).join('');

  const darurat = state.savings[0];
  const pct = Math.round((darurat.saved / darurat.target) * 100);
  $('emergencyText').textContent =
    `${formatRupiah(darurat.saved)} dari ${formatRupiah(darurat.target)} (${pct}%)`;
  $('emergencyBar').style.width = pct + '%';
  const monthsLeft = Math.max(0, Math.floor((darurat.target - darurat.saved) / darurat.monthly));
  $('emergencyNote').textContent =
    `±${monthsLeft} bulan lagi kalau nabung ${formatJuta(darurat.monthly)}/bulan.`;

  const recent = [...state.expenses]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, 5);
  $('recentList').innerHTML = recent.map((e) => `
    <li>${formatDateId(e.date)} — ${e.desc}
      <span class="amt">${formatRupiah(e.amount)}</span></li>`).join('');

  const sisa = masuk - keluar;
  $('dashboardTip').innerHTML =
    `<strong>Sisa ${formatRupiah(sisa)} bulan ini</strong> — ${formatJuta(tabung)} masuk tabungan, ${formatJuta(bebas)} dana bebas.`;
}

// ---------- render: pemasukan ----------
function renderIncome() {
  $('incomeRows').innerHTML = state.income.map((i) => `
    <tr><td>${i.name}</td><td>${formatDateId(i.date)}</td><td class="num">${formatRupiah(i.amount)}</td></tr>`).join('');
  $('incomeTotal').textContent = formatRupiah(totalIncome(state));
}

// ---------- render: pengeluaran ----------
function renderExpenses() {
  const rows = state.expenses.filter((e) =>
    filterCategory === 'Semua kategori' || e.category === filterCategory);
  const sorted = [...rows].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  $('expenseRows').innerHTML = sorted.map((e) => `
    <tr><td>${formatDateId(e.date)}</td><td>${e.desc}</td><td>${e.category}</td>
    <td class="num">${formatRupiah(e.amount)}</td>
    <td><button class="btn-danger" type="button" data-del="${e.id}">Hapus</button></td></tr>`).join('');
  $('expenseTotal').textContent = formatRupiah(totalExpense(state));
  $('expenseTotalLine').textContent = 'Total: ' + formatRupiah(totalExpense(state)) +
    (filterCategory === 'Semua kategori' ? '' : ' · difilter: ' + filterCategory);
  $('expenseRows').querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.expenses = state.expenses.filter((e) => e.id !== btn.dataset.del);
      saveState(state);
      renderAll();
    });
  });
}

// ---------- render: anggaran ----------
function renderBudget() {
  const spent = spentByCategory(state);
  $('budgetList').innerHTML = CATEGORIES.map((c) => {
    const limit = state.budgets[c] || 0;
    const real = spent[c] || 0;
    const sisa = limit - real;
    const pct = limit ? Math.round((real / limit) * 100) : 0;
    const over = real > limit;
    return `<div class="budget-row">
      <div class="budget-head"><span>${c} ${over ? '<span class="badge-over">Melewati batas</span>' : ''}</span>
        <span class="nums">Batas <b data-limit="${c}">${formatRupiah(limit)}</b> · Realisasi <b>${formatRupiah(real)}</b></span></div>
      <input type="range" min="0" max="5000000" step="50000" value="${limit}" data-slider="${c}"
        aria-label="Batas anggaran ${c}">
      <div class="budget-meta">
        <span>Sisa: <b data-sisa="${c}">${formatRupiah(sisa)}</b></span>
        <span data-pct="${c}">${pct}% terpakai</span>
      </div>
      <div class="progress" style="margin-top:8px"><span class="${over ? 'over' : ''}" data-bar="${c}" style="width:${Math.min(100, pct)}%"></span></div>
    </div>`;
  }).join('');
  $('budgetSummary').innerHTML =
    `<span>Total batas <span id="totalLimit">${formatRupiah(totalBudget(state))}</span></span>` +
    `<span>Total realisasi ${formatRupiah(totalExpense(state))}</span>`;
  $('budgetList').querySelectorAll('[data-slider]').forEach((slider) => {
    slider.addEventListener('input', () => {
      const c = slider.dataset.slider;
      state.budgets[c] = Number(slider.value);
      saveState(state);
      const spentNow = spentByCategory(state);
      const real = spentNow[c] || 0;
      const limit = state.budgets[c];
      const sisa = limit - real;
      const pct = limit ? Math.round((real / limit) * 100) : 0;
      const over = real > limit;
      document.querySelector(`[data-limit="${c}"]`).textContent = formatRupiah(limit);
      document.querySelector(`[data-sisa="${c}"]`).textContent = formatRupiah(sisa);
      document.querySelector(`[data-pct="${c}"]`).textContent = pct + '% terpakai';
      const bar = document.querySelector(`[data-bar="${c}"]`);
      bar.style.width = Math.min(100, pct) + '%';
      bar.classList.toggle('over', over);
      $('totalLimit').textContent = formatRupiah(totalBudget(state));
      const head = slider.closest('.budget-row').querySelector('.budget-head span');
      const badge = head.querySelector('.badge-over');
      if (over && !badge) {
        head.insertAdjacentHTML('beforeend', ' <span class="badge-over">Melewati batas</span>');
      } else if (!over && badge) {
        badge.remove();
      }
    });
  });
}

// ---------- render: tabungan ----------
function renderSavings() {
  $('savingCards').innerHTML = state.savings.map((g) => {
    const pct = Math.round((g.saved / g.target) * 100);
    const months = g.saved >= g.target ? 0 : Math.max(1, Math.ceil((g.target - g.saved) / g.monthly));
    const timeText = g.saved >= g.target
      ? 'Target tercapai!'
      : `±${months} bulan lagi (nabung ${formatJuta(g.monthly)}/bulan)`;
    return `<div class="card saving-card">
      <div class="label">${g.name}</div>
      <div class="pct-big">${pct}%</div>
      <div class="progress"><span style="width:${pct}%"></span></div>
      <p class="target">${formatRupiah(g.saved)} dari ${formatRupiah(g.target)}</p>
      <p class="note">${timeText}</p>
    </div>`;
  }).join('');
  $('savingSummary').innerHTML =
    `<span>Total ditabung bulan ini ${formatRupiah(savedThisMonth(state))}</span>`;
}

// ---------- render: laporan ----------
function renderReport() {
  const spent = spentByCategory(state);
  const rows = CATEGORIES.map((c) => ({ name: c, spent: spent[c] || 0, limit: state.budgets[c] || 0 }));
  drawBars($('barChart'), rows);
  const masuk = totalIncome(state);
  const keluar = totalExpense(state);
  $('reportCards').innerHTML = [
    ['Pemasukan', masuk], ['Pengeluaran', keluar],
    ['Ditabung', savedThisMonth(state)], ['Dana bebas', freeFund(state)],
  ].map(([label, value]) => `
    <div class="card"><div class="label">${label}</div><div class="big">${formatRupiah(value)}</div></div>`).join('');
  $('reportRows').innerHTML = rows.map((r) => {
    const selisih = r.limit - r.spent;
    const pct = r.limit ? Math.round((r.spent / r.limit) * 100) : 0;
    return `<tr class="${r.spent > r.limit ? 'over' : ''}"><td>${r.name}</td>
      <td class="num">${formatRupiah(r.limit)}</td><td class="num">${formatRupiah(r.spent)}</td>
      <td class="num">${formatRupiah(selisih)}</td><td class="num">${pct}%</td></tr>`;
  }).join('');
  const pctSpend = (keluar / masuk * 100).toFixed(1).replace('.', ',');
  const pctSave = (savedThisMonth(state) / masuk * 100).toFixed(1).replace('.', ',');
  $('reportClosing').innerHTML =
    `Bulan ini keluarga Bima &amp; Sari memakai <strong>${pctSpend}% pemasukan</strong> untuk belanja ` +
    `(${formatJuta(keluar)} dari ${formatJuta(masuk)}) dan menabung <strong>${pctSave}%</strong>.`;
}

// ---------- semua halaman ----------
function renderAll() {
  renderDashboard();
  renderIncome();
  renderExpenses();
  renderBudget();
  renderSavings();
  renderReport();
}

function route() {
  const r = currentRoute();
  document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
  $('page-' + r).classList.add('active');
  document.querySelectorAll('.main-nav a').forEach((a) => {
    a.classList.toggle('active', a.dataset.route === r);
  });
  document.title = TITLES[r];
  $('mainNav').classList.remove('open');
  $('hamburger').setAttribute('aria-expanded', 'false');
  window.scrollTo(0, 0);
}

// ---------- form ----------
function bindForms() {
  $('incomeForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const name = $('inName').value.trim();
    const amount = Number($('inAmount').value);
    const date = $('inDate').value || '2026-11-26';
    if (!name || !amount || amount <= 0) {
      $('incomeError').textContent = 'Isi nama sumber dan jumlah yang benar (lebih dari Rp0).';
      return;
    }
    $('incomeError').textContent = '';
    state.income.push({ id: uid('in'), name, amount, date });
    saveState(state);
    renderAll();
    $('inName').value = '';
    $('inAmount').value = '';
    showToast('Pemasukan ditambahkan.');
  });

  $('expenseForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const desc = $('exDesc').value.trim();
    const amount = Number($('exAmount').value);
    const date = $('exDate').value || '2026-11-26';
    const category = $('exCat').value;
    if (!desc || !amount || amount <= 0) {
      $('expenseError').textContent = 'Isi deskripsi dan jumlah yang benar (lebih dari Rp0).';
      return;
    }
    $('expenseError').textContent = '';
    state.expenses.push({ id: uid('ex'), date, desc, category, amount });
    saveState(state);
    renderAll();
    $('exDesc').value = '';
    $('exAmount').value = '';
    showToast('Transaksi ditambahkan.');
  });

  $('savingForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const amount = Number($('svAmount').value);
    const goalId = $('svGoal').value;
    if (!amount || amount <= 0) {
      $('savingError').textContent = 'Isi jumlah yang benar (lebih dari Rp0).';
      return;
    }
    $('savingError').textContent = '';
    const goal = state.savings.find((g) => g.id === goalId);
    if (goal) goal.saved += amount;
    saveState(state);
    renderAll();
    $('svAmount').value = '';
    showToast('Tabungan ditambahkan.');
  });
}

function init() {
  // isi dropdown
  $('catFilter').innerHTML = '<option>Semua kategori</option>' +
    CATEGORIES.map((c) => `<option>${c}</option>`).join('');
  $('exCat').innerHTML = CATEGORIES.map((c) => `<option>${c}</option>`).join('');
  $('svGoal').innerHTML = state.savings.map((g) => `<option value="${g.id}">${g.name}</option>`).join('');
  $('catFilter').addEventListener('change', () => {
    filterCategory = $('catFilter').value;
    renderExpenses();
  });
  $('resetBtn').addEventListener('click', () => {
    state = resetState();
    renderAll();
    showToast('Data contoh dipulihkan.');
  });
  $('hamburger').addEventListener('click', () => {
    const nav = $('mainNav');
    const open = nav.classList.toggle('open');
    $('hamburger').setAttribute('aria-expanded', String(open));
  });
  bindForms();
  renderAll();
  route();
  window.addEventListener('hashchange', route);
}

init();
