import { expoClient } from "@better-auth/expo/client";
import {
  convexClient,
  crossDomainClient,
} from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { APP_SCHEME } from "../../convex/lib/app_info";

export const authConfigured = Boolean(
  process.env.EXPO_PUBLIC_CONVEX_URL && process.env.EXPO_PUBLIC_CONVEX_SITE_URL,
);

export const authClient = createAuthClient({
  // The setup screen prevents requests until both public URLs are configured.
  baseURL:
    process.env.EXPO_PUBLIC_CONVEX_SITE_URL ||
    "https://auth-not-configured.invalid",
  fetchOptions: { timeout: 20_000, retry: 0 },
  plugins:
    Platform.OS === "web"
      ? [convexClient(), emailOTPClient(), crossDomainClient()]
      : [
          convexClient(),
          emailOTPClient(),
          expoClient({
            scheme: APP_SCHEME,
            storagePrefix: APP_SCHEME,
            storage: SecureStore,
          }),
        ],
});
