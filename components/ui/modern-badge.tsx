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
  // allow passing left/right accessory (icon components) if desired
  left?: React.ReactNode;
  right?: React.ReactNode;
  accessibilityLabel?: string;
}

/**
 * ModernBadge
 *
 * Safe-to-use badge component that never renders raw string children inside a View.
 * - Primitive children (string/number) are wrapped in <Text>
 * - React elements are rendered as-is
 * - Supports basic variants, sizes and optional gradient style
 */
export default function ModernBadge({
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

    // primitives
    if (typeof child === 'string' || typeof child === 'number') {
      return (
        <Text key={String(key ?? child)} style={textStyles} selectable={false}>
          {String(child)}
        </Text>
      );
    }

    // If it's an array (React will pass array items individually here usually)
    if (Array.isArray(child)) {
      return child.map((c, i) => renderChild(c, `${key ?? 'arr'}-${i}`));
    }

    // React element -> render as-is. For safety, clone to ensure it has a key.
    if (React.isValidElement(child)) {
      // Avoid overwriting style prop on icon elements — they may accept color/size props.
  const childKey =
    key ??
    (child.props && child.props.testID) ??
    Math.random().toString();
  
  return React.cloneElement(child, { key: childKey });

    }

    // Fallback: stringify
    return (
      <Text key={String(key ?? 'fallback')} style={textStyles}>
        {String(child)}
      </Text>
    );
  };

  // Compose content: optional left icon, children, optional right icon
  const content = (
    <>
      {left && <View style={styles.iconWrapper}>{renderChild(left, 'left')}</View>}
      <View style={styles.childrenWrapper}>
        {renderChild(children, 'children')}
      </View>
      {right && <View style={styles.iconWrapper}>{renderChild(right, 'right')}</View>}
    </>
  );

  // If an onPress is provided, make it touchable
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
    // No actual gradient here (avoid extra libs). Subtle elevated look for gradient flag.
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

/* Size variations */
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
