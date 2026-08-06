import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link, router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { resolveAuthDestination } from "@boutforge/api";
import { APP_NAME, COLORS } from "@boutforge/shared";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    const destination = await resolveAuthDestination(supabase);
    router.replace(
      destination === "dashboard" ? "/(tabs)" : "/(auth)/onboarding"
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>{APP_NAME}</Text>
        <Text style={styles.subtitle}>Boxing Fixture Management</Text>

        <View style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Signing in..." : "Log In"}
            </Text>
          </TouchableOpacity>

          <Link href="/(auth)/signup" style={styles.link}>
            Don't have an account? Sign up
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  inner: { flex: 1, justifyContent: "center", padding: 24 },
  logo: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginBottom: 32,
    marginTop: 8,
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
