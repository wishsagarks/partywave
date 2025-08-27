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

  if (variant === 'glass') {
    return (
      <View style={[baseStyle, style]}>
        <BlurView intensity={20} tint="dark" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 20,
        }} />
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
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
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: 20,
        }} />
        <View style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </View>
      </View>
    );
  }

  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={[baseStyle, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  if (variant === 'elevated') {
    return (
      <View style={[
        baseStyle,
        {
          backgroundColor: '#1a1a2e',
          borderWidth: 1,
          borderColor: '#16213e',
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
      { backgroundColor: '#0f0f23' },
      style
    ]}>
      {children}
    </View>
  );
};