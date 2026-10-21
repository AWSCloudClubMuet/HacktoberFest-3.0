// ==========================================================================
// Campus Gig & SkillSwap Portal - Professional Freelance Platform Client
// Fiverr / Upwork Architecture with JWT Authentication, Role Management & Dark Theme
// ==========================================================================

const API_BASE = window.location.origin;

// State
let allUsers = [];
let currentUser = null;

// Dark Theme Controller
export function initTheme() {
  const savedTheme = localStorage.getItem('campus_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(savedTheme);
}

export function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('campus_theme', theme);

  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (toggleBtn) {
    toggleBtn.innerHTML = theme === 'dark' 
      ? '<i class="fa-solid fa-sun text-amber-400"></i>' 
      : '<i class="fa-solid fa-moon text-slate-600 dark:text-slate-300"></i>';
    toggleBtn.setAttribute('title', theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme');
  }
}

export function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  applyTheme(isDark ? 'light' : 'dark');
}

// Sleek Toast Notifications (Fiverr / Upwork Style)
export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  
  toast.className = `pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${
    type === 'success' 
      ? 'bg-emerald-600 text-white border-emerald-500' 
      : type === 'error' 
      ? 'bg-rose-600 text-white border-rose-500' 
      : 'bg-slate-900 text-white border-slate-700 dark:bg-slate-800'
  }`;

  const icon = type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info';

  toast.innerHTML = `
    <i class="fa-solid ${icon} mt-0.5 text-base flex-shrink-0"></i>
    <div class="flex-1 text-sm font-medium leading-snug">${message}</div>
    <button class="text-white/70 hover:text-white text-base leading-none p-1" onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    }
  }, 4000);
}

// Authentication Token Helpers
export function getAuthToken() {
  return localStorage.getItem('campus_jwt_token') || null;
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('campus_jwt_token', token);
  } else {
    localStorage.removeItem('campus_jwt_token');
  }
}

// Automatically syncs a valid JWT for the active student persona
export async function syncUserToken(userId) {
  try {
    const res = await fetch(`${API_BASE}/auth/quick-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        setAuthToken(data.token);
      }
    }
  } catch (err) {
    console.warn('Could not sync auth token:', err);
  }
}

// API fetch wrapper with Bearer JWT and x-user-id fallback
export async function api(path, options = {}) {
  const currentUserId = getCurrentUserId();
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

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

export function getCurrentUserId() {
  return localStorage.getItem('campus_current_user') || 'u1';
}

export async function setCurrentUserId(userId) {
  localStorage.setItem('campus_current_user', userId);
  currentUser = allUsers.find((u) => u.id === userId) || null;
  await syncUserToken(userId);
  window.dispatchEvent(new CustomEvent('campus:user_changed', { detail: { userId } }));
}

export function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Strictly compliant with Page 4: Expired is shown in high-contrast red!
export function renderStatusBadge(status) {
  if (status === 'Expired') {
    return `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800/80"><i class="fa-solid fa-clock"></i> Expired</span>`;
  }
  if (status === 'Open') {
    return `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80"><i class="fa-solid fa-circle-dot text-[9px] animate-pulse"></i> Open</span>`;
  }
  if (status === 'In Progress') {
    return `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800/80"><i class="fa-solid fa-arrows-rotate fa-spin text-[10px]"></i> In Progress</span>`;
  }
  if (status === 'Completed') {
    return `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800/80"><i class="fa-solid fa-check-double text-[10px]"></i> Completed</span>`;
  }
  return `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700"><i class="fa-solid fa-ban text-[10px]"></i> Cancelled</span>`;
}

export function renderPaymentBadge(paymentType, budget) {
  if (paymentType === 'Paid') {
    return `<span class="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"><i class="fa-solid fa-money-bill-wave"></i> PKR ${Number(budget || 0).toLocaleString()}</span>`;
  }
  if (paymentType === 'SkillSwap') {
    return `<span class="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"><i class="fa-solid fa-handshake"></i> SkillSwap</span>`;
  }
  return `<span class="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800"><i class="fa-solid fa-gift"></i> Free / Volunteer</span>`;
}

// Professional Navbar (Upwork / Fiverr Standard)
export async function initNavbar(activePage = '') {
  initTheme();

  try {
    allUsers = await api('/users');
  } catch (e) {
    allUsers = [];
  }

  const currentUserId = getCurrentUserId();
  currentUser = allUsers.find((u) => u.id === currentUserId) || allUsers[0] || null;

  // Ensure active user has a valid JWT stored
  if (!getAuthToken() && currentUser) {
    await syncUserToken(currentUser.id);
  }

  const navMount = document.getElementById('navbar-mount');
  if (!navMount) return;

  const userOptions = allUsers
    .map(
      (u) => `
      <option value="${u.id}" ${u.id === currentUser?.id ? 'selected' : ''}>
        ${u.name} • ${u.major} (Sem ${u.semester})
      </option>
    `
    )
    .join('');

  navMount.innerHTML = `
    <nav class="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 gap-4">
          
          <!-- Logo & Brand -->
          <div class="flex items-center gap-8">
            <a href="index.html" class="flex items-center gap-2.5 group">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <i class="fa-solid fa-briefcase text-lg"></i>
              </div>
              <div class="flex flex-col">
                <span class="font-black text-xl tracking-tight text-slate-900 dark:text-white leading-none font-display">
                  Campus<span class="text-emerald-600 dark:text-emerald-400">Gig</span>
                </span>
                <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase mt-0.5">Freelance & SkillSwap</span>
              </div>
            </a>

            <!-- Desktop Nav Links -->
            <div class="hidden md:flex items-center gap-1">
              <a href="index.html" class="px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activePage === 'browse'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
              }">
                <i class="fa-solid fa-compass mr-1.5 opacity-70"></i> Browse Gigs
              </a>
              <a href="create.html" class="px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activePage === 'create'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
              }">
                <i class="fa-solid fa-circle-plus mr-1.5 opacity-70"></i> Post a Gig
              </a>
              <a href="applications.html" class="px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activePage === 'applications'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
              }">
                <i class="fa-solid fa-file-contract mr-1.5 opacity-70"></i> My Applications
              </a>
              <a href="profile.html" class="px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activePage === 'profile'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
              }">
                <i class="fa-solid fa-user-check mr-1.5 opacity-70"></i> Profile
              </a>
            </div>
          </div>

          <!-- Right: Dark Mode Toggle, Role Switcher & Auth Trigger -->
          <div class="flex items-center gap-2 sm:gap-3">
            
            <!-- Dark Mode Toggle Button -->
            <button
              id="theme-toggle-btn"
              class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center transition-colors text-slate-700 dark:text-slate-300 focus:outline-none"
              title="Toggle Dark Theme"
            >
              <i class="fa-solid fa-moon"></i>
            </button>

            <!-- Role Switcher: "Acting as" (with automatic JWT generation) -->
            <div class="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 transition-colors">
              <div class="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                ${(currentUser?.name || 'U').charAt(0)}
              </div>
              <div class="flex flex-col">
                <span class="text-[9px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-wider leading-none">Acting As:</span>
                <select id="user-switcher" class="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer max-w-[130px] sm:max-w-[160px] truncate leading-tight mt-0.5">
                  ${userOptions}
                </select>
              </div>
            </div>

            <!-- Auth Trigger Button (Sign In / Register modal) -->
            <button
              id="btn-open-auth-modal"
              class="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              title="Sign In or Register New Student"
            >
              <i class="fa-solid fa-lock text-emerald-600 dark:text-emerald-400"></i> Account
            </button>

            <!-- Post Gig Quick Action Button -->
            <a 
              href="create.html" 
              class="hidden lg:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/30 transition-transform hover:scale-105 active:scale-95"
            >
              <i class="fa-solid fa-plus"></i> Post Gig
            </a>

            <!-- Mobile Hamburger Button -->
            <button 
              id="mobile-menu-btn" 
              class="md:hidden w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-sm"
            >
              <i class="fa-solid fa-bars"></i>
            </button>

          </div>
        </div>
      </div>

      <!-- Mobile Dropdown Menu -->
      <div id="mobile-menu" class="hidden md:hidden px-4 pt-2 pb-4 border-t border-slate-200 dark:border-slate-800 space-y-1 bg-white dark:bg-slate-900">
        <a href="index.html" class="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">Browse Gigs</a>
        <a href="create.html" class="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">Post a Gig</a>
        <a href="applications.html" class="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">My Applications</a>
        <a href="profile.html" class="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">Student Profile</a>
        <button id="mobile-open-auth-btn" class="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800">
          <i class="fa-solid fa-user-plus mr-1.5"></i> Sign In / Register
        </button>
      </div>
    </nav>

    <!-- Global Auth Modal (Login & Registration) -->
    <div id="auth-modal" class="fixed inset-0 z-[100] bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs hidden items-center justify-center p-4">
      <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        
        <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">
              <i class="fa-solid fa-shield-halved"></i>
            </div>
            <h3 class="font-display font-extrabold text-base text-slate-900 dark:text-white">Student Authentication</h3>
          </div>
          <button id="auth-modal-close" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none">&times;</button>
        </div>

        <!-- Auth Tabs: Sign In / Register -->
        <div class="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          <button id="tab-btn-login" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs">
            Sign In
          </button>
          <button id="tab-btn-register" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900">
            Register Account
          </button>
        </div>

        <!-- Form 1: Sign In -->
        <form id="form-auth-login" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Campus Email *</label>
            <input
              type="email"
              id="login-email"
              required
              value="${currentUser?.email || 'ali.khan@campus.edu.pk'}"
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Password *</label>
            <input
              type="password"
              id="login-password"
              required
              value="campus123"
              placeholder="Enter password (default: campus123)"
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
            />
            <p class="text-[10px] text-slate-400 mt-1">Seeded accounts use default password: <strong>campus123</strong></p>
          </div>
          <button type="submit" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20">
            Sign In with JWT
          </button>
        </form>

        <!-- Form 2: Register -->
        <form id="form-auth-register" class="space-y-3 hidden">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              id="reg-name"
              required
              placeholder="e.g. Asad Rehman"
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">University Email *</label>
            <input
              type="email"
              id="reg-email"
              required
              placeholder="student@campus.edu.pk"
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Major *</label>
              <input
                type="text"
                id="reg-major"
                required
                placeholder="e.g. CSE"
                class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Semester *</label>
              <input
                type="number"
                id="reg-semester"
                required
                min="1"
                max="12"
                value="5"
                class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Password (min 6 chars) *</label>
            <input
              type="password"
              id="reg-password"
              required
              placeholder="Create secure password"
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Skills (comma-separated)</label>
            <input
              type="text"
              id="reg-skills"
              placeholder="e.g. React, Node.js, Python"
              class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
            />
          </div>
          <button type="submit" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20">
            Create Account & Get JWT
          </button>
        </form>

      </div>
    </div>
  `;

  // Attach Dark theme toggle listener
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTheme);
    initTheme();
  }

  // Mobile menu toggle
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // Switcher event with automatic JWT token issue
  const switcher = document.getElementById('user-switcher');
  if (switcher) {
    switcher.addEventListener('change', async (e) => {
      const selectedId = e.target.value;
      await setCurrentUserId(selectedId);
      const selectedUser = allUsers.find((u) => u.id === selectedId);
      showToast(`Logged in as ${selectedUser?.name || selectedId} (JWT active)`, 'success');
      setTimeout(() => {
        window.location.reload();
      }, 300);
    });
  }

  // Auth Modal Listeners
  const authModal = document.getElementById('auth-modal');
  const btnOpenAuth = document.getElementById('btn-open-auth-modal');
  const btnOpenAuthMobile = document.getElementById('mobile-open-auth-btn');
  const btnCloseAuth = document.getElementById('auth-modal-close');
  const tabLogin = document.getElementById('tab-btn-login');
  const tabRegister = document.getElementById('tab-btn-register');
  const formLogin = document.getElementById('form-auth-login');
  const formRegister = document.getElementById('form-auth-register');

  const openModal = () => {
    if (authModal) {
      authModal.classList.remove('hidden');
      authModal.classList.add('flex');
    }
  };

  const closeModal = () => {
    if (authModal) {
      authModal.classList.add('hidden');
      authModal.classList.remove('flex');
    }
  };

  if (btnOpenAuth) btnOpenAuth.addEventListener('click', openModal);
  if (btnOpenAuthMobile) btnOpenAuthMobile.addEventListener('click', openModal);
  if (btnCloseAuth) btnCloseAuth.addEventListener('click', closeModal);

  if (tabLogin && tabRegister) {
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('bg-white', 'dark:bg-slate-900', 'text-slate-900', 'dark:text-white', 'shadow-xs');
      tabLogin.classList.remove('text-slate-500', 'dark:text-slate-400');
      tabRegister.classList.remove('bg-white', 'dark:bg-slate-900', 'text-slate-900', 'dark:text-white', 'shadow-xs');
      tabRegister.classList.add('text-slate-500', 'dark:text-slate-400');
      formLogin.classList.remove('hidden');
      formRegister.classList.add('hidden');
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('bg-white', 'dark:bg-slate-900', 'text-slate-900', 'dark:text-white', 'shadow-xs');
      tabRegister.classList.remove('text-slate-500', 'dark:text-slate-400');
      tabLogin.classList.remove('bg-white', 'dark:bg-slate-900', 'text-slate-900', 'dark:text-white', 'shadow-xs');
      tabLogin.classList.add('text-slate-500', 'dark:text-slate-400');
      formRegister.classList.remove('hidden');
      formLogin.classList.add('hidden');
    });
  }

  // Handle Login submission
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
        const res = await api('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        if (res.token) {
          setAuthToken(res.token);
          localStorage.setItem('campus_current_user', res.user.id);
          showToast(`Welcome back, ${res.user.name}!`, 'success');
          closeModal();
          setTimeout(() => window.location.reload(), 400);
        }
      } catch (err) {
        // showToast already called by api()
      }
    });
  }

  // Handle Registration submission
  if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value;
      const email = document.getElementById('reg-email').value;
      const major = document.getElementById('reg-major').value;
      const semester = document.getElementById('reg-semester').value;
      const password = document.getElementById('reg-password').value;
      const skills = document.getElementById('reg-skills').value;

      try {
        const res = await api('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name,
            email,
            major,
            semester,
            password,
            skills,
          }),
        });

        if (res.token) {
          setAuthToken(res.token);
          localStorage.setItem('campus_current_user', res.user.id);
          showToast(`Account created for ${res.user.name}!`, 'success');
          closeModal();
          setTimeout(() => window.location.reload(), 400);
        }
      } catch (err) {
        // showToast already called by api()
      }
    });
  }
}
