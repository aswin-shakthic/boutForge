import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { APP_NAME, COLORS } from "@boutforge/shared";

export default function MoreScreen() {
  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{APP_NAME}</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grey100, padding: 16 },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.navy,
    marginBottom: 24,
  },
  button: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.grey200,
  },
  buttonText: { color: COLORS.red, fontWeight: "600", textAlign: "center" },
});
