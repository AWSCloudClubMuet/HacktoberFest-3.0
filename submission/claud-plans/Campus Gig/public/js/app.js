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
    <header class="sticky top-0 z-50 w-full transition-all duration-300">
      <!-- Translucent Glassmorphism Header Bar -->
      <div class="border-b border-slate-200/60 dark:border-white/[0.08] bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl backdrop-saturate-150 transition-colors shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16 gap-4">
            
            <!-- Left: Brand & Desktop Links -->
            <div class="flex items-center gap-6 lg:gap-8 flex-shrink-0">
              <a href="index.html" class="flex items-center gap-3 group flex-shrink-0">
                <div class="w-9 h-9 rounded-xl bg-slate-900 dark:bg-emerald-500/10 border border-slate-800 dark:border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform duration-200 shadow-sm">
                  <i class="fa-solid fa-graduation-cap text-base"></i>
                </div>
                <div class="flex flex-col">
                  <div class="flex items-center gap-1.5 leading-none">
                    <span class="font-black text-lg tracking-tight text-slate-900 dark:text-white font-display">Campus<span class="text-emerald-600 dark:text-emerald-400">Gig</span></span>
                    <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">PORTAL</span>
                  </div>
                  <span class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-1">Student SkillSwap</span>
                </div>
              </a>

              <!-- Desktop Nav Links: single-line, whitespace-nowrap, zero awkward wrapping -->
              <nav class="hidden lg:flex items-center gap-1 flex-shrink-0">
                <a href="index.html" class="whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                  activePage === 'browse'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
                }">
                  <i class="fa-solid fa-compass mr-1.5 opacity-70"></i> Explore Gigs
                </a>
                <a href="create.html" class="whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                  activePage === 'create'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
                }">
                  <i class="fa-solid fa-circle-plus mr-1.5 opacity-70"></i> Post a Gig
                </a>
                <a href="applications.html" class="whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                  activePage === 'applications'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
                }">
                  <i class="fa-solid fa-file-contract mr-1.5 opacity-70"></i> Proposals
                </a>
                <a href="profile.html" class="whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                  activePage === 'profile'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
                }">
                  <i class="fa-solid fa-user-check mr-1.5 opacity-70"></i> Profile
                </a>
              </nav>
            </div>

            <!-- Right: Controls & Actions -->
            <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              
              <!-- Dark Theme Toggle Button -->
              <button
                id="theme-toggle-btn"
                class="w-9 h-9 rounded-xl bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10 flex items-center justify-center transition-all duration-150 shadow-xs"
                title="Toggle Theme"
              >
                <i class="fa-solid fa-moon text-xs"></i>
              </button>

              <!-- Bespoke Frosted Student Persona Capsule & Popover -->
              <div class="relative">
                <button
                  id="persona-dropdown-btn"
                  class="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-white/70 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/70 dark:border-white/10 backdrop-blur-md transition-all shadow-xs group"
                >
                  <div class="relative flex-shrink-0">
                    <div class="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 text-white text-xs font-black flex items-center justify-center shadow-xs">
                      ${(currentUser?.name || 'U').charAt(0)}
                    </div>
                    <span class="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-white dark:border-slate-900 rounded-full"></span>
                  </div>
                  <div class="text-left leading-none max-w-[110px] sm:max-w-[140px] truncate">
                    <div class="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                      ${currentUser?.name || 'Student'}
                    </div>
                    <div class="text-[10px] text-slate-400 font-medium mt-1 truncate">
                      ${currentUser?.major || 'CSE'} (S${currentUser?.semester || 1})
                    </div>
                  </div>
                  <i class="fa-solid fa-chevron-down text-[10px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200"></i>
                </button>

                <!-- Frosted Glass Persona Popover Dropdown -->
                <div
                  id="persona-dropdown-menu"
                  class="hidden absolute right-0 mt-2 w-72 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2"
                >
                  <div class="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80">
                    <div class="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Switch Student Persona</div>
                    <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Click to test as any verified student</div>
                  </div>

                  <div class="max-h-60 overflow-y-auto py-1 space-y-0.5" id="persona-list-container">
                    ${allUsers
                      .map(
                        (u) => `
                      <button
                        class="persona-item w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors ${
                          u.id === currentUser?.id
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold'
                            : 'text-slate-700 dark:text-slate-200'
                        }"
                        data-id="${u.id}"
                      >
                        <div class="flex items-center gap-2.5 min-w-0">
                          <div class="w-6 h-6 rounded-lg ${
                            u.id === currentUser?.id ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          } text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                            ${u.name.charAt(0)}
                          </div>
                          <div class="min-w-0">
                            <div class="text-xs font-semibold truncate leading-tight">${u.name}</div>
                            <div class="text-[10px] text-slate-400 truncate">${u.major} • Semester ${u.semester}</div>
                          </div>
                        </div>
                        ${u.id === currentUser?.id ? '<i class="fa-solid fa-check text-xs text-emerald-600 flex-shrink-0"></i>' : ''}
                      </button>
                    `
                      )
                      .join('')}
                  </div>

                  <!-- Hidden select for compatibility -->
                  <select id="user-switcher" class="hidden">
                    ${userOptions}
                  </select>

                  <div class="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between px-1">
                    <button
                      id="dropdown-open-auth-btn"
                      class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 py-1"
                    >
                      <i class="fa-solid fa-user-plus text-[10px]"></i> Sign In / Register
                    </button>
                    <a href="profile.html" class="text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white py-1">
                      My Profile &rarr;
                    </a>
                  </div>
                </div>
              </div>

              <!-- Post Gig Quick Action Button -->
              <a 
                href="create.html" 
                class="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-sm shadow-emerald-600/30 transition-transform hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                <i class="fa-solid fa-plus text-[11px]"></i> Post Gig
              </a>

              <!-- Mobile Hamburger Button -->
              <button 
                id="mobile-menu-btn" 
                class="lg:hidden w-9 h-9 rounded-xl bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/10 flex items-center justify-center text-sm shadow-xs"
              >
                <i class="fa-solid fa-bars"></i>
              </button>

            </div>
          </div>
        </div>

        <!-- Mobile Frosted Drawer -->
        <div id="mobile-menu" class="hidden lg:hidden px-4 pt-2 pb-4 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl">
          <a href="index.html" class="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">Explore Gigs</a>
          <a href="create.html" class="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">Post a Gig</a>
          <a href="applications.html" class="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">My Applications</a>
          <a href="profile.html" class="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">Student Profile</a>
          <button id="mobile-open-auth-btn" class="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <i class="fa-solid fa-user-plus mr-1.5"></i> Sign In / Register
          </button>
        </div>
      </div>
    </header>

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

  // Persona Popover dropdown toggle
  const personaBtn = document.getElementById('persona-dropdown-btn');
  const personaMenu = document.getElementById('persona-dropdown-menu');

  if (personaBtn && personaMenu) {
    personaBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      personaMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!personaMenu.contains(e.target) && !personaBtn.contains(e.target)) {
        personaMenu.classList.add('hidden');
      }
    });

    // 1-Click Persona Switching
    document.querySelectorAll('.persona-item').forEach((item) => {
      item.addEventListener('click', async (e) => {
        e.stopPropagation();
        const selectedId = item.dataset.id;
        personaMenu.classList.add('hidden');
        await setCurrentUserId(selectedId);
        const selectedUser = allUsers.find((u) => u.id === selectedId);
        showToast(`Switched persona to ${selectedUser?.name || selectedId} (JWT active)`, 'success');
        setTimeout(() => {
          window.location.reload();
        }, 250);
      });
    });
  }

  // Dropdown open auth modal button
  const dropdownAuthBtn = document.getElementById('dropdown-open-auth-btn');
  if (dropdownAuthBtn) {
    dropdownAuthBtn.addEventListener('click', () => {
      if (personaMenu) personaMenu.classList.add('hidden');
      openModal();
    });
  }

  // Switcher event with automatic JWT token issue (for backward compatibility)
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
