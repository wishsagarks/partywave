import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Trophy, Users, Zap, Star } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0C29', '#24243e', '#302B63', '#8B5CF6']}
        style={styles.backgroundGradient}
      />
      
      {/* Floating particles effect */}
      <View style={styles.particlesContainer}>
        {[...Array(20)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.particle,
              {
                left: Math.random() * width,
                top: Math.random() * height,
                animationDelay: `${Math.random() * 5}s`,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <Card variant="glass" style={styles.titleCard}>
            <View style={styles.titleContainer}>
              <Text style={styles.gameIcon}>🎭</Text>
              <View>
                <Text style={styles.title}>UNDERCOVER</Text>
                <Text style={styles.subtitle}>Social Deduction Game</Text>
              </View>
            </View>
            
            <View style={styles.statusContainer}>
              <Badge variant="success">
                <Text style={styles.statusText}>🟢 Ready to Play</Text>
              </Badge>
            </View>
          </Card>
        </View>

        {/* Main Action Buttons */}
        <View style={styles.actionSection}>
          <Button
            variant="primary"
            size="lg"
            onPress={() => router.push('/game')}
            style={styles.primaryButton}
            icon={<Play size={24} color="white" />}
          >
            Start New Game
          </Button>

          <View style={styles.secondaryActions}>
            <Button
              variant="secondary"
              size="md"
              onPress={() => router.push('/leaderboard')}
              style={styles.secondaryButton}
              icon={<Trophy size={20} color="#F59E0B" />}
            >
              Leaderboard
            </Button>
            
            <Button
              variant="ghost"
              size="md"
              onPress={() => router.push('/word-libraries')}
              style={styles.secondaryButton}
              icon={<Zap size={20} color="#8B5CF6" />}
            >
              Word Packs
            </Button>
          </View>
        </View>

        {/* Game Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Game Features</Text>
          <View style={styles.featuresGrid}>
            <Card variant="gradient" style={styles.featureCard}>
              <Users size={24} color="#8B5CF6" />
              <Text style={styles.featureTitle}>3-20 Players</Text>
              <Text style={styles.featureDescription}>Perfect for any group size</Text>
            </Card>
            
            <Card variant="gradient" style={styles.featureCard}>
              <Star size={24} color="#F59E0B" />
              <Text style={styles.featureTitle}>Pass & Play</Text>
              <Text style={styles.featureDescription}>One device for everyone</Text>
            </Card>
            
            <Card variant="gradient" style={styles.featureCard}>
              <Zap size={24} color="#10B981" />
              <Text style={styles.featureTitle}>Special Roles</Text>
              <Text style={styles.featureDescription}>Add chaos and strategy</Text>
            </Card>
          </View>
        </View>

        {/* How to Play */}
        <Card variant="glass" style={styles.howToPlayCard}>
          <Text style={styles.howToPlayTitle}>How to Play</Text>
          <Text style={styles.howToPlayText}>
            Get secret words, describe them cleverly without saying them directly. 
            Discuss suspicions, vote to eliminate impostors, and discover who's the undercover agent!
          </Text>
          <View style={styles.gameSteps}>
            <View style={styles.step}>
              <Badge variant="primary">1</Badge>
              <Text style={styles.stepText}>Get your secret word</Text>
            </View>
            <View style={styles.step}>
              <Badge variant="primary">2</Badge>
              <Text style={styles.stepText}>Describe without revealing</Text>
            </View>
            <View style={styles.step}>
              <Badge variant="primary">3</Badge>
              <Text style={styles.stepText}>Vote to eliminate suspects</Text>
            </View>
          </View>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  titleCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  gameIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#D1D5DB',
    fontStyle: 'italic',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionSection: {
    marginBottom: 32,
    gap: 16,
  },
  primaryButton: {
    marginBottom: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
  },
  featuresSection: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    color: '#D1D5DB',
    textAlign: 'center',
  },
  howToPlayCard: {
    padding: 24,
  },
  howToPlayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  howToPlayText: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  gameSteps: {
    gap: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepText: {
    fontSize: 14,
    color: '#F3F4F6',
    flex: 1,
  },
});