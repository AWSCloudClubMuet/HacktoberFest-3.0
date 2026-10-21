import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexError } from "convex/values";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params): { email: string } & Record<string, string> {
        const email = String(params.email ?? "").trim().toLowerCase();
        if (!email.includes("@")) {
          throw new ConvexError("Enter a valid email address");
        }
        // The role is only chosen when the account is created.
        if (params.flow !== "signUp") return { email };
        const name = String(params.name ?? "").trim() || email.split("@")[0];
        const role = params.role === "volunteer" ? "volunteer" : "coordinator";
        return { email, name, role };
      },
    }),
  ],
});
