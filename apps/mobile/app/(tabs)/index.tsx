import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { getDashboardStats } from "@boutforge/api";
import { fighterFullName, COLORS } from "@boutforge/shared";
import type { Bout } from "@boutforge/shared";

export default function HomeScreen() {
  const [stats, setStats] = useState({
    fighterCount: 0,
    upcomingCount: 0,
    activeBrackets: 0,
    recentResults: [] as Bout[],
    upcomingBouts: [] as Bout[],
  });
  const [clubName, setClubName] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: membership } = await supabase
      .from("club_members")
      .select("club_id, club:clubs(name)")
      .eq("user_id", user.id)
      .single();

    if (!membership) return;
    setClubName((membership.club as { name: string })?.name ?? "");
    const data = await getDashboardStats(supabase, membership.club_id);
    setStats(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.clubName}>{clubName}</Text>

      <View style={styles.statsRow}>
        {[
          { label: "Fighters", value: stats.fighterCount },
          { label: "Upcoming", value: stats.upcomingCount },
          { label: "Brackets", value: stats.activeBrackets },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.push("/(tabs)/fixtures")}
      >
        <Text style={styles.primaryButtonText}>+ Create Fixture</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Upcoming Bouts</Text>
      {stats.upcomingBouts.length === 0 ? (
        <Text style={styles.empty}>No upcoming bouts</Text>
      ) : (
        stats.upcomingBouts.map((bout) => (
          <View key={bout.id} style={styles.card}>
            <Text style={styles.cardTitle}>
              {bout.fighter_a ? fighterFullName(bout.fighter_a) : "TBD"} vs{" "}
              {bout.fighter_b ? fighterFullName(bout.fighter_b) : "TBD"}
            </Text>
            <Text style={styles.cardSub}>
              Round {bout.round_number} · Bout {bout.bout_order}
            </Text>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Recent Results</Text>
      {stats.recentResults.length === 0 ? (
        <Text style={styles.empty}>No recent results</Text>
      ) : (
        stats.recentResults.map((bout) => (
          <View key={bout.id} style={styles.card}>
            <Text style={styles.cardTitle}>
              {bout.result?.winner_id === bout.fighter_a_id
                ? fighterFullName(bout.fighter_a!)
                : fighterFullName(bout.fighter_b!)}{" "}
              wins
            </Text>
            <Text style={styles.cardSub}>
              {bout.result?.method} · R{bout.result?.round_ended}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grey100, padding: 16 },
  clubName: { fontSize: 14, color: COLORS.grey600, marginBottom: 12 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statValue: { fontSize: 24, fontWeight: "bold", color: COLORS.navy },
  statLabel: { fontSize: 12, color: COLORS.grey600, marginTop: 4 },
  primaryButton: {
    backgroundColor: COLORS.red,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  primaryButtonText: { color: COLORS.white, fontWeight: "600" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.navy,
    marginBottom: 8,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  cardTitle: { fontSize: 14, fontWeight: "500" },
  cardSub: { fontSize: 12, color: COLORS.grey600, marginTop: 4 },
  empty: { fontSize: 14, color: COLORS.grey600, marginBottom: 16 },
});
