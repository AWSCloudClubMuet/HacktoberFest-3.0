// ==========================================================================
// Campus Gig & SkillSwap Portal - Professional Client Controller
// ==========================================================================

const API_BASE = window.location.origin;

// State
let allUsers = [];
let currentUser = null;

// Toast Notification
export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info';
  const iconColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1';

  toast.innerHTML = `
    <i class="fa-solid ${icon}" style="color:${iconColor}; margin-top:3px; font-size:1.1rem;"></i>
    <div style="flex:1; color:#0f172a; line-height:1.4;">${message}</div>
    <button style="background:none;border:none;cursor:pointer;color:#94a3b8;font-size:1.2rem;padding:0 4px;" onclick="this.parentElement.remove()">×</button>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 4500);
}

// API fetch wrapper with automatic x-user-id header
export async function api(path, options = {}) {
  const currentUserId = getCurrentUserId();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (currentUserId) {
    headers['x-user-id'] = currentUserId;
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    let data = null;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    }

    if (!res.ok) {
      const errorMessage = data?.error || `Request failed (${res.status})`;
      showToast(errorMessage, 'error');
      throw new Error(errorMessage);
    }

    return data;
  } catch (err) {
    console.error(`API Error [${path}]:`, err);
    throw err;
  }
}

// User state handling
export function getCurrentUserId() {
  return localStorage.getItem('campus_current_user') || 'u1';
}

export function setCurrentUserId(userId) {
  localStorage.setItem('campus_current_user', userId);
  currentUser = allUsers.find((u) => u.id === userId) || null;
  window.dispatchEvent(new CustomEvent('campus:user_changed', { detail: { userId } }));
}

// Formatters
export function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function renderStatusBadge(status) {
  const normalized = (status || 'Open').replace(/\s+/g, '-');
  const icon = status === 'Open' ? 'fa-door-open' : status === 'In Progress' ? 'fa-spinner' : status === 'Completed' ? 'fa-check' : status === 'Expired' ? 'fa-clock' : 'fa-ban';
  return `<span class="status-pill ${normalized}"><i class="fa-solid ${icon}"></i> ${status}</span>`;
}

export function renderPaymentBadge(paymentType, budget) {
  if (paymentType === 'Paid') {
    return `<span class="badge-item Paid"><i class="fa-solid fa-money-bill-wave"></i> PKR ${Number(budget || 0).toLocaleString()}</span>`;
  }
  if (paymentType === 'SkillSwap') {
    return `<span class="badge-item SkillSwap"><i class="fa-solid fa-handshake"></i> SkillSwap</span>`;
  }
  return `<span class="badge-item Free"><i class="fa-solid fa-gift"></i> Free</span>`;
}

// Navbar initialization with Demo Guide ribbon
export async function initNavbar(activePage = '') {
  try {
    allUsers = await api('/users');
  } catch (e) {
    allUsers = [];
  }

  const currentUserId = getCurrentUserId();
  currentUser = allUsers.find((u) => u.id === currentUserId) || allUsers[0] || null;

  const navElement = document.getElementById('navbar-mount');
  if (!navElement) return;

  const userOptions = allUsers
    .map(
      (u) => `
      <option value="${u.id}" ${u.id === currentUser?.id ? 'selected' : ''}>
        ${u.name} — ${u.major} (Sem ${u.semester})
      </option>
    `
    )
    .join('');

  navElement.innerHTML = `
    <!-- Evaluator Demo Ribbon -->
    <div class="demo-tour-banner">
      <div class="demo-tour-content">
        <span class="demo-chip"><i class="fa-solid fa-play"></i> 3-Min Demo Script:</span>
        <span>1. Browse & Filter</span>
        <i class="fa-solid fa-chevron-right" style="font-size:0.65rem; opacity:0.6;"></i>
        <span>2. Post a Gig</span>
        <i class="fa-solid fa-chevron-right" style="font-size:0.65rem; opacity:0.6;"></i>
        <span>3. Switch User & Apply</span>
        <i class="fa-solid fa-chevron-right" style="font-size:0.65rem; opacity:0.6;"></i>
        <span>4. Owner Accept Cascade</span>
        <i class="fa-solid fa-chevron-right" style="font-size:0.65rem; opacity:0.6;"></i>
        <span>5. Complete & Review</span>
      </div>
      <button style="background:none; border:none; color:#a5b4fc; cursor:pointer; font-size:0.75rem;" onclick="this.parentElement.remove()">Dismiss</button>
    </div>

    <!-- Main Navigation Bar -->
    <nav class="navbar">
      <div class="nav-container">
        <a href="index.html" class="brand">
          <div class="brand-icon"><i class="fa-solid fa-graduation-cap"></i></div>
          <span class="brand-text">Campus Gig & SkillSwap</span>
        </a>

        <div class="nav-links">
          <a href="index.html" class="nav-link ${activePage === 'browse' ? 'active' : ''}">
            <i class="fa-solid fa-compass"></i> Browse Gigs
          </a>
          <a href="create.html" class="nav-link ${activePage === 'create' ? 'active' : ''}">
            <i class="fa-solid fa-circle-plus"></i> Post a Gig
          </a>
          <a href="applications.html" class="nav-link ${activePage === 'applications' ? 'active' : ''}">
            <i class="fa-solid fa-file-signature"></i> My Applications
          </a>
          <a href="profile.html" class="nav-link ${activePage === 'profile' ? 'active' : ''}">
            <i class="fa-solid fa-user-circle"></i> My Profile
          </a>
        </div>

        <div class="acting-pill" title="Switch your active student identity">
          <span class="acting-label"><i class="fa-solid fa-user-tag"></i> Acting as:</span>
          <select id="user-switcher" class="user-select">
            ${userOptions}
          </select>
        </div>
      </div>
    </nav>
  `;

  const switcher = document.getElementById('user-switcher');
  if (switcher) {
    switcher.addEventListener('change', (e) => {
      const selectedId = e.target.value;
      setCurrentUserId(selectedId);
      const selectedUser = allUsers.find((u) => u.id === selectedId);
      showToast(`Switched active user to ${selectedUser?.name || selectedId}`, 'success');
      setTimeout(() => {
        window.location.reload();
      }, 350);
    });
  }
}
