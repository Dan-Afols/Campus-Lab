import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { palette } from "../theme/colors";

type Props = {
  title: string;
  value?: string;
  children?: React.ReactNode;
};

export function Card({ title, value, children }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#001933",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2
  },
  title: {
    color: palette.muted,
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "600"
  },
  value: {
    color: palette.text,
    fontSize: 20,
    fontWeight: "700"
  }
});
