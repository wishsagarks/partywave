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
          gradient: ['rgba(139, 69, 255, 0.15)', 'rgba(255, 107, 107, 0.1)'],
          border: 'rgba(255, 154, 158, 0.3)',
        };
      case 'gradient':
        return {
          gradient: ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
          border: 'transparent',
        };
      case 'elevated':
        return {
          gradient: ['#2D1B69', '#11998e'],
          border: '#38ef7d',
        };
      default:
        return {
          gradient: ['#667eea', '#764ba2'],
          border: 'transparent',
        };
    }
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