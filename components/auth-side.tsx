// Side panel for the auth pages (login / signup): brand, a short
// how-it-works, and layered waves in the logo's colours.
export default function AuthSide() {
  return (
    <aside className="auth-side">
      <div className="auth-side-content">
        <div className="auth-side-brand">
          <img src="/logo.png" alt="campusloop logo" className="brand-logo" />
          <span>campus<span className="brand-accent-light">loop</span></span>
        </div>
        <h2>Small jobs and skill swaps, posted by students.</h2>
        <ol className="auth-side-steps">
          <li>
            <strong>1</strong>
            <div>
              <h3>Post or apply</h3>
              <p>Offer a skill, or ask for help and set your budget in PKR.</p>
            </div>
          </li>
          <li>
            <strong>2</strong>
            <div>
              <h3>Pick your person</h3>
              <p>Read the applications, accept one, and the gig is underway.</p>
            </div>
          </li>
          <li>
            <strong>3</strong>
            <div>
              <h3>Review each other</h3>
              <p>When the work is done, both sides leave a rating.</p>
            </div>
          </li>
        </ol>
      </div>
      <svg className="auth-waves" viewBox="0 0 600 320" preserveAspectRatio="none" focusable="false" aria-hidden="true">
        <path d="M0,110 C150,60 280,165 430,132 C505,116 560,100 600,108 L600,320 L0,320 Z" fill="#14655a" />
        <path d="M0,185 C140,145 300,228 450,196 C520,182 572,170 600,178 L600,320 L0,320 Z" fill="#e96955" opacity="0.9" />
        <path d="M0,248 C160,212 330,282 480,252 C540,241 580,236 600,240 L600,320 L0,320 Z" fill="#09332d" />
      </svg>
    </aside>
  )
}
