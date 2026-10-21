// Campus Gig & SkillSwap Portal - Main Frontend Application Logic

// ==========================================================================
// Toast Notification Utility
// ==========================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${icons[type] || 'ℹ️'}</span>
    <div>${escapeHTML(message)}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// ==========================================================================
// HTML Sanitizer
// ==========================================================================
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Format relative or date string
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
}

// Render star icons
function renderStars(rating, reviewCount = null) {
  if (rating === null || rating === undefined || rating === 0) {
    return `<span class="text-muted" style="font-size:0.8rem;">No reviews yet</span>`;
  }

  const rounded = Math.round(Number(rating) * 10) / 10;
  const fullStars = Math.floor(rounded);
  const hasHalf = (rounded - fullStars) >= 0.5;

  let stars = '★'.repeat(fullStars);
  if (hasHalf && fullStars < 5) stars += '½';

  const countText = reviewCount !== null ? ` <span class="text-muted">(${reviewCount})</span>` : '';
  return `<span class="stars">${stars}</span> <strong>${rounded.toFixed(1)}</strong>${countText}`;
}

// Category Badge CSS helper
function getCategoryBadgeClass(category) {
  switch (category) {
    case 'Programming': return 'badge-cat-prog';
    case 'Design': return 'badge-cat-design';
    case 'Writing': return 'badge-cat-writing';
    case 'Tutoring': return 'badge-cat-tutor';
    default: return 'badge-secondary';
  }
}

// Payment Badge CSS helper
function getPaymentBadge(paymentType, budget) {
  if (paymentType === 'Paid') {
    return `<span class="badge badge-paid">💵 Paid ($${budget || 0})</span>`;
  } else if (paymentType === 'Skill Swap') {
    return `<span class="badge badge-swap">🔄 Skill Swap</span>`;
  } else {
    return `<span class="badge badge-free">🎁 Free</span>`;
  }
}

// Status Badge CSS helper
function getStatusBadge(status) {
  switch (status) {
    case 'open':
      return `<span class="badge badge-status-open">🟢 Open</span>`;
    case 'in_progress':
      return `<span class="badge badge-status-in_progress">🟡 In Progress</span>`;
    case 'completed':
      return `<span class="badge badge-status-completed">🔵 Completed</span>`;
    case 'cancelled':
      return `<span class="badge badge-status-cancelled">⚪ Cancelled</span>`;
    default:
      return `<span class="badge badge-secondary">${escapeHTML(status)}</span>`;
  }
}

// ==========================================================================
// Application Core
// ==========================================================================
const App = {
  async init() {
    console.log('Campus Gig & SkillSwap Portal Initializing...');

    // Subscribe to state changes
    State.subscribe((event, data) => this.onStateChange(event, data));

    // Initialize State
    await State.init();

    // Setup DOM Event Listeners
    this.setupNavigation();
    this.setupDemoUserSelector();
    this.setupFilterListeners();
    this.setupPostGigForm();
    this.setupModals();

    // Initial View Render
    this.updateStatsBar();
    this.renderExploreGigs();
  },

  onStateChange(event, data) {
    if (event === 'USER_CHANGED') {
      this.updateDemoUserUI();
      if (State.activeTab === 'explore') this.renderExploreGigs();
      if (State.activeTab === 'dashboard') this.renderDashboard();
    } else if (event === 'FILTER_CHANGED' || event === 'FILTERS_RESET') {
      this.updateActiveFilterChips();
      if (State.activeTab === 'explore') this.renderExploreGigs();
    } else if (event === 'TAB_CHANGED') {
      this.handleTabSwitch(data);
    }
  },

  // ==========================================================================
  // Demo User Selector & Header
  // ==========================================================================
  setupDemoUserSelector() {
    const select = document.getElementById('demo-user-select');
    const avatar = document.getElementById('demo-user-avatar');
    const resetBtn = document.getElementById('btn-quick-reset');

    if (!select) return;

    // Populate dropdown
    select.innerHTML = State.users.map(u => `
      <option value="${u.id}">
        ${escapeHTML(u.name)} (${u.major.split(' ')[0]} - ★${u.averageRating || 'New'})
      </option>
    `).join('');

    if (State.currentUser) {
      select.value = State.currentUser.id;
      if (avatar) avatar.src = State.currentUser.avatar;
    }

    select.addEventListener('change', (e) => {
      const selected = State.users.find(u => u.id === e.target.value);
      if (selected) {
        State.setCurrentUser(selected);
        showToast(`Switched active demo user to ${selected.name}`, 'info');
      }
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.confirmResetDatabase());
    }
  },

  updateDemoUserUI() {
    const user = State.currentUser;
    if (!user) return;

    const select = document.getElementById('demo-user-select');
    const avatar = document.getElementById('demo-user-avatar');
    if (select) select.value = user.id;
    if (avatar) avatar.src = user.avatar;

    // Update Post Gig form notice
    const postAvatar = document.getElementById('post-user-avatar');
    const postName = document.getElementById('post-user-name');
    const postMajor = document.getElementById('post-user-major');
    if (postAvatar) postAvatar.src = user.avatar;
    if (postName) postName.textContent = user.name;
    if (postMajor) postMajor.textContent = `${user.major} • ${user.semester}`;

    this.updateDashboardBadge();
  },

  async updateDashboardBadge() {
    const badge = document.getElementById('nav-dashboard-badge');
    if (!badge || !State.currentUser) return;

    try {
      const [gigsRes, appsRes] = await Promise.all([
        API.getGigs({ ownerId: State.currentUser.id }),
        API.getApplications({ applicantId: State.currentUser.id })
      ]);

      const myGigsCount = gigsRes.data ? gigsRes.data.length : 0;
      const myAppsCount = appsRes.data ? appsRes.data.length : 0;
      const total = myGigsCount + myAppsCount;

      if (total > 0) {
        badge.textContent = total;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    } catch (e) {
      // ignore badge update error
    }
  },

  // ==========================================================================
  // Navigation Tabs
  // ==========================================================================
  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const brand = document.getElementById('brand-logo');

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const tab = link.getAttribute('data-tab');
        if (tab) State.setActiveTab(tab);
      });
    });

    if (brand) {
      brand.addEventListener('click', () => State.setActiveTab('explore'));
    }

    const shortcutBtn = document.getElementById('btn-post-shortcut');
    if (shortcutBtn) {
      shortcutBtn.addEventListener('click', () => State.setActiveTab('post'));
    }
  },

  handleTabSwitch(tabName) {
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('data-tab') === tabName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update active tab pane
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.remove('active');
    });

    const activePane = document.getElementById(`tab-${tabName}`);
    if (activePane) {
      activePane.classList.add('active');
    }

    // Tab-specific rendering
    if (tabName === 'explore') {
      this.updateStatsBar();
      this.renderExploreGigs();
    } else if (tabName === 'dashboard') {
      this.renderDashboard();
    } else if (tabName === 'directory') {
      this.renderStudentDirectory();
    } else if (tabName === 'post') {
      this.updateDemoUserUI();
    }
  },

  // ==========================================================================
  // Stats Bar
  // ==========================================================================
  async updateStatsBar() {
    try {
      const statsRes = await API.getStats();
      const stats = statsRes.data;
      if (!stats) return;

      const totalGigs = document.getElementById('stat-total-gigs');
      const openGigs = document.getElementById('stat-open-gigs');
      const totalStudents = document.getElementById('stat-total-students');
      const completedGigs = document.getElementById('stat-completed-gigs');

      if (totalGigs) totalGigs.textContent = stats.totalGigs;
      if (openGigs) openGigs.textContent = stats.openGigs;
      if (totalStudents) totalStudents.textContent = stats.totalUsers;
      if (completedGigs) completedGigs.textContent = stats.completedGigs;
    } catch (e) {
      console.warn('Could not update stats bar:', e);
    }
  },

  // ==========================================================================
  // Explore Gigs & Filters
  // ==========================================================================
  setupFilterListeners() {
    const searchInput = document.getElementById('filter-search');
    const clearSearch = document.getElementById('btn-clear-search');
    const categoryPills = document.querySelectorAll('.pill-btn');
    const typeSelect = document.getElementById('filter-type');
    const paymentSelect = document.getElementById('filter-payment');
    const statusSelect = document.getElementById('filter-status');
    const sortSelect = document.getElementById('filter-sort');
    const resetBtn = document.getElementById('btn-reset-filters');

    // Debounced search
    let debounceTimer;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (clearSearch) clearSearch.style.display = val ? 'flex' : 'none';

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          State.setFilter('q', val);
        }, 250);
      });
    }

    if (clearSearch && searchInput) {
      clearSearch.addEventListener('click', () => {
        searchInput.value = '';
        clearSearch.style.display = 'none';
        State.setFilter('q', '');
      });
    }

    // Category pills
    categoryPills.forEach(pill => {
      pill.addEventListener('click', () => {
        categoryPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const cat = pill.getAttribute('data-category');
        State.setFilter('category', cat);
      });
    });

    // Secondary filters
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => State.setFilter('type', e.target.value));
    }
    if (paymentSelect) {
      paymentSelect.addEventListener('change', (e) => State.setFilter('paymentType', e.target.value));
    }
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => State.setFilter('status', e.target.value));
    }
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => State.setFilter('sort', e.target.value));
    }

    // Reset filters button
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (clearSearch) clearSearch.style.display = 'none';
        categoryPills.forEach(p => {
          p.classList.toggle('active', p.getAttribute('data-category') === 'All');
        });
        if (typeSelect) typeSelect.value = 'All';
        if (paymentSelect) paymentSelect.value = 'All';
        if (statusSelect) statusSelect.value = 'All';
        if (sortSelect) sortSelect.value = 'newest';

        State.resetFilters();
      });
    }
  },

  updateActiveFilterChips() {
    const container = document.getElementById('active-chips-container');
    if (!container) return;

    const f = State.filters;
    const chips = [];

    if (f.q) chips.push({ label: `Search: "${f.q}"`, key: 'q', defaultVal: '' });
    if (f.category && f.category !== 'All') chips.push({ label: `Category: ${f.category}`, key: 'category', defaultVal: 'All' });
    if (f.type && f.type !== 'All') chips.push({ label: `Type: ${f.type}`, key: 'type', defaultVal: 'All' });
    if (f.paymentType && f.paymentType !== 'All') chips.push({ label: `Payment: ${f.paymentType}`, key: 'paymentType', defaultVal: 'All' });
    if (f.status && f.status !== 'All') chips.push({ label: `Status: ${f.status}`, key: 'status', defaultVal: 'All' });

    if (chips.length === 0) {
      container.style.display = 'none';
      container.innerHTML = '';
      return;
    }

    container.style.display = 'flex';
    container.innerHTML = `
      <span style="font-size:0.75rem; color:var(--text-muted); align-self:center;">Active filters:</span>
      ${chips.map(c => `
        <span class="chip">
          ${escapeHTML(c.label)}
          <span class="chip-remove" onclick="App.removeFilter('${c.key}', '${c.defaultVal}')">&times;</span>
        </span>
      `).join('')}
    `;
  },

  removeFilter(key, defaultVal) {
    if (key === 'q') {
      const searchInput = document.getElementById('filter-search');
      const clearSearch = document.getElementById('btn-clear-search');
      if (searchInput) searchInput.value = '';
      if (clearSearch) clearSearch.style.display = 'none';
    } else if (key === 'category') {
      document.querySelectorAll('.pill-btn').forEach(p => {
        p.classList.toggle('active', p.getAttribute('data-category') === 'All');
      });
    } else {
      const select = document.getElementById(`filter-${key}`);
      if (select) select.value = defaultVal;
    }
    State.setFilter(key, defaultVal);
  },

  async renderExploreGigs() {
    const grid = document.getElementById('gigs-grid');
    const countHeader = document.getElementById('gigs-results-count');
    if (!grid) return;

    // Loading Skeletons
    grid.innerHTML = Array(6).fill('<div class="skeleton-card"></div>').join('');
    if (countHeader) countHeader.textContent = 'Searching campus gigs...';

    try {
      // Fetch matching gigs and current user's applications
      const [gigsRes, userAppsRes] = await Promise.all([
        API.getGigs(State.filters),
        State.currentUser ? API.getApplications({ applicantId: State.currentUser.id }) : { data: [] }
      ]);

      const gigs = gigsRes.data || [];
      const userAppliedGigIds = new Set((userAppsRes.data || []).map(a => a.gigId));

      if (countHeader) {
        countHeader.textContent = `Showing ${gigs.length} ${gigs.length === 1 ? 'Campus Gig' : 'Campus Gigs'}`;
      }

      if (gigs.length === 0) {
        grid.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <h3>No gigs matched your search</h3>
            <p>Try clearing some filters or searching for different keywords.</p>
            <button class="btn btn-primary" onclick="App.removeFilter('category', 'All'); State.resetFilters();">
              Reset Filters
            </button>
          </div>
        `;
        return;
      }

      grid.innerHTML = gigs.map(gig => this.buildGigCardHTML(gig, userAppliedGigIds)).join('');
    } catch (err) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <h3>Failed to load gigs</h3>
          <p>${escapeHTML(err.message)}</p>
          <button class="btn btn-secondary" onclick="App.renderExploreGigs()">Retry</button>
        </div>
      `;
    }
  },

  buildGigCardHTML(gig, userAppliedGigIds = new Set()) {
    const isOwner = State.currentUser && State.currentUser.id === gig.ownerId;
    const hasApplied = userAppliedGigIds.has(gig.id);
    const catClass = getCategoryBadgeClass(gig.category);
    const paymentBadge = getPaymentBadge(gig.paymentType, gig.budget);
    const statusBadge = getStatusBadge(gig.status);
    const typeBadge = gig.type === 'Offering'
      ? '<span class="badge badge-offering">Offering</span>'
      : '<span class="badge badge-requesting">Requesting</span>';

    const tagsHTML = (gig.tags || []).slice(0, 3).map(t => `<span class="gig-tag">${escapeHTML(t)}</span>`).join('');

    // Contextual button
    let actionBtnHTML = '';
    if (isOwner) {
      actionBtnHTML = `
        <button class="btn btn-sm btn-secondary" onclick="App.openGigModal('${gig.id}')">
          Manage (Owner)
        </button>
      `;
    } else if (hasApplied) {
      actionBtnHTML = `
        <button class="btn btn-sm btn-secondary" onclick="App.openGigModal('${gig.id}')">
          View (Applied ✓)
        </button>
      `;
    } else if (gig.status === 'open') {
      actionBtnHTML = `
        <button class="btn btn-sm btn-primary" onclick="App.openGigModal('${gig.id}')">
          Apply Now
        </button>
      `;
    } else {
      actionBtnHTML = `
        <button class="btn btn-sm btn-secondary" onclick="App.openGigModal('${gig.id}')">
          Details
        </button>
      `;
    }

    const ownerName = gig.owner ? escapeHTML(gig.owner.name) : 'Student';
    const ownerAvatar = gig.owner ? gig.owner.avatar : '';
    const ownerMajor = gig.owner ? escapeHTML(gig.owner.major) : '';
    const ownerRating = gig.owner ? renderStars(gig.owner.averageRating, gig.owner.reviewCount) : '';

    return `
      <div class="gig-card" data-gig-id="${gig.id}">
        <div>
          <div class="gig-card-header">
            <div class="badge-row">
              ${typeBadge}
              <span class="badge ${catClass}">${escapeHTML(gig.category)}</span>
              ${paymentBadge}
            </div>
            ${statusBadge}
          </div>

          <h3 class="gig-card-title" onclick="App.openGigModal('${gig.id}')">
            ${escapeHTML(gig.title)}
          </h3>

          <p class="gig-card-desc">
            ${escapeHTML(gig.description)}
          </p>

          <div class="gig-tags">
            ${tagsHTML}
          </div>
        </div>

        <div>
          <div class="gig-owner-row">
            <div class="owner-info" onclick="App.openStudentModal('${gig.ownerId}')" title="View student profile">
              <img src="${ownerAvatar}" alt="${ownerName}" class="avatar-sm">
              <div class="owner-details">
                <span class="owner-name">${ownerName}</span>
                <span class="owner-meta">${ownerMajor}</span>
              </div>
            </div>
            <div>
              ${ownerRating}
            </div>
          </div>

          <div class="gig-card-footer">
            <div class="gig-meta-info">
              <span>📅 Due: ${formatDate(gig.deadline)}</span>
              <span>👥 ${gig.applicantCount || 0} ${gig.applicantCount === 1 ? 'applicant' : 'applicants'}</span>
            </div>
            ${actionBtnHTML}
          </div>
        </div>
      </div>
    `;
  },

  // ==========================================================================
  // Post a Gig Form
  // ==========================================================================
  setupPostGigForm() {
    const form = document.getElementById('form-post-gig');
    const paymentSelect = document.getElementById('post-payment-type');
    const budgetGroup = document.getElementById('group-budget');
    const budgetInput = document.getElementById('post-budget');
    const cancelBtn = document.getElementById('btn-cancel-post');
    const deadlineInput = document.getElementById('post-deadline');

    // Default deadline to 14 days from now
    if (deadlineInput) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 14);
      deadlineInput.value = defaultDate.toISOString().split('T')[0];
    }

    // Toggle budget input visibility based on payment type
    if (paymentSelect && budgetGroup && budgetInput) {
      paymentSelect.addEventListener('change', () => {
        if (paymentSelect.value === 'Paid') {
          budgetGroup.style.display = 'block';
          budgetInput.required = true;
          if (!budgetInput.value) budgetInput.value = '35';
        } else {
          budgetGroup.style.display = 'none';
          budgetInput.required = false;
          budgetInput.value = '0';
        }
      });
    }

    // Quick tag chips
    document.querySelectorAll('.btn-tag-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const tag = chip.getAttribute('data-tag');
        const tagsInput = document.getElementById('post-tags');
        if (tagsInput && tag) {
          const current = tagsInput.value.split(',').map(s => s.trim()).filter(Boolean);
          if (!current.includes(tag)) {
            current.push(tag);
            tagsInput.value = current.join(', ');
          }
        }
      });
    });

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => State.setActiveTab('explore'));
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleCreateGigSubmit();
      });
    }
  },

  async handleCreateGigSubmit() {
    if (!State.currentUser) {
      showToast('Please select a demo user before posting a gig.', 'error');
      return;
    }

    const title = document.getElementById('post-title').value.trim();
    const type = document.querySelector('input[name="gigType"]:checked')?.value || 'Offering';
    const category = document.getElementById('post-category').value;
    const paymentType = document.getElementById('post-payment-type').value;
    const budget = parseFloat(document.getElementById('post-budget').value) || 0;
    const deadline = document.getElementById('post-deadline').value;
    const tags = document.getElementById('post-tags').value;
    const description = document.getElementById('post-description').value.trim();

    // Client Validation
    if (title.length < 3) {
      showToast('Title must be at least 3 characters.', 'error');
      return;
    }
    if (description.length < 10) {
      showToast('Description must be at least 10 characters.', 'error');
      return;
    }
    if (paymentType === 'Paid' && budget < 0) {
      showToast('Paid gigs require a non-negative budget.', 'error');
      return;
    }

    const submitBtn = document.getElementById('btn-submit-post');
    const spinner = submitBtn?.querySelector('.btn-spinner');
    if (submitBtn) submitBtn.disabled = true;
    if (spinner) spinner.style.display = 'inline-block';

    try {
      const payload = {
        title,
        type,
        category,
        paymentType,
        budget,
        deadline,
        tags,
        description,
        ownerId: State.currentUser.id
      };

      const res = await API.createGig(payload);
      showToast('Gig published successfully!', 'success');

      // Reset form
      document.getElementById('form-post-gig').reset();
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 14);
      document.getElementById('post-deadline').value = defaultDate.toISOString().split('T')[0];

      // Switch to explore tab and highlight new gig
      State.setActiveTab('explore');
      this.updateStatsBar();
      this.renderExploreGigs();
    } catch (err) {
      showToast(`Failed to create gig: ${err.message}`, 'error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (spinner) spinner.style.display = 'none';
    }
  },

  // ==========================================================================
  // Gig Details Modal & Contextual Actions
  // ==========================================================================
  async openGigModal(gigId) {
    const modal = document.getElementById('modal-gig-detail');
    const content = document.getElementById('modal-gig-content');
    if (!modal || !content) return;

    modal.style.display = 'flex';
    content.innerHTML = `<div style="text-align:center; padding:3rem;"><div class="btn-spinner" style="width:28px;height:28px;border-color:var(--primary);border-top-color:transparent;"></div></div>`;

    try {
      const res = await API.getGig(gigId);
      const gig = res.data;
      if (!gig) throw new Error('Gig not found');

      this.renderGigModalContent(gig);
    } catch (err) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <h3>Could not load gig</h3>
          <p>${escapeHTML(err.message)}</p>
          <button class="btn btn-secondary" onclick="App.closeModal('modal-gig-detail')">Close</button>
        </div>
      `;
    }
  },

  renderGigModalContent(gig) {
    const content = document.getElementById('modal-gig-content');
    if (!content) return;

    const user = State.currentUser;
    const isOwner = user && user.id === gig.ownerId;
    const isAcceptedApplicant = user && gig.acceptedApplicantId === user.id;

    // Check if current user has applied
    const userApplication = (gig.applications || []).find(a => user && a.applicantId === user.id);

    const catClass = getCategoryBadgeClass(gig.category);
    const paymentBadge = getPaymentBadge(gig.paymentType, gig.budget);
    const statusBadge = getStatusBadge(gig.status);
    const typeBadge = gig.type === 'Offering'
      ? '<span class="badge badge-offering">Offering a Skill</span>'
      : '<span class="badge badge-requesting">Requesting Help</span>';

    const tagsHTML = (gig.tags || []).map(t => `<span class="gig-tag">${escapeHTML(t)}</span>`).join('');

    const ownerName = gig.owner ? escapeHTML(gig.owner.name) : 'Student';
    const ownerAvatar = gig.owner ? gig.owner.avatar : '';
    const ownerMajor = gig.owner ? escapeHTML(gig.owner.major) : '';
    const ownerSemester = gig.owner ? escapeHTML(gig.owner.semester) : '';
    const ownerRating = gig.owner ? renderStars(gig.owner.averageRating, gig.owner.reviewCount) : '';
    const ownerCompleted = gig.owner ? gig.owner.completedGigs : 0;

    // ==========================================
    // Contextual Action Block Rendering
    // ==========================================
    let actionBlockHTML = '';

    // CASE 1: Current user is the GIG OWNER
    if (isOwner) {
      actionBlockHTML = `
        <div class="modal-section" style="background:#f8fafc; padding:1.25rem; border-radius:var(--radius-md); margin-top:1.5rem; border:1px solid var(--border);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <div>
              <span class="badge badge-primary">You Own This Gig</span>
              <h4 style="margin-top:0.25rem;">Owner Controls & Applicant Management</h4>
            </div>
            ${gig.status === 'in_progress' ? `
              <button class="btn btn-sm btn-success" onclick="App.completeGig('${gig.id}')">
                ✓ Mark Gig as Completed
              </button>
            ` : ''}
          </div>

          ${this.buildOwnerApplicantListHTML(gig)}
        </div>
      `;
    }
    // CASE 2: Current user is NOT owner, and gig is OPEN
    else if (gig.status === 'open') {
      if (userApplication) {
        actionBlockHTML = `
          <div class="modal-section" style="background:#eff6ff; padding:1.25rem; border-radius:var(--radius-md); margin-top:1.5rem; border:1px solid #bfdbfe;">
            <h4 style="color:#1e40af; margin-bottom:0.25rem;">You have applied for this gig</h4>
            <p style="font-size:0.85rem; color:#3b82f6; margin-bottom:0.75rem;">
              Status: <strong>${userApplication.status.toUpperCase()}</strong> • Applied on ${formatDate(userApplication.createdAt)}
            </p>
            <div class="app-message-box">
              <strong>Your proposal:</strong> ${escapeHTML(userApplication.message)}
            </div>
          </div>
        `;
      } else {
        actionBlockHTML = `
          <div class="modal-section" style="background:#f8fafc; padding:1.25rem; border-radius:var(--radius-md); margin-top:1.5rem; border:1px solid var(--border);">
            <h4>Apply for this Gig</h4>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">
              Applying as <strong>${escapeHTML(user.name)}</strong> (${escapeHTML(user.major)}). Introduce yourself and outline how you can help.
            </p>
            <form id="form-apply-gig" onsubmit="App.handleApplySubmit(event, '${gig.id}')">
              <div class="form-group">
                <textarea id="apply-message" class="form-textarea" rows="3" placeholder="Hi! I have experience with this and would love to collaborate..." required minlength="5"></textarea>
              </div>
              <div style="display:flex; justify-content:flex-end;">
                <button type="submit" class="btn btn-primary" id="btn-submit-apply">
                  Send Application
                </button>
              </div>
            </form>
          </div>
        `;
      }
    }
    // CASE 3: Gig is IN PROGRESS
    else if (gig.status === 'in_progress') {
      const acceptedApplicant = gig.acceptedApplicant;
      actionBlockHTML = `
        <div class="modal-section" style="background:#fffbeb; padding:1.25rem; border-radius:var(--radius-md); margin-top:1.5rem; border:1px solid #fde68a;">
          <h4 style="color:#92400e; margin-bottom:0.25rem;">⚡ Gig Currently In Progress</h4>
          <p style="font-size:0.88rem; color:#78350f;">
            ${isAcceptedApplicant ? 'You are the accepted collaborator working on this gig!' : `Collaborating with: <strong>${acceptedApplicant ? escapeHTML(acceptedApplicant.name) : 'Accepted student'}</strong>.`}
          </p>
          ${isOwner ? `
            <button class="btn btn-sm btn-success" style="margin-top:0.75rem;" onclick="App.completeGig('${gig.id}')">
              ✓ Mark Gig as Completed
            </button>
          ` : ''}
        </div>
      `;
    }

    // ==========================================
    // Completed Gig: Review Submission & List
    // ==========================================
    let reviewsBlockHTML = '';
    if (gig.status === 'completed') {
      const isEligibleToReview = isOwner || isAcceptedApplicant;
      const myReview = (gig.reviews || []).find(r => user && r.reviewerId === user.id);

      reviewsBlockHTML = `
        <div class="modal-section">
          <h4>Peer Reviews & Feedback</h4>

          ${isEligibleToReview ? (
            myReview ? `
              <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:1rem; border-radius:var(--radius-md); margin-bottom:1rem;">
                <span style="font-size:0.85rem; color:#065f46; font-weight:700;">✓ You submitted a review:</span>
                <div style="margin-top:0.35rem;">
                  <span class="stars">${'★'.repeat(myReview.rating)}</span> <strong>${myReview.rating}/5</strong>
                  <p style="font-size:0.88rem; color:#065f46; margin-top:0.25rem;">"${escapeHTML(myReview.comment)}"</p>
                </div>
              </div>
            ` : `
              <div style="background:#f8fafc; border:1px solid var(--border); padding:1.25rem; border-radius:var(--radius-md); margin-bottom:1.25rem;">
                <h5 style="font-size:0.95rem; font-weight:700; margin-bottom:0.25rem;">Submit Your Review</h5>
                <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.75rem;">
                  Rate your collaboration experience from 1 to 5 stars.
                </p>
                <form id="form-submit-review" onsubmit="App.handleReviewSubmit(event, '${gig.id}')">
                  <div class="star-rating-select" id="star-selector">
                    <span class="star-item active" data-rating="1">★</span>
                    <span class="star-item active" data-rating="2">★</span>
                    <span class="star-item active" data-rating="3">★</span>
                    <span class="star-item active" data-rating="4">★</span>
                    <span class="star-item active" data-rating="5">★</span>
                  </div>
                  <input type="hidden" id="review-rating-val" value="5">
                  <div class="form-group" style="margin-bottom:0.75rem;">
                    <textarea id="review-comment" class="form-textarea" rows="2" placeholder="Write feedback about communication, punctuality, and quality..." required minlength="3"></textarea>
                  </div>
                  <button type="submit" class="btn btn-primary btn-sm" id="btn-submit-rev">
                    Submit Review
                  </button>
                </form>
              </div>
            `
          ) : ''}

          <!-- Display all reviews for this gig -->
          ${(gig.reviews && gig.reviews.length > 0) ? `
            <div class="reviews-list">
              ${gig.reviews.map(rev => {
                const reviewer = State.users.find(u => u.id === rev.reviewerId);
                const reviewerName = reviewer ? escapeHTML(reviewer.name) : 'Student';
                const reviewerAvatar = reviewer ? reviewer.avatar : '';
                return `
                  <div class="review-item">
                    <div class="review-item-header">
                      <div style="display:flex; align-items:center; gap:0.5rem;">
                        <img src="${reviewerAvatar}" alt="${reviewerName}" class="avatar-sm">
                        <strong style="font-size:0.88rem;">${reviewerName}</strong>
                      </div>
                      <div>
                        <span class="stars">${'★'.repeat(rev.rating)}</span>
                        <small class="text-muted">${formatDate(rev.createdAt)}</small>
                      </div>
                    </div>
                    <p class="review-comment">"${escapeHTML(rev.comment)}"</p>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <p class="text-muted" style="font-size:0.85rem;">No reviews submitted yet for this completed gig.</p>
          `}
        </div>
      `;
    }

    content.innerHTML = `
      <div class="modal-gig-header">
        <div class="badge-row" style="margin-bottom:0.5rem;">
          ${typeBadge}
          <span class="badge ${catClass}">${escapeHTML(gig.category)}</span>
          ${paymentBadge}
          ${statusBadge}
        </div>
        <h2>${escapeHTML(gig.title)}</h2>
      </div>

      <!-- Owner Profile Bar -->
      <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:0.85rem 1.25rem; border-radius:var(--radius-md); border:1px solid var(--border); margin-bottom:1.25rem;">
        <div class="owner-info" onclick="App.openStudentModal('${gig.ownerId}')" title="Click to view student profile">
          <img src="${ownerAvatar}" alt="${ownerName}" class="avatar-md">
          <div class="owner-details">
            <span class="owner-name" style="font-size:0.95rem;">${ownerName}</span>
            <span class="owner-meta">${ownerMajor} • ${ownerSemester}</span>
          </div>
        </div>
        <div style="text-align:right;">
          <div>${ownerRating}</div>
          <small class="text-muted">${ownerCompleted} gigs completed</small>
        </div>
      </div>

      <!-- Description & Details -->
      <div class="modal-section" style="border-top:none; padding-top:0;">
        <h4>About this Gig</h4>
        <p style="font-size:0.95rem; color:#334155; line-height:1.6; white-space:pre-line;">
          ${escapeHTML(gig.description)}
        </p>

        <div style="display:flex; gap:1.5rem; margin-top:1.25rem; font-size:0.85rem; color:var(--text-muted); flex-wrap:wrap;">
          <span>📅 <strong>Deadline:</strong> ${formatDate(gig.deadline)}</span>
          <span>👥 <strong>Applications:</strong> ${gig.applications ? gig.applications.length : 0}</span>
          <span>🕒 <strong>Posted:</strong> ${formatDate(gig.createdAt)}</span>
        </div>

        <div class="gig-tags" style="margin-top:1rem; margin-bottom:0;">
          ${tagsHTML}
        </div>
      </div>

      <!-- Contextual Action Block -->
      ${actionBlockHTML}

      <!-- Reviews Block -->
      ${reviewsBlockHTML}
    `;

    // Setup interactive star selector if present
    this.setupStarSelector();
  },

  buildOwnerApplicantListHTML(gig) {
    const apps = gig.applications || [];
    if (apps.length === 0) {
      return `<p class="text-muted" style="font-size:0.88rem;">No applications received yet. Share your gig with campus classmates!</p>`;
    }

    return `
      <div class="applicants-list">
        <h5 style="font-size:0.9rem; margin-bottom:0.75rem; color:var(--text-muted);">
          Applicants (${apps.length})
        </h5>
        ${apps.map(app => {
          const applicant = app.applicant || State.users.find(u => u.id === app.applicantId);
          const appName = applicant ? escapeHTML(applicant.name) : 'Applicant';
          const appAvatar = applicant ? applicant.avatar : '';
          const appMajor = applicant ? escapeHTML(applicant.major) : '';
          const appRating = applicant ? renderStars(applicant.averageRating, applicant.reviewCount) : '';

          let statusBadgeClass = 'badge-secondary';
          if (app.status === 'accepted') statusBadgeClass = 'badge-status-open';
          if (app.status === 'rejected') statusBadgeClass = 'badge-status-cancelled';

          return `
            <div class="applicant-card">
              <div style="flex:1;">
                <div class="applicant-user" onclick="App.openStudentModal('${app.applicantId}')" style="cursor:pointer;" title="View student profile">
                  <img src="${appAvatar}" alt="${appName}" class="avatar-sm">
                  <div>
                    <strong style="font-size:0.9rem;">${appName}</strong>
                    <span style="font-size:0.75rem; color:var(--text-muted);">(${appMajor})</span>
                    <span style="margin-left:0.5rem;">${appRating}</span>
                  </div>
                </div>
                <div class="app-message-box" style="margin-top:0.4rem;">
                  "${escapeHTML(app.message)}"
                </div>
              </div>

              <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.4rem; min-width:140px;">
                <span class="badge ${statusBadgeClass}">
                  ${app.status.toUpperCase()}
                </span>

                ${(gig.status === 'open' && app.status === 'pending') ? `
                  <div style="display:flex; gap:0.35rem;">
                    <button class="btn btn-sm btn-success" onclick="App.acceptApplicant('${app.id}', '${gig.id}')">
                      Accept
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="App.rejectApplicant('${app.id}', '${gig.id}')">
                      Reject
                    </button>
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  setupStarSelector() {
    const starSelector = document.getElementById('star-selector');
    const ratingInput = document.getElementById('review-rating-val');
    if (!starSelector || !ratingInput) return;

    const stars = starSelector.querySelectorAll('.star-item');
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const rating = parseInt(star.getAttribute('data-rating'), 10);
        ratingInput.value = rating;

        stars.forEach(s => {
          const r = parseInt(s.getAttribute('data-rating'), 10);
          if (r <= rating) {
            s.classList.add('active');
          } else {
            s.classList.remove('active');
          }
        });
      });
    });
  },

  // ==========================================================================
  // Application Submission & Management
  // ==========================================================================
  async handleApplySubmit(event, gigId) {
    event.preventDefault();
    if (!State.currentUser) return;

    const message = document.getElementById('apply-message').value.trim();
    if (message.length < 5) {
      showToast('Application message must be at least 5 characters.', 'error');
      return;
    }

    const submitBtn = document.getElementById('btn-submit-apply');
    if (submitBtn) submitBtn.disabled = true;

    try {
      await API.createApplication({
        gigId,
        applicantId: State.currentUser.id,
        message
      });

      showToast('Application sent successfully!', 'success');
      // Refresh modal
      await this.openGigModal(gigId);
      this.updateDashboardBadge();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  },

  async acceptApplicant(applicationId, gigId) {
    if (!State.currentUser) return;

    try {
      const res = await API.updateApplication(applicationId, {
        status: 'accepted',
        actionUserId: State.currentUser.id
      });

      showToast(res.message || 'Applicant accepted! Gig is now In Progress.', 'success');
      await this.openGigModal(gigId);
      this.updateStatsBar();
      this.updateDashboardBadge();
    } catch (err) {
      showToast(`Failed to accept applicant: ${err.message}`, 'error');
    }
  },

  async rejectApplicant(applicationId, gigId) {
    if (!State.currentUser) return;

    try {
      await API.updateApplication(applicationId, {
        status: 'rejected',
        actionUserId: State.currentUser.id
      });

      showToast('Application rejected.', 'info');
      await this.openGigModal(gigId);
    } catch (err) {
      showToast(`Failed to reject application: ${err.message}`, 'error');
    }
  },

  async completeGig(gigId) {
    try {
      await API.updateGig(gigId, { status: 'completed' });
      showToast('Gig marked as Completed! You can now submit a review.', 'success');
      await this.openGigModal(gigId);
      this.updateStatsBar();
      this.updateDashboardBadge();
    } catch (err) {
      showToast(`Failed to complete gig: ${err.message}`, 'error');
    }
  },

  async handleReviewSubmit(event, gigId) {
    event.preventDefault();
    if (!State.currentUser) return;

    const rating = parseInt(document.getElementById('review-rating-val').value, 10) || 5;
    const comment = document.getElementById('review-comment').value.trim();

    if (comment.length < 3) {
      showToast('Review comment must be at least 3 characters.', 'error');
      return;
    }

    const btn = document.getElementById('btn-submit-rev');
    if (btn) btn.disabled = true;

    try {
      await API.createReview({
        gigId,
        reviewerId: State.currentUser.id,
        rating,
        comment
      });

      showToast('Review submitted successfully!', 'success');
      // Reload updated users list
      const freshUsers = await API.getUsers();
      State.users = freshUsers.data || [];

      await this.openGigModal(gigId);
    } catch (err) {
      showToast(`Failed to submit review: ${err.message}`, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  // ==========================================================================
  // My Dashboard
  // ==========================================================================
  async renderDashboard() {
    const user = State.currentUser;
    if (!user) return;

    // Fetch fresh user data with reviews
    try {
      const userRes = await API.getUser(user.id);
      const enriched = userRes.data;

      // Update hero card
      document.getElementById('dash-avatar').src = enriched.avatar;
      document.getElementById('dash-name').textContent = enriched.name;
      document.getElementById('dash-major').textContent = enriched.major;
      document.getElementById('dash-semester').textContent = enriched.semester;
      document.getElementById('dash-bio').textContent = enriched.bio || 'Student collaborator on campus.';

      document.getElementById('dash-rating').innerHTML = enriched.averageRating
        ? `★ ${enriched.averageRating.toFixed(1)}`
        : '--';
      document.getElementById('dash-reviews-count').textContent = enriched.reviewCount || 0;
      document.getElementById('dash-completed-count').textContent = enriched.completedGigs || 0;

      const skillsContainer = document.getElementById('dash-skills-tags');
      if (skillsContainer) {
        skillsContainer.innerHTML = (enriched.skills || []).map(s => `
          <span class="gig-tag">${escapeHTML(s)}</span>
        `).join('');
      }

      // Fetch user's gigs and applications
      const [myGigsRes, myAppsRes] = await Promise.all([
        API.getGigs({ ownerId: user.id }),
        API.getApplications({ applicantId: user.id })
      ]);

      const myGigs = myGigsRes.data || [];
      const myApps = myAppsRes.data || [];

      // Also find gigs in progress or completed where user was accepted applicant
      const allGigsRes = await API.getGigs();
      const allGigs = allGigsRes.data || [];
      const myCollabs = allGigs.filter(g =>
        (g.ownerId === user.id || g.acceptedApplicantId === user.id) &&
        (g.status === 'in_progress' || g.status === 'completed')
      );

      // Update count indicators
      document.getElementById('count-my-gigs').textContent = myGigs.length;
      document.getElementById('count-my-apps').textContent = myApps.length;
      document.getElementById('count-my-collabs').textContent = myCollabs.length;

      // Render Subtabs
      this.renderMyGigsTab(myGigs);
      this.renderMyAppsTab(myApps);
      this.renderMyCollabsTab(myCollabs);

      this.setupDashboardSubtabs();
    } catch (err) {
      console.error('Error rendering dashboard:', err);
    }
  },

  setupDashboardSubtabs() {
    document.querySelectorAll('.dash-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.dash-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.dash-subpane').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const tabKey = btn.getAttribute('data-dash-tab');
        const pane = document.getElementById(`dash-tab-${tabKey}`);
        if (pane) pane.classList.add('active');
      });
    });
  },

  renderMyGigsTab(gigs) {
    const container = document.getElementById('dash-my-gigs-grid');
    if (!container) return;

    if (gigs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>You haven't posted any gigs yet</h3>
          <p>Offer a skill or request help from peers on campus.</p>
          <button class="btn btn-primary" onclick="State.setActiveTab('post')">Post Your First Gig</button>
        </div>
      `;
      return;
    }

    container.innerHTML = gigs.map(gig => this.buildGigCardHTML(gig)).join('');
  },

  renderMyAppsTab(apps) {
    const container = document.getElementById('dash-my-apps-list');
    if (!container) return;

    if (apps.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✉️</div>
          <h3>No applications submitted yet</h3>
          <p>Browse open gigs and apply to collaborate with fellow students.</p>
          <button class="btn btn-primary" onclick="State.setActiveTab('explore')">Explore Gigs</button>
        </div>
      `;
      return;
    }

    container.innerHTML = apps.map(app => {
      const gig = app.gig;
      const statusClass = app.status === 'accepted'
        ? 'badge-status-open'
        : (app.status === 'rejected' ? 'badge-status-cancelled' : 'badge-status-in_progress');

      return `
        <div class="app-card">
          <div class="app-main-info" style="flex:1;">
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
              <span class="badge ${statusClass}">${app.status.toUpperCase()}</span>
              <small class="text-muted">Applied on ${formatDate(app.createdAt)}</small>
            </div>
            <h4>${gig ? escapeHTML(gig.title) : 'Campus Gig'}</h4>
            <div class="app-message-box">
              <strong>Your proposal:</strong> "${escapeHTML(app.message)}"
            </div>
          </div>
          <div>
            <button class="btn btn-sm btn-secondary" onclick="App.openGigModal('${app.gigId}')">
              View Gig
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  renderMyCollabsTab(collabs) {
    const container = document.getElementById('dash-my-collabs-grid');
    if (!container) return;

    if (collabs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🤝</div>
          <h3>No active collaborations yet</h3>
          <p>Once you accept an applicant or your application is accepted, ongoing projects will show here.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = collabs.map(gig => this.buildGigCardHTML(gig)).join('');
  },

  // ==========================================================================
  // Student Directory & Profile Modal
  // ==========================================================================
  async renderStudentDirectory() {
    const grid = document.getElementById('students-grid');
    const searchInput = document.getElementById('dir-search');
    if (!grid) return;

    grid.innerHTML = Array(4).fill('<div class="skeleton-card"></div>').join('');

    try {
      const res = await API.getUsers();
      const users = res.data || [];

      this.renderStudentsGrid(users);

      if (searchInput && !searchInput.dataset.listener) {
        searchInput.dataset.listener = 'true';
        searchInput.addEventListener('input', (e) => {
          const q = e.target.value.toLowerCase().trim();
          const filtered = users.filter(u =>
            u.name.toLowerCase().includes(q) ||
            u.major.toLowerCase().includes(q) ||
            (u.skills && u.skills.some(s => s.toLowerCase().includes(q)))
          );
          this.renderStudentsGrid(filtered);
        });
      }
    } catch (err) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <h3>Could not load student directory</h3>
          <p>${escapeHTML(err.message)}</p>
        </div>
      `;
    }
  },

  renderStudentsGrid(users) {
    const grid = document.getElementById('students-grid');
    if (!grid) return;

    if (users.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <h3>No students matched</h3>
          <p>Try searching for another skill or major.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = users.map(user => `
      <div class="student-card">
        <img src="${user.avatar}" alt="${escapeHTML(user.name)}" class="avatar-lg">
        <h3 class="student-name">${escapeHTML(user.name)}</h3>
        <span class="student-major">${escapeHTML(user.major)}</span>
        <span class="student-semester">${escapeHTML(user.semester)}</span>

        <div class="student-rating-badge">
          ${renderStars(user.averageRating, user.reviewCount)}
        </div>

        <p class="student-bio">${escapeHTML(user.bio || '')}</p>

        <div class="student-skills-row">
          ${(user.skills || []).slice(0, 3).map(s => `<span class="gig-tag">${escapeHTML(s)}</span>`).join('')}
        </div>

        <div style="display:flex; justify-content:space-between; width:100%; align-items:center; margin-top:auto; padding-top:0.75rem; border-top:1px solid var(--border);">
          <small class="text-muted">${user.completedGigs || 0} completed</small>
          <button class="btn btn-sm btn-secondary" onclick="App.openStudentModal('${user.id}')">
            View Profile
          </button>
        </div>
      </div>
    `).join('');
  },

  async openStudentModal(userId) {
    const modal = document.getElementById('modal-student-profile');
    const content = document.getElementById('modal-student-content');
    if (!modal || !content) return;

    modal.style.display = 'flex';
    content.innerHTML = `<div style="text-align:center; padding:3rem;"><div class="btn-spinner" style="width:28px;height:28px;border-color:var(--primary);border-top-color:transparent;"></div></div>`;

    try {
      const res = await API.getUser(userId);
      const student = res.data;
      if (!student) throw new Error('Student not found');

      const reviews = student.reviewsReceived || [];

      content.innerHTML = `
        <div style="text-align:center; margin-bottom:1.5rem;">
          <img src="${student.avatar}" alt="${escapeHTML(student.name)}" class="avatar-lg" style="margin-bottom:0.75rem;">
          <h2 style="font-size:1.5rem; font-weight:800; margin-bottom:0.25rem;">${escapeHTML(student.name)}</h2>
          <p style="font-size:0.9rem; color:var(--primary); font-weight:700;">${escapeHTML(student.major)} • ${escapeHTML(student.semester)}</p>
          <div style="margin-top:0.5rem;">
            ${renderStars(student.averageRating, student.reviewCount)}
          </div>
        </div>

        <div style="margin-bottom:1.25rem;">
          <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:0.35rem;">About</h4>
          <p style="font-size:0.88rem; color:#334155; line-height:1.5;">${escapeHTML(student.bio || 'Campus collaborator.')}</p>
        </div>

        <div style="margin-bottom:1.5rem;">
          <h4 style="font-size:0.95rem; font-weight:700; margin-bottom:0.4rem;">Skills</h4>
          <div style="display:flex; flex-wrap:wrap; gap:0.4rem;">
            ${(student.skills || []).map(s => `<span class="gig-tag">${escapeHTML(s)}</span>`).join('')}
          </div>
        </div>

        <div class="modal-section">
          <h4>Peer Reviews (${reviews.length})</h4>
          ${reviews.length > 0 ? `
            <div class="reviews-list">
              ${reviews.map(r => `
                <div class="review-item">
                  <div class="review-item-header">
                    <div style="display:flex; align-items:center; gap:0.4rem;">
                      <img src="${r.reviewer ? r.reviewer.avatar : ''}" alt="" class="avatar-sm">
                      <strong style="font-size:0.85rem;">${r.reviewer ? escapeHTML(r.reviewer.name) : 'Student'}</strong>
                    </div>
                    <div>
                      <span class="stars">${'★'.repeat(r.rating)}</span>
                      <small class="text-muted">${formatDate(r.createdAt)}</small>
                    </div>
                  </div>
                  <p class="review-comment">"${escapeHTML(r.comment)}"</p>
                </div>
              `).join('')}
            </div>
          ` : `
            <p class="text-muted" style="font-size:0.85rem;">No reviews received yet.</p>
          `}
        </div>

        <div style="display:flex; justify-content:center; margin-top:1.5rem;">
          <button class="btn btn-secondary" onclick="App.closeModal('modal-student-profile')">Close</button>
        </div>
      `;
    } catch (err) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <h3>Could not load profile</h3>
          <p>${escapeHTML(err.message)}</p>
          <button class="btn btn-secondary" onclick="App.closeModal('modal-student-profile')">Close</button>
        </div>
      `;
    }
  },

  // ==========================================================================
  // Modals Management
  // ==========================================================================
  setupModals() {
    // Close modal on click backdrop or close button
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.style.display = 'none';
        }
      });
    });

    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-modal');
        if (modalId) this.closeModal(modalId);
      });
    });

    // Reset button in demo guide
    const guideResetBtn = document.getElementById('btn-guide-reset');
    if (guideResetBtn) {
      guideResetBtn.addEventListener('click', () => this.confirmResetDatabase());
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
  },

  confirmResetDatabase() {
    const modal = document.getElementById('modal-confirm');
    const title = document.getElementById('confirm-title');
    const msg = document.getElementById('confirm-message');
    const okBtn = document.getElementById('btn-confirm-ok');
    const cancelBtn = document.getElementById('btn-confirm-cancel');

    if (!modal) return;

    title.textContent = 'Reset Demo Database?';
    msg.textContent = 'This will restore all 14 users, 28 gigs, 24 applications, and 10 reviews back to the clean seed state.';
    modal.style.display = 'flex';

    cancelBtn.onclick = () => {
      modal.style.display = 'none';
    };

    okBtn.onclick = async () => {
      modal.style.display = 'none';
      try {
        await API.resetDatabase();
        showToast('Database reset to clean seed data!', 'success');
        await State.init();
        this.updateStatsBar();
        this.renderExploreGigs();
      } catch (err) {
        showToast(`Failed to reset: ${err.message}`, 'error');
      }
    };
  }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
