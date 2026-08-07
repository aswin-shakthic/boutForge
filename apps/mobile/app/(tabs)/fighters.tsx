import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { getFighters, getUserClubs } from "@boutforge/api";
import {
  fighterFullName,
  fighterRecord,
  getAgeFromDob,
  getFighterClubDisplayName,
  COLORS,
} from "@boutforge/shared";
import type { Fighter } from "@boutforge/shared";

export default function FightersScreen() {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const memberships = await getUserClubs(supabase, user.id);
    const clubIds = memberships.map((entry) => entry.club_id);
    if (clubIds.length === 0) return;
    const data = await getFighters(supabase, clubIds);
    setFighters(data);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={fighters}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No fighters yet</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/fighter/${item.id}`)}
          >
            <Text style={styles.name}>{fighterFullName(item)}</Text>
            <Text style={styles.sub}>
              {getFighterClubDisplayName(item)} · {getAgeFromDob(item.dob)} yrs · {item.gender} ·{" "}
              {item.weight_class?.name ?? "—"}
            </Text>
            <Text style={styles.record}>{fighterRecord(item)}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grey100 },
  card: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grey200,
  },
  name: { fontSize: 16, fontWeight: "600", color: COLORS.navy },
  sub: { fontSize: 13, color: COLORS.grey600, marginTop: 4 },
  record: { fontSize: 13, fontFamily: "monospace", marginTop: 4 },
  empty: { textAlign: "center", color: COLORS.grey600, marginTop: 40 },
});
