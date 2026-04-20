import React from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { Card } from "../../components/Card";
import { palette } from "../../theme/colors";
import { useApiQuery } from "../../services/hooks";

export function NewsScreen() {
  const news = useApiQuery<Array<{ id: string; title: string; category: string; isPinned: boolean; isUrgent: boolean }>>("/news");

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>University Newsfeed</Text>
      {news.loading ? <Card title="Loading" value="Fetching latest updates" /> : null}
      {news.error ? <Card title="Error" value="Failed to load news" /> : null}
      {news.data?.map((item) => (
        <Card
          key={item.id}
          title={`${item.isPinned ? "Pinned • " : ""}${item.category}${item.isUrgent ? " • URGENT" : ""}`}
          value={item.title}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.surface },
  content: { padding: 16 },
  heading: { fontSize: 24, fontWeight: "700", color: palette.deepNavy, marginBottom: 16 }
});
