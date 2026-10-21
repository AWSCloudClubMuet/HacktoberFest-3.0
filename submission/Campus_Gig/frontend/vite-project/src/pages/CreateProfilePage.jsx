import { useNavigate } from "react-router-dom";
import { api } from "../api";
import ProfileForm from "../components/ProfileForm";
import { useUser } from "../UserContext";

export default function CreateProfilePage() {
  const { login } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (payload) => {
    const profile = await api.createUser(payload);
    await login(profile.id);
    navigate(`/profile/${profile.id}`);
  };

  return (
    <div className="card narrow">
      <h2>Create your profile</h2>
      <ProfileForm submitLabel="Create profile" onSubmit={handleSubmit} />
    </div>
  );
}
