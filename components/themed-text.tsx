import { StyleSheet, Text, TextProps } from "react-native";

interface ThemedTextProps extends TextProps {
  type?:
    | "default"
    | "title"
    | "subtitle"
    | "link"
    | "small"
    | "code"
    | "smallBold"
    | "linkPrimary";
  themeColor?: string;
}

export function ThemedText({
  style,
  type = "default",
  children,
  ...props
}: ThemedTextProps) {
  return (
    <Text style={[styles[type], style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  default: { color: "#fff", fontSize: 16 },
  title: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  subtitle: { color: "#fff", fontSize: 20, fontWeight: "600" },
  link: { color: "#06b6d4", fontSize: 14 },
  linkPrimary: { color: "#06b6d4", fontSize: 14, fontWeight: "600" },
  small: { color: "#9ca3af", fontSize: 12 },
  smallBold: { color: "#9ca3af", fontSize: 12, fontWeight: "bold" },
  code: { color: "#06b6d4", fontSize: 12, fontFamily: "monospace" },
});

