import { getUsers, getCurrentUserId, setCurrentUserId } from "./api.js";

export async function mountUserSwitcher(selectEl) {
  const users = await getUsers();

  selectEl.innerHTML = users
    .map((u) => `<option value="${u.id}">${u.name}</option>`)
    .join("");

  // Default to the first user if nobody is selected yet
  if (!getCurrentUserId()) setCurrentUserId(users[0].id);
  selectEl.value = getCurrentUserId();

  selectEl.addEventListener("change", () => {
    setCurrentUserId(selectEl.value);
    location.reload(); // simplest way to refresh every screen for the new user
  });
}