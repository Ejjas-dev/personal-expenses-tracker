const $ = id => document.getElementById(id);
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) ||
  ['Salary', 'Food', 'Travel', 'Bills', 'Shopping'];

function save() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
  localStorage.setItem('categories', JSON.stringify(categories));
}

/* ---------- Categories ---------- */
function renderCategories() {
  const opts = categories.map(c => `<option>${c}</option>`).join('');
  $('category').innerHTML = opts;
  $('filterCat').innerHTML = '<option value="">All Categories</option>' + opts;
  $('catList').innerHTML = categories.map(c =>
    `<span class="tag">${c}<button onclick="deleteCategory('${c}')">x</button></span>`).join('');
}
$('addCat').onclick = () => {
  const name = $('newCat').value.trim();
  if (!name || categories.includes(name)) return alert('Enter a new, unique category');
  categories.push(name); $('newCat').value = '';
  save(); renderCategories();
};
function deleteCategory(name) {
  if (transactions.some(t => t.category === name))
    return alert('Category is used by transactions');
  categories = categories.filter(c => c !== name);
  save(); renderCategories();
}

/* ---------- Add / Edit / Delete ---------- */
$('form').onsubmit = e => {
  e.preventDefault();
  const data = {
    type: $('type').value,
    amount: parseFloat($('amount').value),
    date: $('date').value,
    category: $('category').value,
    desc: $('desc').value.trim()
  };
  if (!(data.amount > 0) || !data.desc) return alert('Enter valid details');
  const id = $('editId').value;
  if (id) {
    const t = transactions.find(x => x.id == id);
    Object.assign(t, data);
  } else {
    transactions.push({ id: Date.now(), ...data });
  }
  resetForm(); save(); render();
};
function editTx(id) {
  const t = transactions.find(x => x.id == id);
  $('editId').value = t.id; $('type').value = t.type; $('amount').value = t.amount;
  $('date').value = t.date; $('category').value = t.category; $('desc').value = t.desc;
  $('saveBtn').textContent = 'Update'; $('cancelBtn').hidden = false;
  window.scrollTo(0, 0);
}
function deleteTx(id) {
  if (!confirm('Delete this transaction?')) return;
  transactions = transactions.filter(t => t.id != id);
  save(); render();
}
function resetForm() {
  $('form').reset(); $('editId').value = '';
  $('date').value = new Date().toISOString().slice(0, 10);
  $('saveBtn').textContent = 'Add'; $('cancelBtn').hidden = true;
}
$('cancelBtn').onclick = resetForm;

/* ---------- Search & Filter ---------- */
function getFiltered() {
  const s = $('search').value.toLowerCase();
  return transactions.filter(t =>
    t.desc.toLowerCase().includes(s) &&
    (!$('filterCat').value || t.category === $('filterCat').value) &&
    (!$('filterType').value || t.type === $('filterType').value) &&
    (!$('from').value || t.date >= $('from').value) &&
    (!$('to').value || t.date <= $('to').value)
  ).sort((a, b) => b.date.localeCompare(a.date));
}
['search', 'filterCat', 'filterType', 'from', 'to'].forEach(id => $(id).oninput = render);
$('clearBtn').onclick = () => {
  ['search', 'filterCat', 'filterType', 'from', 'to'].forEach(id => $(id).value = '');
  render();
};

/* ---------- Display ---------- */
function renderTable() {
  $('tbody').innerHTML = getFiltered().map(t => `<tr>
    <td>${t.date}</td><td class="${t.type}">${t.type}</td><td>${t.category}</td>
    <td>${t.desc}</td><td class="${t.type}">${t.amount.toFixed(2)}</td>
    <td><button onclick="editTx(${t.id})">Edit</button>
        <button class="del" onclick="deleteTx(${t.id})">Delete</button></td></tr>`).join('')
    || '<tr><td colspan="6">No transactions found</td></tr>';
}
function renderTotals() {
  const inc = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const exp = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  $('income').textContent = inc.toFixed(2);
  $('expense').textContent = exp.toFixed(2);
  $('balance').textContent = (inc - exp).toFixed(2);
}
function renderMonthly() {
  const m = {};
  transactions.forEach(t => {
    const k = t.date.slice(0, 7);
    m[k] = m[k] || { inc: 0, exp: 0 };
    t.type === 'income' ? m[k].inc += t.amount : m[k].exp += t.amount;
  });
  $('monthly').innerHTML = Object.keys(m).sort().reverse().map(k => `<tr><td>${k}</td>
    <td class="income">${m[k].inc.toFixed(2)}</td><td class="expense">${m[k].exp.toFixed(2)}</td>
    <td>${(m[k].inc - m[k].exp).toFixed(2)}</td></tr>`).join('')
    || '<tr><td colspan="4">No data</td></tr>';
}
function renderChart() {
  const c = $('chart'), ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);
  const totals = {};
  transactions.filter(t => t.type === 'expense')
    .forEach(t => totals[t.category] = (totals[t.category] || 0) + t.amount);
  const names = Object.keys(totals);
  if (!names.length) { ctx.fillText('No expense data', 20, 30); return; }
  const max = Math.max(...Object.values(totals));
  const w = c.width / names.length;
  names.forEach((n, i) => {
    const h = (totals[n] / max) * (c.height - 60);
    ctx.fillStyle = '#2f6fd0';
    ctx.fillRect(i * w + 15, c.height - 30 - h, w - 30, h);
    ctx.fillStyle = '#222'; ctx.font = '12px Arial';
    ctx.fillText(n, i * w + 15, c.height - 12);
    ctx.fillText(totals[n].toFixed(0), i * w + 15, c.height - 36 - h);
  });
}

function render() { renderTable(); renderTotals(); renderMonthly(); renderChart(); }

renderCategories(); resetForm(); render();