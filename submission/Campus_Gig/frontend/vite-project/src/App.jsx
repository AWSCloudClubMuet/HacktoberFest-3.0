import { Link, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import RequireUser from "./components/RequireUser";
import CreateGigPage from "./pages/CreateGigPage";
import CreateProfilePage from "./pages/CreateProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import GigDetailPage from "./pages/GigDetailPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import WelcomePage from "./pages/WelcomePage";
import MyApplicationPage from "./pages/MyApplicationPage";

function NotFound() {
  return (
    <div className="card narrow">
      <h2>Page not found</h2>
      <Link to="/">Go to home</Link>
    </div>
  );
}

function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/profile/new" element={<CreateProfilePage />} />
          <Route
            path="/profile/edit"
            element={
              <RequireUser>
                <EditProfilePage />
              </RequireUser>
            }
          />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route
            path="/gigs/new"
            element={
              <RequireUser>
                <CreateGigPage />
              </RequireUser>
            }
          />
          <Route path="/gigs/:id" element={<GigDetailPage />} />
          <Route
            path="/applications"
            element={
              <RequireUser>
                <MyApplicationPage />
              </RequireUser>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
