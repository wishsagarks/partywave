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
          backgroundColor: '#4a5568', 
          color: '#E2E8F0',
          gradientColors: ['#4a5568', '#2d3748']
        };
      case 'success':
        return { 
          backgroundColor: '#38a169', 
          color: '#FFFFFF',
          gradientColors: ['#38a169', '#2f855a']
        };
      case 'warning':
        return { 
          backgroundColor: '#d69e2e', 
          color: '#FFFFFF',
          gradientColors: ['#d69e2e', '#b7791f']
        };
      case 'destructive':
        return { 
          backgroundColor: '#e53e3e', 
          color: '#FFFFFF',
          gradientColors: ['#e53e3e', '#c53030']
        };
      case 'info':
        return { 
          backgroundColor: '#3182ce', 
          color: '#FFFFFF',
          gradientColors: ['#3182ce', '#2c5282']
        };
      default:
        return { 
          backgroundColor: '#667eea', 
          color: '#FFFFFF',
          gradientColors: ['#667eea', '#764ba2']
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