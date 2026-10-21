import { useState } from 'react'
import { UserProvider } from './UserContext'
import Navbar from './Navbar'
import ExploreGigs from './pages/ExploreGigs'
import PostGig from './pages/PostGig'
import MyGigs from './pages/MyGigs'
import MyApplications from './pages/MyApplications'
import StudentProfile from './pages/StudentProfile'
import './App.css'

function MainContent() {
  const [activePage, setActivePage] = useState('explore')

  const navigateTo = (page) => {
    setActivePage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app">
      <Navbar activePage={activePage} onNavigate={navigateTo} />
      <main className="page-content" id="main-content">
        <div className="page-container">
          {activePage === 'explore' && <ExploreGigs onNavigate={navigateTo} />}
          {activePage === 'post' && (
            <PostGig
              onPosted={() => {
                navigateTo('my-gigs')
              }}
            />
          )}
          {activePage === 'my-gigs' && <MyGigs onNavigate={navigateTo} />}
          {activePage === 'my-apps' && <MyApplications onNavigate={navigateTo} />}
          {activePage === 'profile' && <StudentProfile onNavigate={navigateTo} />}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <UserProvider>
      <MainContent />
    </UserProvider>
  )
}
