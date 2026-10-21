const TOKEN_KEY = 'campusgig_token';
const PROFILE_KEY = 'campusgig_profile';

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export function readProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
  } catch {
    return null;
  }
}

export function saveProfile(user) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(user));
}

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  saveProfile(user);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PROFILE_KEY);
}
