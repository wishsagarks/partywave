import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ModernInputProps extends TextInputProps {
  label?: string;
  error?: string;
  variant?: 'default' | 'glass' | 'minimal';
  containerStyle?: ViewStyle;
}

export const ModernInput: React.FC<ModernInputProps> = ({
  label,
  error,
  variant = 'default',
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getInputStyle = () => {
    const baseStyle = {
      borderRadius: 16,
      padding: 16,
      fontSize: 16,
      color: '#E2E8F0',
      minHeight: 56,
    };

    if (variant === 'glass') {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(15, 15, 35, 0.8)',
        borderWidth: 1,
        borderColor: isFocused ? '#667eea' : 'rgba(102, 126, 234, 0.3)',
      };
    }

    if (variant === 'minimal') {
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        borderBottomWidth: 2,
        borderBottomColor: isFocused ? '#667eea' : 'rgba(102, 126, 234, 0.5)',
        borderRadius: 0,
        paddingHorizontal: 0,
      };
    }

    return {
      ...baseStyle,
      backgroundColor: 'rgba(15, 15, 35, 0.9)',
      borderWidth: 2,
      borderColor: error ? '#ff6b6b' : (isFocused ? '#667eea' : 'rgba(102, 126, 234, 0.4)'),
    };
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[
          styles.label,
          { color: isFocused ? '#667eea' : '#a0aec0' }
        ]}>
          {label}
        </Text>
      )}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            getInputStyle(),
            style,
          ]}
          placeholderTextColor="#4a5568"
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {isFocused && variant !== 'minimal' && (
          <LinearGradient
            colors={['rgba(102, 126, 234, 0.2)', 'rgba(118, 75, 162, 0.1)']}
            style={styles.focusGradient}
          />
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  inputContainer: {
    position: 'relative',
  },
  focusGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    opacity: 0.1,
    pointerEvents: 'none',
  },
  error: {
    fontSize: 12,
    color: '#e53e3e',
    marginTop: 6,
    fontWeight: '500',
  },
});