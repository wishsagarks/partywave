import React from 'react';
import { View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'glass' | 'gradient';
  className?: string;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  variant = 'default',
  className 
}) => {
  const baseStyle = {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  };

  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']}
        style={[baseStyle, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  if (variant === 'glass') {
    return (
      <View style={[
        baseStyle,
        {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
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
      { backgroundColor: '#374151' },
      style
    ]}>
      {children}
    </View>
  );
};