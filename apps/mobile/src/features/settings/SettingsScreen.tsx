import React from "react";
import { ScrollView, StyleSheet, Text, Pressable } from "react-native";
import { Card } from "../../components/Card";
import { palette } from "../../theme/colors";
import { api } from "../../services/api";

export function SettingsScreen() {
  const updatePrefs = async () => {
    await api.patch("/users/notifications/preferences", {
      material: true,
      pastQuestion: true,
      timetable: true,
      news: true,
      hostel: true,
      health: true,
      classReminder: true
    });
  };

  const toggleLocator = async (enabled: boolean) => {
    await api.patch("/users/privacy/coursemate-locator", { enabled });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Settings</Text>
      <Card title="Theme" value="System / Dark / Light" />
      <Card title="Notification Preferences" value="Toggle by type" />
      <Card title="Privacy" value="Coursemate locator visibility" />
      <Card title="Offline Cache" value="Timetable, news, materials" />
      <Pressable style={styles.button} onPress={updatePrefs}>
        <Text style={styles.buttonText}>Save Notification Defaults</Text>
      </Pressable>
      <Pressable style={styles.buttonSecondary} onPress={() => toggleLocator(false)}>
        <Text style={styles.buttonText}>Hide Bed Location</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.surface },
  content: { padding: 16 },
  heading: { fontSize: 24, fontWeight: "700", color: palette.deepNavy, marginBottom: 16 },
  button: { backgroundColor: palette.electricBlue, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10 },
  buttonSecondary: { backgroundColor: palette.deepNavy, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  buttonText: { color: palette.white, fontWeight: "600", textAlign: "center" }
});
