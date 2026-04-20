import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { palette } from "../../theme/colors";

type Props = {
  onContinue: () => void;
};

export function OnboardingScreen({ onContinue }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Campus Lab</Text>
      <Text style={styles.subtitle}>Smart student life manager for academics, hostel, health, finance, and AI support.</Text>
      <Pressable style={styles.button} onPress={onContinue}>
        <Text style={styles.buttonText}>Start Registration</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.deepNavy, justifyContent: "center", padding: 24 },
  title: { color: palette.white, fontSize: 34, fontWeight: "700", marginBottom: 12 },
  subtitle: { color: "#D9E6F5", fontSize: 16, lineHeight: 24, marginBottom: 20 },
  button: { backgroundColor: palette.electricBlue, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16 },
  buttonText: { color: palette.white, textAlign: "center", fontWeight: "600" }
});
