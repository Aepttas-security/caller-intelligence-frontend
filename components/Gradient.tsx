import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

interface GradientProps {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: any;
  children?: React.ReactNode;
}

export const LinearGradient: React.FC<GradientProps> = ({
  colors,
  style,
  children,
}) => {
  if (Platform.OS === 'web') {
    const gradientStyle = {
      background: `linear-gradient(to right, ${colors.join(', ')})`,
      ...StyleSheet.flatten(style),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
    return <div style={gradientStyle}>{children}</div>;
  }

  return (
    <View style={[style, { backgroundColor: colors && colors.length > 0 ? colors[0] : '#000000' }]}>
      {children}
    </View>
  );
};

export default LinearGradient;
