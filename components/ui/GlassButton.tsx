import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return {
          gradient: ['rgba(139, 92, 246, 0.3)', 'rgba(124, 58, 237, 0.2)'],
          border: 'rgba(139, 92, 246, 0.4)',
          text: '#FFFFFF',
        };
      case 'secondary':
        return {
          gradient: ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)'],
          border: 'rgba(255, 255, 255, 0.2)',
          text: '#F3F4F6',
        };
      case 'danger':
        return {
          gradient: ['rgba(239, 68, 68, 0.3)', 'rgba(220, 38, 38, 0.2)'],
          border: 'rgba(239, 68, 68, 0.4)',
          text: '#FFFFFF',
        };
      default:
        return {
          gradient: ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)'],
          border: 'rgba(255, 255, 255, 0.2)',
          text: '#F3F4F6',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { padding: 12, fontSize: 14, borderRadius: 12 };
      case 'large':
        return { padding: 20, fontSize: 18, borderRadius: 20 };
      default:
        return { padding: 16, fontSize: 16, borderRadius: 16 };
    }
  };

  const colors = getVariantColors();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          borderRadius: sizeStyles.borderRadius,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <BlurView
        intensity={15}
        tint="dark"
        style={[styles.blurContainer, { borderRadius: sizeStyles.borderRadius }]}
      >
        <LinearGradient
          colors={colors.gradient}
          style={[styles.gradient, { borderRadius: sizeStyles.borderRadius }]}
        />
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.1)', 'transparent']}
          style={[styles.highlight, { borderRadius: sizeStyles.borderRadius }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.5 }}
        />
        <LinearGradient
          colors={[colors.border, colors.border]}
          style={[styles.border, { borderRadius: sizeStyles.borderRadius }]}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.1)']}
          style={[styles.innerShadow, { borderRadius: sizeStyles.borderRadius }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.05)',
            'transparent',
            'rgba(0, 0, 0, 0.05)',
          ]}
          style={[styles.content, { padding: sizeStyles.padding }]}
        >
          {icon && <LinearGradient colors={['transparent']} style={styles.icon}>{icon}</LinearGradient>}
          <Text
            style={[
              styles.text,
              {
                fontSize: sizeStyles.fontSize,
                color: colors.text,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </LinearGradient>
      </BlurView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  blurContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
  },
  innerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  icon: {
    // Icon styling if needed
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});