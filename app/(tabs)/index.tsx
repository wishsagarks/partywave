import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Users, BookOpen, Trophy } from 'lucide-react-native';

export default function HomeScreen() {
  return (
    <LinearGradient
      colors={['#1F2937', '#111827']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>🎭 UNDERCOVER</Text>
        <Text style={styles.subtitle}>Word Party Game</Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity 
          style={[styles.menuButton, styles.primaryButton]}
          onPress={() => router.push('/game')}
        >
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.buttonGradient}
          >
            <Play size={24} color="white" />
            <Text style={styles.primaryButtonText}>Start New Game</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => router.push('/leaderboard')}
        >
          <Trophy size={20} color="#F59E0B" />
          <Text style={styles.buttonText}>Leaderboard</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => router.push('/settings')}
        >
          <BookOpen size={20} color="#10B981" />
          <Text style={styles.buttonText}>Word Libraries</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.gameInfo}>
        <View style={styles.infoCard}>
          <Users size={16} color="#8B5CF6" />
          <Text style={styles.infoText}>3-20 Players</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoEmoji}>📱</Text>
          <Text style={styles.infoText}>Pass & Play</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoEmoji}>🎯</Text>
          <Text style={styles.infoText}>Social Deduction</Text>
        </View>
      </View>

      <Text style={styles.howToPlay}>
        Describe your secret word, find the impostors, and win through deduction and bluffing!
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F3F4F6',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  menuButton: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  primaryButton: {
    padding: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonText: {
    color: '#F3F4F6',
    fontSize: 16,
    fontWeight: '600',
  },
  gameInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  infoEmoji: {
    fontSize: 16,
  },
  infoText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '500',
  },
  howToPlay: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
});