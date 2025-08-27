import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface ModernButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
          textColor: '#FFFFFF',
          shadowColor: '#f093fb',
        };
      case 'secondary':
        return {
          colors: ['#11998e', '#38ef7d'],
          textColor: '#FFFFFF',
          shadowColor: '#11998e',
        };
      case 'ghost':
        return {
          colors: ['transparent', 'transparent'],
          textColor: '#f093fb',
          border: true,
          borderColor: '#f093fb',
        };
      case 'destructive':
        return {
          colors: ['#ff6b6b', '#ee5a52'],
          textColor: '#FFFFFF',
          shadowColor: '#ff6b6b',
        };
      case 'success':
        return {
          colors: ['#4ecdc4', '#44a08d'],
          textColor: '#FFFFFF',
          shadowColor: '#4ecdc4',
        };
      default:
        return {
          colors: ['#a8edea', '#fed6e3'],
          textColor: '#FFFFFF',
          shadowColor: '#a8edea',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: 12, fontSize: 14, borderRadius: 12, minHeight: 40 };
      case 'lg':
        return { padding: 20, fontSize: 18, borderRadius: 16, minHeight: 56 };
      case 'xl':
        return { padding: 24, fontSize: 20, borderRadius: 20, minHeight: 64 };
      default:
        return { padding: 16, fontSize: 16, borderRadius: 14, minHeight: 48 };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const buttonContent = (
    <>
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles.textColor} />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={[
            styles.text,
            {
              fontSize: sizeStyles.fontSize,
              color: variantStyles.textColor,
              opacity: disabled ? 0.6 : 1,
            },
            textStyle,
          ]}>
            {children}
          </Text>
        </>
      )}
    </>
  );

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          borderRadius: sizeStyles.borderRadius,
          opacity: disabled ? 0.6 : 1,
          minHeight: sizeStyles.minHeight,
          shadowColor: variantStyles.shadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: disabled ? 0 : 0.3,
          shadowRadius: 12,
          elevation: disabled ? 0 : 6,
        },
        variantStyles.border && {
          borderWidth: 2,
          borderColor: variantStyles.borderColor,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={variantStyles.colors}
        style={[
          styles.gradient,
          {
            padding: sizeStyles.padding,
            borderRadius: sizeStyles.borderRadius,
            minHeight: sizeStyles.minHeight,
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
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});