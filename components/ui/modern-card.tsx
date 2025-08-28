import React from 'react';
import { View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface ModernCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'glass' | 'gradient' | 'solid' | 'elevated';
  className?: string;
}

export const ModernCard: React.FC<ModernCardProps> = ({ 
  children, 
  style, 
  variant = 'glass',
  className 
}) => {
  const baseStyle = {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'glass':
        return {
          gradient: ['rgba(15, 15, 35, 0.85)', 'rgba(26, 26, 46, 0.9)'],
          border: 'rgba(102, 126, 234, 0.3)',
          backdrop: true,
        };
      case 'gradient':
        return {
          gradient: ['#1a1a2e', '#16213e', '#0f3460', '#533483'],
          border: 'transparent',
        };
      case 'elevated':
        return {
          gradient: ['#0f0f23', '#1a1a2e'],
          border: 'rgba(102, 126, 234, 0.4)',
        };
      default:
        return {
          gradient: ['#0f0f23', '#1a1a2e'],
          border: 'transparent',
        };
    }
  };

  if (variant === 'glass') {
    const styles = getVariantStyles();
    return (
      <View style={[baseStyle, style]}>
        <BlurView intensity={25} tint="dark" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 20,
        }} />
        <LinearGradient
          colors={styles.gradient}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 20,
          }}
        />
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderWidth: 1,
          borderColor: styles.border,
          borderRadius: 20,
        }} />
        <View style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </View>
      </View>
    );
  }

  if (variant === 'gradient') {
    const styles = getVariantStyles();
    return (
      <LinearGradient
        colors={styles.gradient}
        style={[baseStyle, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  if (variant === 'elevated') {
    const styles = getVariantStyles();
    return (
      <View style={[
        baseStyle,
        {
          backgroundColor: '#0f0f23',
          borderWidth: 1,
          borderColor: styles.border,
          shadowOpacity: 0.3,
        },
        style
      ]}>
        {children}
      </View>
    );
  }

  return (
    <View style={[
      baseStyle,
      { backgroundColor: '#0a0a1a' },
      style
    ]}>
      {children}
    </View>
  );
};