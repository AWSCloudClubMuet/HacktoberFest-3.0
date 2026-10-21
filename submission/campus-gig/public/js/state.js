// Campus Gig & SkillSwap Portal - Application State Store

const State = {
  currentUser: null,
  users: [],
  gigs: [],
  userApplications: [],
  stats: null,

  filters: {
    q: '',
    category: 'All',
    type: 'All',
    paymentType: 'All',
    status: 'All',
    sort: 'newest'
  },

  activeTab: 'explore',
  activeModal: null,

  listeners: [],

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },

  notify(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data, this);
      } catch (e) {
        console.error('State notification error:', e);
      }
    });
  },

  async init() {
    try {
      // 1. Load users
      const usersRes = await API.getUsers();
      this.users = usersRes.data || [];

      // 2. Select demo user (stored or default to usr-1 Alex)
      const storedUserId = localStorage.getItem('campus_gig_current_user');
      const defaultUser = this.users.find(u => u.id === storedUserId) || this.users[0];
      this.setCurrentUser(defaultUser);

      // 3. Load stats
      const statsRes = await API.getStats();
      this.stats = statsRes.data;

      this.notify('INIT_COMPLETE');
    } catch (err) {
      console.error('Failed to initialize state:', err);
    }
  },

  setCurrentUser(user) {
    if (!user) return;
    this.currentUser = user;
    localStorage.setItem('campus_gig_current_user', user.id);
    this.notify('USER_CHANGED', user);
  },

  setFilter(key, value) {
    this.filters[key] = value;
    this.notify('FILTER_CHANGED', { key, value });
  },

  resetFilters() {
    this.filters = {
      q: '',
      category: 'All',
      type: 'All',
      paymentType: 'All',
      status: 'All',
      sort: 'newest'
    };
    this.notify('FILTERS_RESET');
  },

  setActiveTab(tabName) {
    this.activeTab = tabName;
    this.notify('TAB_CHANGED', tabName);
  }
};
