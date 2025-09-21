// @/components/ui/modern-badge.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
  TouchableOpacity,
  Platform,
} from 'react-native';

type Variant = 'primary' | 'secondary' | 'warning' | 'destructive' | 'info' | 'success' | 'elevated';

interface ModernBadgeProps {
  children?: React.ReactNode;
  variant?: Variant;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  gradient?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  onPress?: (e: GestureResponderEvent) => void;
  left?: React.ReactNode;
  right?: React.ReactNode;
  accessibilityLabel?: string;
}

/**
 * Named export AND default export so both import styles work.
 */
export function ModernBadge({
  children,
  variant = 'primary',
  size = 'md',
  gradient = false,
  style,
  textStyle,
  onPress,
  left,
  right,
  accessibilityLabel,
}: ModernBadgeProps) {
  const containerStyles = [
    styles.base,
    variantStyles[variant] || variantStyles.primary,
    sizeStyles[size] || sizeStyles.md,
    gradient ? styles.gradientOverlay : null,
    style,
  ];

  const textStyles = [styles.textBase, sizeTextStyles[size] || sizeTextStyles.md, textStyle];

  // Helper: render a child. Wrap strings/numbers in <Text>.
  const renderChild = (child: React.ReactNode, key?: number | string) => {
    if (child === null || child === undefined) return null;

    if (typeof child === 'string' || typeof child === 'number') {
      return (
        <Text key={String(key ?? child)} style={textStyles} selectable={false}>
          {String(child)}
        </Text>
      );
    }

    if (Array.isArray(child)) {
      return child.map((c, i) => renderChild(c, `${String(key ?? 'arr')}-${i}`));
    }

    if (React.isValidElement(child)) {
      // Build a safe key without mixing ?? and || in one expression
      const childKey =
        (key !== null && key !== undefined)
          ? String(key)
          : (child.props && child.props.testID)
            ? String(child.props.testID)
            : Math.random().toString();

      return React.cloneElement(child, { key: childKey });
    }

    // Fallback: stringify anything unexpected
    return (
      <Text key={String(key ?? 'fallback')} style={textStyles}>
        {String(child)}
      </Text>
    );
  };

  const content = (
    <>
      {left && <View style={styles.iconWrapper}>{renderChild(left, 'left')}</View>}
      <View style={styles.childrenWrapper}>{renderChild(children, 'children')}</View>
      {right && <View style={styles.iconWrapper}>{renderChild(right, 'right')}</View>}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={containerStyles as ViewStyle}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View accessibilityLabel={accessibilityLabel} style={containerStyles as ViewStyle}>
      {content}
    </View>
  );
}

/* Default export for compatibility */
export default ModernBadge;

/* ----------------------------- Styles ------------------------------ */

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'android' ? 4 : 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
    minHeight: 28,
  },
  gradientOverlay: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  textBase: {
    color: '#FFFFFF',
    fontWeight: '600',
    includeFontPadding: false,
  },
  iconWrapper: {
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childrenWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

/* Variants */
const variantStyles: Record<Variant, ViewStyle> = {
  primary: {
    backgroundColor: '#667eea',
  },
  secondary: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  warning: {
    backgroundColor: '#d69e2e',
  },
  destructive: {
    backgroundColor: '#e53e3e',
  },
  info: {
    backgroundColor: '#4a90e2',
  },
  success: {
    backgroundColor: '#38a169',
  },
  elevated: {
    backgroundColor: '#2d3748',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
};

const sizeStyles: Record<NonNullable<ModernBadgeProps['size']>, ViewStyle> = {
  xs: { paddingHorizontal: 6, paddingVertical: 2, minHeight: 20 },
  sm: { paddingHorizontal: 8, paddingVertical: 4, minHeight: 24 },
  md: { paddingHorizontal: 10, paddingVertical: 6, minHeight: 28 },
  lg: { paddingHorizontal: 12, paddingVertical: 8, minHeight: 36 },
};

const sizeTextStyles: Record<NonNullable<ModernBadgeProps['size']>, TextStyle> = {
  xs: { fontSize: 10 },
  sm: { fontSize: 12 },
  md: { fontSize: 13 },
  lg: { fontSize: 15 },
};
