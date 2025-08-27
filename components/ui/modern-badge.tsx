import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ModernBadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  gradient?: boolean;
}

export const ModernBadge: React.FC<ModernBadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  style,
  gradient = false,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return { 
          backgroundColor: '#667eea', 
          color: '#FFFFFF',
          gradientColors: ['#667eea', '#764ba2']
        };
      case 'secondary':
        return { 
          backgroundColor: '#1a1a2e', 
          color: '#FFFFFF',
          gradientColors: ['#1a1a2e', '#16213e']
        };
      case 'success':
        return { 
          backgroundColor: '#11998e', 
          color: '#FFFFFF',
          gradientColors: ['#11998e', '#38ef7d']
        };
      case 'warning':
        return { 
          backgroundColor: '#feca57', 
          color: '#FFFFFF',
          gradientColors: ['#feca57', '#f39c12']
        };
      case 'destructive':
        return { 
          backgroundColor: '#ff6b6b', 
          color: '#FFFFFF',
          gradientColors: ['#ff6b6b', '#ee5a52']
        };
      case 'info':
        return { 
          backgroundColor: '#667eea', 
          color: '#FFFFFF',
          gradientColors: ['#667eea', '#764ba2']
        };
      default:
        return { 
          backgroundColor: '#2d3748', 
          color: '#FFFFFF',
          gradientColors: ['#2d3748', '#4a5568']
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { paddingHorizontal: 8, paddingVertical: 4, fontSize: 11, borderRadius: 8 };
      case 'lg':
        return { paddingHorizontal: 16, paddingVertical: 8, fontSize: 14, borderRadius: 12 };
      default:
        return { paddingHorizontal: 12, paddingVertical: 6, fontSize: 12, borderRadius: 10 };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const content = (
    <Text style={[
      styles.text,
      {
        color: variantStyles.color,
        fontSize: sizeStyles.fontSize,
      },
    ]}>
      {children}
    </Text>
  );

  if (gradient) {
    return (
      <LinearGradient
        colors={variantStyles.gradientColors}
        style={[
          styles.badge,
          {
            paddingHorizontal: sizeStyles.paddingHorizontal,
            paddingVertical: sizeStyles.paddingVertical,
            borderRadius: sizeStyles.borderRadius,
          },
          style,
        ]}
      >
        {content}
      </LinearGradient>
    );
  }

  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: variantStyles.backgroundColor,
        paddingHorizontal: sizeStyles.paddingHorizontal,
        paddingVertical: sizeStyles.paddingVertical,
        borderRadius: sizeStyles.borderRadius,
      },
      style,
    ]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});