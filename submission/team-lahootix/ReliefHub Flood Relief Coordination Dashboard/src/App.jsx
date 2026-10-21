import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { RoleProvider, useRole } from './context/RoleContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Camps } from './pages/Camps';
import { Inventory } from './pages/Inventory';
import { Dispatches } from './pages/Dispatches';
import { Donations } from './pages/Donations';
import { Volunteers } from './pages/Volunteers';

function AppShell() {
  const { isLoggedIn } = useRole();

  if (!isLoggedIn) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/"            element={<Dashboard />} />
            <Route path="/camps"       element={<Camps />} />
            <Route path="/inventory"   element={<Inventory />} />
            <Route path="/dispatches"  element={<Dispatches />} />
            <Route path="/donations"   element={<Donations />} />
            <Route path="/volunteers"  element={<Volunteers />} />
            <Route path="*"            element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <RoleProvider>
        <AppShell />
      </RoleProvider>
    </ThemeProvider>
  );
}
