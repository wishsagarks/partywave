// src/components/ui/modern-card.tsx
import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

type Variant = 'glass' | 'elevated' | 'gradient' | 'default';

interface ModernCardProps {
  children?: ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: Variant;
}

export function ModernCard({ children, style, variant = 'default' }: ModernCardProps) {
  const variantStyle = (() => {
    switch (variant) {
      case 'glass':
        return styles.glass;
      case 'elevated':
        return styles.elevated;
      case 'gradient':
        return styles.gradient;
      default:
        return styles.default;
    }
  })();

  return <View style={[styles.card, variantStyle, style as any]}>{children}</View>;
}

export default ModernCard;

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
  },
  default: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 0,
  },
  glass: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  elevated: {
    backgroundColor: '#0f1724',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  gradient: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 0,
  },
});
