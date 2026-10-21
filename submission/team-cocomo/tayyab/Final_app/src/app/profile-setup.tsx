import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from "react-native";
import { Controller, useForm, useWatch } from "react-hook-form";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Check, MapPin, ShoppingBag, Sprout, type LucideIcon } from "lucide-react-native";
import { Image } from "expo-image";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";
import { DISTRICT_OPTIONS, districtLabel } from "@/components/kisan/districts";
import { Tap } from "@/components/kisan/tap";
import { TextField } from "@/components/kisan/text-field";
import { Button, FieldError, FieldLabel, SelectField, SelectSheet } from "@/components/kisan/ui";
import { fonts } from "@/constants/fonts";
import { theme } from "@/constants/theme";
import { api, ApiError } from "@/lib/api/client";
import { invalidate } from "@/lib/api/resources";
import type { Me } from "@/lib/api/types";
import { authClient } from "@/lib/auth-client";
import { errorText } from "@/lib/form-errors";
import { clearProfileDraft, loadProfileDraft, saveProfileDraft } from "@/lib/profile-draft";
import { zodResolver } from "@/lib/zod-resolver";
import { useAuthSession } from "@/providers/auth-provider";
import {
  normalizePhone,
  profileSchema,
  type District,
  type Role,
} from "../../convex/lib/kisan";

type Form = {
  name: string;
  phone: string;
  email: string;
  password: string;
  district: District;
  role: Role;
};

type AuthMode = "register" | "login" | "verify" | "forgot" | "reset";

/** Which button is working: only it shows a spinner, the others are disabled. */
type Pending = "submit" | "google" | null;

const registerSchema = profileSchema.extend({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be under 128 characters."),
});

/** 3001234567 → "300 1234 567" */
const formatPhone = (digits: string) =>
  [digits.slice(0, 3), digits.slice(3, 7), digits.slice(7, 10)].filter(Boolean).join(" ");

const haptic = () => {
  if (process.env.EXPO_OS !== "web") void Haptics.selectionAsync().catch(() => {});
};

/** Registration, login, verification, recovery, and profile editing. */
export default function ProfileSetup() {
  const { session } = useAuthSession();
  const signedIn = !!session?.user;
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Pending>(null);
  const busy = pending !== null;
  const [serverError, setServerError] = useState("");
  const [districtOpen, setDistrictOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("register");
  const [pendingEmail, setPendingEmail] = useState("");
  // Has a finished profile: this screen edits it rather than completing it.
  const [hasProfile, setHasProfile] = useState(false);
  // Set after a successful log in / Google / verify. Navigation waits for the
  // session to reach the app, or "/" would still see a signed-out user.
  const [authDone, setAuthDone] = useState(false);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitted },
  } = useForm<Form>({
    resolver: zodResolver((signedIn ? profileSchema : registerSchema) as never),
    defaultValues: { name: "", phone: "", email: "", password: "" },
  });

  // Prefill from the account when editing, or from an unfinished sign-up.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const draft = await loadProfileDraft();
      const me = signedIn ? await api.get<Me>("/users/me").catch(() => null) : null;
      if (cancelled) return;
      reset({
        name: me?.name || draft?.name || "",
        phone: normalizePhone(me?.phone ?? draft?.phone ?? ""),
        email: me?.email || draft?.email || "",
        password: "",
        district: me?.district ?? draft?.district,
        role: me?.role ?? draft?.role,
      });
      setHasProfile(!!me?.role);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [signedIn, reset]);

  const role = useWatch({ control, name: "role" });
  const district = useWatch({ control, name: "district" });
  const editing = signedIn && hasProfile;

  useEffect(() => {
    if (authDone && signedIn) router.replace("/");
  }, [authDone, signedIn]);

  const onSubmit = handleSubmit(async (values) => {
    if (busy) return;
    setPending("submit");
    setServerError("");
    const profile = {
      name: values.name.trim(),
      phone: normalizePhone(values.phone),
      email: values.email.trim().toLowerCase(),
      district: values.district,
      role: values.role,
    };
    try {
      if (!signedIn) {
        // Keep the profile until email verification creates a session. The
        // entry route saves this draft as soon as that session is available.
        await saveProfileDraft(profile);
        const result = await authClient.signUp.email({
          name: profile.name,
          email: profile.email,
          password: values.password,
        });
        if (result.error) throw new Error(authErrorMessage(result.error));
        setPendingEmail(profile.email);
        setAuthMode("verify");
        return;
      }
      await api.patch<Me>("/users/me", profile);
      await clearProfileDraft();
      // Role or district may have changed: refresh tabs, prices and badge.
      void invalidate("/users/me", "/prices", "/alerts", "/listings");
      if (editing) router.back();
      else router.replace("/");
    } catch (e) {
      setServerError(
        e instanceof ApiError
          ? (errorText(e.code) ?? e.message)
          : e instanceof Error
            ? e.message
            : "Couldn't create your account. Please try again.",
      );
    } finally {
      setPending(null);
    }
  });

  const signInWithGoogle = async () => {
    if (busy) return;
    setPending("google");
    setServerError("");
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
      if (result.error) throw new Error(authErrorMessage(result.error));
      await clearProfileDraft();
      setAuthDone(true);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Google sign-in failed. Please try again.");
    } finally {
      setPending(null);
    }
  };

  if (loading || authDone)
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={theme.green} accessibilityLabel="Loading" />
      </View>
    );

  if (!signedIn && authMode !== "register")
    return (
      <AuthAccessScreen
        mode={authMode}
        initialEmail={pendingEmail}
        onSignedIn={() => setAuthDone(true)}
        onModeChange={(mode, email) => {
          if (email) setPendingEmail(email);
          setAuthMode(mode);
        }}
      />
    );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title} accessibilityRole="header">
          {editing ? "Edit your profile" : signedIn ? "Tell us about you" : "Create your account"}
        </Text>
        <Text style={styles.subtitle}>
          {signedIn
            ? "We use your district to show the nearest mandi first."
            : "Create a secure account, then choose the nearest mandi for you."}
        </Text>

        <FieldLabel>Full name</FieldLabel>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextField
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Your full name"
              autoComplete="name"
              textContentType="name"
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
              accessibilityLabel="Full name"
              error={errorText(errors.name?.message)}
              editable={!busy}
            />
          )}
        />

        <FieldLabel>Phone number</FieldLabel>
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <TextField
              ref={phoneRef}
              prefix="+92"
              value={formatPhone(field.value)}
              onChangeText={(text) => field.onChange(normalizePhone(text).slice(0, 10))}
              onBlur={field.onBlur}
              placeholder="300 0000 123"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              maxLength={12}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              accessibilityLabel="Phone number"
              error={errorText(errors.phone?.message)}
              editable={!busy}
            />
          )}
        />

        <FieldLabel>Email</FieldLabel>
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextField
              ref={emailRef}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType={signedIn ? "done" : "next"}
              onSubmitEditing={() => passwordRef.current?.focus()}
              accessibilityLabel="Email"
              hint={signedIn ? "For price-alert emails. We never share it." : "Used to sign in and recover your account."}
              error={errorText(errors.email?.message)}
              editable={!busy}
            />
          )}
        />

        {!signedIn && (
          <>
            <FieldLabel>Password</FieldLabel>
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <TextField
                  ref={passwordRef}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="At least 8 characters"
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                  accessibilityLabel="Password"
                  hint="Use at least 8 characters."
                  error={errorText(errors.password?.message)}
                  editable={!busy}
                />
              )}
            />
          </>
        )}

        <FieldLabel>District</FieldLabel>
        <SelectField
          Icon={MapPin}
          value={district ? districtLabel(district) : undefined}
          placeholder="Search your district or city"
          onPress={() => setDistrictOpen(true)}
          error={!!errors.district}
          accessibilityLabel={`District, ${district ?? "not chosen"}`}
        />
        <FieldError>{errorText(errors.district?.message)}</FieldError>

        <FieldLabel>I am a</FieldLabel>
        <View style={styles.roles} accessibilityRole="radiogroup">
          <RoleCard
            title="Farmer"
            body="Track prices, set alerts, sell produce"
            Icon={Sprout}
            iconBg={theme.green}
            iconColor={theme.card}
            selected={role === "farmer"}
            onPress={() => setValue("role", "farmer", { shouldValidate: isSubmitted })}
          />
          <RoleCard
            title="Buyer"
            body="Check rates, buy direct from farms"
            Icon={ShoppingBag}
            iconBg={theme.mustardSoft}
            iconColor={theme.ink}
            selected={role === "buyer"}
            onPress={() => setValue("role", "buyer", { shouldValidate: isSubmitted })}
          />
        </View>
        <FieldError>{errorText(errors.role?.message)}</FieldError>

        {!!serverError && (
          <Text style={styles.serverError} accessibilityLiveRegion="polite">
            {serverError}
          </Text>
        )}

        {!signedIn && (
          <AuthChoices
            pending={pending}
            onGoogle={() => void signInWithGoogle()}
            prompt="Already have an account?"
            action="Log in"
            onAction={() => {
              setPendingEmail("");
              setServerError("");
              setAuthMode("login");
            }}
          />
        )}
      </KeyboardAwareScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title={editing ? "Save changes" : signedIn ? "Continue" : "Create account"}
          onPress={() => void onSubmit()}
          loading={pending === "submit"}
          disabled={busy}
        />
      </View>

      <SelectSheet
        visible={districtOpen}
        title="Your district"
        options={DISTRICT_OPTIONS}
        value={district}
        searchable
        searchPlaceholder="Search district or city"
        onClose={() => setDistrictOpen(false)}
        onSelect={(d) => {
          haptic();
          setValue("district", d, { shouldValidate: isSubmitted });
        }}
      />
    </SafeAreaView>
  );
}

function AuthAccessScreen({
  mode,
  initialEmail,
  onSignedIn,
  onModeChange,
}: {
  mode: Exclude<AuthMode, "register">;
  initialEmail: string;
  onSignedIn: () => void;
  onModeChange: (mode: AuthMode, email?: string) => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pending, setPending] = useState<Pending>(null);
  const busy = pending !== null;
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const cleanEmail = email.trim().toLowerCase();
  const validateEmail = () => {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return true;
    setError("Enter a valid email, like name@example.com.");
    return false;
  };
  const validatePassword = (value: string) => {
    if (value.length >= 8 && value.length <= 128) return true;
    setError("Password must be between 8 and 128 characters.");
    return false;
  };

  const login = async () => {
    if (!validateEmail() || !validatePassword(password)) return;
    setPending("submit");
    setError("");
    setInfo("");
    try {
      const result = await authClient.signIn.email({
        email: cleanEmail,
        password,
        rememberMe: true,
      });
      if (result.error) {
        if (result.error.code === "EMAIL_NOT_VERIFIED") {
          const sent = await authClient.emailOtp.sendVerificationOtp({
            email: cleanEmail,
            type: "email-verification",
          });
          if (sent.error) throw new Error(authErrorMessage(sent.error));
          onModeChange("verify", cleanEmail);
          return;
        }
        throw new Error(authErrorMessage(result.error));
      }
      await clearProfileDraft();
      onSignedIn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't log in. Please try again.");
    } finally {
      setPending(null);
    }
  };

  const verify = async () => {
    if (!validateEmail()) return;
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setPending("submit");
    setError("");
    try {
      const result = await authClient.emailOtp.verifyEmail({ email: cleanEmail, otp });
      if (result.error) throw new Error(authErrorMessage(result.error));
      // Keeps the sign-up draft: "/" saves it as the profile.
      onSignedIn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't verify the code. Please try again.");
    } finally {
      setPending(null);
    }
  };

  const resendVerification = async () => {
    if (!validateEmail()) return;
    setPending("submit");
    setError("");
    setInfo("");
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: cleanEmail,
        type: "email-verification",
      });
      if (result.error) throw new Error(authErrorMessage(result.error));
      setInfo("A new code was sent to your email.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send a new code.");
    } finally {
      setPending(null);
    }
  };

  const requestReset = async () => {
    if (!validateEmail()) return;
    setPending("submit");
    setError("");
    setInfo("");
    try {
      const result = await authClient.emailOtp.requestPasswordReset({ email: cleanEmail });
      if (result.error) throw new Error(authErrorMessage(result.error));
      setInfo("If an account exists, a reset code has been sent.");
      onModeChange("reset", cleanEmail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send the reset code.");
    } finally {
      setPending(null);
    }
  };

  const resetPassword = async () => {
    if (!validateEmail() || !validatePassword(newPassword)) return;
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setPending("submit");
    setError("");
    try {
      const result = await authClient.emailOtp.resetPassword({
        email: cleanEmail,
        otp,
        password: newPassword,
      });
      if (result.error) throw new Error(authErrorMessage(result.error));
      setPassword("");
      setOtp("");
      setNewPassword("");
      setInfo("Password changed. You can now log in.");
      onModeChange("login", cleanEmail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't reset your password.");
    } finally {
      setPending(null);
    }
  };

  const googleSignIn = async () => {
    if (busy) return;
    setPending("google");
    setError("");
    try {
      const result = await authClient.signIn.social({ provider: "google", callbackURL: "/" });
      if (result.error) throw new Error(authErrorMessage(result.error));
      await clearProfileDraft();
      onSignedIn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed. Please try again.");
    } finally {
      setPending(null);
    }
  };

  const title =
    mode === "login"
      ? "Welcome back"
      : mode === "verify"
        ? "Verify your email"
        : mode === "forgot"
          ? "Forgot password"
          : "Set a new password";
  const subtitle =
    mode === "login"
      ? "Log in to see your mandi prices, alerts and listings."
      : mode === "verify"
        ? `Enter the 6-digit code sent to ${cleanEmail}.`
        : mode === "forgot"
          ? "We'll email you a code to reset your password."
          : "Enter the code from your email and choose a new password.";

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.authContent}
      >
        <View style={styles.authLogo}>
          <Sprout size={24} color={theme.card} strokeWidth={2.4} />
        </View>
        <Text style={styles.authTitle} accessibilityRole="header">
          {title}
        </Text>
        <Text style={styles.authSubtitle}>{subtitle}</Text>

        <FieldLabel>Email</FieldLabel>
        <TextField
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!busy && mode !== "verify" && mode !== "reset"}
          accessibilityLabel="Email"
        />

        {mode === "login" && (
          <>
            <FieldLabel>Password</FieldLabel>
            <TextField
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              editable={!busy}
              accessibilityLabel="Password"
              onSubmitEditing={() => void login()}
            />
            <Tap
              onPress={() => {
                setError("");
                setInfo("");
                onModeChange("forgot", cleanEmail);
              }}
              accessibilityRole="button"
              style={styles.forgotLink}
            >
              <Text style={styles.linkText}>Forgot password?</Text>
            </Tap>
          </>
        )}

        {(mode === "verify" || mode === "reset") && (
          <>
            <FieldLabel>Verification code</FieldLabel>
            <TextField
              value={otp}
              onChangeText={(value) => setOtp(value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={6}
              editable={!busy}
              accessibilityLabel="Verification code"
              containerStyle={styles.codeField}
            />
          </>
        )}

        {mode === "reset" && (
          <>
            <FieldLabel>New password</FieldLabel>
            <TextField
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 8 characters"
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              editable={!busy}
              accessibilityLabel="New password"
              hint="Use at least 8 characters."
            />
          </>
        )}

        {!!error && (
          <Text style={styles.serverError} accessibilityLiveRegion="polite">
            {error}
          </Text>
        )}
        {!!info && !error && (
          <Text style={styles.infoText} accessibilityLiveRegion="polite">
            {info}
          </Text>
        )}

        <Button
          title={
            mode === "login"
              ? "Log in"
              : mode === "verify"
                ? "Verify email"
                : mode === "forgot"
                  ? "Send reset code"
                  : "Reset password"
          }
          onPress={() => {
            if (busy) return;
            if (mode === "login") void login();
            else if (mode === "verify") void verify();
            else if (mode === "forgot") void requestReset();
            else void resetPassword();
          }}
          loading={pending === "submit"}
          disabled={busy}
          style={styles.authPrimary}
        />

        {mode === "verify" && (
          <Tap
            onPress={() => void resendVerification()}
            disabled={busy}
            accessibilityRole="button"
            style={styles.centerLink}
          >
            <Text style={styles.linkText}>Send a new code</Text>
          </Tap>
        )}

        {mode === "login" ? (
          <AuthChoices
            pending={pending}
            onGoogle={() => void googleSignIn()}
            prompt="New to KisanMandi?"
            action="Create account"
            onAction={() => onModeChange("register", cleanEmail)}
          />
        ) : (
          <Tap
            onPress={() => {
              setError("");
              setInfo("");
              onModeChange("login", cleanEmail);
            }}
            accessibilityRole="button"
            style={styles.centerLink}
          >
            <Text style={styles.switchText}>Back to login</Text>
          </Tap>
        )}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

function AuthChoices({
  pending,
  onGoogle,
  prompt,
  action,
  onAction,
}: {
  pending: Pending;
  onGoogle: () => void;
  prompt: string;
  action: string;
  onAction: () => void;
}) {
  const busy = pending !== null;
  return (
    <View style={styles.authChoices}>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>
      <Tap
        onPress={onGoogle}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
        style={[styles.googleButton, busy && pending !== "google" && styles.disabled]}
      >
        {pending === "google" ? (
          <ActivityIndicator color={theme.ink} />
        ) : (
          <>
            <Image source={require("../../assets/images/google.png")} style={styles.googleIcon} />
            <Text style={styles.googleText}>Continue with Google</Text>
          </>
        )}
      </Tap>
      <View style={styles.switchRow}>
        <Text style={styles.switchText}>{prompt}</Text>
        <Tap onPress={onAction} disabled={busy} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.linkText}>{action}</Text>
        </Tap>
      </View>
    </View>
  );
}

function authErrorMessage(error: unknown) {
  const value = error as { code?: string; message?: string; statusText?: string } | null;
  const code = value?.code;
  if (code === "INVALID_EMAIL_OR_PASSWORD") return "Email or password is incorrect.";
  if (code === "EMAIL_NOT_VERIFIED") return "Verify your email before logging in.";
  if (code === "USER_ALREADY_EXISTS") return "An account already exists for this email. Log in instead.";
  if (code === "INVALID_OTP") return "That code is incorrect or expired.";
  if (code === "TOO_MANY_ATTEMPTS") return "Too many attempts. Request a new code.";
  if (code === "PASSWORD_TOO_SHORT") return "Password must be at least 8 characters.";
  return value?.message || value?.statusText || "Authentication failed. Please try again.";
}

function RoleCard({
  title,
  body,
  Icon,
  iconBg,
  iconColor,
  selected,
  onPress,
}: {
  title: string;
  body: string;
  Icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Tap
      onPress={() => {
        haptic();
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${title}. ${body}`}
      style={[styles.roleCard, selected && styles.roleSelected]}
    >
      <View style={[styles.roleIcon, { backgroundColor: iconBg }]}>
        <Icon size={22} color={iconColor} strokeWidth={2} />
      </View>
      {selected && (
        <View style={styles.check}>
          <Check size={13} color={theme.card} strokeWidth={3} />
        </View>
      )}
      <Text style={styles.roleTitle}>{title}</Text>
      <Text style={styles.roleBody}>{body}</Text>
    </Tap>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  center: { alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 },
  title: { fontFamily: fonts.bold, fontSize: 26, letterSpacing: -0.4, color: theme.ink },
  subtitle: { marginTop: 6, fontFamily: fonts.regular, fontSize: 14, color: theme.muted, marginBottom: 2 },
  serverError: { marginTop: 16, textAlign: "center", fontFamily: fonts.medium, fontSize: 13, color: theme.red },
  infoText: { marginTop: 16, textAlign: "center", fontFamily: fonts.medium, fontSize: 13, color: theme.green },
  authContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 32 },
  authLogo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: theme.green,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 18,
  },
  authTitle: {
    fontFamily: fonts.bold,
    fontSize: 28,
    letterSpacing: -0.5,
    color: theme.ink,
    textAlign: "center",
  },
  authSubtitle: {
    marginTop: 8,
    marginBottom: 14,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: theme.muted,
    textAlign: "center",
  },
  authPrimary: { marginTop: 24 },
  forgotLink: { alignSelf: "flex-end", paddingVertical: 12 },
  centerLink: { alignSelf: "center", paddingHorizontal: 12, paddingVertical: 14 },
  codeField: { maxWidth: 220, width: "100%", alignSelf: "center" },
  authChoices: { marginTop: 20 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.line },
  dividerText: { fontFamily: fonts.semibold, fontSize: 11, color: theme.muted },
  googleButton: {
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  googleIcon: { width: 20, height: 20 },
  disabled: { opacity: 0.5 },
  googleText: { fontFamily: fonts.semibold, fontSize: 15, color: theme.ink },
  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 18 },
  switchText: { fontFamily: fonts.regular, fontSize: 14, color: theme.muted },
  linkText: { fontFamily: fonts.semibold, fontSize: 14, color: theme.green },
  roles: { flexDirection: "row", gap: 12 },
  roleCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: theme.card,
    borderWidth: 1.5,
    borderColor: theme.card,
    padding: 16,
    minHeight: 158,
  },
  roleSelected: { backgroundColor: theme.greenSoft, borderColor: theme.green },
  roleIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  check: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.green,
    alignItems: "center",
    justifyContent: "center",
  },
  roleTitle: { fontFamily: fonts.bold, fontSize: 16, color: theme.ink },
  roleBody: { marginTop: 8, fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 18, color: theme.muted },
  footer: { paddingHorizontal: 24, paddingTop: 8, backgroundColor: theme.bg },
});
