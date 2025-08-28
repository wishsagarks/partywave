import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'default',
  size = 'md',
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          colors: ['#8B5CF6', '#7C3AED'],
          textColor: '#FFFFFF',
        };
      case 'secondary':
        return {
          colors: ['#374151', '#4B5563'],
          textColor: '#F3F4F6',
        };
      case 'ghost':
        return {
          colors: ['transparent', 'transparent'],
          textColor: '#8B5CF6',
          border: true,
        };
      case 'destructive':
        return {
          colors: ['#EF4444', '#DC2626'],
          textColor: '#FFFFFF',
        };
      default:
        return {
          colors: ['#6B7280', '#9CA3AF'],
          textColor: '#FFFFFF',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: 12, fontSize: 14, borderRadius: 8 };
      case 'lg':
        return { padding: 20, fontSize: 18, borderRadius: 12 };
      default:
        return { padding: 16, fontSize: 16, borderRadius: 10 };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const buttonContent = (
    <>
      {icon && <>{icon}</>}
      <Text style={[
        styles.text,
        {
          fontSize: sizeStyles.fontSize,
          color: variantStyles.textColor,
          opacity: disabled ? 0.5 : 1,
        },
        textStyle,
      ]}>
        {children}
      </Text>
    </>
  );

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          borderRadius: sizeStyles.borderRadius,
          opacity: disabled ? 0.5 : 1,
        },
        variantStyles.border && {
          borderWidth: 1,
          borderColor: '#8B5CF6',
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={variantStyles.colors}
        style={[
          styles.gradient,
          {
            padding: sizeStyles.padding,
            borderRadius: sizeStyles.borderRadius,
          },
        ]}
      >
        {buttonContent}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});