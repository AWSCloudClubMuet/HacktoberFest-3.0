/**
 * TaskPeer — Campus Marketplace Portal Controller
 * Refined Features:
 * - 2-Second Splash screen with TaskPeer and tagline
 * - Solid green buttons (no gradients)
 * - 5 interactive clickable visual star rating buttons in Review Modal
 * - Centered Post a Gig, My Activity, and Gig Detail screens
 * - SkillSwap dedicated return-service field
 * - Star rating icons & pencil edit icons
 * - Proper crisp corners
 */

import { mockDb } from './mockApi.js';

// Blob Face Avatar generator (SVG)
export function getBlobAvatarSvg(userId, size = 40, isSleepy = false) {
    const colors = ['#FF6B6B', '#FFE94A', '#3A3FB0', '#8B5CF6', '#6EE7A0'];
    let hash = 0;
    const str = String(userId || 'guest');
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    const colorIndex = Math.abs(hash) % colors.length;
    const bgColor = colors[colorIndex];
    const faceColor = (bgColor === '#3A3FB0' || bgColor === '#8B5CF6') ? '#FFFFFF' : '#0B0B1A';

    if (isSleepy) {
        return `<svg width="${size}" height="${size}" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" class="blob-avatar" aria-hidden="true">
            <circle cx="22" cy="22" r="22" fill="${bgColor}"/>
            <path d="M13 20C15 17 19 17 21 20" stroke="${faceColor}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
            <path d="M23 20C25 17 29 17 31 20" stroke="${faceColor}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
            <path d="M18 28C20 27 24 27 26 28" stroke="${faceColor}" stroke-width="2" stroke-linecap="round" fill="none"/>
        </svg>`;
    }

    return `<svg width="${size}" height="${size}" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" class="blob-avatar" aria-hidden="true">
        <circle cx="22" cy="22" r="22" fill="${bgColor}"/>
        <circle cx="16" cy="18" r="2.5" fill="${faceColor}"/>
        <circle cx="28" cy="18" r="2.5" fill="${faceColor}"/>
        <path d="M15 25C17 29 27 29 29 25" stroke="${faceColor}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    </svg>`;
}

// Single Star Icon SVG
export function renderSingleStarSvg(size = 14) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="#FFE94A" stroke="#B45309" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="star-icon" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>`;
}

// 5-Star Rating Icons SVG Group
export function renderStarRatingSvg(rating, max = 5, size = 15) {
    let stars = '';
    const rounded = Math.round(Number(rating) || 0);
    for (let i = 1; i <= max; i++) {
        const isFilled = i <= rounded;
        stars += `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${isFilled ? '#FFE94A' : '#E2E8F0'}" stroke="${isFilled ? '#B45309' : '#94A3B8'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="star-icon" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>`;
    }
    return `<span class="star-rating-row">${stars}</span>`;
}

// Pencil Edit Icon SVG
export function getPencilIconSvg(size = 14) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>`;
}

class CampusGigApp {
    constructor() {
        this.activeUserId = localStorage.getItem("campus_active_user") || "usr_1";
        this.currentView = "view-browse";
        this.activeSubtab = "my-gigs";
        this.currentGigDetailId = null;
        this.currentProfileUserId = null;
        this.previousViewForProfile = null;
        this.isEditingBio = false;
        this.isEditingSkills = false;
        this.debounceTimer = null;

        this.initSplash();
        this.initElements();
        this.bindEvents();
        this.initInteractiveStars();
        this.render();
    }

    // 2-Second Splash Screen that disappears on its own
    initSplash() {
        setTimeout(() => {
            const splash = document.getElementById("splash-screen");
            if (splash) {
                splash.classList.add("fade-out");
                setTimeout(() => splash.remove(), 280);
            }
        }, 2000);
    }

    initElements() {
        // Header & Nav
        this.headerAuthArea = document.getElementById("header-auth-area");
        this.headerActivityCount = document.getElementById("header-activity-count");
        this.desktopNavLinks = document.querySelectorAll(".desktop-nav .nav-link");
        this.bottomTabItems = document.querySelectorAll(".bottom-tab-bar .tab-item");
        this.viewPanels = document.querySelectorAll(".view-panel");

        // Browse elements
        this.searchInput = document.getElementById("search-input");
        this.resultsCountText = document.getElementById("results-count-text");
        this.gigsCardsList = document.getElementById("gigs-cards-list");
        this.gigsTableBody = document.getElementById("gigs-table-body");
        this.filterCatRadios = document.querySelectorAll("input[name='filter-cat']");
        this.filterTypeRadios = document.querySelectorAll("input[name='filter-type']");
        this.filterPaymentRadios = document.querySelectorAll("input[name='filter-payment']");
        this.filterMinBudget = document.getElementById("filter-min-budget");
        this.filterMaxBudget = document.getElementById("filter-max-budget");
        this.btnResetFilters = document.getElementById("btn-reset-filters");

        // Mobile Filter Chips & Bottom Sheet
        this.btnMobileCat = document.getElementById("btn-mobile-cat-filter");
        this.btnMobileType = document.getElementById("btn-mobile-type-filter");
        this.btnMobilePayment = document.getElementById("btn-mobile-payment-filter");
        this.btnMobileBudget = document.getElementById("btn-mobile-budget-filter");
        this.btnMobileReset = document.getElementById("btn-mobile-reset-filter");
        this.modalFilterSheet = document.getElementById("modal-filter-sheet");
        this.filterSheetBody = document.getElementById("filter-sheet-body");
        this.btnCloseFilterSheet = document.getElementById("btn-close-filter-sheet");
        this.btnSheetApply = document.getElementById("btn-sheet-apply");
        this.btnSheetReset = document.getElementById("btn-sheet-reset");
        this.sheetTitle = document.getElementById("sheet-title");

        this.labelMobileCat = document.getElementById("label-mobile-cat");
        this.labelMobileType = document.getElementById("label-mobile-type");
        this.labelMobilePayment = document.getElementById("label-mobile-payment");

        // Detail elements
        this.detailContentArea = document.getElementById("detail-content-area");
        this.btnBackToBrowse = document.getElementById("btn-back-to-browse");

        // Post a gig form
        this.formPostGig = document.getElementById("form-post-gig");
        this.postTitle = document.getElementById("post-title");
        this.postCategory = document.getElementById("post-category");
        this.postType = document.getElementById("post-type");
        this.togglePostType = document.getElementById("toggle-post-type");
        this.postDesc = document.getElementById("post-desc");
        this.postPayment = document.getElementById("post-payment");
        this.togglePostPayment = document.getElementById("toggle-post-payment");
        this.wrapPostBudget = document.getElementById("wrap-post-budget");
        this.postBudget = document.getElementById("post-budget");
        this.postDeadline = document.getElementById("post-deadline");
        this.btnCancelPost = document.getElementById("btn-cancel-post");

        // Errors
        this.errTitle = document.getElementById("err-title");
        this.errCategory = document.getElementById("err-category");
        this.errDesc = document.getElementById("err-desc");
        this.errBudget = document.getElementById("err-budget");
        this.errDeadline = document.getElementById("err-deadline");

        // Activity elements
        this.subtabMyGigs = document.getElementById("subtab-my-gigs");
        this.subtabMyApps = document.getElementById("subtab-my-apps");
        this.activityContentArea = document.getElementById("activity-content-area");

        // Profile elements
        this.profileContainer = document.getElementById("profile-container");

        // Student Login Modal
        this.modalLogin = document.getElementById("modal-login");
        this.loginStudentsList = document.getElementById("login-students-list");
        this.btnCloseLoginModal = document.getElementById("btn-close-login-modal");
        this.btnCancelLoginModal = document.getElementById("btn-cancel-login-modal");

        // Review Modal
        this.modalReview = document.getElementById("modal-review");
        this.formReview = document.getElementById("form-review");
        this.reviewGigId = document.getElementById("review-gig-id");
        this.reviewTargetLabel = document.getElementById("review-target-label");
        this.reviewRatingSelect = document.getElementById("review-rating-select");
        this.interactiveStars = document.getElementById("interactive-stars");
        this.ratingTextHint = document.getElementById("rating-text-hint");
        this.reviewCommentInput = document.getElementById("review-comment-input");
        this.errReviewComment = document.getElementById("err-review-comment");
        this.btnCloseReviewModal = document.getElementById("btn-close-review-modal");
        this.btnCancelReviewModal = document.getElementById("btn-cancel-review-modal");

        // Dev Modal
        this.btnDevLink = document.getElementById("btn-dev-link");
        this.modalDev = document.getElementById("modal-dev");
        this.btnCloseDevModal = document.getElementById("btn-close-dev-modal");
        this.btnCloseDev = document.getElementById("btn-close-dev");
        this.btnDevResetDb = document.getElementById("btn-dev-reset-db");
        this.btnDevClearSession = document.getElementById("btn-dev-clear-session");

        // Toast
        this.toastMsg = document.getElementById("toast-msg");
    }

    // 5 Interactive visual stars in review modal
    initInteractiveStars() {
        if (!this.interactiveStars) return;

        const starBtns = this.interactiveStars.querySelectorAll(".star-btn");
        const setRating = (rating) => {
            if (this.reviewRatingSelect) {
                this.reviewRatingSelect.value = String(rating);
            }
            if (this.ratingTextHint) {
                this.ratingTextHint.textContent = `${rating} ${rating === 1 ? 'star' : 'stars'}`;
            }
            starBtns.forEach(btn => {
                const val = Number(btn.dataset.val);
                const isFilled = val <= rating;
                const polygon = btn.querySelector("polygon");
                if (polygon) {
                    polygon.setAttribute("fill", isFilled ? "#FFE94A" : "#E2E8F0");
                    polygon.setAttribute("stroke", isFilled ? "#B45309" : "#94A3B8");
                }
            });
        };

        starBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const val = Number(btn.dataset.val);
                setRating(val);
            });
        });

        // Default to 5 stars
        setRating(5);
    }

    bindEvents() {
        this.desktopNavLinks.forEach(link => {
            link.addEventListener("click", () => {
                const view = link.dataset.view;
                this.handleNavViewRequest(view);
            });
        });

        this.bottomTabItems.forEach(tab => {
            tab.addEventListener("click", () => {
                const view = tab.dataset.view;
                this.handleNavViewRequest(view);
            });
        });

        document.getElementById("nav-brand")?.addEventListener("click", (e) => {
            e.preventDefault();
            this.switchView("view-browse");
        });

        this.searchInput?.addEventListener("input", () => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => this.renderBrowse(), 150);
        });

        const filterInputs = [
            ...this.filterCatRadios,
            ...this.filterTypeRadios,
            ...this.filterPaymentRadios,
            this.filterMinBudget,
            this.filterMaxBudget
        ];
        filterInputs.forEach(input => {
            if (!input) return;
            input.addEventListener("change", () => {
                this.updateMobileFilterLabels();
                this.renderBrowse();
            });
            input.addEventListener("input", () => {
                this.renderBrowse();
            });
        });

        const resetAction = () => {
            if (this.searchInput) this.searchInput.value = "";
            const catAll = document.querySelector("input[name='filter-cat'][value='All']");
            if (catAll) catAll.checked = true;
            const typeAll = document.querySelector("input[name='filter-type'][value='All']");
            if (typeAll) typeAll.checked = true;
            const payAll = document.querySelector("input[name='filter-payment'][value='All']");
            if (payAll) payAll.checked = true;
            if (this.filterMinBudget) this.filterMinBudget.value = "";
            if (this.filterMaxBudget) this.filterMaxBudget.value = "";
            this.updateMobileFilterLabels();
            this.renderBrowse();
        };

        this.btnResetFilters?.addEventListener("click", resetAction);
        this.btnMobileReset?.addEventListener("click", resetAction);

        this.btnMobileCat?.addEventListener("click", () => this.openFilterSheet("category"));
        this.btnMobileType?.addEventListener("click", () => this.openFilterSheet("type"));
        this.btnMobilePayment?.addEventListener("click", () => this.openFilterSheet("payment"));
        this.btnMobileBudget?.addEventListener("click", () => this.openFilterSheet("budget"));

        const closeSheet = () => this.modalFilterSheet?.classList.remove("open");
        this.btnCloseFilterSheet?.addEventListener("click", closeSheet);
        this.btnSheetApply?.addEventListener("click", () => {
            closeSheet();
            this.updateMobileFilterLabels();
            this.renderBrowse();
        });
        this.btnSheetReset?.addEventListener("click", () => {
            resetAction();
            closeSheet();
        });
        this.modalFilterSheet?.addEventListener("click", (e) => {
            if (e.target === this.modalFilterSheet) closeSheet();
        });

        this.btnBackToBrowse?.addEventListener("click", () => {
            this.switchView("view-browse");
        });

        this.togglePostType?.querySelectorAll(".segmented-pill-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                this.togglePostType.querySelectorAll(".segmented-pill-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                if (this.postType) {
                    this.postType.value = btn.dataset.value;
                }
            });
        });

        this.togglePostPayment?.querySelectorAll(".segmented-pill-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                this.togglePostPayment.querySelectorAll(".segmented-pill-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                const val = btn.dataset.value;
                if (this.postPayment) {
                    this.postPayment.value = val;
                }
                const isPaid = val === "Paid";
                if (this.wrapPostBudget) {
                    this.wrapPostBudget.style.display = isPaid ? "block" : "none";
                }
                if (!isPaid && this.postBudget) {
                    this.postBudget.value = "";
                    this.errBudget?.classList.remove("visible");
                }
            });
        });

        this.btnCancelPost?.addEventListener("click", () => {
            this.switchView("view-browse");
        });

        this.formPostGig?.addEventListener("submit", (e) => {
            e.preventDefault();
            this.handlePostSubmit();
        });

        this.subtabMyGigs?.addEventListener("click", () => {
            this.activeSubtab = "my-gigs";
            this.subtabMyGigs.classList.add("active");
            this.subtabMyApps.classList.remove("active");
            this.renderActivity();
        });
        this.subtabMyApps?.addEventListener("click", () => {
            this.activeSubtab = "my-apps";
            this.subtabMyApps.classList.add("active");
            this.subtabMyGigs.classList.remove("active");
            this.renderActivity();
        });

        const closeLogin = () => this.modalLogin?.classList.remove("open");
        this.btnCloseLoginModal?.addEventListener("click", closeLogin);
        this.btnCancelLoginModal?.addEventListener("click", closeLogin);
        this.modalLogin?.addEventListener("click", (e) => {
            if (e.target === this.modalLogin) closeLogin();
        });

        const closeReview = () => this.modalReview?.classList.remove("open");
        this.btnCloseReviewModal?.addEventListener("click", closeReview);
        this.btnCancelReviewModal?.addEventListener("click", closeReview);
        this.modalReview?.addEventListener("click", (e) => {
            if (e.target === this.modalReview) closeReview();
        });

        this.formReview?.addEventListener("submit", (e) => {
            e.preventDefault();
            this.handleReviewSubmit();
        });

        const closeDev = () => this.modalDev?.classList.remove("open");
        this.btnDevLink?.addEventListener("click", () => this.modalDev?.classList.add("open"));
        this.btnCloseDevModal?.addEventListener("click", closeDev);
        this.btnCloseDev?.addEventListener("click", closeDev);
        this.modalDev?.addEventListener("click", (e) => {
            if (e.target === this.modalDev) closeDev();
        });

        this.btnDevResetDb?.addEventListener("click", () => {
            mockDb.reset();
            closeDev();
            this.showToast("Database reset to seed data.");
            this.render();
        });

        this.btnDevClearSession?.addEventListener("click", () => {
            this.handleLogout();
            closeDev();
        });
    }

    handleNavViewRequest(view) {
        if ((view === "view-post" || view === "view-activity" || view === "view-profile") && !this.activeUserId) {
            this.openLoginModal("Sign in as a student to access this page.");
            return;
        }

        if (view === "view-profile") {
            this.currentProfileUserId = this.activeUserId;
            this.isEditingBio = false;
            this.isEditingSkills = false;
        }

        this.switchView(view);
    }

    updateMobileFilterLabels() {
        const catVal = document.querySelector("input[name='filter-cat']:checked")?.value || "All";
        const typeVal = document.querySelector("input[name='filter-type']:checked")?.value || "All";
        const payVal = document.querySelector("input[name='filter-payment']:checked")?.value || "All";

        if (this.labelMobileCat) this.labelMobileCat.textContent = `Category: ${catVal}`;
        if (this.labelMobileType) this.labelMobileType.textContent = `Type: ${typeVal}`;
        if (this.labelMobilePayment) this.labelMobilePayment.textContent = `Payment: ${payVal}`;

        if (this.btnMobileCat) this.btnMobileCat.classList.toggle("active", catVal !== "All");
        if (this.btnMobileType) this.btnMobileType.classList.toggle("active", typeVal !== "All");
        if (this.btnMobilePayment) this.btnMobilePayment.classList.toggle("active", payVal !== "All");
    }

    openFilterSheet(focusSection = "all") {
        if (!this.filterSheetBody) return;

        let content = "";
        const catVal = document.querySelector("input[name='filter-cat']:checked")?.value || "All";
        const typeVal = document.querySelector("input[name='filter-type']:checked")?.value || "All";
        const payVal = document.querySelector("input[name='filter-payment']:checked")?.value || "All";
        const minVal = this.filterMinBudget?.value || "";
        const maxVal = this.filterMaxBudget?.value || "";

        if (focusSection === "category") {
            this.sheetTitle.textContent = "Filter Category";
            content = `
                <div class="filter-options">
                    ${["All", "Programming", "Design", "Writing", "Tutoring"].map(c => `
                        <label class="filter-radio-label">
                            <input type="radio" name="sheet-cat" value="${c}" ${catVal === c ? 'checked' : ''}> ${c === 'All' ? 'All categories' : c}
                        </label>
                    `).join("")}
                </div>
            `;
        } else if (focusSection === "type") {
            this.sheetTitle.textContent = "Filter Type";
            content = `
                <div class="filter-options">
                    <label class="filter-radio-label">
                        <input type="radio" name="sheet-type" value="All" ${typeVal === 'All' ? 'checked' : ''}> All types
                    </label>
                    <label class="filter-radio-label">
                        <input type="radio" name="sheet-type" value="Offering" ${typeVal === 'Offering' ? 'checked' : ''}> Offering service
                    </label>
                    <label class="filter-radio-label">
                        <input type="radio" name="sheet-type" value="Requesting" ${typeVal === 'Requesting' ? 'checked' : ''}> Requesting help
                    </label>
                </div>
            `;
        } else if (focusSection === "payment") {
            this.sheetTitle.textContent = "Filter Payment";
            content = `
                <div class="filter-options">
                    <label class="filter-radio-label">
                        <input type="radio" name="sheet-pay" value="All" ${payVal === 'All' ? 'checked' : ''}> All payment
                    </label>
                    <label class="filter-radio-label">
                        <input type="radio" name="sheet-pay" value="Paid" ${payVal === 'Paid' ? 'checked' : ''}> Paid
                    </label>
                    <label class="filter-radio-label">
                        <input type="radio" name="sheet-pay" value="SkillSwap" ${payVal === 'SkillSwap' ? 'checked' : ''}> Skill swap
                    </label>
                    <label class="filter-radio-label">
                        <input type="radio" name="sheet-pay" value="Free" ${payVal === 'Free' ? 'checked' : ''}> Free
                    </label>
                </div>
            `;
        } else {
            this.sheetTitle.textContent = "Filter Budget";
            content = `
                <div class="budget-row" style="margin-top: 10px;">
                    <input type="number" id="sheet-min-budget" placeholder="Min" min="0" value="${minVal}">
                    <span class="budget-sep">–</span>
                    <input type="number" id="sheet-max-budget" placeholder="Max" min="0" value="${maxVal}">
                </div>
            `;
        }

        this.filterSheetBody.innerHTML = content;

        if (focusSection === "category") {
            this.filterSheetBody.querySelectorAll("input[name='sheet-cat']").forEach(r => {
                r.addEventListener("change", () => {
                    const target = document.querySelector(`input[name='filter-cat'][value='${r.value}']`);
                    if (target) target.checked = true;
                });
            });
        } else if (focusSection === "type") {
            this.filterSheetBody.querySelectorAll("input[name='sheet-type']").forEach(r => {
                r.addEventListener("change", () => {
                    const target = document.querySelector(`input[name='filter-type'][value='${r.value}']`);
                    if (target) target.checked = true;
                });
            });
        } else if (focusSection === "payment") {
            this.filterSheetBody.querySelectorAll("input[name='sheet-pay']").forEach(r => {
                r.addEventListener("change", () => {
                    const target = document.querySelector(`input[name='filter-payment'][value='${r.value}']`);
                    if (target) target.checked = true;
                });
            });
        } else if (focusSection === "budget") {
            const sheetMin = document.getElementById("sheet-min-budget");
            const sheetMax = document.getElementById("sheet-max-budget");
            sheetMin?.addEventListener("input", () => {
                if (this.filterMinBudget) this.filterMinBudget.value = sheetMin.value;
            });
            sheetMax?.addEventListener("input", () => {
                if (this.filterMaxBudget) this.filterMaxBudget.value = sheetMax.value;
            });
        }

        this.modalFilterSheet.classList.add("open");
    }

    // =========================================================================
    // AUTHENTICATION & LOGIN SYSTEM
    // =========================================================================

    getActiveUser() {
        if (!this.activeUserId) return null;
        return mockDb.getUserProfile(this.activeUserId) || null;
    }

    renderAuthHeader() {
        const user = this.getActiveUser();

        if (user) {
            const firstName = user.name.split(" ")[0];
            const avatarSvg = getBlobAvatarSvg(user.id, 30);

            this.headerAuthArea.innerHTML = `
                <button class="user-switcher-btn" id="btn-switch-account" aria-label="Switch student account">
                    ${avatarSvg}
                    <div class="switcher-text">
                        <span class="switcher-viewing">Viewing as</span>
                        <span class="switcher-name">${this.escapeHtml(firstName)}</span>
                    </div>
                    <svg class="switcher-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
            `;

            document.getElementById("btn-switch-account")?.addEventListener("click", () => {
                this.openLoginModal();
            });
        } else {
            this.headerAuthArea.innerHTML = `
                <button class="btn-primary" id="btn-open-login" style="padding: 6px 16px; font-size: 13px;">Sign in</button>
            `;

            document.getElementById("btn-open-login")?.addEventListener("click", () => {
                this.openLoginModal();
            });
        }
    }

    openLoginModal(noticeText = null) {
        const users = mockDb.users;
        this.loginStudentsList.innerHTML = users.map(u => {
            const isCurrent = this.activeUserId === u.id;
            const avatarSvg = getBlobAvatarSvg(u.id, 34);
            return `
                <div class="student-login-row" data-user-id="${u.id}">
                    <div class="student-login-info">
                        ${avatarSvg}
                        <div>
                            <strong>${this.escapeHtml(u.name)}</strong>
                            <div style="font-size: 12px; color: var(--text-muted);">${u.major} · ${u.semester} semester</div>
                        </div>
                    </div>
                    <button class="${isCurrent ? 'btn-primary' : 'btn-secondary'}" style="font-size: 12px; padding: 4px 14px; min-height: 30px;">
                        ${isCurrent ? 'Active' : 'Sign in'}
                    </button>
                </div>
            `;
        }).join("");

        this.loginStudentsList.querySelectorAll(".student-login-row").forEach(row => {
            row.addEventListener("click", () => {
                this.handleLoginAs(row.dataset.userId);
            });
        });

        if (noticeText) {
            this.showToast(noticeText);
        }

        this.modalLogin.classList.add("open");
    }

    handleLoginAs(userId) {
        this.activeUserId = userId;
        this.currentProfileUserId = userId;
        this.isEditingBio = false;
        this.isEditingSkills = false;
        localStorage.setItem("campus_active_user", userId);
        this.modalLogin.classList.remove("open");
        const u = this.getActiveUser();
        this.showToast(`Signed in as ${u ? u.name : 'Student'}.`);
        this.render();
    }

    handleLogout() {
        this.activeUserId = null;
        this.currentProfileUserId = null;
        this.isEditingBio = false;
        this.isEditingSkills = false;
        localStorage.removeItem("campus_active_user");
        this.showToast("Signed out.");
        if (this.currentView === "view-post" || this.currentView === "view-activity" || this.currentView === "view-profile") {
            this.switchView("view-browse");
        } else {
            this.render();
        }
    }

    switchView(viewId) {
        this.currentView = viewId;

        this.desktopNavLinks.forEach(link => {
            link.classList.toggle("active", link.dataset.view === viewId);
        });

        this.bottomTabItems.forEach(tab => {
            tab.classList.toggle("active", tab.dataset.view === viewId);
        });

        this.viewPanels.forEach(panel => {
            panel.classList.toggle("active", panel.id === viewId);
        });

        window.scrollTo({ top: 0, behavior: 'instant' });
        this.render();
    }

    openUserProfile(userId) {
        if (!userId) return;
        this.previousViewForProfile = this.currentView;
        this.currentProfileUserId = userId;
        this.isEditingBio = false;
        this.isEditingSkills = false;
        this.switchView("view-profile");
    }

    render() {
        this.renderAuthHeader();

        if (this.activeUserId) {
            const myGigs = mockDb.getGigs({ user_id: this.activeUserId, status: "All" });
            const myApps = mockDb.getApplicationsForUser(this.activeUserId);
            const totalActivity = myGigs.length + myApps.length;
            if (this.headerActivityCount) {
                this.headerActivityCount.textContent = totalActivity > 0 ? `(${totalActivity})` : "";
            }
        } else {
            if (this.headerActivityCount) {
                this.headerActivityCount.textContent = "";
            }
        }

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
        }
    }

    // =========================================================================
    // VIEW 1: BROWSE (STACKED CARDS, PROPER CORNERS)
    // =========================================================================

    renderBrowse() {
        const catVal = document.querySelector("input[name='filter-cat']:checked")?.value || "All";
        const typeVal = document.querySelector("input[name='filter-type']:checked")?.value || "All";
        const payVal = document.querySelector("input[name='filter-payment']:checked")?.value || "All";

        const filters = {
            q: this.searchInput ? this.searchInput.value : "",
            category: catVal,
            type: typeVal,
            payment_type: payVal,
            status: "Open",
            min_budget: this.filterMinBudget ? this.filterMinBudget.value : "",
            max_budget: this.filterMaxBudget ? this.filterMaxBudget.value : ""
        };

        const gigs = mockDb.getGigs(filters);
        if (this.resultsCountText) {
            this.resultsCountText.textContent = `${gigs.length} ${gigs.length === 1 ? 'gig' : 'gigs'} found`;
        }

        if (gigs.length === 0) {
            const emptyHtml = `
                <div class="empty-state">
                    ${getBlobAvatarSvg('sleepy', 52, true)}
                    <div>
                        <h4>Nothing matches. Try fewer filters.</h4>
                        <p style="margin-top: 4px;">Clear your search or switch to all categories.</p>
                    </div>
                </div>
            `;
            if (this.gigsCardsList) this.gigsCardsList.innerHTML = emptyHtml;
            if (this.gigsTableBody) this.gigsTableBody.innerHTML = `<tr><td colspan="6">${emptyHtml}</td></tr>`;
            return;
        }

        const cardsHtml = gigs.map(gig => {
            const isOffering = gig.type === "Offering";
            const owner = gig.owner || { name: "Student", average_rating: 0, reviews_count: 0 };
            const posterAvatar = getBlobAvatarSvg(gig.user_id, 34);

            const ratingDisplay = owner.average_rating > 0
                ? `${renderSingleStarSvg(13)} <span style="font-weight: 600;">${owner.average_rating}</span>`
                : `${renderSingleStarSvg(13)} <span>New</span>`;

            const paymentStr = gig.payment_type === "Paid"
                ? `Paid $${gig.budget}`
                : (gig.payment_type === "SkillSwap" ? "Skill swap" : "Free");

            const paymentClass = gig.payment_type === "Paid"
                ? "payment-paid"
                : (gig.payment_type === "SkillSwap" ? "payment-swap" : "payment-free");

            const deadlineInfo = this.formatDeadline(gig.deadline, gig.status);
            const statusClass = "status-" + gig.status.toLowerCase().replace(/\s+/g, "-");

            return `
                <article class="gig-card" data-gig-id="${gig.id}">
                    <div class="gig-card-header">
                        <div class="gig-poster-info">
                            ${posterAvatar}
                            <div class="gig-poster-text">
                                <span class="gig-poster-name">${this.escapeHtml(owner.name)}</span>
                                <span class="gig-poster-rating">${ratingDisplay}</span>
                            </div>
                        </div>
                        <span class="status-chip ${statusClass}">${gig.status}</span>
                    </div>

                    <h3 class="gig-card-title">${this.escapeHtml(gig.title)}</h3>
                    <p class="gig-card-desc">${this.escapeHtml(gig.description)}</p>

                    <div class="gig-card-chips">
                        <span class="category-chip">${gig.category}</span>
                        <span class="type-chip">${isOffering ? 'Offering' : 'Requesting'}</span>
                        <span class="payment-chip ${paymentClass}">${paymentStr}</span>
                    </div>

                    <div class="gig-card-footer">
                        <span class="deadline-info">${deadlineInfo}</span>
                        <button class="btn-apply btn-card-apply" data-gig-id="${gig.id}">Apply</button>
                    </div>
                </article>
            `;
        }).join("");

        if (this.gigsCardsList) {
            this.gigsCardsList.innerHTML = cardsHtml;

            this.gigsCardsList.querySelectorAll(".gig-card").forEach(card => {
                card.addEventListener("click", () => {
                    const gigId = card.dataset.gigId;
                    this.currentGigDetailId = gigId;
                    this.switchView("view-detail");
                });
            });

            this.gigsCardsList.querySelectorAll(".btn-card-apply").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const gigId = btn.dataset.gigId;
                    this.currentGigDetailId = gigId;
                    this.switchView("view-detail");
                });
            });
        }
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
    // VIEW 2: GIG DETAIL (CENTERED, SOLID GREEN BUTTON)
    // =========================================================================

    renderDetail(gigId) {
        if (!gigId) {
            this.switchView("view-browse");
            return;
        }

        const gig = mockDb.getGigById(gigId);
        if (!gig) {
            this.detailContentArea.innerHTML = `<div class="card"><p class="empty-state">Gig not found.</p></div>`;
            return;
        }

        const isOwner = this.activeUserId && gig.user_id === this.activeUserId;
        const isOffering = gig.type === "Offering";
        const isSkillSwap = gig.payment_type === "SkillSwap";

        const paymentStr = gig.payment_type === "Paid"
            ? `Paid $${gig.budget}`
            : (gig.payment_type === "SkillSwap" ? "Skill swap" : "Free");

        const paymentClass = gig.payment_type === "Paid"
            ? "payment-paid"
            : (gig.payment_type === "SkillSwap" ? "payment-swap" : "payment-free");

        const owner = gig.owner || { name: "Student", major: "General", semester: "1st", average_rating: 0, reviews_count: 0 };
        const ownerAvatar = getBlobAvatarSvg(owner.id, 40);

        const ratingLine = owner.average_rating > 0
            ? `${renderStarRatingSvg(owner.average_rating, 5, 14)} <span style="font-weight: 600; margin-left: 4px;">${owner.average_rating}</span> (${owner.reviews_count} ${owner.reviews_count === 1 ? 'review' : 'reviews'})`
            : `${renderSingleStarSvg(14)} <span style="margin-left: 4px;">No reviews yet</span>`;

        const statusClass = "status-" + gig.status.toLowerCase().replace(/\s+/g, "-");
        const deadlineLine = this.formatDeadline(gig.deadline, gig.status);

        let actionSection = "";

        if (isOwner) {
            const apps = gig.applications || [];
            const isInProgress = gig.status === "In Progress";
            const isCompleted = gig.status === "Completed";

            let appsHtml = "";
            if (apps.length === 0) {
                appsHtml = `<p style="font-size: 14px; color: var(--text-muted); margin-top: 8px;">No applicants yet.</p>`;
            } else {
                appsHtml = `
                    <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">
                        ${apps.map(app => {
                            const applicant = app.applicant || { name: "Student", major: "General", average_rating: 0, reviews_count: 0 };
                            const appAvatar = getBlobAvatarSvg(app.applicant_id, 32);
                            const appRating = applicant.average_rating > 0
                                ? `${renderSingleStarSvg(12)} ${applicant.average_rating}`
                                : `${renderSingleStarSvg(12)} New`;

                            let actionButtons = "";
                            if (app.status === "Pending" && gig.status === "Open") {
                                actionButtons = `
                                    <div style="display: flex; gap: 6px;">
                                        <button class="btn-primary btn-accept-app" data-id="${app.id}" style="font-size: 12px; padding: 5px 14px; min-height: 32px;">Accept</button>
                                        <button class="btn-secondary btn-reject-app" data-id="${app.id}" style="font-size: 12px; padding: 5px 14px; min-height: 32px;">Reject</button>
                                    </div>
                                `;
                            } else if (app.status === "Accepted") {
                                actionButtons = `<span class="status-chip status-open">Accepted</span>`;
                            } else {
                                actionButtons = `<span class="status-chip status-expired">Rejected</span>`;
                            }

                            return `
                                <div class="applicant-card">
                                    <div class="applicant-card-header">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            ${appAvatar}
                                            <div>
                                                <button class="btn-link student-profile-btn" data-user-id="${app.applicant_id}" style="font-weight: 600; font-size: 13px;">
                                                    ${this.escapeHtml(applicant.name)}
                                                </button>
                                                <div style="color: var(--text-muted); font-size: 12px; display: flex; align-items: center; gap: 4px;">
                                                    ${applicant.major} · ${appRating}
                                                </div>
                                            </div>
                                        </div>
                                        <div>${actionButtons}</div>
                                    </div>
                                    <div class="applicant-msg-text">"${this.escapeHtml(app.message)}"</div>
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
                    <div style="margin-top: 14px; padding: 14px; background: #F8FAFC; border-radius: var(--radius-input); border: 1.5px solid var(--border-input);">
                        <p style="font-size: 14px; margin-bottom: 10px;">Work is in progress. Once the gig is done, mark it completed to exchange reviews.</p>
                        <button class="btn-primary" id="btn-mark-completed">Mark completed</button>
                    </div>
                `;
            }

            let reviewBtnHtml = "";
            if (isCompleted && gig.accepted_applicant_id) {
                const hasReviewed = mockDb.reviews.some(r => r.gig_id === gig.id && r.reviewer_id === this.activeUserId);
                if (!hasReviewed) {
                    reviewBtnHtml = `
                        <div style="margin-top: 12px;">
                            <button class="btn-primary" id="btn-owner-rate-applicant">Rate accepted applicant</button>
                        </div>
                    `;
                } else {
                    reviewBtnHtml = `<p style="font-size: 13px; color: var(--text-muted); margin-top: 10px;">Review submitted for this gig.</p>`;
                }
            }

            actionSection = `
                <div class="detail-main-card">
                    <h3>Applicants (${apps.length})</h3>
                    ${appsHtml}
                    ${completeBtnHtml}
                    ${reviewBtnHtml}
                </div>
            `;
        } else {
            const existingApp = this.activeUserId
                ? (gig.applications || []).find(a => a.applicant_id === this.activeUserId)
                : null;

            const isExpired = gig.status === "Expired";
            const isCompleted = gig.status === "Completed";
            const isAcceptedApplicant = this.activeUserId && gig.accepted_applicant_id === this.activeUserId;

            if (existingApp) {
                let reviewBtnHtml = "";
                if (isCompleted && isAcceptedApplicant) {
                    const hasReviewed = mockDb.reviews.some(r => r.gig_id === gig.id && r.reviewer_id === this.activeUserId);
                    if (!hasReviewed) {
                        reviewBtnHtml = `
                            <div style="margin-top: 12px;">
                                <button class="btn-primary" id="btn-applicant-rate-owner">Rate gig owner</button>
                            </div>
                        `;
                    } else {
                        reviewBtnHtml = `<p style="font-size: 13px; color: var(--text-muted); margin-top: 8px;">Review submitted for this gig.</p>`;
                    }
                }

                actionSection = `
                    <div class="detail-main-card">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                            <span style="font-size: 14px; font-weight: 600;">Your application</span>
                            <span class="status-chip ${existingApp.status === 'Accepted' ? 'status-open' : (existingApp.status === 'Rejected' ? 'status-expired' : 'status-in-progress')}">
                                ${existingApp.status}
                            </span>
                        </div>
                        <p class="applicant-msg-text" style="font-size: 14px; color: var(--text-muted); margin-top: 4px;">
                            ${this.escapeHtml(existingApp.message)}
                        </p>
                        ${reviewBtnHtml}
                    </div>
                `;
            } else if (isExpired) {
                actionSection = `
                    <div class="detail-main-card">
                        <p style="color: var(--text-muted); font-size: 14px;">This gig is expired and closed to applications.</p>
                    </div>
                `;
            } else if (gig.status === "Open") {
                const skillSwapReturnField = isSkillSwap ? `
                    <div class="form-field">
                        <label for="apply-swap-service">What skill or service can you offer in return?</label>
                        <input type="text" id="apply-swap-service" placeholder="e.g. Python debugging, Figma UI mockup, pitch deck polish" ${!this.activeUserId ? 'disabled' : ''}>
                        <div class="field-error" id="err-apply-swap">Please specify the skill or service you offer in return.</div>
                    </div>
                ` : '';

                actionSection = `
                    <div class="detail-main-card">
                        <h3 style="margin-bottom: 8px;">Apply for this gig</h3>
                        ${!this.activeUserId ? '<p style="font-size: 14px; color: var(--text-muted); margin-bottom: 12px;"><a id="link-apply-login">Sign in to submit your application</a></p>' : ''}
                        <form id="form-apply">
                            ${skillSwapReturnField}
                            <div class="form-field">
                                <label for="apply-msg">Short message</label>
                                <textarea id="apply-msg" rows="3" placeholder="Explain your experience or why you are a good fit..." ${!this.activeUserId ? 'disabled' : ''}></textarea>
                                <div class="field-error" id="err-apply-msg">A short message is required.</div>
                            </div>
                            <button type="submit" class="btn-apply" id="btn-submit-apply">Apply</button>
                        </form>
                    </div>
                `;
            } else {
                actionSection = `
                    <div class="detail-main-card">
                        <p style="color: var(--text-muted); font-size: 14px;">This gig is ${gig.status.toLowerCase()} and not accepting applications.</p>
                    </div>
                `;
            }
        }

        this.detailContentArea.innerHTML = `
            <div class="detail-main-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 10px;">
                    <h2>${this.escapeHtml(gig.title)}</h2>
                    <span class="status-chip ${statusClass}">${gig.status}</span>
                </div>

                <div class="gig-card-chips" style="margin-bottom: 14px;">
                    <span class="category-chip">${gig.category}</span>
                    <span class="type-chip">${isOffering ? 'Offering service' : 'Requesting help'}</span>
                    <span class="payment-chip ${paymentClass}">${paymentStr}</span>
                    <span class="deadline-info">${deadlineLine}</span>
                </div>

                <div class="detail-poster-row">
                    ${ownerAvatar}
                    <div style="flex: 1;">
                        <div>
                            <button class="btn-link student-profile-btn" data-user-id="${owner.id}" style="font-weight: 700; font-size: 14px; color: var(--ink-black);">
                                ${this.escapeHtml(owner.name)}
                            </button>
                            <span style="font-size: 13px; color: var(--text-muted);">· ${owner.major}, ${owner.semester} sem</span>
                        </div>
                        <div style="font-size: 13px; color: var(--text-muted); margin-top: 3px; display: flex; align-items: center;">
                            ${ratingLine}
                        </div>
                    </div>
                    <button class="btn-secondary student-profile-btn" data-user-id="${owner.id}" style="font-size: 12px; padding: 5px 14px; min-height: 32px;">
                        View profile
                    </button>
                </div>

                <div class="detail-desc-text">${this.escapeHtml(gig.description)}</div>
                <div style="font-size: 13px; color: var(--text-muted);">
                    Deadline: ${gig.deadline}
                </div>
            </div>

            ${actionSection}
        `;

        this.detailContentArea.querySelectorAll(".student-profile-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openUserProfile(btn.dataset.userId);
            });
        });

        const linkApplyLogin = document.getElementById("link-apply-login");
        if (linkApplyLogin) {
            linkApplyLogin.addEventListener("click", () => this.openLoginModal());
        }

        const formApply = document.getElementById("form-apply");
        if (formApply) {
            formApply.addEventListener("submit", (e) => {
                e.preventDefault();
                if (!this.activeUserId) {
                    this.openLoginModal("Sign in as a student to apply.");
                    return;
                }

                const msgInput = document.getElementById("apply-msg");
                const errMsg = document.getElementById("err-apply-msg");
                const swapInput = document.getElementById("apply-swap-service");
                const errSwap = document.getElementById("err-apply-swap");

                let hasApplyError = false;
                errMsg?.classList.remove("visible");
                errSwap?.classList.remove("visible");

                if (isSkillSwap) {
                    if (!swapInput || !swapInput.value.trim()) {
                        errSwap?.classList.add("visible");
                        hasApplyError = true;
                    }
                }

                if (!msgInput.value.trim()) {
                    errMsg?.classList.add("visible");
                    hasApplyError = true;
                }

                if (hasApplyError) return;

                const combinedMessage = isSkillSwap
                    ? `${msgInput.value.trim()}\n\nService offered in return: ${swapInput.value.trim()}`
                    : msgInput.value.trim();

                try {
                    mockDb.createApplication({
                        gig_id: gig.id,
                        applicant_id: this.activeUserId,
                        message: combinedMessage
                    });
                    this.showToast("Application sent.");
                    this.render();
                } catch (err) {
                    this.showToast(err.message);
                }
            });
        }

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
        if (!this.activeUserId) {
            this.openLoginModal("Sign in as a student to post a gig.");
            this.switchView("view-browse");
            return;
        }

        const d = new Date();
        d.setDate(d.getDate() + 7);
        if (this.postDeadline) {
            this.postDeadline.value = d.toISOString().split("T")[0];
        }

        const isPaid = this.postPayment?.value === "Paid";
        if (this.wrapPostBudget) {
            this.wrapPostBudget.style.display = isPaid ? "block" : "none";
        }
    }

    handlePostSubmit() {
        if (!this.activeUserId) {
            this.openLoginModal("Sign in to post a gig.");
            return;
        }

        let hasError = false;
        [this.errTitle, this.errCategory, this.errDesc, this.errBudget, this.errDeadline].forEach(el => {
            el?.classList.remove("visible");
        });

        const title = this.postTitle.value.trim();
        const desc = this.postDesc.value.trim();
        const cat = this.postCategory.value;
        const type = this.postType.value;
        const payment = this.postPayment.value;
        const budgetVal = this.postBudget.value;
        const deadline = this.postDeadline.value;

        if (!title) {
            this.errTitle?.classList.add("visible");
            hasError = true;
        }

        if (!desc) {
            this.errDesc?.classList.add("visible");
            hasError = true;
        }

        if (payment === "Paid") {
            if (!budgetVal || Number(budgetVal) <= 0) {
                this.errBudget?.classList.add("visible");
                hasError = true;
            }
        }

        if (!deadline) {
            this.errDeadline?.classList.add("visible");
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
        if (!this.activeUserId) {
            this.activityContentArea.innerHTML = `
                <div class="empty-state">
                    ${getBlobAvatarSvg('sleepy', 52, true)}
                    <div>
                        <h4>You are not signed in.</h4>
                        <p style="margin-top: 8px;">
                            <button class="btn-primary" id="btn-activity-login">Sign in as student</button>
                        </p>
                    </div>
                </div>
            `;
            document.getElementById("btn-activity-login")?.addEventListener("click", () => this.openLoginModal());
            return;
        }

        if (this.activeSubtab === "my-gigs") {
            const gigs = mockDb.getGigs({ user_id: this.activeUserId, status: "All" });

            if (gigs.length === 0) {
                this.activityContentArea.innerHTML = `
                    <div class="empty-state">
                        ${getBlobAvatarSvg('sleepy', 52, true)}
                        <div>
                            <h4>You have not posted any gigs yet.</h4>
                            <p style="margin-top: 4px;">Click "Post a gig" in the navigation to post one.</p>
                        </div>
                    </div>
                `;
                return;
            }

            this.activityContentArea.innerHTML = gigs.map(g => {
                const apps = mockDb.applications.filter(a => a.gig_id === g.id);
                const statusClass = "status-" + g.status.toLowerCase().replace(/\s+/g, "-");
                const deadlineInfo = this.formatDeadline(g.deadline, g.status);

                return `
                    <div class="activity-item-card" data-gig-id="${g.id}">
                        <div class="activity-item-top">
                            <span class="activity-item-title">${this.escapeHtml(g.title)}</span>
                            <span class="status-chip ${statusClass}">${g.status}</span>
                        </div>
                        <div class="activity-item-meta">
                            <span class="category-chip">${g.category}</span>
                            <span>${apps.length} applicant${apps.length === 1 ? '' : 's'}</span>
                            <span>·</span>
                            <span>${deadlineInfo}</span>
                        </div>
                    </div>
                `;
            }).join("");
        } else {
            const apps = mockDb.getApplicationsForUser(this.activeUserId);

            if (apps.length === 0) {
                this.activityContentArea.innerHTML = `
                    <div class="empty-state">
                        ${getBlobAvatarSvg('sleepy', 52, true)}
                        <div>
                            <h4>No applications yet.</h4>
                            <p style="margin-top: 4px;">Browse open gigs and apply with a short message.</p>
                        </div>
                    </div>
                `;
                return;
            }

            this.activityContentArea.innerHTML = apps.map(a => {
                const gig = a.gig || { title: "Gig", status: "Open", owner: { name: "Poster" } };
                const posterAvatar = getBlobAvatarSvg(gig.user_id, 26);
                const appStatusClass = a.status === "Accepted"
                    ? "status-open"
                    : (a.status === "Rejected" ? "status-expired" : "status-in-progress");

                return `
                    <div class="activity-item-card" data-gig-id="${a.gig_id}">
                        <div class="activity-item-top">
                            <span class="activity-item-title">${this.escapeHtml(gig.title)}</span>
                            <span class="status-chip ${appStatusClass}">${a.status}</span>
                        </div>
                        <div class="activity-item-meta">
                            <div style="display: flex; align-items: center; gap: 6px;">
                                ${posterAvatar}
                                <span>${this.escapeHtml(gig.owner ? gig.owner.name : 'Student')}</span>
                            </div>
                            <span>·</span>
                            <span>Applied ${a.created_at}</span>
                            <span>·</span>
                            <span>Gig: ${gig.status}</span>
                        </div>
                    </div>
                `;
            }).join("");
        }

        this.activityContentArea.querySelectorAll(".activity-item-card").forEach(card => {
            card.addEventListener("click", () => {
                this.currentGigDetailId = card.dataset.gigId;
                this.switchView("view-detail");
            });
        });
    }

    // =========================================================================
    // VIEW 5: PROFILE
    // =========================================================================

    renderProfile() {
        if (!this.currentProfileUserId) {
            this.currentProfileUserId = this.activeUserId;
        }

        if (!this.currentProfileUserId) {
            this.profileContainer.innerHTML = `
                <div class="empty-state">
                    ${getBlobAvatarSvg('sleepy', 52, true)}
                    <div>
                        <h4>You are not signed in.</h4>
                        <p style="margin-top: 8px;">
                            <button class="btn-primary" id="btn-profile-login">Sign in as student</button>
                        </p>
                    </div>
                </div>
            `;
            document.getElementById("btn-profile-login")?.addEventListener("click", () => this.openLoginModal());
            return;
        }

        const user = mockDb.getUserProfile(this.currentProfileUserId);
        if (!user) {
            this.profileContainer.innerHTML = `<div class="card"><p class="empty-state">Profile not found.</p></div>`;
            return;
        }

        const isOwnProfile = this.activeUserId === this.currentProfileUserId;
        const profileAvatarSvg = getBlobAvatarSvg(user.id, 64);

        const ratingStr = user.average_rating > 0
            ? `${renderSingleStarSvg(14)} <span style="font-weight: 600;">${user.average_rating}</span> rating (${user.reviews_count} reviews)`
            : `no ratings yet`;
        const statLine = `${user.gigs_posted_count} posted · ${user.gigs_completed_count} completed · ${ratingStr}`;

        const reviews = user.received_reviews || [];
        let reviewsHtml = "";
        if (reviews.length === 0) {
            reviewsHtml = `<div class="card"><p style="font-size: 14px; color: var(--text-muted);">No reviews received yet.</p></div>`;
        } else {
            reviewsHtml = reviews.map(r => {
                const reviewerAvatar = getBlobAvatarSvg(r.reviewer.id || r.reviewer_id, 30);
                return `
                    <div class="review-card">
                        <div class="review-stars">
                            ${renderStarRatingSvg(r.rating, 5, 15)}
                            <span style="font-size: 12px; font-weight: 600; color: var(--text-muted); margin-left: 6px;">(${r.rating}/5)</span>
                        </div>
                        <div class="review-comment">"${this.escapeHtml(r.comment)}"</div>
                        <div class="review-author-line">
                            ${reviewerAvatar}
                            <span>
                                <button class="btn-link student-profile-btn" data-user-id="${r.reviewer.id || r.reviewer_id}" style="font-size: 13px;">
                                    ${this.escapeHtml(r.reviewer.name)}
                                </button>
                                on "${this.escapeHtml(r.gig.title)}"
                            </span>
                        </div>
                    </div>
                `;
            }).join("");
        }

        const allGigs = mockDb.getGigs({ status: "All" });
        const gigsCompleted = allGigs.filter(g =>
            g.status === "Completed" &&
            (g.user_id === this.currentProfileUserId || g.accepted_applicant_id === this.currentProfileUserId)
        );

        let completedGigsHtml = "";
        if (gigsCompleted.length === 0) {
            completedGigsHtml = `<div class="card"><p style="font-size: 14px; color: var(--text-muted);">No completed gigs yet.</p></div>`;
        } else {
            completedGigsHtml = gigsCompleted.map(g => {
                const paymentStr = g.payment_type === "Paid" ? `$${g.budget}` : (g.payment_type === "SkillSwap" ? "Skill swap" : "Free");

                let reviewPill = "";
                if (this.activeUserId && (this.activeUserId === g.user_id || this.activeUserId === g.accepted_applicant_id)) {
                    const alreadyReviewed = mockDb.reviews.some(r => r.gig_id === g.id && r.reviewer_id === this.activeUserId);
                    if (!alreadyReviewed) {
                        reviewPill = `<button class="btn-primary btn-profile-leave-review" data-gig-id="${g.id}" style="font-size: 12px; padding: 5px 14px; min-height: 32px;">Leave a review</button>`;
                    }
                }

                return `
                    <div class="activity-item-card" data-gig-id="${g.id}">
                        <div class="activity-item-top">
                            <span class="activity-item-title">${this.escapeHtml(g.title)}</span>
                            <span class="status-chip status-completed">Completed</span>
                        </div>
                        <div class="activity-item-meta" style="justify-content: space-between;">
                            <div>
                                <span class="category-chip">${g.category}</span>
                                <span style="margin-left: 8px;">${paymentStr}</span>
                            </div>
                            ${reviewPill}
                        </div>
                    </div>
                `;
            }).join("");
        }

        const backBtnHtml = !isOwnProfile
            ? `<button class="btn-secondary" id="btn-back-from-profile" style="margin-bottom: 14px; padding: 5px 14px; font-size: 13px;">← Back</button>`
            : "";

        let bioBlockHtml = "";
        if (isOwnProfile && this.isEditingBio) {
            bioBlockHtml = `
                <div style="margin-top: 12px; margin-bottom: 12px;">
                    <form id="form-edit-bio">
                        <label style="display: block; font-weight: 700; font-size: 13px; margin-bottom: 6px;">Edit bio</label>
                        <textarea id="input-edit-bio" rows="4" style="width: 100%; font-size: 14px; margin-bottom: 8px;">${this.escapeHtml(user.bio)}</textarea>
                        <div style="display: flex; gap: 8px;">
                            <button type="submit" class="btn-primary" style="font-size: 13px; padding: 5px 14px; min-height: 34px;">Save bio</button>
                            <button type="button" class="btn-secondary" id="btn-cancel-bio-edit" style="font-size: 13px; padding: 5px 14px; min-height: 34px;">Cancel</button>
                        </div>
                    </form>
                </div>
            `;
        } else if (isOwnProfile) {
            bioBlockHtml = `
                <div style="margin-top: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-subtle);">Bio</span>
                        <button class="btn-icon-edit" id="btn-start-bio-edit" title="Edit bio" aria-label="Edit bio">
                            ${getPencilIconSvg(13)}
                        </button>
                    </div>
                    <div style="font-size: 14px; color: var(--ink-black);">${this.escapeHtml(user.bio)}</div>
                </div>
            `;
        } else {
            bioBlockHtml = `
                <div style="margin-top: 12px;">
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-subtle); margin-bottom: 4px;">Bio</div>
                    <div style="font-size: 14px; color: var(--ink-black);">${this.escapeHtml(user.bio)}</div>
                </div>
            `;
        }

        let skillsBlockHtml = "";
        if (isOwnProfile && this.isEditingSkills) {
            skillsBlockHtml = `
                <div style="margin-top: 14px; margin-bottom: 12px;">
                    <form id="form-edit-skills">
                        <label style="display: block; font-weight: 700; font-size: 13px; margin-bottom: 6px;">Edit skills (comma-separated)</label>
                        <input type="text" id="input-edit-skills" value="${this.escapeHtml(user.skills.join(", "))}" style="width: 100%; font-size: 14px; margin-bottom: 8px;">
                        <div style="display: flex; gap: 8px;">
                            <button type="submit" class="btn-primary" style="font-size: 13px; padding: 5px 14px; min-height: 34px;">Save skills</button>
                            <button type="button" class="btn-secondary" id="btn-cancel-skills-edit" style="font-size: 13px; padding: 5px 14px; min-height: 34px;">Cancel</button>
                        </div>
                    </form>
                </div>
            `;
        } else if (isOwnProfile) {
            skillsBlockHtml = `
                <div style="margin-top: 14px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-subtle);">Skills</span>
                        <button class="btn-icon-edit" id="btn-start-skills-edit" title="Edit skills" aria-label="Edit skills">
                            ${getPencilIconSvg(13)}
                        </button>
                    </div>
                    <div class="skills-chips-row">
                        ${user.skills.map(s => `<span class="skill-chip">${this.escapeHtml(s)}</span>`).join("")}
                    </div>
                </div>
            `;
        } else {
            skillsBlockHtml = `
                <div style="margin-top: 14px;">
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-subtle); margin-bottom: 4px;">Skills</div>
                    <div class="skills-chips-row">
                        ${user.skills.map(s => `<span class="skill-chip">${this.escapeHtml(s)}</span>`).join("")}
                    </div>
                </div>
            `;
        }

        this.profileContainer.innerHTML = `
            ${backBtnHtml}
            <div class="profile-card">
                <div class="profile-header-row">
                    ${profileAvatarSvg}
                    <div>
                        <h2>${this.escapeHtml(user.name)} ${isOwnProfile ? '<span style="font-size: 13px; font-weight: normal; color: var(--text-muted);">(You)</span>' : ''}</h2>
                        <div style="color: var(--text-muted); font-size: 13px;">${user.major} · ${user.semester} semester</div>
                    </div>
                </div>
                <div class="profile-stat-line" style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                    ${statLine}
                </div>
                ${bioBlockHtml}
                ${skillsBlockHtml}
            </div>

            <h3 style="margin: 20px 0 10px 0;">Completed gigs (${gigsCompleted.length})</h3>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
                ${completedGigsHtml}
            </div>

            <h3 style="margin: 20px 0 10px 0;">Reviews (${reviews.length})</h3>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${reviewsHtml}
            </div>
        `;

        document.getElementById("btn-back-from-profile")?.addEventListener("click", () => {
            this.switchView(this.previousViewForProfile || "view-browse");
        });

        document.getElementById("btn-start-bio-edit")?.addEventListener("click", () => {
            this.isEditingBio = true;
            this.renderProfile();
        });

        document.getElementById("btn-cancel-bio-edit")?.addEventListener("click", () => {
            this.isEditingBio = false;
            this.renderProfile();
        });

        const formEditBio = document.getElementById("form-edit-bio");
        if (formEditBio) {
            formEditBio.addEventListener("submit", (e) => {
                e.preventDefault();
                const newBio = document.getElementById("input-edit-bio").value.trim();
                mockDb.updateUserProfile(this.activeUserId, { bio: newBio });
                this.isEditingBio = false;
                this.showToast("Bio updated.");
                this.renderProfile();
            });
        }

        document.getElementById("btn-start-skills-edit")?.addEventListener("click", () => {
            this.isEditingSkills = true;
            this.renderProfile();
        });

        document.getElementById("btn-cancel-skills-edit")?.addEventListener("click", () => {
            this.isEditingSkills = false;
            this.renderProfile();
        });

        const formEditSkills = document.getElementById("form-edit-skills");
        if (formEditSkills) {
            formEditSkills.addEventListener("submit", (e) => {
                e.preventDefault();
                const newSkills = document.getElementById("input-edit-skills").value.trim();
                mockDb.updateUserProfile(this.activeUserId, { skills: newSkills });
                this.isEditingSkills = false;
                this.showToast("Skills updated.");
                this.renderProfile();
            });
        }

        this.profileContainer.querySelectorAll(".student-profile-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openUserProfile(btn.dataset.userId);
            });
        });

        this.profileContainer.querySelectorAll(".activity-item-card").forEach(row => {
            row.addEventListener("click", (e) => {
                if (e.target.closest(".btn-profile-leave-review")) return;
                const gigId = row.dataset.gigId;
                if (gigId) {
                    this.previousViewForProfile = "view-profile";
                    this.currentGigDetailId = gigId;
                    this.switchView("view-detail");
                }
            });
        });

        this.profileContainer.querySelectorAll(".btn-profile-leave-review").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const gigId = btn.dataset.gigId;
                const gig = mockDb.getGigById(gigId);
                const targetName = gig && gig.user_id === this.activeUserId
                    ? (gig.accepted_applicant ? gig.accepted_applicant.name : "applicant")
                    : (gig && gig.owner ? gig.owner.name : "owner");
                this.openReviewModal(gigId, targetName);
            });
        });
    }

    // =========================================================================
    // REVIEW MODAL (RESET VISUAL STARS ON OPEN)
    // =========================================================================

    openReviewModal(gigId, targetName) {
        if (!this.activeUserId) {
            this.openLoginModal("Sign in to leave a review.");
            return;
        }

        this.reviewGigId.value = gigId;
        this.reviewTargetLabel.textContent = `Rating for ${targetName}`;
        this.reviewCommentInput.value = "";
        this.errReviewComment?.classList.remove("visible");

        // Reset visual stars to 5 stars
        if (this.interactiveStars) {
            const starBtns = this.interactiveStars.querySelectorAll(".star-btn");
            starBtns.forEach(btn => {
                const polygon = btn.querySelector("polygon");
                if (polygon) {
                    polygon.setAttribute("fill", "#FFE94A");
                    polygon.setAttribute("stroke", "#B45309");
                }
            });
        }
        if (this.reviewRatingSelect) this.reviewRatingSelect.value = "5";
        if (this.ratingTextHint) this.ratingTextHint.textContent = "5 stars";

        this.modalReview.classList.add("open");
    }

    handleReviewSubmit() {
        const gigId = this.reviewGigId.value;
        const rating = Number(this.reviewRatingSelect.value);
        const comment = this.reviewCommentInput.value.trim();

        if (!comment) {
            this.errReviewComment?.classList.add("visible");
            return;
        }
        this.errReviewComment?.classList.remove("visible");

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
    // TOAST & UTILITIES
    // =========================================================================

    showToast(text) {
        if (!this.toastMsg) return;
        this.toastMsg.textContent = text;
        this.toastMsg.classList.add("show");
        setTimeout(() => {
            this.toastMsg.classList.remove("show");
        }, 2200);
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