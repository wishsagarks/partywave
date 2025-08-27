import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Trophy, Users, Zap, Star, Crown, Shield, Target } from 'lucide-react-native';
import { ModernCard } from '@/components/ui/modern-card';
import { ModernButton } from '@/components/ui/modern-button';
import { ModernBadge } from '@/components/ui/modern-badge';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb', '#f5576c']}
        style={styles.backgroundGradient}
      />
      
      {/* Animated background elements */}
      <View style={styles.backgroundElements}>
        {[...Array(15)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.floatingElement,
              {
                left: Math.random() * width,
                top: Math.random() * height,
                animationDelay: `${Math.random() * 5}s`,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <ModernCard variant="glass" style={styles.heroCard}>
              <View style={styles.heroContent}>
                <Text style={styles.gameIcon}>🎭</Text>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>UNDERCOVER</Text>
                  <Text style={styles.subtitle}>Social Deduction Masterpiece</Text>
                </View>
                <ModernBadge variant="success" gradient size="md">
                  🟢 Ready to Play
                </ModernBadge>
              </View>
            </ModernCard>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsSection}>
            <View style={styles.statsGrid}>
              <ModernCard variant="elevated" style={styles.statCard}>
                <Users size={24} color="#667eea" />
                <Text style={styles.statNumber}>3-20</Text>
                <Text style={styles.statLabel}>Players</Text>
              </ModernCard>
              
              <ModernCard variant="elevated" style={styles.statCard}>
                <Target size={24} color="#38a169" />
                <Text style={styles.statNumber}>5-15</Text>
                <Text style={styles.statLabel}>Minutes</Text>
              </ModernCard>
              
              <ModernCard variant="elevated" style={styles.statCard}>
                <Crown size={24} color="#d69e2e" />
                <Text style={styles.statNumber}>∞</Text>
                <Text style={styles.statLabel}>Rounds</Text>
              </ModernCard>
            </View>
          </View>

          {/* Main Actions */}
          <View style={styles.actionSection}>
            <ModernButton
              variant="primary"
              size="xl"
              onPress={() => router.push('/game')}
              style={styles.primaryButton}
              icon={<Play size={24} color="white" />}
            >
              Start New Game
            </ModernButton>

            <View style={styles.secondaryActions}>
              <ModernButton
                variant="secondary"
                size="lg"
                onPress={() => router.push('/leaderboard')}
                style={styles.secondaryButton}
                icon={<Trophy size={20} color="#d69e2e" />}
              >
                Leaderboard
              </ModernButton>
              
              <ModernButton
                variant="ghost"
                size="lg"
                onPress={() => router.push('/word-libraries')}
                style={styles.secondaryButton}
                icon={<Zap size={20} color="#667eea" />}
              >
                Word Packs
              </ModernButton>
            </View>
          </View>

          {/* Game Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Why You'll Love It</Text>
            <View style={styles.featuresGrid}>
              <ModernCard variant="glass" style={styles.featureCard}>
                <Shield size={28} color="#667eea" />
                <Text style={styles.featureTitle}>Pass & Play</Text>
                <Text style={styles.featureDescription}>
                  One device for everyone. No downloads required.
                </Text>
              </ModernCard>
              
              <ModernCard variant="glass" style={styles.featureCard}>
                <Star size={28} color="#38a169" />
                <Text style={styles.featureTitle}>Special Roles</Text>
                <Text style={styles.featureDescription}>
                  Add chaos with unique abilities and powers.
                </Text>
              </ModernCard>
              
              <ModernCard variant="glass" style={styles.featureCard}>
                <Target size={28} color="#e53e3e" />
                <Text style={styles.featureTitle}>Mind Games</Text>
                <Text style={styles.featureDescription}>
                  Bluff, deduce, and outsmart your friends.
                </Text>
              </ModernCard>
            </View>
          </View>

          {/* How to Play */}
          <ModernCard variant="gradient" style={styles.howToPlayCard}>
            <Text style={styles.howToPlayTitle}>How to Play</Text>
            <Text style={styles.howToPlayDescription}>
              Master the art of deception in this thrilling social game where words are weapons 
              and trust is a luxury you can't afford.
            </Text>
            
            <View style={styles.gameSteps}>
              <View style={styles.step}>
                <ModernBadge variant="primary" gradient size="lg">1</ModernBadge>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Get Your Secret Word</Text>
                  <Text style={styles.stepDescription}>
                    Receive your hidden word - but beware, some players have different words!
                  </Text>
                </View>
              </View>
              
              <View style={styles.step}>
                <ModernBadge variant="warning" gradient size="lg">2</ModernBadge>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Describe Cleverly</Text>
                  <Text style={styles.stepDescription}>
                    Give clues without revealing your word. Stay subtle, stay alive.
                  </Text>
                </View>
              </View>
              
              <View style={styles.step}>
                <ModernBadge variant="destructive" gradient size="lg">3</ModernBadge>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Vote & Eliminate</Text>
                  <Text style={styles.stepDescription}>
                    Discuss suspicions and vote out the impostors hiding among you.
                  </Text>
                </View>
              </View>
            </View>
          </ModernCard>

          {/* Call to Action */}
          <View style={styles.ctaSection}>
            <Text style={styles.ctaTitle}>Ready for the Ultimate Mind Game?</Text>
            <ModernButton
              variant="success"
              size="xl"
              onPress={() => router.push('/game')}
              icon={<Play size={24} color="white" />}
            >
              Start Playing Now
            </ModernButton>
          </View>
        </View>
      </ScrollView>
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
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingElement: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 3,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  heroSection: {
    marginBottom: 32,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  heroContent: {
    alignItems: 'center',
    gap: 20,
  },
  gameIcon: {
    fontSize: 64,
  },
  titleContainer: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0AEC0',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  statsSection: {
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionSection: {
    marginBottom: 40,
    gap: 20,
  },
  primaryButton: {
    marginBottom: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 16,
  },
  secondaryButton: {
    flex: 1,
  },
  featuresSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#A0AEC0',
    textAlign: 'center',
    lineHeight: 20,
  },
  howToPlayCard: {
    padding: 32,
    marginBottom: 40,
  },
  howToPlayTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  howToPlayDescription: {
    fontSize: 16,
    color: '#E2E8F0',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  gameSteps: {
    gap: 24,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  stepContent: {
    flex: 1,
    gap: 8,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepDescription: {
    fontSize: 14,
    color: '#CBD5E0',
    lineHeight: 20,
  },
  ctaSection: {
    alignItems: 'center',
    gap: 20,
    paddingBottom: 40,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});