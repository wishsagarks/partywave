import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  style,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: '#8B5CF6', color: '#FFFFFF' };
      case 'secondary':
        return { backgroundColor: '#6B7280', color: '#FFFFFF' };
      case 'success':
        return { backgroundColor: '#10B981', color: '#FFFFFF' };
      case 'warning':
        return { backgroundColor: '#F59E0B', color: '#FFFFFF' };
      case 'destructive':
        return { backgroundColor: '#EF4444', color: '#FFFFFF' };
      default:
        return { backgroundColor: '#374151', color: '#F3F4F6' };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={[
      styles.badge,
      { backgroundColor: variantStyles.backgroundColor },
      style,
    ]}>
      <Text style={[
        styles.text,
        { color: variantStyles.color },
      ]}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});