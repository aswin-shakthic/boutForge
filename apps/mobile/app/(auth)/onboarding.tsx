import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import {
  completePendingSignup,
  createClub,
  getUserClubs,
  joinClubWithInvite,
} from "@boutforge/api";
import { APP_NAME, COLORS } from "@boutforge/shared";

export default function OnboardingScreen() {
  const [useInvite, setUseInvite] = useState(false);
  const [clubName, setClubName] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/(auth)/login");
        return;
      }

      await completePendingSignup(supabase);
      const clubs = await getUserClubs(supabase, user.id);
      if (clubs.length > 0) {
        router.replace("/(tabs)");
        return;
      }

      const meta = user.user_metadata as {
        pending_club_name?: string;
        pending_invite_token?: string;
      };
      if (meta.pending_invite_token) {
        setInviteToken(meta.pending_invite_token);
        setUseInvite(true);
      } else if (meta.pending_club_name) {
        setClubName(meta.pending_club_name);
      }

      setLoading(false);
    }

    init();
  }, []);

  async function handleSubmit() {
    setError("");

    if (useInvite && !inviteToken.trim()) {
      setError("Invite code is required");
      return;
    }
    if (!useInvite && !clubName.trim()) {
      setError("Club name is required");
      return;
    }

    setSubmitting(true);
    try {
      if (useInvite) {
        await joinClubWithInvite(supabase, inviteToken.trim());
      } else {
        await createClub(supabase, clubName.trim());
      }
      await supabase.auth.updateUser({
        data: { pending_club_name: null, pending_invite_token: null },
      });
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set up club");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.logo}>{APP_NAME}</Text>
        <View style={styles.card}>
          <Text style={styles.title}>Finish setup</Text>
          <Text style={styles.subtitle}>Create or join a club to continue</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggle, !useInvite && styles.toggleActive]}
              onPress={() => setUseInvite(false)}
            >
              <Text style={!useInvite ? styles.toggleTextActive : styles.toggleText}>
                Create club
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggle, useInvite && styles.toggleActive]}
              onPress={() => setUseInvite(true)}
            >
              <Text style={useInvite ? styles.toggleTextActive : styles.toggleText}>
                Join invite
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder={useInvite ? "Invite code" : "Club name"}
            value={useInvite ? inviteToken : clubName}
            onChangeText={useInvite ? setInviteToken : setClubName}
            autoCapitalize={useInvite ? "none" : "words"}
          />

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.buttonText}>
              {submitting ? "Saving…" : "Continue"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  inner: { flexGrow: 1, justifyContent: "center", padding: 24 },
  loading: { color: COLORS.white, textAlign: "center", marginTop: 48 },
  logo: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
    marginBottom: 24,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.navy,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.grey600,
    marginBottom: 16,
  },
  toggleRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  toggle: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.grey200,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  toggleActive: {
    borderColor: COLORS.red,
    backgroundColor: "#FEE2E2",
  },
  toggleText: { color: COLORS.grey600, fontSize: 13 },
  toggleTextActive: { color: COLORS.red, fontSize: 13, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: COLORS.grey200,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: COLORS.red,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: COLORS.white, fontWeight: "600", fontSize: 16 },
  error: {
    color: COLORS.red,
    fontSize: 14,
    marginBottom: 12,
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 8,
  },
});
