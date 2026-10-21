import { useNavigate } from "react-router-dom";
import { api } from "../api";
import ProfileForm from "../components/ProfileForm";
import { useUser } from "../UserContext";

export default function EditProfilePage() {
  const { currentUser, refreshUser } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (payload) => {
    await api.updateUser(currentUser.id, payload);
    await refreshUser();
    navigate(`/profile/${currentUser.id}`);
  };

  return (
    <div className="card narrow">
      <h2>Edit profile</h2>
      <ProfileForm
        initial={currentUser}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
