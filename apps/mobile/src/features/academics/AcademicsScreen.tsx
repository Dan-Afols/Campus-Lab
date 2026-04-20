import React from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { Card } from "../../components/Card";
import { palette } from "../../theme/colors";
import { useApiQuery } from "../../services/hooks";

export function AcademicsScreen() {
  const timetable = useApiQuery<Array<{ id: string; course: { code: string; title: string }; dayOfWeek: number; startsAt: string; venue: string }>>(
    "/timetable/mine"
  );
  const materials = useApiQuery<Array<{ id: string; title: string; aiSummary: string | null }>>("/materials/mine");

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Academics</Text>
      <Card title="Weekly Timetable" value={`${timetable.data?.length ?? 0} classes synced to your level`} />
      {timetable.data?.slice(0, 3).map((entry) => (
        <Card key={entry.id} title={`${entry.course.code} • Day ${entry.dayOfWeek}`} value={`${entry.startsAt} at ${entry.venue}`} />
      ))}
      <Card title="Course Materials" value={`${materials.data?.length ?? 0} published resources`} />
      {materials.data?.slice(0, 2).map((item) => (
        <Card key={item.id} title={item.title} value={item.aiSummary ? "AI summary ready" : "Summary queued"} />
      ))}
      <Card title="Past Questions" value="Filtered by department and year" />
      <Card title="Class Reminder" value="15-minute pre-class push notification" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.surface },
  content: { padding: 16 },
  heading: { fontSize: 24, fontWeight: "700", color: palette.deepNavy, marginBottom: 16 }
});
