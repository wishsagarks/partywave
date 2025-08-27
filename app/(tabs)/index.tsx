import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Play, Users, Trophy, WifiOff } from 'lucide-react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0C29', '#24243e', '#302B63']}
        style={styles.backgroundGradient}
      />
      <BlurView intensity={5} tint="dark" style={styles.backgroundBlur}>
        <View style={styles.header}>
          <GlassCard style={styles.titleCard} intensity={15}>
            <Text style={styles.title}>🎭 UNDERCOVER</Text>
            <Text style={styles.subtitle}>Word Party Game</Text>
          </GlassCard>
          
          <GlassCard style={styles.statusCard} intensity={10}>
            <WifiOff size={16} color="#10B981" />
            <Text style={styles.offlineText}>Offline Mode</Text>
          </GlassCard>
        </View>

        <View style={styles.menuContainer}>
          <GlassButton
            title="Start New Game"
            onPress={() => router.push('/game')}
            variant="primary"
            size="large"
            icon={<Play size={24} color="white" />}
            style={styles.primaryButton}
          />

          <GlassButton
            title="Leaderboard"
            onPress={() => router.push('/leaderboard')}
            variant="secondary"
            size="medium"
            icon={<Trophy size={20} color="#F59E0B" />}
            style={styles.secondaryButton}
          />
        </View>

        <View style={styles.gameInfo}>
          <GlassCard style={styles.infoCard} intensity={12}>
            <Users size={16} color="#8B5CF6" />
            <Text style={styles.infoText}>3-20 Players</Text>
          </GlassCard>
          <GlassCard style={styles.infoCard} intensity={12}>
            <Text style={styles.infoEmoji}>🔄</Text>
            <Text style={styles.infoText}>Pass & Play</Text>
          </GlassCard>
          <GlassCard style={styles.infoCard} intensity={12}>
            <Text style={styles.infoEmoji}>🕵️</Text>
            <Text style={styles.infoText}>Social Deduction</Text>
          </GlassCard>
        </View>

        <GlassCard style={styles.descriptionCard} intensity={8}>
          <Text style={styles.howToPlay}>
            Get secret words, describe them cleverly, discuss suspicions, vote to eliminate impostors!
          </Text>
        </GlassCard>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundBlur: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    gap: 16,
  },
  titleCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 32,
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#F3F4F6',
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#D1D5DB',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  offlineText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 40,
    gap: 16,
  },
  primaryButton: {
    marginBottom: 8,
  },
  secondaryButton: {
    // Additional styling if needed
  },
  gameInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 20,
    gap: 8,
  },
  infoCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  infoEmoji: {
    fontSize: 16,
  },
  infoText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  descriptionCard: {
    marginTop: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  howToPlay: {
    textAlign: 'center',
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});