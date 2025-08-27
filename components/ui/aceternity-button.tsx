import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';

interface AceternityButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'default' | 'shimmer' | 'glow' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const AceternityButton: React.FC<AceternityButtonProps> = ({
  children,
  onPress,
  variant = 'default',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const { theme, colors } = useTheme();

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

  const getVariantStyles = () => {
    switch (variant) {
      case 'shimmer':
        return {
          colors: theme === 'dark' 
            ? ['#60A5FA', '#818CF8', '#A78BFA']
            : ['#3B82F6', '#6366F1', '#8B5CF6'],
          textColor: '#FFFFFF',
          shadowColor: colors.primary,
        };
      case 'glow':
        return {
          colors: theme === 'dark'
            ? ['#10B981', '#34D399', '#6EE7B7']
            : ['#059669', '#10B981', '#34D399'],
          textColor: '#FFFFFF',
          shadowColor: colors.success,
        };
      case 'outline':
        return {
          colors: ['transparent', 'transparent'],
          textColor: colors.primary,
          border: true,
          borderColor: colors.primary,
        };
      case 'ghost':
        return {
          colors: ['transparent', 'transparent'],
          textColor: colors.text,
          border: false,
        };
      case 'destructive':
        return {
          colors: theme === 'dark'
            ? ['#F87171', '#EF4444', '#DC2626']
            : ['#EF4444', '#DC2626', '#B91C1C'],
          textColor: '#FFFFFF',
          shadowColor: colors.error,
        };
      default:
        return {
          colors: theme === 'dark'
            ? ['#334155', '#475569', '#64748B']
            : ['#F1F5F9', '#E2E8F0', '#CBD5E1'],
          textColor: colors.text,
          shadowColor: colors.primary,
        };
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
          shadowOpacity: disabled ? 0 : (variant === 'glow' ? 0.4 : 0.2),
          shadowRadius: variant === 'glow' ? 16 : 8,
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
  },
});