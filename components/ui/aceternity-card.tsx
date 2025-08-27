import React from 'react';
import { View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/hooks/useTheme';

interface AceternityCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'glass' | 'gradient' | 'spotlight' | 'border';
  className?: string;
}

export const AceternityCard: React.FC<AceternityCardProps> = ({ 
  children, 
  style, 
  variant = 'default',
  className 
}) => {
  const { theme, colors } = useTheme();

  const baseStyle = {
    borderRadius: 20,
    padding: 24,
    shadowColor: theme === 'dark' ? '#000' : '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
    shadowRadius: 24,
    elevation: 8,
  };

  if (variant === 'glass') {
    return (
      <View style={[baseStyle, style]}>
        <BlurView 
          intensity={theme === 'dark' ? 30 : 20} 
          tint={theme === 'dark' ? 'dark' : 'light'} 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 20,
          }} 
        />
        <LinearGradient
          colors={theme === 'dark' 
            ? ['rgba(30, 41, 59, 0.8)', 'rgba(15, 23, 42, 0.9)']
            : ['rgba(248, 250, 252, 0.8)', 'rgba(241, 245, 249, 0.9)']
          }
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
          borderColor: theme === 'dark' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(203, 213, 225, 0.3)',
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
        colors={theme === 'dark'
          ? ['#1E293B', '#334155', '#475569']
          : ['#F1F5F9', '#E2E8F0', '#CBD5E1']
        }
        style={[baseStyle, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  if (variant === 'spotlight') {
    return (
      <View style={[
        baseStyle,
        {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          position: 'relative',
          overflow: 'hidden',
        },
        style
      ]}>
        <LinearGradient
          colors={theme === 'dark'
            ? ['rgba(96, 165, 250, 0.1)', 'transparent', 'rgba(139, 92, 246, 0.1)']
            : ['rgba(59, 130, 246, 0.1)', 'transparent', 'rgba(139, 92, 246, 0.1)']
          }
          style={{
            position: 'absolute',
            top: -50,
            left: -50,
            right: -50,
            height: 100,
            transform: [{ rotate: '45deg' }],
          }}
        />
        {children}
      </View>
    );
  }

  if (variant === 'border') {
    return (
      <View style={[
        baseStyle,
        {
          backgroundColor: colors.surface,
          borderWidth: 2,
          borderColor: colors.primary,
          shadowColor: colors.primary,
          shadowOpacity: 0.2,
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
      { backgroundColor: colors.surface },
      style
    ]}>
      {children}
    </View>
  );
};