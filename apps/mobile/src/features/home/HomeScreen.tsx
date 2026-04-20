import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { Card } from "../../components/Card";
import { palette } from "../../theme/colors";
import { useApiQuery } from "../../services/hooks";

export function HomeScreen() {
  const timetable = useApiQuery<Array<{ course: { code: string }; startsAt: string }>>("/timetable/mine");
  const materials = useApiQuery<Array<{ title: string }>>("/materials/mine");
  const notifications = useApiQuery<Array<{ id: string }>>("/notifications");
  const health = useApiQuery<{ steps: Array<{ steps: number }>; hydration: Array<{ cups: number }> }>("/health/summary");

  const nextClass = timetable.data?.[0];
  const recentMaterial = materials.data?.[0];
  const latestSteps = health.data?.steps?.[0]?.steps ?? 0;
  const latestCups = health.data?.hydration?.[0]?.cups ?? 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Welcome back, Student</Text>
      <View style={styles.statsRow}>
        <Card title="Today's Classes" value={`${timetable.data?.length ?? 0}`} />
        <Card title="New Materials" value={`${materials.data?.length ?? 0}`} />
      </View>
      <View style={styles.statsRow}>
        <Card title="Notifications" value={`${notifications.data?.length ?? 0}`} />
        <Card title="Steps Today" value={`${latestSteps}`} />
      </View>
      <Card
        title="Upcoming Timetable"
        value={nextClass ? `${nextClass.course.code} at ${nextClass.startsAt}` : timetable.loading ? "Loading..." : "No class scheduled"}
      />
      <Card title="Recent Uploads" value={recentMaterial?.title ?? (materials.loading ? "Loading..." : "No materials yet")} />
      <Card title="Finance Summary" value="₦9,200 spent this week" />
      <Card title="Health Summary" value={`${latestCups}/8 cups water, ${Math.round((latestSteps / 8000) * 100)}% step goal`} />
      <Card title="Hostel Status" value="Booked" />
      {timetable.error || materials.error || notifications.error || health.error ? (
        <Text style={styles.errorText}>Some dashboard data could not be loaded.</Text>
      ) : null}
      <View style={styles.actions}>
        {["Book Hostel", "View Timetable", "Upload", "Ask AI"].map((label) => (
          <Pressable key={label} style={styles.actionButton}>
            <Text style={styles.actionText}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.surface },
  content: { padding: 16 },
  greeting: { fontSize: 24, fontWeight: "700", color: palette.deepNavy, marginBottom: 16 },
  statsRow: { flexDirection: "row", gap: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  actionButton: { backgroundColor: palette.electricBlue, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 },
  actionText: { color: palette.white, fontWeight: "600" },
  errorText: { color: palette.danger, marginBottom: 8 }
});
