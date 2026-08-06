import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { getBracketWithBouts, recordBoutResult } from "@boutforge/api";
import {
  fighterFullName,
  getRoundStatus,
  COLORS,
  BOUT_METHOD_LABELS,
} from "@boutforge/shared";
import type { Bout, Bracket } from "@boutforge/shared";

export default function BracketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [bouts, setBouts] = useState<Bout[]>([]);
  const [selectedBout, setSelectedBout] = useState<Bout | null>(null);
  const [winnerId, setWinnerId] = useState("");
  const [method, setMethod] = useState("UD");

  async function load() {
    if (!id) return;
    const data = await getBracketWithBouts(supabase, id);
    setBracket(data.bracket);
    setBouts(data.bouts);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleRecordResult() {
    if (!selectedBout || !winnerId) return;
    try {
      await recordBoutResult(supabase, selectedBout.id, {
        winner_id: winnerId,
        method: method as "UD",
        round_ended: 3,
      });
      setSelectedBout(null);
      setWinnerId("");
      await load();
      Alert.alert("Success", "Result recorded");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed");
    }
  }

  if (!bracket) return <Text style={styles.loading}>Loading...</Text>;

  const rounds = [...new Set(bouts.map((b) => b.round_number))].sort();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{bracket.name}</Text>

      {rounds.map((round) => {
        const roundBouts = bouts.filter((b) => b.round_number === round);
        const status = getRoundStatus(bouts, round);

        return (
          <View key={round} style={styles.roundCard}>
            <View style={styles.roundHeader}>
              <Text style={styles.roundTitle}>Round {round}</Text>
              <Text style={styles.roundStatus}>{status}</Text>
            </View>
            {roundBouts.map((bout) => (
              <View key={bout.id} style={styles.boutCard}>
                <Text style={styles.boutText}>
                  Bout {bout.bout_order}:{" "}
                  {bout.fighter_a
                    ? fighterFullName(bout.fighter_a)
                    : "TBD"}{" "}
                  vs{" "}
                  {bout.fighter_b
                    ? fighterFullName(bout.fighter_b)
                    : bout.slot_b_type === "bye"
                      ? "BYE"
                      : "TBD"}
                </Text>
                {bout.status === "completed" && bout.result && (
                  <Text style={styles.resultText}>
                    {bout.result.method} · R{bout.result.round_ended}
                  </Text>
                )}
                {bout.status === "scheduled" && bout.fighter_a && bout.fighter_b && (
                  <TouchableOpacity
                    style={styles.resultButton}
                    onPress={() => {
                      setSelectedBout(bout);
                      setWinnerId(bout.fighter_a_id ?? "");
                    }}
                  >
                    <Text style={styles.resultButtonText}>Enter Result</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        );
      })}

      {selectedBout && (
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Record Result</Text>
          <Text style={styles.modalSub}>
            Select winner for Bout {selectedBout.bout_order}
          </Text>
          {selectedBout.fighter_a && (
            <TouchableOpacity
              style={[
                styles.winnerOption,
                winnerId === selectedBout.fighter_a_id && styles.winnerSelected,
              ]}
              onPress={() => setWinnerId(selectedBout.fighter_a_id!)}
            >
              <Text>{fighterFullName(selectedBout.fighter_a)}</Text>
            </TouchableOpacity>
          )}
          {selectedBout.fighter_b && (
            <TouchableOpacity
              style={[
                styles.winnerOption,
                winnerId === selectedBout.fighter_b_id && styles.winnerSelected,
              ]}
              onPress={() => setWinnerId(selectedBout.fighter_b_id!)}
            >
              <Text>{fighterFullName(selectedBout.fighter_b)}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.saveButton} onPress={handleRecordResult}>
            <Text style={styles.saveButtonText}>Save Result</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedBout(null)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grey100, padding: 16 },
  loading: { padding: 20, textAlign: "center" },
  title: { fontSize: 20, fontWeight: "bold", color: COLORS.navy, marginBottom: 16 },
  roundCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  roundHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  roundTitle: { fontWeight: "600", color: COLORS.navy },
  roundStatus: { fontSize: 12, color: COLORS.grey600 },
  boutCard: {
    borderTopWidth: 1,
    borderTopColor: COLORS.grey200,
    paddingTop: 12,
    marginTop: 8,
  },
  boutText: { fontSize: 14 },
  resultText: { fontSize: 12, color: "#15803d", marginTop: 4 },
  resultButton: {
    backgroundColor: COLORS.red,
    borderRadius: 6,
    padding: 8,
    alignItems: "center",
    marginTop: 8,
  },
  resultButtonText: { color: COLORS.white, fontSize: 13, fontWeight: "600" },
  modal: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  modalSub: { fontSize: 14, color: COLORS.grey600, marginBottom: 16 },
  winnerOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.grey200,
    borderRadius: 8,
    marginBottom: 8,
  },
  winnerSelected: { borderColor: COLORS.red, backgroundColor: "#FEE2E2" },
  saveButton: {
    backgroundColor: COLORS.red,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: { color: COLORS.white, fontWeight: "600" },
  cancelText: { textAlign: "center", color: COLORS.grey600, marginTop: 12 },
});
