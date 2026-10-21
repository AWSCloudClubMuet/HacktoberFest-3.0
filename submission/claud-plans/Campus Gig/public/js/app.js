// ==========================================================================
// Campus Gig & SkillSwap Portal - Frontend Client & UI Controller
// ==========================================================================

const API_BASE = window.location.origin;

// State
let allUsers = [];
let currentUser = null;

// Helper: Show sleek Lovable-style toast
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
  toast.innerHTML = `
    <div class="toast-msg">${message}</div>
    <button style="background:none;border:none;cursor:pointer;color:#94a3b8;font-size:1.1rem;" onclick="this.parentElement.remove()">×</button>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 4000);
}

// API fetch wrapper with x-user-id header
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
      const errorMessage = data?.error || `Request failed with status ${res.status}`;
      showToast(errorMessage, 'error');
      throw new Error(errorMessage);
    }

    return data;
  } catch (err) {
    console.error(`API Error [${path}]:`, err);
    throw err;
  }
}

// Get or set active user from localStorage
export function getCurrentUserId() {
  return localStorage.getItem('campus_current_user') || 'u1';
}

export function setCurrentUserId(userId) {
  localStorage.setItem('campus_current_user', userId);
  currentUser = allUsers.find((u) => u.id === userId) || null;
  window.dispatchEvent(new CustomEvent('campus:user_changed', { detail: { userId } }));
}

// Format relative date or deadline
export function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Status badge renderer (Guarantees Expired is displayed in red)
export function renderStatusBadge(status) {
  const normalized = (status || 'Open').replace(/\s+/g, '-');
  return `<span class="status-badge ${normalized}">${status}</span>`;
}

// Payment pill renderer
export function renderPaymentPill(paymentType, budget) {
  if (paymentType === 'Paid') {
    return `<span class="pill-payment Paid">💰 PKR ${Number(budget || 0).toLocaleString()}</span>`;
  }
  if (paymentType === 'SkillSwap') {
    return `<span class="pill-payment SkillSwap">🤝 SkillSwap</span>`;
  }
  return `<span class="pill-payment Free">🎁 Free</span>`;
}

// Shared Navbar initialization with "Acting as" User Switcher
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
        ${u.name} (${u.major} - Sem ${u.semester})
      </option>
    `
    )
    .join('');

  navElement.innerHTML = `
    <nav class="navbar">
      <div class="nav-container">
        <a href="index.html" class="brand">
          <div class="brand-icon">🎓</div>
          <span class="brand-text">Campus Gig & SkillSwap</span>
        </a>

        <div class="nav-links">
          <a href="index.html" class="nav-link ${activePage === 'browse' ? 'active' : ''}">Browse Gigs</a>
          <a href="create.html" class="nav-link ${activePage === 'create' ? 'active' : ''}">+ Post a Gig</a>
          <a href="applications.html" class="nav-link ${activePage === 'applications' ? 'active' : ''}">My Applications</a>
          <a href="profile.html" class="nav-link ${activePage === 'profile' ? 'active' : ''}">My Profile</a>
        </div>

        <div class="user-switcher-wrap">
          <div class="acting-pill">
            <span class="acting-label">Acting as:</span>
            <select id="user-switcher" class="user-select">
              ${userOptions}
            </select>
          </div>
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
      showToast(`Switched user to ${selectedUser?.name || selectedId}`, 'success');
      setTimeout(() => {
        window.location.reload();
      }, 300);
    });
  }
}
