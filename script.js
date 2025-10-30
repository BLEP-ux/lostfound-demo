// Demo credentials
const DEMO_STUDENT = { email: 'student@lostfound.com', password: '1234' };
const DEMO_ADMIN = { email: 'admin@lostfound.com', password: 'admin123' };

const $ = (id) => document.getElementById(id);

// Login toggle logic
let role = 'student';
document.addEventListener('DOMContentLoaded', () => {
  const toggleStudent = $('toggleStudent');
  const toggleAdmin = $('toggleAdmin');
  const loginForm = $('loginForm');
  const email = $('email');
  const password = $('password');
  const loginError = $('loginError');

  const setRole = (r) => {
    role = r;
    if (r === 'student') {
      toggleStudent.classList.add('active');
      toggleAdmin.classList.remove('active');
      email.placeholder = 'Student email';
    } else {
      toggleAdmin.classList.add('active');
      toggleStudent.classList.remove('active');
      email.placeholder = 'Admin email';
    }
    loginError.textContent = '';
  };

  toggleStudent.addEventListener('click', () => setRole('student'));
  toggleAdmin.addEventListener('click', () => setRole('admin'));

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const em = email.value.trim();
    const pw = password.value.trim();
    if (!em || !pw) { loginError.textContent = 'Please fill the fields'; return; }

    if (role === 'student') {
      if (em === DEMO_STUDENT.email && pw === DEMO_STUDENT.password) {
        localStorage.setItem('lf_demo_user', JSON.stringify({ role: 'student', email: em }));
        window.location.href = 'dashboard.html';
      } else {
        loginError.textContent = 'Invalid student credentials';
      }
    } else {
      if (em === DEMO_ADMIN.email && pw === DEMO_ADMIN.password) {
        localStorage.setItem('lf_demo_user', JSON.stringify({ role: 'admin', email: em }));
        window.location.href = 'admin_dashboard.html';
      } else {
        loginError.textContent = 'Invalid admin credentials';
      }
    }
  });
});

// localStorage items
const STORAGE_KEY = 'lf_items_v1';
function loadItems() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch (e) { return []; }
}
function saveItems(items) { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

// priority rules
function computePriority(item) {
  const highKeywords = ['wallet','phone','id','passport'];
  const nameLower = (item.name || '').toLowerCase();
  const catLower = (item.category || '').toLowerCase();
  for (const k of highKeywords) { if (nameLower.includes(k) || catLower.includes(k)) return 'high'; }
  const lost = new Date(item.dateLost);
  const now = new Date();
  const diffDays = (now - lost) / (1000*60*60*24);
  if (!isNaN(diffDays) && diffDays <= 2) return 'medium';
  return 'low';
}
function uid() { return 'id-' + Math.random().toString(36).slice(2,10); }
function fileToDataURL(file, cb) {
  const reader = new FileReader();
  reader.onload = () => cb(reader.result);
  reader.readAsDataURL(file);
}

// Student dashboard
function initStudentDashboard() {
  const user = JSON.parse(localStorage.getItem('lf_demo_user') || '{}');
  if (!user || user.role !== 'student') { window.location.href = 'index.html'; return; }
  const nameI = $('itemName'); const catI = $('itemCategory'); const descI = $('itemDesc');
  const locI = $('itemLocation'); const dateI = $('itemDate'); const contactI = $('itemContact');
  const fileI = $('itemImage'); const addBtn = $('addItemBtn'); const listWrap = $('myItemsList'); const msg = $('studentMsg');

  function renderList() {
    const items = loadItems().filter(i => i.status !== 'rejected');
    const mine = items.filter(i => i.reportedBy === user.email);
    if (!mine.length) listWrap.innerHTML = '<p class="small">No items reported yet.</p>';
    else { listWrap.innerHTML = mine.map(it => renderItemHTML(it)).join(''); setTimeout(()=>{ document.querySelectorAll('[data-action-claim]').forEach(btn=>{ btn.addEventListener('click', e=> { const id = btn.getAttribute('data-action-claim'); markReturned(id); }); }); },50); }
  }
  function renderItemHTML(it) {
    return `<div class="item-card card-panel" id="${it.id}">
      <img class="item-thumb" src="${it.imageDataURL || 'https://via.placeholder.com/300x300?text=No+Image'}" />
      <div class="item-meta">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <p class="item-title">${escapeHtml(it.name)}</p>
          <div class="small">${new Date(it.dateLost).toLocaleDateString()}</div>
        </div>
        <p class="item-desc">${escapeHtml(it.desc || '')}</p>
        <p class="small">Location: ${escapeHtml(it.location || '')}</p>
        <p class="small">Contact: ${escapeHtml(it.contact || '')}</p>
        <div style="margin-top:8px">
          <button class="small-btn" data-action-claim="${it.id}">Mark Returned</button>
        </div>
      </div>
    </div>`;
  }
  function markReturned(id) { const items = loadItems(); const idx = items.findIndex(x => x.id === id); if (idx === -1) return; items[idx].status = 'returned'; saveItems(items); renderList(); msg.textContent = 'Marked as returned.'; setTimeout(()=> msg.textContent='',2000); }

  addBtn.addEventListener('click', ()=>{
    const name = nameI.value.trim(); if (!name) { alert('Enter item name'); return; }
    const cat = catI.value.trim(); const desc = descI.value.trim(); const location = locI.value.trim();
    const dateLost = dateI.value || new Date().toISOString().slice(0,10); const contact = contactI.value.trim();
    const file = fileI.files[0];
    if (file) { fileToDataURL(file, (dataUrl)=> { saveNewItem(dataUrl); }); } else { saveNewItem(''); }
    function saveNewItem(dataUrl) { const items = loadItems(); const it = { id: uid(), name, category: cat, desc, location, dateLost, contact, imageDataURL: dataUrl, status: 'open', reportedBy: user.email }; items.push(it); saveItems(items);
      nameI.value=''; catI.value=''; descI.value=''; locI.value=''; dateI.value=''; contactI.value=''; fileI.value='';
      renderList(); msg.textContent = 'Item reported.'; setTimeout(()=> msg.textContent='',2000);
    }
  });
  renderList();
}

// Admin dashboard
function initAdminDashboard() {
  const user = JSON.parse(localStorage.getItem('lf_demo_user') || '{}');
  if (!user || user.role !== 'admin') { window.location.href = 'index.html'; return; }
  const listWrap = $('adminItemsList'); const sortSel = $('sortBy'); const msg = $('adminMsg');
  function render() {
    const items = loadItems().filter(i => i.status !== 'rejected' && i.status !== 'returned');
    const withPr = items.map(i => ({...i, priority: computePriority(i)}));
    const s = sortSel.value;
    if (s === 'priority') { const order = { high: 0, medium: 1, low: 2 }; withPr.sort((a,b)=> order[a.priority]-order[b.priority]); }
    else { withPr.sort((a,b)=> new Date(b.dateLost)-new Date(a.dateLost)); }
    if (!withPr.length) { listWrap.innerHTML = '<p class="small">No reported items.</p>'; return; }
    listWrap.innerHTML = withPr.map(it => renderAdminItem(it)).join(''); setTimeout(()=> attachAdminActions(),50);
  }
  function renderAdminItem(it) {
    const prClass = it.priority === 'high' ? 'pr-high' : it.priority === 'medium' ? 'pr-med' : 'pr-low';
    return `<div class="item-card card-panel" id="${it.id}">
      <img class="item-thumb" src="${it.imageDataURL || 'https://via.placeholder.com/300x300?text=No+Image'}" />
      <div class="item-meta">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <p class="item-title">${escapeHtml(it.name)}</p>
          <div class="priority ${prClass}">${it.priority.toUpperCase()}</div>
        </div>
        <p class="item-desc">${escapeHtml(it.desc||'')}</p>
        <p class="small">Location: ${escapeHtml(it.location||'')}</p>
        <p class="small">Date: ${new Date(it.dateLost).toLocaleDateString()}</p>
        <p class="small">Reported by: ${escapeHtml(it.reportedBy||'')}</p>
        <div style="margin-top:8px;display:flex;gap:8px">
          <button class="small-btn" data-action-return="${it.id}">Mark Returned</button>
          <button class="small-btn" data-action-reject="${it.id}">Reject</button>
        </div>
      </div>
    </div>`;
  }
  function attachAdminActions() {
    document.querySelectorAll('[data-action-return]').forEach(btn => {
      btn.addEventListener('click', ()=> { const id = btn.getAttribute('data-action-return'); updateStatus(id,'returned'); });
    });
    document.querySelectorAll('[data-action-reject]').forEach(btn => {
      btn.addEventListener('click', ()=> { const id = btn.getAttribute('data-action-reject'); updateStatus(id,'rejected'); });
    });
  }
  function updateStatus(id,status) { const items = loadItems(); const idx = items.findIndex(x => x.id === id); if (idx === -1) return; items[idx].status = status; saveItems(items); render(); msg.textContent = 'Updated.'; setTimeout(()=> msg.textContent='',1600); }
  $('logoutAdmin')?.addEventListener('click', ()=> { localStorage.removeItem('lf_demo_user'); window.location.href='index.html'; });
  $('clearAll')?.addEventListener('click', ()=> { if (!confirm('Clear ALL reported items? This affects only your browser.')) return; saveItems([]); render(); });
  sortSel.addEventListener('change', ()=> render());
  render();
}

function escapeHtml(s){ return String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('\"','&quot;'); }
document.addEventListener('DOMContentLoaded', ()=>{ const p = location.pathname.split('/').pop(); if (p === 'dashboard.html') initStudentDashboard(); else if (p === 'admin_dashboard.html') initAdminDashboard(); });
