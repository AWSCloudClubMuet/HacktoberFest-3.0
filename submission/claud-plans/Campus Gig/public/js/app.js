// ==========================================================================
// Campus Gig & SkillSwap Portal - Professional Freelance Platform Client
// Fiverr / Upwork Architecture with Dark Theme & Multi-Role Switching
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
  const isDark = document.documentElement.classList.contains('dark');
  
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

export function getCurrentUserId() {
  return localStorage.getItem('campus_current_user') || 'u1';
}

export function setCurrentUserId(userId) {
  localStorage.setItem('campus_current_user', userId);
  currentUser = allUsers.find((u) => u.id === userId) || null;
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

          <!-- Right: Dark Mode Toggle & Role Switcher -->
          <div class="flex items-center gap-2 sm:gap-3">
            
            <!-- Dark Mode Toggle Button -->
            <button
              id="theme-toggle-btn"
              class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center transition-colors text-slate-700 dark:text-slate-300 focus:outline-none"
              title="Toggle Dark Theme"
            >
              <i class="fa-solid fa-moon"></i>
            </button>

            <!-- Role Switcher: "Acting as" -->
            <div class="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 transition-colors">
              <div class="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                ${(currentUser?.name || 'U').charAt(0)}
              </div>
              <div class="flex flex-col">
                <span class="text-[9px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-wider leading-none">Acting As:</span>
                <select id="user-switcher" class="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 outline-none cursor-pointer max-w-[150px] truncate leading-tight mt-0.5">
                  ${userOptions}
                </select>
              </div>
            </div>

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
      </div>
    </nav>
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

  // Switcher event
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
