/**
 * Campus Gig & SkillSwap Portal - Mock API Backend Engine
 * 
 * Supports full CRUD, state transitions, validation, and dynamic reputation calculation.
 * Works seamlessly in both Browser (with localStorage persistence) and Node.js environments.
 */

import { INITIAL_USERS, INITIAL_GIGS, INITIAL_APPLICATIONS, INITIAL_REVIEWS } from './seedData.js';

class MockDatabase {
  constructor() {
    this.storageKeyPrefix = "campus_gig_portal_";
    this.isBrowser = typeof window !== "undefined" && typeof localStorage !== "undefined";
    this.initializeData();
  }

  initializeData(forceReset = false) {
    if (this.isBrowser && !forceReset) {
      const storedUsers = localStorage.getItem(this.storageKeyPrefix + "users");
      const storedGigs = localStorage.getItem(this.storageKeyPrefix + "gigs");
      const storedApps = localStorage.getItem(this.storageKeyPrefix + "applications");
      const storedRevs = localStorage.getItem(this.storageKeyPrefix + "reviews");

      if (storedUsers && storedGigs && storedApps && storedRevs) {
        try {
          this.users = JSON.parse(storedUsers);
          this.gigs = JSON.parse(storedGigs);
          this.applications = JSON.parse(storedApps);
          this.reviews = JSON.parse(storedRevs);
          this.syncExpiredGigs();
          return;
        } catch (e) {
          console.warn("Corrupted localStorage. Resetting to seed data.", e);
        }
      }
    }

    // Deep clone seed data
    this.users = JSON.parse(JSON.stringify(INITIAL_USERS));
    this.gigs = JSON.parse(JSON.stringify(INITIAL_GIGS));
    this.applications = JSON.parse(JSON.stringify(INITIAL_APPLICATIONS));
    this.reviews = JSON.parse(JSON.stringify(INITIAL_REVIEWS));

    this.syncExpiredGigs();
    this.persist();
  }

  persist() {
    if (this.isBrowser) {
      localStorage.setItem(this.storageKeyPrefix + "users", JSON.stringify(this.users));
      localStorage.setItem(this.storageKeyPrefix + "gigs", JSON.stringify(this.gigs));
      localStorage.setItem(this.storageKeyPrefix + "applications", JSON.stringify(this.applications));
      localStorage.setItem(this.storageKeyPrefix + "reviews", JSON.stringify(this.reviews));
    }
  }

  reset() {
    this.initializeData(true);
  }

  /**
   * Rule: Gigs past their deadline while still Open appear as Expired.
   */
  syncExpiredGigs() {
    const today = new Date().toISOString().split("T")[0];
    let changed = false;

    this.gigs.forEach(gig => {
      if (gig.status === "Open" && gig.deadline && gig.deadline < today) {
        gig.status = "Expired";
        changed = true;
      }
    });

    if (changed) {
      this.persist();
    }
  }

  // =========================================================================
  // USER & REPUTATION METHODS
  // =========================================================================

  /**
   * Milestone 1 & 4: Compute profile dynamic stats and reputation
   */
  getUserProfile(userId) {
    this.syncExpiredGigs();
    const user = this.users.find(u => u.id === userId);
    if (!user) return null;

    // Gigs posted
    const gigsPosted = this.gigs.filter(g => g.user_id === userId).length;

    // Gigs completed: either as owner (where status is Completed) OR as accepted applicant
    const gigsCompleted = this.gigs.filter(g => 
      g.status === "Completed" && (g.user_id === userId || g.accepted_applicant_id === userId)
    ).length;

    // Reviews received (reviewee_id == userId)
    const receivedReviews = this.reviews.filter(r => r.reviewee_id === userId);
    const reviewCount = receivedReviews.length;
    
    // Dynamic average rating
    const avgRating = reviewCount > 0
      ? Number((receivedReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
      : 0.0;

    return {
      ...user,
      gigs_posted_count: gigsPosted,
      gigs_completed_count: gigsCompleted,
      reviews_count: reviewCount,
      average_rating: avgRating,
      received_reviews: receivedReviews.map(r => ({
        ...r,
        reviewer: this.users.find(u => u.id === r.reviewer_id) || { name: "Campus Student" },
        gig: this.gigs.find(g => g.id === r.gig_id) || { title: "Completed Gig" }
      }))
    };
  }

  getAllUsers() {
    return this.users.map(u => this.getUserProfile(u.id));
  }

  updateUserProfile(userId, updates = {}) {
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error("User not found.");

    if (updates.bio !== undefined) {
      user.bio = updates.bio.trim();
    }
    if (updates.skills !== undefined) {
      if (Array.isArray(updates.skills)) {
        user.skills = updates.skills;
      } else if (typeof updates.skills === "string") {
        user.skills = updates.skills.split(",").map(s => s.trim()).filter(Boolean);
      }
    }

    this.persist();
    return this.getUserProfile(userId);
  }

  // =========================================================================
  // GIG METHODS (Milestone 1, 2, 3)
  // =========================================================================

  /**
   * Milestone 2: Discovery and Filter
   */
  getGigs(filters = {}) {
    this.syncExpiredGigs();
    let result = [...this.gigs];

    const {
      category,
      type,
      payment_type,
      min_budget,
      max_budget,
      q,
      status,
      user_id
    } = filters;

    if (category && category !== "All") {
      result = result.filter(g => g.category.toLowerCase() === category.toLowerCase());
    }

    if (type && type !== "All") {
      result = result.filter(g => g.type.toLowerCase() === type.toLowerCase());
    }

    if (payment_type && payment_type !== "All") {
      result = result.filter(g => g.payment_type.toLowerCase() === payment_type.toLowerCase());
    }

    if (status && status !== "All") {
      result = result.filter(g => g.status.toLowerCase() === status.toLowerCase());
    }

    if (user_id) {
      result = result.filter(g => g.user_id === user_id);
    }

    if (min_budget !== undefined && min_budget !== null && min_budget !== "") {
      const min = Number(min_budget);
      result = result.filter(g => (g.budget !== null ? g.budget >= min : false));
    }

    if (max_budget !== undefined && max_budget !== null && max_budget !== "") {
      const max = Number(max_budget);
      result = result.filter(g => (g.budget !== null ? g.budget <= max : true));
    }

    if (q && q.trim()) {
      const query = q.trim().toLowerCase();
      result = result.filter(g =>
        g.title.toLowerCase().includes(query) ||
        g.description.toLowerCase().includes(query) ||
        g.category.toLowerCase().includes(query)
      );
    }

    // Attach poster details
    return result.map(g => ({
      ...g,
      owner: this.users.find(u => u.id === g.user_id),
      accepted_applicant: g.accepted_applicant_id ? this.users.find(u => u.id === g.accepted_applicant_id) : null,
      applications_count: this.applications.filter(a => a.gig_id === g.id).length
    })).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  getGigById(gigId) {
    this.syncExpiredGigs();
    const gig = this.gigs.find(g => g.id === gigId);
    if (!gig) return null;

    const owner = this.getUserProfile(gig.user_id);
    const acceptedApplicant = gig.accepted_applicant_id ? this.getUserProfile(gig.accepted_applicant_id) : null;
    const gigApplications = this.applications
      .filter(a => a.gig_id === gig.id)
      .map(a => ({
        ...a,
        applicant: this.getUserProfile(a.applicant_id)
      }));

    return {
      ...gig,
      owner,
      accepted_applicant: acceptedApplicant,
      applications: gigApplications
    };
  }

  /**
   * Milestone 1: Create Gig with validation
   */
  createGig(data) {
    const { user_id, title, description, category, type, payment_type, budget, deadline } = data;

    if (!user_id || !title || !description || !category || !type || !payment_type || !deadline) {
      throw new Error("Missing required fields for gig creation.");
    }

    const validCategories = ["Programming", "Design", "Writing", "Tutoring"];
    if (!validCategories.includes(category)) {
      throw new Error(`Category must be one of: ${validCategories.join(", ")}`);
    }

    const validTypes = ["Offering", "Requesting"];
    if (!validTypes.includes(type)) {
      throw new Error("Type must be either 'Offering' or 'Requesting'");
    }

    const validPaymentTypes = ["Paid", "SkillSwap", "Free"];
    if (!validPaymentTypes.includes(payment_type)) {
      throw new Error("Payment type must be Paid, SkillSwap, or Free");
    }

    if (payment_type === "Paid") {
      if (budget === undefined || budget === null || Number(budget) <= 0) {
        throw new Error("Paid gigs need a budget.");
      }
    }

    const newGig = {
      id: "gig_" + (this.gigs.length + 1) + "_" + Math.floor(Math.random() * 1000),
      user_id,
      title: title.trim(),
      description: description.trim(),
      type,
      category,
      payment_type,
      budget: payment_type === "Paid" ? Number(budget) : null,
      deadline,
      status: "Open",
      accepted_applicant_id: null,
      created_at: new Date().toISOString().split("T")[0]
    };

    this.gigs.unshift(newGig);
    this.persist();
    return this.getGigById(newGig.id);
  }

  /**
   * Milestone 3: Gig Status Transition
   * Rules:
   * - Only gig owners may change gig status
   * - Support Open -> In Progress -> Completed
   * - Allow completion ONLY from In Progress
   */
  updateGigStatus(gigId, newStatus, actingUserId) {
    const gig = this.gigs.find(g => g.id === gigId);
    if (!gig) throw new Error("Gig not found.");

    if (gig.user_id !== actingUserId) {
      throw new Error("Forbidden: Only the gig owner can modify gig status.");
    }

    const validStatuses = ["Open", "In Progress", "Completed", "Cancelled"];
    if (!validStatuses.includes(newStatus)) {
      throw new Error("Invalid status: " + newStatus);
    }

    // Rule: Allow completion ONLY from In Progress
    if (newStatus === "Completed" && gig.status !== "In Progress") {
      throw new Error("Invalid transition: Gigs can only be marked Completed from 'In Progress' status.");
    }

    gig.status = newStatus;
    this.persist();
    return this.getGigById(gig.id);
  }

  // =========================================================================
  // APPLICATION METHODS (Milestone 2, 3)
  // =========================================================================

  /**
   * Milestone 2: Apply to Gig
   * Rules:
   * - Reject applications to the user's own gigs!
   * - Reject duplicate application to the same gig!
   * - Reject if gig is not Open
   */
  createApplication({ gig_id, applicant_id, message }) {
    this.syncExpiredGigs();
    const gig = this.gigs.find(g => g.id === gig_id);
    if (!gig) throw new Error("Gig not found.");

    // Rule: Check if gig is open
    if (gig.status !== "Open") {
      throw new Error(`Cannot apply: This gig is currently ${gig.status}.`);
    }

    // Rule: Reject application to user's own gig
    if (gig.user_id === applicant_id) {
      throw new Error("Cannot apply to your own gig.");
    }

    // Rule: Reject duplicate application
    const existing = this.applications.find(a => a.gig_id === gig_id && a.applicant_id === applicant_id);
    if (existing) {
      throw new Error("Duplicate application: You have already applied to this gig.");
    }

    if (!message || !message.trim()) {
      throw new Error("A short message is required to apply.");
    }

    const newApp = {
      id: "app_" + (this.applications.length + 1) + "_" + Math.floor(Math.random() * 1000),
      gig_id,
      applicant_id,
      message: message.trim(),
      status: "Pending",
      created_at: new Date().toISOString().split("T")[0]
    };

    this.applications.push(newApp);
    this.persist();
    return newApp;
  }

  /**
   * Milestone 3: Applicant Selection & Acceptance
   * Rules:
   * - Only gig owners may accept/reject applicants
   * - Acceptance automatically changes gig to In Progress
   * - Rejects remaining Pending applications
   * - Closes gig to new applications
   */
  updateApplicationStatus(applicationId, newStatus, actingUserId) {
    const app = this.applications.find(a => a.id === applicationId);
    if (!app) throw new Error("Application not found.");

    const gig = this.gigs.find(g => g.id === app.gig_id);
    if (!gig) throw new Error("Associated gig not found.");

    // Rule: Only gig owners may accept applicants or change gig status
    if (gig.user_id !== actingUserId) {
      throw new Error("Forbidden: Only the gig owner can review applications.");
    }

    if (newStatus === "Accepted") {
      if (gig.status !== "Open") {
        throw new Error(`Cannot accept applicant: Gig is already ${gig.status}.`);
      }

      app.status = "Accepted";
      gig.status = "In Progress";
      gig.accepted_applicant_id = app.applicant_id;

      // Automatically reject remaining Pending applications for this gig
      this.applications.forEach(otherApp => {
        if (otherApp.gig_id === gig.id && otherApp.id !== app.id && otherApp.status === "Pending") {
          otherApp.status = "Rejected";
        }
      });
    } else if (newStatus === "Rejected") {
      app.status = "Rejected";
    } else {
      throw new Error("Invalid application status: " + newStatus);
    }

    this.persist();
    return {
      application: app,
      gig: this.getGigById(gig.id)
    };
  }

  getApplicationsForUser(userId) {
    return this.applications
      .filter(a => a.applicant_id === userId)
      .map(a => ({
        ...a,
        gig: this.getGigById(a.gig_id)
      }));
  }

  getApplicationsForGig(gigId, actingUserId) {
    const gig = this.gigs.find(g => g.id === gigId);
    if (!gig) throw new Error("Gig not found.");

    // Only owner can view all applications with details
    if (gig.user_id !== actingUserId) {
      throw new Error("Forbidden: Only the gig owner can view all applications.");
    }

    return this.applications
      .filter(a => a.gig_id === gigId)
      .map(a => ({
        ...a,
        applicant: this.getUserProfile(a.applicant_id)
      }));
  }

  // =========================================================================
  // REVIEWS & REPUTATION (Milestone 4)
  // =========================================================================

  /**
   * Milestone 4: Mutual Reviews
   * Rules:
   * - Gig must be Completed
   * - Only the owner and accepted applicant may leave a review for each other
   * - Allow only ONE review per reviewer for that gig
   */
  createReview({ gig_id, reviewer_id, rating, comment }) {
    const gig = this.gigs.find(g => g.id === gig_id);
    if (!gig) throw new Error("Gig not found.");

    // Rule: Gig must be Completed
    if (gig.status !== "Completed") {
      throw new Error("Reviews can only be submitted after a gig is Completed.");
    }

    // Determine who is reviewer and who is reviewee
    let reviewee_id;
    if (reviewer_id === gig.user_id) {
      // Owner is reviewing the accepted applicant
      if (!gig.accepted_applicant_id) {
        throw new Error("No accepted applicant on this gig to review.");
      }
      reviewee_id = gig.accepted_applicant_id;
    } else if (reviewer_id === gig.accepted_applicant_id) {
      // Accepted applicant is reviewing the owner
      reviewee_id = gig.user_id;
    } else {
      throw new Error("Forbidden: Only the gig owner and accepted applicant may participate in mutual reviews.");
    }

    // Rule: Allow only one review per reviewer for that gig
    const existing = this.reviews.find(r => r.gig_id === gig_id && r.reviewer_id === reviewer_id);
    if (existing) {
      throw new Error("Duplicate review: You have already submitted a review for this gig.");
    }

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      throw new Error("Rating must be an integer between 1 and 5.");
    }

    if (!comment || !comment.trim()) {
      throw new Error("Review comment cannot be empty.");
    }

    const newReview = {
      id: "rev_" + (this.reviews.length + 1) + "_" + Math.floor(Math.random() * 1000),
      gig_id,
      reviewer_id,
      reviewee_id,
      rating: Math.round(numRating),
      comment: comment.trim()
    };

    this.reviews.push(newReview);
    this.persist();
    return newReview;
  }

  getReviewsForGig(gigId) {
    return this.reviews
      .filter(r => r.gig_id === gigId)
      .map(r => ({
        ...r,
        reviewer: this.users.find(u => u.id === r.reviewer_id),
        reviewee: this.users.find(u => u.id === r.reviewee_id)
      }));
  }
}

// Global singleton instance for the app
export const mockDb = new MockDatabase();
