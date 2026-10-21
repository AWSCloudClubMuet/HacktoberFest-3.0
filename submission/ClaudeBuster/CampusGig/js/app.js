/**
 * Campus Gig & SkillSwap Portal — Handcrafted Frontend Controller
 * Follows strict student marketplace visual rules:
 * - Left-aligned, Source Serif 4 headings, IBM Plex Sans body
 * - Dense rows, plain text status colors
 * - Zero corporate buzzwords (no seamless, unlock, empower, discover, welcome back)
 * - Instant pointer feedback
 */

import { mockDb } from './mockApi.js';

class CampusGigApp {
  constructor() {
    this.activeUserId = "usr_1"; // Default active student
    this.currentView = "view-browse";
    this.activeSubtab = "my-gigs";
    this.currentGigDetailId = null;
    this.debounceTimer = null;

    this.initElements();
    this.bindEvents();
    this.populateUserSwitcher();
    this.render();
  }

  initElements() {
    // Header & User switcher
    this.selectActiveUser = document.getElementById("select-active-user");
    this.headerActivityCount = document.getElementById("header-activity-count");
    this.navLinks = document.querySelectorAll(".nav-link");
    this.viewPanels = document.querySelectorAll(".view-panel");

    // Browse filters & elements
    this.searchInput = document.getElementById("search-input");
    this.resultsCountText = document.getElementById("results-count-text");
    this.gigsTableBody = document.getElementById("gigs-table-body");
    this.filterCatRadios = document.querySelectorAll("input[name='filter-cat']");
    this.filterTypeRadios = document.querySelectorAll("input[name='filter-type']");
    this.filterPaymentRadios = document.querySelectorAll("input[name='filter-payment']");
    this.filterStatusRadios = document.querySelectorAll("input[name='filter-status']");
    this.filterMinBudget = document.getElementById("filter-min-budget");
    this.filterMaxBudget = document.getElementById("filter-max-budget");
    this.btnResetFilters = document.getElementById("btn-reset-filters");

    // Detail elements
    this.detailContentArea = document.getElementById("detail-content-area");
    this.btnBackToBrowse = document.getElementById("btn-back-to-browse");

    // Post a gig form
    this.formPostGig = document.getElementById("form-post-gig");
    this.postTitle = document.getElementById("post-title");
    this.postCategory = document.getElementById("post-category");
    this.postType = document.getElementById("post-type");
    this.postDesc = document.getElementById("post-desc");
    this.postPayment = document.getElementById("post-payment");
    this.wrapPostBudget = document.getElementById("wrap-post-budget");
    this.postBudget = document.getElementById("post-budget");
    this.postDeadline = document.getElementById("post-deadline");
    this.btnCancelPost = document.getElementById("btn-cancel-post");

    // Errors
    this.errTitle = document.getElementById("err-title");
    this.errDesc = document.getElementById("err-desc");
    this.errBudget = document.getElementById("err-budget");
    this.errDeadline = document.getElementById("err-deadline");

    // Activity elements
    this.subtabMyGigs = document.getElementById("subtab-my-gigs");
    this.subtabMyApps = document.getElementById("subtab-my-apps");
    this.activityContentArea = document.getElementById("activity-content-area");

    // Profile elements
    this.profileContainer = document.getElementById("profile-container");

    // API Console elements
    this.apiStatUsers = document.getElementById("api-stat-users");
    this.apiStatGigs = document.getElementById("api-stat-gigs");
    this.apiStatApps = document.getElementById("api-stat-apps");
    this.apiStatRevs = document.getElementById("api-stat-revs");
    this.btnResetDb = document.getElementById("btn-reset-db");

    // Review Modal
    this.modalReview = document.getElementById("modal-review");
    this.formReview = document.getElementById("form-review");
    this.reviewGigId = document.getElementById("review-gig-id");
    this.reviewTargetLabel = document.getElementById("review-target-label");
    this.reviewRatingSelect = document.getElementById("review-rating-select");
    this.reviewCommentInput = document.getElementById("review-comment-input");
    this.errReviewComment = document.getElementById("err-review-comment");
    this.btnCloseReviewModal = document.getElementById("btn-close-review-modal");
    this.btnCancelReviewModal = document.getElementById("btn-cancel-review-modal");

    // Toast
    this.toastMsg = document.getElementById("toast-msg");
  }

  bindEvents() {
    // Zero-delay pointer feedback on buttons
    document.addEventListener("pointerdown", (e) => {
      const btn = e.target.closest("button");
      if (btn) {
        btn.style.opacity = "0.85";
      }
    });
    document.addEventListener("pointerup", (e) => {
      const btn = e.target.closest("button");
      if (btn) {
        btn.style.opacity = "1";
      }
    });

    // User Switcher
    this.selectActiveUser.addEventListener("change", (e) => {
      this.activeUserId = e.target.value;
      const u = this.getActiveUser();
      this.showToast(`Switched to ${u.name}`);
      this.render();
    });

    // Nav Links
    this.navLinks.forEach(link => {
      link.addEventListener("click", () => {
        this.switchView(link.dataset.view);
      });
    });

    // Brand link -> Browse
    document.getElementById("nav-brand").addEventListener("click", (e) => {
      e.preventDefault();
      this.switchView("view-browse");
    });

    // Search input (debounced)
    this.searchInput.addEventListener("input", () => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.renderBrowse(), 150);
    });

    // Filter radios & budget
    const filterInputs = [
      ...this.filterCatRadios,
      ...this.filterTypeRadios,
      ...this.filterPaymentRadios,
      ...this.filterStatusRadios,
      this.filterMinBudget,
      this.filterMaxBudget
    ];
    filterInputs.forEach(input => {
      input.addEventListener("change", () => this.renderBrowse());
      input.addEventListener("input", () => this.renderBrowse());
    });

    // Reset filters
    this.btnResetFilters.addEventListener("click", () => {
      this.searchInput.value = "";
      document.querySelector("input[name='filter-cat'][value='All']").checked = true;
      document.querySelector("input[name='filter-type'][value='All']").checked = true;
      document.querySelector("input[name='filter-payment'][value='All']").checked = true;
      document.querySelector("input[name='filter-status'][value='Open']").checked = true;
      this.filterMinBudget.value = "";
      this.filterMaxBudget.value = "";
      this.renderBrowse();
    });

    // Back to browse from detail
    this.btnBackToBrowse.addEventListener("click", () => {
      this.switchView("view-browse");
    });

    // Toggle budget input on post payment change
    this.postPayment.addEventListener("change", () => {
      const isPaid = this.postPayment.value === "Paid";
      this.wrapPostBudget.style.display = isPaid ? "block" : "none";
      if (!isPaid) {
        this.postBudget.value = "";
        this.errBudget.classList.remove("visible");
      }
    });

    // Cancel post
    this.btnCancelPost.addEventListener("click", () => {
      this.switchView("view-browse");
    });

    // Post form submit
    this.formPostGig.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handlePostSubmit();
    });

    // Sub-tabs in My Activity
    this.subtabMyGigs.addEventListener("click", () => {
      this.activeSubtab = "my-gigs";
      this.subtabMyGigs.classList.add("active");
      this.subtabMyApps.classList.remove("active");
      this.renderActivity();
    });
    this.subtabMyApps.addEventListener("click", () => {
      this.activeSubtab = "my-apps";
      this.subtabMyApps.classList.add("active");
      this.subtabMyGigs.classList.remove("active");
      this.renderActivity();
    });

    // API Reset DB button
    this.btnResetDb.addEventListener("click", () => {
      mockDb.reset();
      this.showToast("Seed data restored.");
      this.render();
    });

    // Close review modal
    const closeReview = () => this.modalReview.classList.remove("open");
    this.btnCloseReviewModal.addEventListener("click", closeReview);
    this.btnCancelReviewModal.addEventListener("click", closeReview);
    this.modalReview.addEventListener("click", (e) => {
      if (e.target === this.modalReview) closeReview();
    });

    // Submit review form
    this.formReview.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleReviewSubmit();
    });
  }

  // =========================================================================
  // USER & NAVIGATION
  // =========================================================================

  getActiveUser() {
    return mockDb.getUserProfile(this.activeUserId) || mockDb.users[0];
  }

  populateUserSwitcher() {
    const users = mockDb.users;
    this.selectActiveUser.innerHTML = users.map(u =>
      `<option value="${u.id}">${u.name} (${u.major})</option>`
    ).join("");
    this.selectActiveUser.value = this.activeUserId;
  }

  switchView(viewId) {
    this.currentView = viewId;
    this.navLinks.forEach(link => {
      link.classList.toggle("active", link.dataset.view === viewId);
    });

    this.viewPanels.forEach(panel => {
      panel.classList.toggle("active", panel.id === viewId);
    });

    this.render();
  }

  render() {
    // Update nav activity count
    const myGigs = mockDb.getGigs({ user_id: this.activeUserId, status: "All" });
    const myApps = mockDb.getApplicationsForUser(this.activeUserId);
    const totalActivity = myGigs.length + myApps.length;
    this.headerActivityCount.textContent = totalActivity > 0 ? `(${totalActivity})` : "";

    // Route active view
    if (this.currentView === "view-browse") {
      this.renderBrowse();
    } else if (this.currentView === "view-detail") {
      this.renderDetail(this.currentGigDetailId);
    } else if (this.currentView === "view-post") {
      this.renderPostForm();
    } else if (this.currentView === "view-activity") {
      this.renderActivity();
    } else if (this.currentView === "view-profile") {
      this.renderProfile();
    } else if (this.currentView === "view-api") {
      this.renderApiConsole();
    }
  }

  // =========================================================================
  // VIEW 1: BROWSE (DENSE ROWS, NO HERO)
  // =========================================================================

  renderBrowse() {
    const catVal = document.querySelector("input[name='filter-cat']:checked")?.value || "All";
    const typeVal = document.querySelector("input[name='filter-type']:checked")?.value || "All";
    const payVal = document.querySelector("input[name='filter-payment']:checked")?.value || "All";
    const statusVal = document.querySelector("input[name='filter-status']:checked")?.value || "Open";

    const filters = {
      q: this.searchInput.value,
      category: catVal,
      type: typeVal,
      payment_type: payVal,
      status: statusVal,
      min_budget: this.filterMinBudget.value,
      max_budget: this.filterMaxBudget.value
    };

    const gigs = mockDb.getGigs(filters);
    this.resultsCountText.textContent = `${gigs.length} ${gigs.length === 1 ? 'gig' : 'gigs'} found`;

    if (gigs.length === 0) {
      this.gigsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">
            <h4>Nothing matches. Try fewer filters.</h4>
            <p style="font-size: 13px; margin-top: 4px;">Clear your search or switch to all categories.</p>
          </td>
        </tr>
      `;
      return;
    }

    this.gigsTableBody.innerHTML = gigs.map(gig => {
      const isOffering = gig.type === "Offering";
      const paymentStr = gig.payment_type === "Paid"
        ? `Paid $${gig.budget}`
        : (gig.payment_type === "SkillSwap" ? "Skill swap" : "Free");

      const paymentClass = gig.payment_type === "Paid"
        ? "payment-paid-val"
        : (gig.payment_type === "SkillSwap" ? "payment-swap-val" : "payment-free-val");

      // Deadline text
      const deadlineInfo = this.formatDeadline(gig.deadline, gig.status);
      const statusClass = "status-" + gig.status.toLowerCase().replace(/\s+/g, "-");

      return `
        <tr data-gig-id="${gig.id}">
          <td>
            <div class="gig-row-title">${this.escapeHtml(gig.title)}</div>
            <div class="gig-row-desc-preview">${this.escapeHtml(gig.description)}</div>
          </td>
          <td style="color: var(--text-muted);">${gig.category}</td>
          <td>
            <span class="${isOffering ? 'type-offering' : 'type-requesting'}">
              ${isOffering ? 'Offering' : 'Requesting'}
            </span>
          </td>
          <td><span class="${paymentClass}">${paymentStr}</span></td>
          <td>${deadlineInfo}</td>
          <td><span class="status-text ${statusClass}">${gig.status}</span></td>
        </tr>
      `;
    }).join("");

    // Attach row clicks
    this.gigsTableBody.querySelectorAll("tr[data-gig-id]").forEach(row => {
      row.addEventListener("click", () => {
        this.currentGigDetailId = row.dataset.gigId;
        this.switchView("view-detail");
      });
    });
  }

  formatDeadline(deadlineDate, status) {
    if (!deadlineDate) return "No date";
    const today = new Date().toISOString().split("T")[0];
    const isPast = deadlineDate < today;

    if (status === "Expired" || isPast) {
      return `<span class="deadline-struck">${deadlineDate}</span>`;
    }

    const d1 = new Date(today);
    const d2 = new Date(deadlineDate);
    const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "due today";
    if (diffDays === 1) return "due tomorrow";
    return `due in ${diffDays} days`;
  }

  // =========================================================================
  // VIEW 2: GIG DETAIL
  // =========================================================================

  renderDetail(gigId) {
    if (!gigId) {
      this.switchView("view-browse");
      return;
    }

    const gig = mockDb.getGigById(gigId);
    if (!gig) {
      this.detailContentArea.innerHTML = `<p class="empty-state">Gig not found.</p>`;
      return;
    }

    const isOwner = gig.user_id === this.activeUserId;
    const isOffering = gig.type === "Offering";
    const paymentStr = gig.payment_type === "Paid"
      ? `Paid $${gig.budget}`
      : (gig.payment_type === "SkillSwap" ? "Skill swap" : "Free");

    const owner = gig.owner || { name: "Student", major: "General", semester: "1st", average_rating: 0, reviews_count: 0 };
    const ratingLine = owner.average_rating > 0
      ? `★ ${owner.average_rating} (${owner.reviews_count} ${owner.reviews_count === 1 ? 'review' : 'reviews'})`
      : `★ No reviews yet`;

    const statusClass = "status-" + gig.status.toLowerCase().replace(/\s+/g, "-");
    const deadlineLine = this.formatDeadline(gig.deadline, gig.status);

    // Dynamic Action Section
    let actionSection = "";

    if (isOwner) {
      // Owner View: Applicant list & status controls
      const apps = gig.applications || [];
      const pendingApps = apps.filter(a => a.status === "Pending");
      const acceptedApp = apps.find(a => a.status === "Accepted");
      const isInProgress = gig.status === "In Progress";
      const isCompleted = gig.status === "Completed";

      let appsHtml = "";
      if (apps.length === 0) {
        appsHtml = `<p style="font-size: 13px; color: var(--text-muted); margin-top: 0.5rem;">No applicants yet.</p>`;
      } else {
        appsHtml = `
          <div style="margin-top: 0.85rem;">
            ${apps.map(app => {
              const applicant = app.applicant || { name: "Student", major: "General", average_rating: 0, reviews_count: 0 };
              const appRating = applicant.average_rating > 0 ? `★ ${applicant.average_rating}` : `★ New`;

              let actionButtons = "";
              if (app.status === "Pending" && gig.status === "Open") {
                actionButtons = `
                  <div class="applicant-actions">
                    <button class="btn-primary btn-accept-app" data-id="${app.id}" style="font-size: 13px; padding: 0.3rem 0.65rem;">Accept</button>
                    <button class="btn-secondary btn-reject-app" data-id="${app.id}" style="font-size: 13px; padding: 0.3rem 0.65rem;">Reject</button>
                  </div>
                `;
              } else if (app.status === "Accepted") {
                actionButtons = `<span style="font-weight: 600; color: var(--accent); font-size: 13px;">Accepted candidate</span>`;
              } else {
                actionButtons = `<span style="color: var(--text-subtle); font-size: 13px;">Rejected</span>`;
              }

              return `
                <div class="applicant-row">
                  <div class="applicant-row-top">
                    <div>
                      <strong>${this.escapeHtml(applicant.name)}</strong>
                      <span style="color: var(--text-muted); font-size: 12px; margin-left: 4px;">
                        · ${applicant.major} · ${appRating}
                      </span>
                    </div>
                    <div>${actionButtons}</div>
                  </div>
                  <div class="applicant-msg">"${this.escapeHtml(app.message)}"</div>
                  <div style="font-size: 11px; color: var(--text-subtle);">Applied ${app.created_at}</div>
                </div>
              `;
            }).join("")}
          </div>
        `;
      }

      let completeBtnHtml = "";
      if (isInProgress) {
        completeBtnHtml = `
          <div style="margin-top: 1rem; padding: 0.85rem; background: #F5F2EB; border-radius: var(--radius);">
            <p style="font-size: 13px; margin-bottom: 0.5rem;">Work is in progress. Once the gig is done, mark it completed to exchange reviews.</p>
            <button class="btn-primary" id="btn-mark-completed">Mark completed</button>
          </div>
        `;
      }

      let reviewBtnHtml = "";
      if (isCompleted && gig.accepted_applicant_id) {
        const hasReviewed = mockDb.reviews.some(r => r.gig_id === gig.id && r.reviewer_id === this.activeUserId);
        if (!hasReviewed) {
          reviewBtnHtml = `
            <div style="margin-top: 1rem;">
              <button class="btn-primary" id="btn-owner-rate-applicant">Rate accepted applicant</button>
            </div>
          `;
        } else {
          reviewBtnHtml = `<p style="font-size: 13px; color: var(--text-muted); margin-top: 0.75rem;">✓ You submitted your review for this gig.</p>`;
        }
      }

      actionSection = `
        <div class="action-section">
          <h4>Applicants (${apps.length})</h4>
          ${appsHtml}
          ${completeBtnHtml}
          ${reviewBtnHtml}
        </div>
      `;
    } else {
      // Non-owner View: Apply form or status
      const existingApp = (gig.applications || []).find(a => a.applicant_id === this.activeUserId);
      const isExpired = gig.status === "Expired";
      const isCompleted = gig.status === "Completed";
      const isAcceptedApplicant = gig.accepted_applicant_id === this.activeUserId;

      if (existingApp) {
        let reviewBtnHtml = "";
        if (isCompleted && isAcceptedApplicant) {
          const hasReviewed = mockDb.reviews.some(r => r.gig_id === gig.id && r.reviewer_id === this.activeUserId);
          if (!hasReviewed) {
            reviewBtnHtml = `
              <div style="margin-top: 0.75rem;">
                <button class="btn-primary" id="btn-applicant-rate-owner">Rate gig owner</button>
              </div>
            `;
          } else {
            reviewBtnHtml = `<p style="font-size: 13px; color: var(--text-muted); margin-top: 0.5rem;">✓ You submitted your review for this gig.</p>`;
          }
        }

        actionSection = `
          <div class="action-section">
            <p style="font-size: 14px; font-weight: 600;">
              You applied to this gig — status: <span class="status-${existingApp.status.toLowerCase()}">${existingApp.status}</span>
            </p>
            <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
              Your message: "${this.escapeHtml(existingApp.message)}"
            </p>
            ${reviewBtnHtml}
          </div>
        `;
      } else if (isExpired) {
        actionSection = `
          <div class="action-section">
            <p style="color: var(--text-muted); font-size: 13px;">This gig is expired and closed to applications.</p>
          </div>
        `;
      } else if (gig.status === "Open") {
        actionSection = `
          <div class="action-section">
            <h4 style="margin-bottom: 0.5rem;">Apply for this gig</h4>
            <form id="form-apply">
              <div class="form-field">
                <label for="apply-msg">Short message</label>
                <textarea id="apply-msg" rows="3" placeholder="Explain how you can help or why you're a good fit..."></textarea>
                <div class="field-error" id="err-apply-msg">A short message is required.</div>
              </div>
              <button type="submit" class="btn-primary" id="btn-submit-apply">Apply</button>
            </form>
          </div>
        `;
      } else {
        actionSection = `
          <div class="action-section">
            <p style="color: var(--text-muted); font-size: 13px;">This gig is ${gig.status.toLowerCase()} and not accepting applications.</p>
          </div>
        `;
      }
    }

    this.detailContentArea.innerHTML = `
      <div class="detail-header">
        <h2>${this.escapeHtml(gig.title)}</h2>
        <div class="detail-meta-line">
          ${gig.category} · ${isOffering ? 'Offering service' : 'Requesting help'} · <strong>${paymentStr}</strong> · <span class="${statusClass}">${gig.status}</span> (${deadlineLine})
        </div>
      </div>

      <div class="detail-poster-line">
        <div>
          Posted by <strong>${this.escapeHtml(owner.name)}</strong> · ${owner.major}, ${owner.semester} sem
        </div>
        <div>
          ${ratingLine}
        </div>
      </div>

      <div class="detail-body">${this.escapeHtml(gig.description)}</div>

      ${actionSection}
    `;

    // Bind Apply Form
    const formApply = document.getElementById("form-apply");
    if (formApply) {
      formApply.addEventListener("submit", (e) => {
        e.preventDefault();
        const msgInput = document.getElementById("apply-msg");
        const errMsg = document.getElementById("err-apply-msg");
        if (!msgInput.value.trim()) {
          errMsg.classList.add("visible");
          return;
        }
        errMsg.classList.remove("visible");

        try {
          mockDb.createApplication({
            gig_id: gig.id,
            applicant_id: this.activeUserId,
            message: msgInput.value.trim()
          });
          this.showToast("Application sent.");
          this.render();
        } catch (err) {
          this.showToast(err.message);
        }
      });
    }

    // Bind Accept / Reject buttons for owner
    this.detailContentArea.querySelectorAll(".btn-accept-app").forEach(b => {
      b.addEventListener("click", () => {
        try {
          mockDb.updateApplicationStatus(b.dataset.id, "Accepted", this.activeUserId);
          this.showToast("Applicant accepted. Gig is now In Progress.");
          this.render();
        } catch (err) {
          this.showToast(err.message);
        }
      });
    });

    this.detailContentArea.querySelectorAll(".btn-reject-app").forEach(b => {
      b.addEventListener("click", () => {
        try {
          mockDb.updateApplicationStatus(b.dataset.id, "Rejected", this.activeUserId);
          this.showToast("Application rejected.");
          this.render();
        } catch (err) {
          this.showToast(err.message);
        }
      });
    });

    // Bind Mark completed button
    const btnMarkComp = document.getElementById("btn-mark-completed");
    if (btnMarkComp) {
      btnMarkComp.addEventListener("click", () => {
        try {
          mockDb.updateGigStatus(gig.id, "Completed", this.activeUserId);
          this.showToast("Gig marked completed.");
          this.render();
        } catch (err) {
          this.showToast(err.message);
        }
      });
    }

    // Bind Review buttons
    const btnOwnerRate = document.getElementById("btn-owner-rate-applicant");
    if (btnOwnerRate) {
      btnOwnerRate.addEventListener("click", () => {
        this.openReviewModal(gig.id, gig.accepted_applicant ? gig.accepted_applicant.name : "applicant");
      });
    }

    const btnAppRate = document.getElementById("btn-applicant-rate-owner");
    if (btnAppRate) {
      btnAppRate.addEventListener("click", () => {
        this.openReviewModal(gig.id, gig.owner ? gig.owner.name : "owner");
      });
    }
  }

  // =========================================================================
  // VIEW 3: POST A GIG
  // =========================================================================

  renderPostForm() {
    // Set default deadline 7 days ahead
    const d = new Date();
    d.setDate(d.getDate() + 7);
    this.postDeadline.value = d.toISOString().split("T")[0];

    const isPaid = this.postPayment.value === "Paid";
    this.wrapPostBudget.style.display = isPaid ? "block" : "none";
  }

  handlePostSubmit() {
    let hasError = false;

    // Reset error states
    [this.errTitle, this.errDesc, this.errBudget, this.errDeadline].forEach(el => el.classList.remove("visible"));

    const title = this.postTitle.value.trim();
    const desc = this.postDesc.value.trim();
    const cat = this.postCategory.value;
    const type = this.postType.value;
    const payment = this.postPayment.value;
    const budgetVal = this.postBudget.value;
    const deadline = this.postDeadline.value;

    if (!title) {
      this.errTitle.classList.add("visible");
      hasError = true;
    }

    if (!desc) {
      this.errDesc.classList.add("visible");
      hasError = true;
    }

    if (payment === "Paid") {
      if (!budgetVal || Number(budgetVal) <= 0) {
        this.errBudget.classList.add("visible");
        hasError = true;
      }
    }

    if (!deadline) {
      this.errDeadline.classList.add("visible");
      hasError = true;
    }

    if (hasError) return;

    try {
      mockDb.createGig({
        user_id: this.activeUserId,
        title,
        description: desc,
        category: cat,
        type,
        payment_type: payment,
        budget: payment === "Paid" ? Number(budgetVal) : null,
        deadline
      });

      this.formPostGig.reset();
      this.showToast("Gig posted.");
      this.switchView("view-browse");
    } catch (err) {
      this.showToast(err.message);
    }
  }

  // =========================================================================
  // VIEW 4: MY ACTIVITY (SUB-TABS: MY GIGS / MY APPLICATIONS)
  // =========================================================================

  renderActivity() {
    if (this.activeSubtab === "my-gigs") {
      const gigs = mockDb.getGigs({ user_id: this.activeUserId, status: "All" });

      if (gigs.length === 0) {
        this.activityContentArea.innerHTML = `
          <div class="empty-state">
            <h4>You haven't posted any gigs yet.</h4>
            <p style="font-size: 13px; margin-top: 4px;">Click "Post a gig" in the header to post one.</p>
          </div>
        `;
        return;
      }

      this.activityContentArea.innerHTML = `
        <div class="activity-table-wrap">
          <table class="gigs-table">
            <thead>
              <tr>
                <th style="width: 44%;">Title</th>
                <th style="width: 14%;">Category</th>
                <th style="width: 12%;">Applicants</th>
                <th style="width: 15%;">Deadline</th>
                <th style="width: 15%;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${gigs.map(g => {
                const apps = mockDb.applications.filter(a => a.gig_id === g.id);
                const statusClass = "status-" + g.status.toLowerCase().replace(/\s+/g, "-");
                return `
                  <tr data-gig-id="${g.id}">
                    <td>
                      <div class="gig-row-title">${this.escapeHtml(g.title)}</div>
                    </td>
                    <td>${g.category}</td>
                    <td>${apps.length} applicant${apps.length === 1 ? '' : 's'}</td>
                    <td>${this.formatDeadline(g.deadline, g.status)}</td>
                    <td><span class="status-text ${statusClass}">${g.status}</span></td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      `;
    } else {
      // My applications
      const apps = mockDb.getApplicationsForUser(this.activeUserId);

      if (apps.length === 0) {
        this.activityContentArea.innerHTML = `
          <div class="empty-state">
            <h4>No applications yet.</h4>
            <p style="font-size: 13px; margin-top: 4px;">Browse open gigs and apply with a short message.</p>
          </div>
        `;
        return;
      }

      this.activityContentArea.innerHTML = `
        <div class="activity-table-wrap">
          <table class="gigs-table">
            <thead>
              <tr>
                <th style="width: 40%;">Gig Title</th>
                <th style="width: 15%;">Poster</th>
                <th style="width: 15%;">Applied</th>
                <th style="width: 15%;">Gig Status</th>
                <th style="width: 15%;">Your Status</th>
              </tr>
            </thead>
            <tbody>
              ${apps.map(a => {
                const gig = a.gig || { title: "Gig", status: "Open", owner: { name: "Poster" } };
                const appStatusClass = a.status === "Accepted"
                  ? "status-open"
                  : (a.status === "Rejected" ? "status-expired" : "status-in-progress");

                return `
                  <tr data-gig-id="${a.gig_id}">
                    <td>
                      <div class="gig-row-title">${this.escapeHtml(gig.title)}</div>
                    </td>
                    <td>${this.escapeHtml(gig.owner ? gig.owner.name : 'Student')}</td>
                    <td>${a.created_at}</td>
                    <td>${gig.status}</td>
                    <td><span class="status-text ${appStatusClass}">${a.status}</span></td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      `;
    }

    // Attach row clicks
    this.activityContentArea.querySelectorAll("tr[data-gig-id]").forEach(row => {
      row.addEventListener("click", () => {
        this.currentGigDetailId = row.dataset.gigId;
        this.switchView("view-detail");
      });
    });
  }

  // =========================================================================
  // VIEW 5: PROFILE
  // =========================================================================

  renderProfile() {
    const user = this.getActiveUser();

    // One line: "12 posted · 9 completed · 4.6 rating"
    const ratingStr = user.average_rating > 0
      ? `${user.average_rating} rating (${user.reviews_count} reviews)`
      : `no ratings yet`;
    const statLine = `${user.gigs_posted_count} posted · ${user.gigs_completed_count} completed · ${ratingStr}`;

    const reviews = user.received_reviews || [];
    let reviewsHtml = "";
    if (reviews.length === 0) {
      reviewsHtml = `<p style="font-size: 13px; color: var(--text-muted);">No reviews received yet.</p>`;
    } else {
      reviewsHtml = reviews.map(r => `
        <div class="review-row">
          <div class="review-stars-line">
            ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)} (${r.rating}/5)
          </div>
          <div class="review-comment-body">"${this.escapeHtml(r.comment)}"</div>
          <div class="review-attribution">
            — ${this.escapeHtml(r.reviewer.name)} on "${this.escapeHtml(r.gig.title)}"
          </div>
        </div>
      `).join("");
    }

    this.profileContainer.innerHTML = `
      <div class="profile-top">
        <h2>${this.escapeHtml(user.name)}</h2>
        <div class="profile-academic">${user.major} · ${user.semester} semester</div>
        <div class="profile-stat-line">${statLine}</div>
        <div class="profile-bio-text">${this.escapeHtml(user.bio)}</div>
        <div class="profile-skills-text">
          <strong>Skills:</strong> ${user.skills.join(", ")}
        </div>
      </div>

      <div class="reviews-section">
        <h3 class="reviews-title">Reviews (${reviews.length})</h3>
        ${reviewsHtml}
      </div>
    `;
  }

  // =========================================================================
  // VIEW 6: API CONSOLE
  // =========================================================================

  renderApiConsole() {
    this.apiStatUsers.textContent = mockDb.users.length;
    this.apiStatGigs.textContent = mockDb.gigs.length;
    this.apiStatApps.textContent = mockDb.applications.length;
    this.apiStatRevs.textContent = mockDb.reviews.length;
  }

  // =========================================================================
  // REVIEW MODAL
  // =========================================================================

  openReviewModal(gigId, targetName) {
    this.reviewGigId.value = gigId;
    this.reviewTargetLabel.textContent = `Rating for ${targetName} (1 to 5)`;
    this.reviewCommentInput.value = "";
    this.errReviewComment.classList.remove("visible");
    this.modalReview.classList.add("open");
  }

  handleReviewSubmit() {
    const gigId = this.reviewGigId.value;
    const rating = Number(this.reviewRatingSelect.value);
    const comment = this.reviewCommentInput.value.trim();

    if (!comment) {
      this.errReviewComment.classList.add("visible");
      return;
    }
    this.errReviewComment.classList.remove("visible");

    try {
      mockDb.createReview({
        gig_id: gigId,
        reviewer_id: this.activeUserId,
        rating,
        comment
      });

      this.modalReview.classList.remove("open");
      this.showToast("Review submitted.");
      this.render();
    } catch (err) {
      this.showToast(err.message);
    }
  }

  // =========================================================================
  // MINIMAL TOAST & UTILITIES
  // =========================================================================

  showToast(text) {
    this.toastMsg.textContent = text;
    this.toastMsg.classList.add("show");
    setTimeout(() => {
      this.toastMsg.classList.remove("show");
    }, 2500);
  }

  escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

// Bootstrap
document.addEventListener("DOMContentLoaded", () => {
  window.campusGigApp = new CampusGigApp();
});
