import React from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { Card } from "../../components/Card";
import { palette } from "../../theme/colors";

export function HealthFinanceScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Health + Finance</Text>
      <Card title="Expense Tracker" value="Daily, weekly, monthly trends" />
      <Card title="Savings Planner" value="Target ₦100,000 by Aug 2026" />
      <Card title="Water Intake" value="6/8 cups" />
      <Card title="Step Counter" value="4,862 steps, 3.8km, 194 kcal" />
      <Card title="Sleep" value="7h 15m average this week" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.surface },
  content: { padding: 16 },
  heading: { fontSize: 24, fontWeight: "700", color: palette.deepNavy, marginBottom: 16 }
});
