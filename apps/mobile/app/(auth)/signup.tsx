import { useState } from "react";
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
import { Link, router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { createClub } from "@boutforge/api";
import { APP_NAME, COLORS } from "@boutforge/shared";

export default function SignupScreen() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    club_name: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setError("");
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name } },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user && form.club_name) {
      try {
        await createClub(supabase, form.club_name);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create club");
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    router.replace("/(tabs)");
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.logo}>{APP_NAME}</Text>
        <View style={styles.card}>
          <Text style={styles.title}>Create account</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {(["full_name", "email", "password", "club_name"] as const).map(
            (field) => (
              <TextInput
                key={field}
                style={styles.input}
                placeholder={
                  field === "full_name"
                    ? "Full name"
                    : field === "club_name"
                      ? "Club name"
                      : field.charAt(0).toUpperCase() + field.slice(1)
                }
                value={form[field]}
                onChangeText={(v) => setForm({ ...form, [field]: v })}
                secureTextEntry={field === "password"}
                autoCapitalize={field === "email" ? "none" : "words"}
                keyboardType={field === "email" ? "email-address" : "default"}
              />
            )
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Creating..." : "Sign Up"}
            </Text>
          </TouchableOpacity>

          <Link href="/(auth)/login" style={styles.link}>
            Already have an account? Log in
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  inner: { flexGrow: 1, justifyContent: "center", padding: 24 },
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
    marginBottom: 16,
  },
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
  link: {
    color: COLORS.red,
    textAlign: "center",
    marginTop: 16,
    fontSize: 14,
  },
});
