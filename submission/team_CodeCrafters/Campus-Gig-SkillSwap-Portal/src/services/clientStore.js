// CampusLoop Persistent Client Storage Engine
// Provides full local database persistence for standalone static deployments (Vercel / Netlify)
// Ensures zero HTTP 405 errors and full CRUD persistence across page reloads

import {
  INITIAL_USERS,
  INITIAL_GIGS,
  INITIAL_APPLICATIONS,
  INITIAL_REVIEWS,
  INITIAL_NOTIFICATIONS,
  INITIAL_CONVERSATIONS
} from '../data/mockData';

const STORAGE_KEY = 'campusloop_persistent_db_v1';

function getStoredData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.gigs)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[CampusLoop Storage] Failed to load cached data:', e);
  }

  // Initialize fresh store from mockData
  const fresh = {
    users: JSON.parse(JSON.stringify(INITIAL_USERS)),
    gigs: JSON.parse(JSON.stringify(INITIAL_GIGS)),
    applications: JSON.parse(JSON.stringify(INITIAL_APPLICATIONS)),
    reviews: JSON.parse(JSON.stringify(INITIAL_REVIEWS)),
    notifications: JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)),
    conversations: JSON.parse(JSON.stringify(INITIAL_CONVERSATIONS)),
    bookmarks: ['gig_1', 'gig_3']
  };

  saveStoredData(fresh);
  return fresh;
}

function saveStoredData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[CampusLoop Storage] Failed to save data to localStorage:', e);
  }
}

// Calculate user rating dynamically from reviews
function calculateUserRating(userId, allReviews) {
  const userReviews = allReviews.filter(r => r.reviewee_id === userId);
  if (!userReviews.length) return { rating: 5.0, count: 0 };
  const sum = userReviews.reduce((acc, r) => acc + Number(r.rating || 5), 0);
  const avg = (sum / userReviews.length).toFixed(1);
  return { rating: parseFloat(avg), count: userReviews.length };
}

export const clientStore = {
  // Reset store to default
  reset: () => {
    localStorage.removeItem(STORAGE_KEY);
    return getStoredData();
  },

  // USERS
  getUsers: async () => {
    const db = getStoredData();
    return db.users.map(u => {
      const { rating, count } = calculateUserRating(u.id, db.reviews);
      return {
        ...u,
        rating: count > 0 ? rating : (u.rating || 5.0),
        reviews_count: count > 0 ? count : (u.reviews_count || 0)
      };
    });
  },

  getUser: async (id) => {
    const db = getStoredData();
    const user = db.users.find(u => u.id === id);
    if (!user) throw new Error('Student profile not found');
    const { rating, count } = calculateUserRating(user.id, db.reviews);
    return {
      ...user,
      rating: count > 0 ? rating : (user.rating || 5.0),
      reviews_count: count > 0 ? count : (user.reviews_count || 0)
    };
  },

  updateProfile: async (id, data, activeUserId) => {
    if (activeUserId && activeUserId !== id) {
      throw new Error('Unauthorized to edit this student profile');
    }
    const db = getStoredData();
    const idx = db.users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('Student profile not found');

    db.users[idx] = { ...db.users[idx], ...data };
    saveStoredData(db);
    return db.users[idx];
  },

  // GIGS
  getGigs: async (filters = {}) => {
    const db = getStoredData();
    let result = [...db.gigs];

    if (filters.category && filters.category !== 'All') {
      result = result.filter(g => g.category.toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.payment_type && filters.payment_type !== 'All') {
      result = result.filter(g => g.payment_type.toLowerCase() === filters.payment_type.toLowerCase());
    }
    if (filters.type && filters.type !== 'All') {
      result = result.filter(g => g.type.toLowerCase() === filters.type.toLowerCase());
    }
    if (filters.status && filters.status !== 'All') {
      result = result.filter(g => g.status.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(g =>
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        (g.skills_required || []).some(s => s.toLowerCase().includes(q))
      );
    }

    return result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  },

  getGig: async (id) => {
    const db = getStoredData();
    const gig = db.gigs.find(g => g.id === id);
    if (!gig) throw new Error('Gig not found');
    return gig;
  },

  createGig: async (gigData, activeUserId = 'usr_1') => {
    const db = getStoredData();
    const poster = db.users.find(u => u.id === activeUserId) || db.users[0];

    // Server-grade input validation
    if (!gigData.title || gigData.title.trim().length < 8) {
      throw new Error('Title must be at least 8 characters long');
    }
    if (!gigData.category) {
      throw new Error('Category is required');
    }
    if (gigData.payment_type === 'Paid') {
      const b = Number(gigData.budget);
      if (isNaN(b) || b <= 0) {
        throw new Error('Paid gigs require a positive budget amount');
      }
    }
    if (!gigData.description || gigData.description.trim().length < 25) {
      throw new Error('Description must be at least 25 characters long');
    }

    const { rating } = calculateUserRating(poster.id, db.reviews);

    const newGig = {
      id: `gig_${Date.now()}`,
      user_id: poster.id,
      title: gigData.title.trim(),
      type: gigData.type || 'Offering',
      category: gigData.category,
      payment_type: gigData.payment_type || 'Paid',
      budget: gigData.payment_type === 'Paid' ? Number(gigData.budget) : null,
      skills_required: Array.isArray(gigData.skills_required) ? gigData.skills_required : [gigData.category],
      description: gigData.description.trim(),
      deadline: gigData.deadline || null,
      status: 'Open',
      applicants_count: 0,
      image: gigData.image || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80",
      poster_name: poster.name,
      poster_avatar: poster.avatar,
      poster_rating: rating || 5.0,
      poster_major: poster.major,
      created_at: new Date().toISOString().split('T')[0]
    };

    db.gigs.unshift(newGig);

    // Increment poster's gigs_posted
    const posterIdx = db.users.findIndex(u => u.id === poster.id);
    if (posterIdx !== -1) {
      db.users[posterIdx].gigs_posted = (db.users[posterIdx].gigs_posted || 0) + 1;
    }

    saveStoredData(db);
    return newGig;
  },

  updateGig: async (id, data, activeUserId) => {
    const db = getStoredData();
    const idx = db.gigs.findIndex(g => g.id === id);
    if (idx === -1) throw new Error('Gig not found');

    const gig = db.gigs[idx];
    if (activeUserId && gig.user_id !== activeUserId && gig.accepted_applicant_id !== activeUserId) {
      throw new Error('Unauthorized to modify this gig');
    }

    // Status transition: In Progress -> Completed
    if (data.status === 'Completed' && gig.status !== 'In Progress') {
      throw new Error('Only gigs in progress can be marked as completed');
    }

    db.gigs[idx] = { ...gig, ...data };

    // If marked completed, update both parties gigs_completed count
    if (data.status === 'Completed' && gig.status === 'In Progress') {
      const ownerIdx = db.users.findIndex(u => u.id === gig.user_id);
      if (ownerIdx !== -1) db.users[ownerIdx].gigs_completed = (db.users[ownerIdx].gigs_completed || 0) + 1;

      if (gig.accepted_applicant_id) {
        const collabIdx = db.users.findIndex(u => u.id === gig.accepted_applicant_id);
        if (collabIdx !== -1) db.users[collabIdx].gigs_completed = (db.users[collabIdx].gigs_completed || 0) + 1;
      }
    }

    saveStoredData(db);
    return db.gigs[idx];
  },

  deleteGig: async (id, activeUserId) => {
    const db = getStoredData();
    const gig = db.gigs.find(g => g.id === id);
    if (!gig) throw new Error('Gig not found');
    if (activeUserId && gig.user_id !== activeUserId) {
      throw new Error('Unauthorized to delete this gig');
    }
    db.gigs = db.gigs.filter(g => g.id !== id);
    saveStoredData(db);
    return { success: true };
  },

  // APPLICATIONS
  getApplications: async (filters = {}) => {
    const db = getStoredData();
    let result = [...db.applications];
    if (filters.gig_id) {
      result = result.filter(a => a.gig_id === filters.gig_id);
    }
    if (filters.applicant_id) {
      result = result.filter(a => a.applicant_id === filters.applicant_id);
    }
    return result;
  },

  submitApplication: async ({ gig_id, message }, activeUserId = 'usr_1') => {
    const db = getStoredData();
    const gig = db.gigs.find(g => g.id === gig_id);
    if (!gig) throw new Error('Target gig not found');

    if (gig.user_id === activeUserId) {
      throw new Error('You cannot apply to your own gig');
    }
    if (gig.status !== 'Open') {
      throw new Error('Applications are closed for this gig');
    }

    const existing = db.applications.find(a =>
      a.gig_id === gig_id && a.applicant_id === activeUserId && a.status !== 'Rejected'
    );
    if (existing) {
      throw new Error('You have already applied to this gig');
    }

    const applicant = db.users.find(u => u.id === activeUserId) || {
      id: activeUserId,
      name: 'Applicant',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      major: 'Student',
      rating: 5.0
    };

    const newApp = {
      id: `app_${Date.now()}`,
      gig_id,
      applicant_id: activeUserId,
      applicant_name: applicant.name,
      applicant_avatar: applicant.avatar,
      applicant_major: applicant.major,
      applicant_rating: applicant.rating || 5.0,
      message: message.trim(),
      status: 'Pending',
      applied_at: new Date().toISOString().split('T')[0]
    };

    db.applications.unshift(newApp);

    // Increment gig applicant counter
    const gigIdx = db.gigs.findIndex(g => g.id === gig_id);
    if (gigIdx !== -1) {
      db.gigs[gigIdx].applicants_count = (db.gigs[gigIdx].applicants_count || 0) + 1;
    }

    // Notify gig owner
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      user_id: gig.user_id,
      type: 'application_received',
      title: 'New Application Received',
      message: `${applicant.name} applied for "${gig.title}": "${message.slice(0, 50)}..."`,
      time: 'Just now',
      read: false,
      gig_id
    });

    saveStoredData(db);
    return newApp;
  },

  acceptApplication: async (applicationId, activeUserId = 'usr_1') => {
    const db = getStoredData();
    const appIdx = db.applications.findIndex(a => a.id === applicationId);
    if (appIdx === -1) throw new Error('Application not found');

    const app = db.applications[appIdx];
    const gigIdx = db.gigs.findIndex(g => g.id === app.gig_id);
    if (gigIdx === -1) throw new Error('Associated gig not found');

    const gig = db.gigs[gigIdx];
    if (gig.user_id !== activeUserId) {
      throw new Error('Only the gig creator can accept applicants');
    }

    // Accept this application
    db.applications[appIdx].status = 'Accepted';

    // Reject competing pending applications
    db.applications.forEach(a => {
      if (a.gig_id === gig.id && a.id !== applicationId && a.status === 'Pending') {
        a.status = 'Rejected';
      }
    });

    // Update gig status to In Progress
    db.gigs[gigIdx].status = 'In Progress';
    db.gigs[gigIdx].accepted_applicant_id = app.applicant_id;

    // Notify accepted student
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      user_id: app.applicant_id,
      type: 'application_accepted',
      title: 'Application Accepted! 🎉',
      message: `Your pitch for "${gig.title}" was accepted! The project is now In Progress.`,
      time: 'Just now',
      read: false,
      gig_id: gig.id
    });

    saveStoredData(db);
    return {
      message: 'Application accepted! Gig is now In Progress.',
      application: db.applications[appIdx],
      gig: db.gigs[gigIdx]
    };
  },

  rejectApplication: async (applicationId, activeUserId = 'usr_1') => {
    const db = getStoredData();
    const appIdx = db.applications.findIndex(a => a.id === applicationId);
    if (appIdx === -1) throw new Error('Application not found');

    const app = db.applications[appIdx];
    const gig = db.gigs.find(g => g.id === app.gig_id);
    if (gig && gig.user_id !== activeUserId) {
      throw new Error('Only the gig creator can reject applicants');
    }

    db.applications[appIdx].status = 'Rejected';
    saveStoredData(db);
    return db.applications[appIdx];
  },

  // REVIEWS
  getReviews: async (filters = {}) => {
    const db = getStoredData();
    let result = [...db.reviews];
    if (filters.gig_id) {
      result = result.filter(r => r.gig_id === filters.gig_id);
    }
    if (filters.reviewee_id) {
      result = result.filter(r => r.reviewee_id === filters.reviewee_id);
    }
    return result;
  },

  submitReview: async (reviewData, activeUserId = 'usr_1') => {
    const db = getStoredData();
    const gig = db.gigs.find(g => g.id === reviewData.gig_id);
    if (!gig) throw new Error('Gig not found');

    if (gig.status !== 'Completed') {
      throw new Error('Reviews can only be submitted after the gig is marked Completed');
    }

    const isOwner = gig.user_id === activeUserId;
    const isCollab = gig.accepted_applicant_id === activeUserId;
    if (!isOwner && !isCollab) {
      throw new Error('Only confirmed project participants can submit a review');
    }

    // Check duplicate
    const existing = db.reviews.find(r =>
      r.gig_id === reviewData.gig_id && r.reviewer_id === activeUserId
    );
    if (existing) {
      throw new Error('You have already submitted a review for this gig');
    }

    const reviewer = db.users.find(u => u.id === activeUserId) || { name: 'Student Peer' };

    const newReview = {
      id: `rev_${Date.now()}`,
      gig_id: reviewData.gig_id,
      reviewer_id: activeUserId,
      reviewer_name: reviewer.name,
      reviewer_avatar: reviewer.avatar,
      reviewee_id: reviewData.reviewee_id,
      rating: Number(reviewData.rating),
      comment: reviewData.comment.trim(),
      created_at: new Date().toISOString().split('T')[0]
    };

    db.reviews.unshift(newReview);

    // Recalculate reviewee rating
    const { rating, count } = calculateUserRating(reviewData.reviewee_id, db.reviews);
    const targetIdx = db.users.findIndex(u => u.id === reviewData.reviewee_id);
    let updatedUser = null;
    if (targetIdx !== -1) {
      db.users[targetIdx].rating = rating;
      db.users[targetIdx].reviews_count = count;
      updatedUser = db.users[targetIdx];
    }

    // Notify reviewee
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      user_id: reviewData.reviewee_id,
      type: 'review_received',
      title: 'New Review & Rating Received ⭐',
      message: `${reviewer.name} gave you a ${reviewData.rating}-star review: "${reviewData.comment.slice(0, 45)}..."`,
      time: 'Just now',
      read: false,
      gig_id: gig.id
    });

    saveStoredData(db);
    return {
      message: 'Review and rating submitted successfully!',
      review: newReview,
      updated_user: updatedUser
    };
  },

  // CONVERSATIONS
  getConversations: async (activeUserId = 'usr_1') => {
    const db = getStoredData();
    return db.conversations.filter(c =>
      c.participant_one_id === activeUserId || c.participant_two_id === activeUserId
    );
  },

  sendMessage: async (convId, text, activeUserId = 'usr_1') => {
    const db = getStoredData();
    const convIdx = db.conversations.findIndex(c => c.id === convId);
    if (convIdx === -1) throw new Error('Conversation not found');

    const newMsg = {
      id: `msg_${Date.now()}`,
      conversation_id: convId,
      sender_id: activeUserId,
      text: text.trim(),
      created_at: new Date().toISOString(),
      timestamp: 'Just now'
    };

    if (!Array.isArray(db.conversations[convIdx].messages)) {
      db.conversations[convIdx].messages = [];
    }
    db.conversations[convIdx].messages.push(newMsg);
    db.conversations[convIdx].last_message = text.trim();
    db.conversations[convIdx].last_message_time = 'Just now';

    saveStoredData(db);
    return newMsg;
  },

  // NOTIFICATIONS
  getNotifications: async (activeUserId = 'usr_1') => {
    const db = getStoredData();
    return db.notifications.filter(n => n.user_id === activeUserId);
  },

  markAllNotificationsRead: async (activeUserId = 'usr_1') => {
    const db = getStoredData();
    db.notifications.forEach(n => {
      if (n.user_id === activeUserId) n.read = true;
    });
    saveStoredData(db);
    return { success: true };
  },

  markNotificationRead: async (id) => {
    const db = getStoredData();
    const notif = db.notifications.find(n => n.id === id);
    if (notif) notif.read = true;
    saveStoredData(db);
    return { success: true };
  },

  // BOOKMARKS
  getBookmarks: async () => {
    const db = getStoredData();
    return db.bookmarks || [];
  },

  toggleBookmark: async (gigId) => {
    const db = getStoredData();
    if (!Array.isArray(db.bookmarks)) db.bookmarks = [];
    const index = db.bookmarks.indexOf(gigId);
    let bookmarked = false;
    if (index > -1) {
      db.bookmarks.splice(index, 1);
      bookmarked = false;
    } else {
      db.bookmarks.push(gigId);
      bookmarked = true;
    }
    saveStoredData(db);
    return {
      bookmarked,
      message: bookmarked ? 'Gig added to saved bookmarks' : 'Gig removed from bookmarks'
    };
  },

  // STATS
  getStats: async () => {
    const db = getStoredData();
    const openGigs = db.gigs.filter(g => g.status === 'Open').length;
    const completedGigs = db.gigs.filter(g => g.status === 'Completed').length;
    return {
      activeGigs: openGigs,
      totalStudents: db.users.length * 35 + 240,
      swapsCompleted: completedGigs * 12 + 84,
      avgSatisfaction: "4.9"
    };
  },

  // AI ASSISTANT
  queryAiAssistant: async (query) => {
    const db = getStoredData();
    const q = query.toLowerCase();

    if (q.includes('programming') || q.includes('coding') || q.includes('react') || q.includes('web') || q.includes('python')) {
      const matching = db.gigs.filter(g => g.category === 'Programming' && g.status === 'Open').slice(0, 3);
      return {
        text: `Found ${matching.length} active programming gigs on CampusLoop:`,
        suggestedGigs: matching,
        chips: ["Show high-paying gigs", "How do I apply to a gig?"]
      };
    }

    if (q.includes('high-paying') || q.includes('budget') || q.includes('money') || q.includes('paid')) {
      const topPaid = db.gigs
        .filter(g => g.payment_type === 'Paid' && g.status === 'Open')
        .sort((a, b) => (b.budget || 0) - (a.budget || 0))
        .slice(0, 3);
      return {
        text: `Here are the top-paying student opportunities currently open:`,
        suggestedGigs: topPaid,
        chips: ["Find me programming gigs", "How does Skill Swap work?"]
      };
    }

    if (q.includes('apply') || q.includes('how to apply')) {
      return {
        text: `To apply to a gig on CampusLoop:\n1. Browse through Explore or your Dashboard recommendations.\n2. Click "View Details" on the gig card.\n3. Click "Apply to Gig" to submit your pitch.\n4. Once the creator accepts, the collaboration begins in My Work!`,
        suggestedGigs: [],
        chips: ["Find me programming gigs", "Show high-paying gigs"]
      };
    }

    // Default match
    const matching = db.gigs.filter(g =>
      g.status === 'Open' &&
      (g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q) || (g.skills_required || []).some(s => s.toLowerCase().includes(q)))
    ).slice(0, 3);

    return {
      text: matching.length > 0
        ? `Found ${matching.length} matching opportunities for "${query}":`
        : `I searched CampusLoop for "${query}". Check out these open opportunities or browse Explore:`,
      suggestedGigs: matching.length > 0 ? matching : db.gigs.filter(g => g.status === 'Open').slice(0, 3),
      chips: ["Find me programming gigs", "Show high-paying gigs", "How do I apply to a gig?"]
    };
  }
};
