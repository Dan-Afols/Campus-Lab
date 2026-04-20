import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { Card } from "../../components/Card";
import { palette } from "../../theme/colors";
import { api } from "../../services/api";

async function askAI(mode: "Math" | "Summarize" | "General") {
  if (mode === "Math") {
    await api.post("/ai/math", { prompt: "Solve x^2 - 5x + 6 = 0" });
    return;
  }

  if (mode === "Summarize") {
    await api.post("/ai/summarize", { text: "Summarize this lecture note." });
    return;
  }

  await api.post("/ai/chat", { prompt: "How do I book a hostel?" });
}

export function AIScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Campus Lab AI</Text>
      <Card title="Math Mode" value="Deepseek/Qwen Math routing" />
      <Card title="Summary Mode" value="BART/Longformer summarization" />
      <Card title="General Mode" value="Mistral/Llama navigation and Q&A" />
      <View style={styles.row}>
        {["Math", "Summarize", "General"].map((mode) => (
          <Pressable key={mode} style={styles.modeButton} onPress={() => askAI(mode as "Math" | "Summarize" | "General") }>
            <Text style={styles.modeText}>{mode}</Text>
          </Pressable>
        ))}
      </View>
      <Card title="AI Meal Suggestion" value="Regenerate with budget constraints" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.surface },
  content: { padding: 16 },
  heading: { fontSize: 24, fontWeight: "700", color: palette.deepNavy, marginBottom: 16 },
  row: { flexDirection: "row", gap: 10, marginBottom: 14 },
  modeButton: { backgroundColor: palette.deepNavy, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 },
  modeText: { color: palette.white, fontWeight: "600" }
});
