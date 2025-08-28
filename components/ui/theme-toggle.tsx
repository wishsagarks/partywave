import React from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Sun, Moon } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, colors } = useTheme();
  const animatedValue = React.useRef(new Animated.Value(theme === 'dark' ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: theme === 'dark' ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [theme]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F1F5F9', '#334155'],
  });

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.border }]}
      onPress={toggleTheme}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.track, { backgroundColor }]}>
        <Animated.View 
          style={[
            styles.thumb, 
            { 
              backgroundColor: colors.background,
              transform: [{ translateX }],
              shadowColor: colors.text,
            }
          ]}
        >
          {theme === 'dark' ? (
            <Moon size={16} color={colors.text} />
          ) : (
            <Sun size={16} color={colors.text} />
          )}
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 52,
    height: 32,
    borderRadius: 16,
    padding: 2,
  },
  track: {
    flex: 1,
    borderRadius: 14,
    position: 'relative',
  },
  thumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});