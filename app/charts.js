// Duit Kita — grafik Canvas, digambar dari data state (bukan gambar statis).
import { CATEGORIES, CATEGORY_COLORS } from './data.js';

function setupCanvas(canvas, cssW, cssH) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

// Donat pembagian pengeluaran per kategori. values: {kategori: jumlah}
export function drawDonut(canvas, values) {
  const W = 160, H = 160;
  const ctx = setupCanvas(canvas, W, H);
  ctx.clearRect(0, 0, W, H);
  const total = CATEGORIES.reduce((s, c) => s + (values[c] || 0), 0);
  const cx = W / 2, cy = H / 2, r = 82, hole = 46;
  if (!total) {
    ctx.fillStyle = '#8a8a7a';
    ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Belum ada pengeluaran', cx, cy);
    return;
  }
  let a = -Math.PI / 2;
  for (const c of CATEGORIES) {
    const v = values[c] || 0;
    if (!v) continue;
    const sweep = (v / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, a, a + sweep);
    ctx.closePath();
    ctx.fillStyle = CATEGORY_COLORS[c];
    ctx.fill();
    a += sweep;
  }
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(cx, cy, hole, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#1d5c3f';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Total keluar', cx, cy - 4);
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('Rp' + total.toLocaleString('id-ID'), cx, cy + 16);
}

// Batang berdampingan: realisasi vs batas per kategori.
// rows: [{name, spent, limit}]
export function drawBars(canvas, rows) {
  const W = 680, H = 320;
  const ctx = setupCanvas(canvas, W, H);
  ctx.clearRect(0, 0, W, H);
  const padL = 150, padR = 16, padT = 14, padB = 30;
  const max = Math.max(1, ...rows.flatMap((r) => [r.spent, r.limit])) * 1.18;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const rowH = plotH / rows.length;
  const barH = Math.min(16, rowH * 0.32);
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  rows.forEach((r, i) => {
    const yTop = padT + i * rowH;
    const yMid = yTop + rowH / 2;
    ctx.fillStyle = '#33302a';
    ctx.fillText(r.name, padL - 8, yMid);
    const wSpent = (r.spent / max) * plotW;
    const wLimit = (r.limit / max) * plotW;
    ctx.fillStyle = '#1d5c3f';
    ctx.fillRect(padL, yMid - barH - 2, wSpent, barH);
    ctx.fillStyle = '#e9a13b';
    ctx.fillRect(padL, yMid + 2, wLimit, barH);
    ctx.fillStyle = '#33302a';
    ctx.textAlign = 'left';
    ctx.fillText('Rp' + (r.spent / 1000000).toFixed(1).replace('.', ',') + ' jt', padL + wSpent + 6, yMid - barH / 2 - 1);
    ctx.textAlign = 'right';
  });
  // garis dasar
  ctx.strokeStyle = '#c9c2b2';
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, H - padB);
  ctx.lineTo(W - padR, H - padB);
  ctx.stroke();
  // legenda
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#1d5c3f';
  ctx.fillRect(padL, H - 16, 12, 12);
  ctx.fillStyle = '#33302a';
  ctx.fillText('Realisasi', padL + 18, H - 5);
  ctx.fillStyle = '#e9a13b';
  ctx.fillRect(padL + 110, H - 16, 12, 12);
  ctx.fillStyle = '#33302a';
  ctx.fillText('Batas anggaran', padL + 128, H - 5);
}
