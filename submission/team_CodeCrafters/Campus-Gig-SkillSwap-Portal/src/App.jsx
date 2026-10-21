import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { Footer } from './components/layout/Footer';

// Screens
import { LandingScreen } from './components/screens/LandingScreen';
import { ExploreScreen } from './components/screens/ExploreScreen';
import { GigDetailScreen } from './components/screens/GigDetailScreen';
import { CreateGigScreen } from './components/screens/CreateGigScreen';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { ManageApplicationsScreen } from './components/screens/ManageApplicationsScreen';
import { MyWorkScreen } from './components/screens/MyWorkScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { ReviewsScreen } from './components/screens/ReviewsScreen';
import { MessagesScreen } from './components/screens/MessagesScreen';

// Modals & Overlays
import { NotificationsModal } from './components/common/NotificationsModal';
import { AiAssistantModal } from './components/common/AiAssistantModal';
import { DemoAccountModal } from './components/common/DemoAccountModal';
import { ToastContainer } from './components/common/ToastContainer';
import { ErrorBoundary } from './components/common/ErrorBoundary';

function MainLayout() {
  const { currentScreen } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex flex-col font-sans selection:bg-[var(--primary-emerald-light)] selection:text-[var(--primary-emerald-text)] pb-16 lg:pb-0 transition-colors duration-200">
      
      {/* Top Navbar (Fluid full width) */}
      <Navbar onToggleMobileSidebar={() => setMobileSidebarOpen(prev => !prev)} />

      {/* Main Full-Width Application Shell */}
      <div className="flex-1 flex w-full max-w-[1920px] mx-auto">
        
        {/* Desktop Sidebar (Consistent width, sticky) */}
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Dynamic Screen Viewport (Uses all remaining space fluidly) */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 xl:px-10 py-6 w-full overflow-x-hidden">
          <ErrorBoundary>
            {currentScreen === 'landing' && <LandingScreen />}
            {currentScreen === 'explore' && <ExploreScreen />}
            {currentScreen === 'gig-detail' && <GigDetailScreen />}
            {currentScreen === 'create-gig' && <CreateGigScreen />}
            {currentScreen === 'dashboard' && <DashboardScreen />}
            {currentScreen === 'manage-applications' && <ManageApplicationsScreen />}
            {currentScreen === 'my-work' && <MyWorkScreen />}
            {currentScreen === 'profile' && <ProfileScreen />}
            {currentScreen === 'reviews' && <ReviewsScreen />}
            {currentScreen === 'messages' && <MessagesScreen />}
          </ErrorBoundary>
        </main>

      </div>

      {/* Bottom Footer */}
      <Footer />

      {/* Mobile Sticky Bottom Navigation (<1024px) */}
      <MobileNav />

      {/* Global Modals & AI Floating Widget */}
      <NotificationsModal />
      <AiAssistantModal />
      <DemoAccountModal />
      <ToastContainer />

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
