import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import {
  INITIAL_USERS,
  INITIAL_GIGS,
  INITIAL_APPLICATIONS,
  INITIAL_REVIEWS,
  INITIAL_NOTIFICATIONS,
  INITIAL_CONVERSATIONS
} from '../data/mockData';
import { api, setApiActiveUser } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Navigation & Screen State
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [selectedGigId, setSelectedGigId] = useState('gig_1');
  const [selectedProfileId, setSelectedProfileId] = useState('usr_1');
  const [globalSearch, setGlobalSearch] = useState('');

  // Theme State ('light' | 'dark')
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('campusloop_theme') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('campusloop_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Core Data States
  const [users, setUsers] = useState(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState(INITIAL_USERS[0]); // Default to Aarav Sharma
  const [gigs, setGigs] = useState(INITIAL_GIGS);
  const [applications, setApplications] = useState(INITIAL_APPLICATIONS);
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [bookmarks, setBookmarks] = useState(['gig_1', 'gig_3']);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Synchronize state from API backend
  const refreshData = useCallback(async (userId = null) => {
    const activeId = userId || currentUser.id;
    setApiActiveUser(activeId);

    try {
      const [
        fetchedUsers,
        fetchedGigs,
        fetchedApps,
        fetchedRevs,
        fetchedNotifs,
        fetchedConvs,
        fetchedBookmarks
      ] = await Promise.all([
        api.getUsers().catch(() => null),
        api.getGigs().catch(() => null),
        api.getApplications().catch(() => null),
        api.getReviews().catch(() => null),
        api.getNotifications().catch(() => null),
        api.getConversations().catch(() => null),
        api.getBookmarks().catch(() => null)
      ]);

      if (fetchedUsers) {
        setUsers(fetchedUsers);
        const matched = fetchedUsers.find(u => u.id === activeId);
        if (matched) setCurrentUser(matched);
      }
      if (fetchedGigs) setGigs(fetchedGigs);
      if (fetchedApps) setApplications(fetchedApps);
      if (fetchedRevs) setReviews(fetchedRevs);
      if (fetchedNotifs) setNotifications(fetchedNotifs);
      if (fetchedConvs) setConversations(fetchedConvs);
      if (fetchedBookmarks) setBookmarks(fetchedBookmarks);

      setIsBackendConnected(true);
    } catch (err) {
      console.warn('API sync warning (falling back to initial data):', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.id]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Switch Active Demo User
  const switchUser = async (userId) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      setApiActiveUser(target.id);
      addToast(`Switched active student to ${target.name} (${target.major})`, 'info');
      setIsDemoModalOpen(false);

      // Fetch user-specific notifications and conversations
      try {
        const [notifs, convs, bms] = await Promise.all([
          api.getNotifications().catch(() => null),
          api.getConversations().catch(() => null),
          api.getBookmarks().catch(() => null)
        ]);
        if (notifs) setNotifications(notifs);
        if (convs) setConversations(convs);
        if (bms) setBookmarks(bms);
      } catch (err) {
        console.error('Error fetching user data on switch:', err);
      }
    }
  };

  // Navigate to gig details
  const viewGig = (gigId) => {
    setSelectedGigId(gigId);
    setCurrentScreen('gig-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate to user profile
  const viewProfile = (userId) => {
    setSelectedProfileId(userId);
    setCurrentScreen('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toggle Bookmark
  const toggleBookmark = async (gigId) => {
    // Optimistic UI update
    const alreadyBookmarked = bookmarks.includes(gigId);
    setBookmarks(prev => alreadyBookmarked ? prev.filter(id => id !== gigId) : [...prev, gigId]);

    try {
      const res = await api.toggleBookmark(gigId);
      addToast(res.message, res.bookmarked ? 'success' : 'info');
    } catch (err) {
      // Rollback on failure
      setBookmarks(prev => alreadyBookmarked ? [...prev, gigId] : prev.filter(id => id !== gigId));
      addToast(err.message, 'error');
    }
  };

  // Check if a gig is expired based on current date
  const isGigExpired = (gig) => {
    if (gig.status === 'Expired') return true;
    if (!gig.deadline) return false;
    const now = new Date();
    const deadline = new Date(gig.deadline);
    return deadline < now && gig.status === 'Open';
  };

  // Create New Gig
  const createGig = async (gigData) => {
    try {
      const payload = {
        title: gigData.title.trim(),
        description: gigData.description.trim(),
        type: gigData.type,
        category: gigData.category,
        payment_type: gigData.payment_type,
        budget: gigData.payment_type === 'Paid' ? Number(gigData.budget) : null,
        deadline: gigData.deadline,
        skills_required: gigData.skills_required || [gigData.category],
        image: gigData.image || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80"
      };

      const createdGig = await api.createGig(payload);
      setGigs(prev => [createdGig, ...prev]);

      // Update user state
      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, gigs_posted: u.gigs_posted + 1 } : u));
      setCurrentUser(prev => ({ ...prev, gigs_posted: prev.gigs_posted + 1 }));

      addToast('Your gig was published successfully!', 'success');
      viewGig(createdGig.id);
      return createdGig;
    } catch (err) {
      addToast(err.message || 'Failed to create gig', 'error');
      return null;
    }
  };

  // Apply to a Gig
  const applyToGig = async (gigId, message) => {
    const targetGig = gigs.find(g => g.id === gigId);
    if (!targetGig) {
      addToast('Opportunity not found.', 'error');
      return false;
    }

    if (targetGig.user_id === currentUser.id) {
      addToast("You cannot apply to your own gig.", 'error');
      return false;
    }

    try {
      const createdApp = await api.submitApplication({ gig_id: gigId, message });
      setApplications(prev => [createdApp, ...prev]);

      // Increment applicants_count locally
      setGigs(prev => prev.map(g => g.id === gigId ? { ...g, applicants_count: (g.applicants_count || 0) + 1 } : g));

      addToast("Application submitted successfully to the poster!", 'success');
      setIsApplyModalOpen(false);
      return true;
    } catch (err) {
      addToast(err.message || "Failed to submit application", 'error');
      return false;
    }
  };

  // Accept Applicant (Milestone 3 Core Logic)
  const acceptApplicant = async (applicationId) => {
    try {
      const result = await api.acceptApplication(applicationId);

      // Update application statuses locally
      setApplications(prev => prev.map(a => {
        if (a.id === applicationId) return { ...a, status: 'Accepted' };
        if (a.gig_id === result.gig.id && a.status === 'Pending') return { ...a, status: 'Rejected' };
        return a;
      }));

      // Update gig status
      setGigs(prev => prev.map(g => g.id === result.gig.id ? result.gig : g));

      addToast(result.message || 'Application accepted! Gig is now In Progress.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to accept application', 'error');
    }
  };

  // Reject Applicant
  const rejectApplicant = async (applicationId) => {
    try {
      const updated = await api.rejectApplication(applicationId);
      setApplications(prev => prev.map(a => a.id === applicationId ? updated : a));
      addToast(`Application marked as rejected.`, 'info');
    } catch (err) {
      addToast(err.message || 'Failed to reject application', 'error');
    }
  };

  // Complete Gig (Milestone 3: Only from In Progress)
  const completeGig = async (gigId) => {
    try {
      const updatedGig = await api.updateGig(gigId, { status: 'Completed' });

      setGigs(prev => prev.map(g => g.id === gigId ? updatedGig : g));

      // Refresh users to reflect updated gigs_completed
      const freshUsers = await api.getUsers().catch(() => null);
      if (freshUsers) {
        setUsers(freshUsers);
        const me = freshUsers.find(u => u.id === currentUser.id);
        if (me) setCurrentUser(me);
      }

      addToast("Gig marked as completed! You can now write a mutual review.", 'success');
    } catch (err) {
      addToast(err.message || 'Failed to mark gig as complete', 'error');
    }
  };

  // Submit Mutual Review (Milestone 4)
  const submitReview = async ({ gigId, revieweeId, rating, comment }) => {
    try {
      const result = await api.submitReview({
        gig_id: gigId,
        reviewee_id: revieweeId,
        rating,
        comment
      });

      setReviews(prev => [result.review, ...prev]);

      // Update reviewee stats locally
      if (result.updated_user) {
        setUsers(prev => prev.map(u => u.id === result.updated_user.id ? { ...u, ...result.updated_user } : u));
        if (currentUser.id === result.updated_user.id) {
          setCurrentUser(prev => ({ ...prev, ...result.updated_user }));
        }
      }

      addToast("Review and rating submitted successfully!", 'success');
      return true;
    } catch (err) {
      addToast(err.message || 'Failed to submit review', 'error');
      return false;
    }
  };

  // Mark all notifications as read
  const markAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      addToast("All notifications marked as read.", 'info');
    } catch (err) {
      addToast(err.message || 'Failed to update notifications', 'error');
    }
  };

  // Send Chat Message
  const sendMessage = async (conversationId, text) => {
    if (!text.trim()) return;

    try {
      const newMsg = await api.sendMessage(conversationId, text);

      setConversations(prev => prev.map(c => {
        if (c.id === conversationId) {
          return {
            ...c,
            last_message: text.trim(),
            last_message_time: "Just now",
            messages: [...c.messages, newMsg]
          };
        }
        return c;
      }));
    } catch (err) {
      addToast(err.message || 'Failed to send message', 'error');
    }
  };

  // Computed Values
  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter(n => n.user_id === currentUser.id && !n.read).length;
  }, [notifications, currentUser]);

  const activeApplicationsCount = useMemo(() => {
    return applications.filter(a => a.applicant_id === currentUser.id && a.status === 'Pending').length;
  }, [applications, currentUser]);

  const userPostedGigs = useMemo(() => {
    return gigs.filter(g => g.user_id === currentUser.id);
  }, [gigs, currentUser]);

  const userAcceptedWork = useMemo(() => {
    return gigs.filter(g => g.accepted_applicant_id === currentUser.id);
  }, [gigs, currentUser]);

  const pendingReceivedApplications = useMemo(() => {
    const userGigIds = userPostedGigs.map(g => g.id);
    return applications.filter(a => userGigIds.includes(a.gig_id) && a.status === 'Pending');
  }, [userPostedGigs, applications]);

  // Skill-based recommendations for current user
  const recommendedGigs = useMemo(() => {
    const userSkills = currentUser.skills || [];
    return gigs.filter(g => {
      if (g.user_id === currentUser.id) return false;
      if (g.status !== 'Open') return false;
      const matchesSkill = (g.skills_required || []).some(s =>
        userSkills.some(us => us.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(us.toLowerCase()))
      );
      return matchesSkill || g.category === 'Programming';
    }).slice(0, 4);
  }, [gigs, currentUser]);

  // Platform stats calculated dynamically
  const platformStats = useMemo(() => {
    const activeCount = gigs.filter(g => g.status === 'Open').length;
    const completedCount = gigs.filter(g => g.status === 'Completed').length;
    const allRatings = reviews.map(r => r.rating);
    const avgSatisfaction = allRatings.length ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1) : "4.9";

    return {
      activeGigs: activeCount,
      totalStudents: users.length * 35 + 240,
      swapsCompleted: completedCount * 12 + 84,
      avgSatisfaction: avgSatisfaction
    };
  }, [gigs, users, reviews]);

  const value = {
    currentScreen,
    setCurrentScreen,
    selectedGigId,
    setSelectedGigId,
    selectedProfileId,
    setSelectedProfileId,
    globalSearch,
    setGlobalSearch,
    users,
    currentUser,
    switchUser,
    gigs,
    applications,
    reviews,
    notifications,
    conversations,
    bookmarks,
    toggleBookmark,
    isGigExpired,
    createGig,
    applyToGig,
    acceptApplicant,
    rejectApplicant,
    completeGig,
    submitReview,
    markAllNotificationsRead,
    sendMessage,
    unreadNotificationsCount,
    activeApplicationsCount,
    userPostedGigs,
    userAcceptedWork,
    pendingReceivedApplications,
    recommendedGigs,
    platformStats,
    viewGig,
    viewProfile,
    isDemoModalOpen,
    setIsDemoModalOpen,
    isAiAssistantOpen,
    setIsAiAssistantOpen,
    isNotificationsOpen,
    setIsNotificationsOpen,
    isApplyModalOpen,
    setIsApplyModalOpen,
    toasts,
    addToast,
    removeToast,
    theme,
    setTheme,
    toggleTheme,
    isBackendConnected,
    isLoading,
    refreshData
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
