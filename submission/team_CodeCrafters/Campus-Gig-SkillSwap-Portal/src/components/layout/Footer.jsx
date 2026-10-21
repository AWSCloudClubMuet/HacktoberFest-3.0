import React from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, GraduationCap } from 'lucide-react';

export function Footer() {
  const { setCurrentScreen, setIsDemoModalOpen } = useApp();

  return (
    <footer className="bg-[var(--bg-surface)] text-[var(--text-secondary)] text-sm border-t border-[var(--border-color)] transition-colors duration-200">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--primary-emerald)] text-white flex items-center justify-center font-bold">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="font-bold text-xl text-[var(--text-primary)] tracking-tight">
                Campus<span className="text-[var(--primary-emerald)]">Loop</span>
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Skills connect. Opportunities grow. The peer-to-peer university marketplace for micro-gigs, collaborative skill swaps, and academic mentorship.
            </p>
            <div className="flex items-center gap-2 text-xs text-[var(--primary-emerald-text)] bg-[var(--primary-emerald-light)] border border-[var(--primary-emerald)]/30 px-3 py-1.5 rounded-xl w-fit">
              <Shield className="w-3.5 h-3.5" />
              <span>Campus Verified Students</span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-[var(--text-primary)] text-xs uppercase tracking-wider mb-4">
              Explore Disciplines
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => setCurrentScreen('explore')} className="hover:text-[var(--primary-emerald)] transition-colors">
                  Programming & Software
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentScreen('explore')} className="hover:text-[var(--primary-emerald)] transition-colors">
                  UI/UX & Graphic Design
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentScreen('explore')} className="hover:text-[var(--primary-emerald)] transition-colors">
                  Academic Writing & SOPs
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentScreen('explore')} className="hover:text-[var(--primary-emerald)] transition-colors">
                  STEM Tutoring & Mentorship
                </button>
              </li>
            </ul>
          </div>

          {/* Platform Workflows */}
          <div>
            <h4 className="font-semibold text-[var(--text-primary)] text-xs uppercase tracking-wider mb-4">
              Platform Workflow
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => setCurrentScreen('create-gig')} className="hover:text-[var(--primary-emerald)] transition-colors">
                  Post an Opportunity
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentScreen('dashboard')} className="hover:text-[var(--primary-emerald)] transition-colors">
                  Student Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentScreen('manage-applications')} className="hover:text-[var(--primary-emerald)] transition-colors">
                  Manage Applications
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentScreen('reviews')} className="hover:text-[var(--primary-emerald)] transition-colors">
                  Reputation & Reviews
                </button>
              </li>
            </ul>
          </div>

          {/* Hackathon Info */}
          <div>
            <h4 className="font-semibold text-[var(--text-primary)] text-xs uppercase tracking-wider mb-4">
              Hackathon Demonstration
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">
              Built for HacktoberFest-Hackathon 2026. GitHub Issue #12: Campus Gig & SkillSwap Portal.
            </p>
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-surface-secondary)] hover:bg-[var(--bg-hover)] text-xs text-[var(--text-primary)] border border-[var(--border-color)] transition-colors"
            >
              <span>Demo Account Switcher (12 Users)</span>
            </button>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <p>© 2026 CampusLoop. Designed for collegiate skill exchange and student growth.</p>
          <div className="flex items-center gap-4 flex-wrap">
            <span>Inter font & Lucide Icons</span>
            <span>•</span>
            <span>Mobile-First Responsive</span>
            <span>•</span>
            <span className="text-[var(--primary-emerald)] font-semibold">100% Mock API Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
