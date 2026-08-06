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
import { getBrackets } from "@boutforge/api";
import { COLORS } from "@boutforge/shared";
import type { Bracket } from "@boutforge/shared";

export default function FixturesScreen() {
  const [brackets, setBrackets] = useState<Bracket[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: membership } = await supabase
      .from("club_members")
      .select("club_id")
      .eq("user_id", user.id)
      .single();
    if (!membership) return;
    const data = await getBrackets(supabase, membership.club_id);
    setBrackets(data);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={brackets}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No fixtures yet</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/bracket/${item.id}`)}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.sub}>
              {item.format.replace("_", " ")} · {item.status}
            </Text>
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
  empty: { textAlign: "center", color: COLORS.grey600, marginTop: 40 },
});
