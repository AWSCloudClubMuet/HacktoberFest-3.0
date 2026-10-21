import { createAuthClient } from 'better-auth/react'

// Better Auth is hosted by the Express API; /api/auth/* is rewritten to it
// by next.config.mjs, so the client talks to this app's own origin.
export const authClient = createAuthClient({
  baseURL: typeof window === 'undefined' ? undefined : window.location.origin,
})
