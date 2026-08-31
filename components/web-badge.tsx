import { StyleSheet, Text, View } from "react-native";

export function WebBadge() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>ðŸŒ Web Version</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0b0f19",
    padding: 8,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 16,
  },
  text: { color: "#9ca3af", fontSize: 12 },
});

