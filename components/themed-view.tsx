import { StyleSheet, View, ViewProps } from "react-native";

interface ThemedViewProps extends ViewProps {
  type?: "default" | "backgroundElement";
}

export function ThemedView({
  style,
  type = "default",
  children,
  ...props
}: ThemedViewProps) {
  return (
    <View style={[styles[type], style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  default: { backgroundColor: "#030712" },
  backgroundElement: {
    backgroundColor: "#0b0f19",
    borderRadius: 8,
    padding: 12,
  },
});

