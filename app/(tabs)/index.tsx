import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Trophy, Users, Zap, Star, Crown, Shield, Target, Settings } from 'lucide-react-native';
import { AceternityCard } from '@/components/ui/aceternity-card';
import { AceternityButton } from '@/components/ui/aceternity-button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTheme } from '@/hooks/useTheme';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const { theme, colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={theme === 'dark' 
          ? ['#0F172A', '#1E293B', '#334155', '#475569']
          : ['#F8FAFC', '#F1F5F9', '#E2E8F0', '#CBD5E1']
        }
        style={styles.backgroundGradient}
      />
      
      {/* Animated background elements */}
      <View style={styles.backgroundElements}>
        {[...Array(20)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.floatingElement,
              {
                left: Math.random() * width,
                top: Math.random() * height,
                backgroundColor: theme === 'dark' 
                  ? 'rgba(96, 165, 250, 0.3)' 
                  : 'rgba(59, 130, 246, 0.2)',
              },
            ]}
          />
        ))}
      </View>

      {/* Header with Theme Toggle */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>UNDERCOVER</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Social Deduction Game</Text>
        </View>
        <ThemeToggle />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <AceternityCard variant="glass" style={styles.heroCard}>
              <View style={styles.heroContent}>
                <Text style={styles.gameIcon}>🎭</Text>
                <View style={styles.titleContainer}>
                  <Text style={[styles.title, { color: colors.text }]}>Ready to Play?</Text>
                  <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Master the art of deception in this thrilling social game
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                  <Text style={[styles.statusText, { color: colors.success }]}>Online & Ready</Text>
                </View>
              </View>
            </AceternityCard>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsSection}>
            <View style={styles.statsGrid}>
              <AceternityCard variant="spotlight" style={styles.statCard}>
                <Users size={24} color={colors.primary} />
                <Text style={[styles.statNumber, { color: colors.text }]}>3-20</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Players</Text>
              </AceternityCard>
              
              <AceternityCard variant="spotlight" style={styles.statCard}>
                <Target size={24} color={colors.success} />
                <Text style={[styles.statNumber, { color: colors.text }]}>5-15</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Minutes</Text>
              </AceternityCard>
              
              <AceternityCard variant="spotlight" style={styles.statCard}>
                <Crown size={24} color={colors.warning} />
                <Text style={[styles.statNumber, { color: colors.text }]}>∞</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rounds</Text>
              </AceternityCard>
            </View>
          </View>

          {/* Main Actions */}
          <View style={styles.actionSection}>
            <AceternityButton
              variant="shimmer"
              size="xl"
              onPress={() => router.push('/game')}
              style={styles.primaryButton}
              icon={<Play size={24} color="white" />}
            >
              Start New Game
            </AceternityButton>

            <View style={styles.secondaryActions}>
              <AceternityButton
                variant="glow"
                size="lg"
                onPress={() => router.push('/leaderboard')}
                style={styles.secondaryButton}
                icon={<Trophy size={20} color="white" />}
              >
                Leaderboard
              </AceternityButton>
              
              <AceternityButton
                variant="outline"
                size="lg"
                onPress={() => router.push('/word-libraries')}
                style={styles.secondaryButton}
                icon={<Zap size={20} color={colors.primary} />}
              >
                Word Packs
              </AceternityButton>
            </View>
          </View>

          {/* Game Features */}
          <View style={styles.featuresSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Why You'll Love It</Text>
            <View style={styles.featuresGrid}>
              <AceternityCard variant="border" style={styles.featureCard}>
                <Shield size={28} color={colors.primary} />
                <Text style={[styles.featureTitle, { color: colors.text }]}>Pass & Play</Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                  One device for everyone. No downloads required.
                </Text>
              </AceternityCard>
              
              <AceternityCard variant="border" style={styles.featureCard}>
                <Star size={28} color={colors.success} />
                <Text style={[styles.featureTitle, { color: colors.text }]}>Special Roles</Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                  Add chaos with unique abilities and powers.
                </Text>
              </AceternityCard>
              
              <AceternityCard variant="border" style={styles.featureCard}>
                <Target size={28} color={colors.error} />
                <Text style={[styles.featureTitle, { color: colors.text }]}>Mind Games</Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                  Bluff, deduce, and outsmart your friends.
                </Text>
              </AceternityCard>
            </View>
          </View>

          {/* How to Play */}
          <AceternityCard variant="gradient" style={styles.howToPlayCard}>
            <Text style={[styles.howToPlayTitle, { color: colors.text }]}>How to Play</Text>
            <Text style={[styles.howToPlayDescription, { color: colors.textSecondary }]}>
              Master the art of deception in this thrilling social game where words are weapons 
              and trust is a luxury you can't afford.
            </Text>
            
            <View style={styles.gameSteps}>
              <View style={styles.step}>
                <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumber}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>Get Your Secret Word</Text>
                  <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                    Receive your hidden word - but beware, some players have different words!
                  </Text>
                </View>
              </View>
              
              <View style={styles.step}>
                <View style={[styles.stepBadge, { backgroundColor: colors.warning }]}>
                  <Text style={styles.stepNumber}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>Describe Cleverly</Text>
                  <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                    Give clues without revealing your word. Stay subtle, stay alive.
                  </Text>
                </View>
              </View>
              
              <View style={styles.step}>
                <View style={[styles.stepBadge, { backgroundColor: colors.error }]}>
                  <Text style={styles.stepNumber}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>Vote & Eliminate</Text>
                  <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                    Discuss suspicions and vote out the impostors hiding among you.
                  </Text>
                </View>
              </View>
            </View>
          </AceternityCard>

          {/* Call to Action */}
          <View style={styles.ctaSection}>
            <Text style={[styles.ctaTitle, { color: colors.text }]}>Ready for the Ultimate Mind Game?</Text>
            <AceternityButton
              variant="glow"
              size="xl"
              onPress={() => router.push('/game')}
              icon={<Play size={24} color="white" />}
            >
              Start Playing Now
            </AceternityButton>
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
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 24,
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
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
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
  },
  statLabel: {
    fontSize: 12,
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
    marginBottom: 24,
    textAlign: 'center',
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
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
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
    marginBottom: 16,
    textAlign: 'center',
  },
  howToPlayDescription: {
    fontSize: 16,
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
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
    gap: 8,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepDescription: {
    fontSize: 14,
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
    textAlign: 'center',
  },
});