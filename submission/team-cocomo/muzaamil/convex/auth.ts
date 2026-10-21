import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexError } from "convex/values";
import { demoModeEnabled, isDemoAccount } from "./lib/auth";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params): { email: string } & Record<string, string> {
        const email = String(params.email ?? "").trim().toLowerCase();
        if (!email.includes("@")) {
          throw new ConvexError("Enter a valid email address");
        }
        if (isDemoAccount(email) && !demoModeEnabled()) {
          throw new ConvexError("Shared test accounts are disabled. Use your own account.");
        }
        // Never accept a privileged role from a public signup request.
        if (params.flow !== "signUp") return { email };
        const name = String(params.name ?? "").trim() || email.split("@")[0];
        const role = demoModeEnabled() && email === "coordinator@reliefhub.demo" ? "coordinator" : "volunteer";
        return { email, name, role };
      },
    }),
  ],
});
