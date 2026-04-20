import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { palette } from "../../theme/colors";

const legend = [
  { label: "Available", color: palette.success },
  { label: "Booked", color: "#F44336" },
  { label: "Selected", color: "#2196F3" },
  { label: "Held", color: palette.held },
  { label: "Coursemate", color: palette.warning }
];

export function HostelScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Hostel Booking</Text>
      <View style={styles.legendWrap}>
        {legend.map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: item.color }]} />
            <Text>{item.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.grid}>
        {Array.from({ length: 30 }).map((_, i) => {
          const color = i % 11 === 0 ? palette.warning : i % 5 === 0 ? "#F44336" : palette.success;
          return <View key={i} style={[styles.cell, { backgroundColor: color }]} />;
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.surface },
  content: { padding: 16 },
  heading: { fontSize: 24, fontWeight: "700", color: palette.deepNavy, marginBottom: 16 },
  legendWrap: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 14, height: 14, borderRadius: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cell: { width: "16%", aspectRatio: 1, borderRadius: 8 }
});
