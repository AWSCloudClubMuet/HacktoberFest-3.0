
import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ExploreGigs from "./pages/ExploreGigs";
import MyApplications from "./pages/MyApplications";
import MyGigs from "./pages/MyGigs";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import AppLayout from "./components/AppLayout";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/explore" element={<ExploreGigs />} />
        <Route path="/applications" element={<MyApplications />} />
        <Route path="/my-gigs" element={<MyGigs />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
