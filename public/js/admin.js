/**
 * YH Studio Admin Dashboard
 */

const API_BASE = '/api/admin';
let authToken = localStorage.getItem('yh_admin_token');
let currentOrders = [];
let currentFilter = 'all';

// ========================================
// AUTH
// ========================================

function initAuth() {
  const loginScreen = document.getElementById('loginScreen');
  const dashboard = document.getElementById('dashboard');
  const passwordInput = document.getElementById('passwordInput');
  const loginBtn = document.getElementById('loginBtn');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');

  if (authToken) {
    loginScreen.style.display = 'none';
    dashboard.style.display = 'grid';
    initDashboard();
  }

  async function doLogin() {
    const pw = passwordInput.value.trim();
    if (!pw) return;

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        headers: { 'Authorization': `Bearer ${pw}` }
      });
      if (res.ok) {
        authToken = pw;
        localStorage.setItem('yh_admin_token', pw);
        loginScreen.style.display = 'none';
        dashboard.style.display = 'grid';
        initDashboard();
      } else {
        loginError.textContent = 'Invalid password';
        passwordInput.value = '';
      }
    } catch {
      loginError.textContent = 'Connection error';
    }
  }

  loginBtn.addEventListener('click', doLogin);
  passwordInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  logoutBtn.addEventListener('click', () => {
    authToken = null;
    localStorage.removeItem('yh_admin_token');
    location.reload();
  });
}

// ========================================
// DASHBOARD
// ========================================

function initDashboard() {
  loadOrders();
  loadStats();
  setupNavigation();
  setupFilters();
  setupRefresh();
  setupManualAI();
}

function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const view = item.dataset.view;
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
      document.getElementById(`${view}View`).style.display = 'block';
      document.getElementById('pageTitle').textContent = 
        view === 'orders' ? 'Orders' : view === 'stats' ? 'Analytics' : 'AI Studio';
    });
  });
}

function setupFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderOrders();
    });
  });
}

function setupRefresh() {
  document.getElementById('refreshBtn').addEventListener('click', () => {
    loadOrders();
    loadStats();
  });
}

// ========================================
// API CALLS
// ========================================

async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      ...opts.headers
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function loadOrders() {
  try {
    currentOrders = await api(`${API_BASE}/orders`);
    renderOrders();
  } catch (err) {
    console.error('Failed to load orders:', err);
  }
}

async function loadStats() {
  try {
    const stats = await api(`${API_BASE}/stats`);
    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statToday').textContent = stats.today;
    document.getElementById('statCompleted').textContent = stats.completed;
    document.getElementById('statPending').textContent = stats.pending;
    document.getElementById('statGenerating').textContent = stats.generating;
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

// ========================================
// RENDERING
// ========================================

function renderOrders() {
  const container = document.getElementById('ordersList');
  let filtered = currentOrders;
  if (currentFilter !== 'all') {
    filtered = currentOrders.filter(o => o.status === currentFilter);
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No orders found</p></div>`;
    return;
  }

  container.innerHTML = filtered.map(order => `
    <div class="order-card" data-id="${order.id}">
      <div class="order-info">
        <h4>${escapeHtml(order.name)}</h4>
        <p>${escapeHtml(order.email)}</p>
      </div>
      <div class="order-meta">
        <span class="order-status status-${order.status}">${order.status}</span>
        <span class="order-package">${order.package}</span>
      </div>
      <div class="order-meta">
        <span class="order-date">${formatDate(order.createdAt)}</span>
        <span class="order-date">${order.concepts?.length || 0} concepts</span>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.order-card').forEach(card => {
    card.addEventListener('click', () => showOrderDetail(card.dataset.id));
  });
}

async function showOrderDetail(id) {
  try {
    const order = await api(`${API_BASE}/orders/${id}`);
    const modal = document.getElementById('orderModal');
    const body = document.getElementById('modalBody');

    const conceptsHtml = order.concepts?.length ? `
      <div class="concepts-section">
        <h4>Generated Concepts (${order.concepts.length})</h4>
        <div class="concepts-grid">
          ${order.concepts.map(c => `
            <div class="concept-result">
              <div class="concept-preview" style="background: ${c.template?.gradient || c.palette?.[0] || '#333'};">
                <span>${(c.title || 'A').charAt(0)}</span>
              </div>
              <div class="concept-data">
                <h5>${escapeHtml(c.title || 'Untitled')}</h5>
                <p>${escapeHtml(c.description || '')}</p>
                <div class="concept-palette">
                  ${(c.palette || []).map(p => `<div class="palette-swatch" style="background: ${p};"></div>`).join('')}
                </div>
                <div class="concept-tags">
                  ${(c.tags || []).map(t => `<span class="concept-tag">${escapeHtml(t)}</span>`).join('')}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '<p style="color:var(--text-muted);margin:20px 0;">No concepts generated yet</p>';

    const logsHtml = order.aiLogs?.length ? `
      <div class="ai-logs">
        <div class="ai-logs-header">AI Generation Log</div>
        <div class="ai-logs-body">
          ${order.aiLogs.map(l => `
            <div class="log-line ${l.type}">${escapeHtml(l.message)}</div>
          `).join('')}
        </div>
      </div>
    ` : '';

    body.innerHTML = `
      <div class="order-detail">
        <h3>Order #${order.id.slice(0, 8)}</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <label>Client</label>
            <span>${escapeHtml(order.name)}</span>
          </div>
          <div class="detail-item">
            <label>Email</label>
            <span>${escapeHtml(order.email)}</span>
          </div>
          <div class="detail-item">
            <label>Package</label>
            <span>${escapeHtml(order.package)}</span>
          </div>
          <div class="detail-item">
            <label>Status</label>
            <span>${order.status}</span>
          </div>
          <div class="detail-item">
            <label>Created</label>
            <span>${formatDate(order.createdAt)}</span>
          </div>
          <div class="detail-item">
            <label>Source</label>
            <span>${order.source}</span>
          </div>
        </div>
        <div class="detail-brief">
          <label>Project Brief</label>
          <p>${escapeHtml(order.brief)}</p>
        </div>
        ${conceptsHtml}
        ${logsHtml}
        <div style="margin-top:24px;display:flex;gap:12px;">
          <button class="refresh-btn" onclick="regenerateOrder('${order.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
            Regenerate Concepts
          </button>
          <button class="refresh-btn" onclick="deleteOrder('${order.id}')" style="border-color:var(--danger);color:var(--danger);">
            Delete Order
          </button>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  } catch (err) {
    alert('Failed to load order details');
  }
}

async function regenerateOrder(id) {
  if (!confirm('Regenerate AI concepts for this order?')) return;
  try {
    await api(`${API_BASE}/orders/${id}/regenerate`, { method: 'POST' });
    alert('Regeneration started');
    loadOrders();
  } catch (err) {
    alert('Failed to regenerate');
  }
}

async function deleteOrder(id) {
  if (!confirm('Delete this order permanently?')) return;
  try {
    await api(`${API_BASE}/orders/${id}`, { method: 'DELETE' });
    document.getElementById('orderModal').style.display = 'none';
    loadOrders();
    loadStats();
  } catch (err) {
    alert('Failed to delete');
  }
}

// ========================================
// MANUAL AI GENERATION
// ========================================

function setupManualAI() {
  const btn = document.getElementById('manualGenerateBtn');
  const prompt = document.getElementById('manualPrompt');
  const results = document.getElementById('manualResults');

  btn.addEventListener('click', async () => {
    const text = prompt.value.trim();
    if (!text) return;

    btn.disabled = true;
    btn.textContent = 'Generating...';
    results.innerHTML = '<p style="color:var(--text-muted);">Generating concepts...</p>';

    try {
      // Use the public endpoint which creates an order and generates
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Manual Test',
          email: 'test@yhstudio.design',
          package: 'test',
          message: text,
          source: 'admin_manual'
        })
      });
      const data = await res.json();

      if (data.success) {
        // Poll for completion
        let attempts = 0;
        const poll = setInterval(async () => {
          attempts++;
          if (attempts > 60) { clearInterval(poll); return; }

          const orderRes = await fetch(`/api/orders/${data.orderId}`);
          const order = await orderRes.json();

          if (order.status === 'completed' && order.concepts?.length > 0) {
            clearInterval(poll);
            renderManualResults(order.concepts, results);
            btn.disabled = false;
            btn.textContent = 'Generate Concepts';
          } else if (order.status === 'error') {
            clearInterval(poll);
            results.innerHTML = '<p style="color:var(--danger);">Generation failed</p>';
            btn.disabled = false;
            btn.textContent = 'Generate Concepts';
          }
        }, 2000);
      }
    } catch (err) {
      results.innerHTML = '<p style="color:var(--danger);">Error: ' + err.message + '</p>';
      btn.disabled = false;
      btn.textContent = 'Generate Concepts';
    }
  });
}

function renderManualResults(concepts, container) {
  container.innerHTML = `
    <h4 style="margin:24px 0 16px;font-family:var(--font-display);font-size:1.2rem;">Generated Concepts</h4>
    <div class="concepts-grid">
      ${concepts.map(c => `
        <div class="concept-result">
          <div class="concept-preview" style="background: ${c.template?.gradient || c.palette?.[0] || '#333'};">
            <span>${(c.title || 'A').charAt(0)}</span>
          </div>
          <div class="concept-data">
            <h5>${escapeHtml(c.title || 'Untitled')}</h5>
            <p>${escapeHtml(c.description || '')}</p>
            <div class="concept-palette">
              ${(c.palette || []).map(p => `<div class="palette-swatch" style="background: ${p};"></div>`).join('')}
            </div>
            <div class="concept-tags">
              ${(c.tags || []).map(t => `<span class="concept-tag">${escapeHtml(t)}</span>`).join('')}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ========================================
// UTILITIES
// ========================================

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Modal close
document.getElementById('modalBackdrop').addEventListener('click', () => {
  document.getElementById('orderModal').style.display = 'none';
});
document.getElementById('modalClose').addEventListener('click', () => {
  document.getElementById('orderModal').style.display = 'none';
});

// Initialize
document.addEventListener('DOMContentLoaded', initAuth);
