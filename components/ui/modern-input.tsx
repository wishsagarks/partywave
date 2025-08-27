import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ModernInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  variant?: 'default' | 'glass' | 'minimal';
}

export const ModernInput: React.FC<ModernInputProps> = ({
  label,
  error,
  containerStyle,
  variant = 'default',
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
        backgroundColor: 'rgba(139, 69, 255, 0.1)',
        borderWidth: 1,
        borderColor: isFocused ? '#f093fb' : 'rgba(255, 154, 158, 0.3)',
      };
    }

    if (variant === 'minimal') {
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        borderBottomWidth: 2,
        borderBottomColor: isFocused ? '#f093fb' : '#11998e',
        borderRadius: 0,
        paddingHorizontal: 0,
      };
    }

    return {
      ...baseStyle,
      backgroundColor: 'rgba(45, 27, 105, 0.8)',
      borderWidth: 2,
      borderColor: error ? '#ff6b6b' : (isFocused ? '#f093fb' : '#11998e'),
    };
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[
          styles.label,
          { color: isFocused ? '#f093fb' : '#d299c2' }
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
          placeholderTextColor="#718096"
          onFocus={handleFocus}
          colors={['#f093fb', '#f5576c']}
          {...props}
        />
        {isFocused && variant !== 'minimal' && (
          <LinearGradient
            colors={['#667eea', '#764ba2']}
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