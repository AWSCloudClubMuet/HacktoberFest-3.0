// Light-coloured background waves for the auth pages (login / signup).
// Rendered fixed behind the centred card; purely decorative.
export default function AuthWaves() {
  return (
    <svg className="auth-waves-bg" viewBox="0 0 1440 420" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0,170 C240,110 430,240 720,198 C1010,158 1210,238 1440,175 L1440,420 L0,420 Z" fill="#e9f0ed" />
      <path d="M0,248 C260,198 480,300 760,264 C1040,230 1245,300 1440,248 L1440,420 L0,420 Z" fill="#f9e3dd" />
      <path d="M0,318 C280,272 520,360 820,324 C1085,294 1285,350 1440,312 L1440,420 L0,420 Z" fill="#d9e9e3" />
    </svg>
  )
}
