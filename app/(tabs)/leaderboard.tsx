import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { Trophy, Award, Star, Medal, Calendar, Users, Clock } from 'lucide-react-native';
import { useLeaderboard } from '@/hooks/useGameData';
import { useTheme } from '@/hooks/useTheme';


export default function LeaderboardScreen() {
  const { colors } = useTheme();
  const { topPlayers, recentGames, loading, error } = useLeaderboard();
  const [sortBy, setSortBy] = useState<'points' | 'recent'>('points');


  const getRoleColor = (role: string) => {
    switch (role) {
      case 'civilian': return '#10B981';
      case 'undercover': return '#EF4444';
      case 'mrwhite': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'civilian': return 'Civilian';
      case 'undercover': return 'Undercover';
      case 'mrwhite': return 'Mr. White';
      default: return 'Unknown';
    }
  };

  const getRoleEmoji = (role: string) => {
    switch (role) {
      case 'civilian': return '👥';
      case 'undercover': return '🕵️';
      case 'mrwhite': return '❓';
      default: return '❓';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy size={20} color="#F59E0B" />;
      case 1: return <Medal size={20} color="#D1D5DB" />;
      case 2: return <Award size={20} color="#CD7F32" />;
      default: return <Star size={16} color="#6B7280" />;
    }
  };

  const getWinRate = (player: any) => {
    if (player.games_played === 0) return 0;
    return Math.round((player.games_won / player.games_played) * 100);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading leaderboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>🏆 Leaderboard</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Hall of Fame</Text>
      </View>

      <View style={styles.sortButtons}>
        <TouchableOpacity
          style={[
            styles.sortButton, 
            { backgroundColor: colors.surface },
            sortBy === 'points' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setSortBy('points')}
        >
          <Text style={[
            styles.sortButtonText, 
            { color: colors.textSecondary },
            sortBy === 'points' && { color: '#FFFFFF' }
          ]}>
            Top Players
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.sortButton, 
            { backgroundColor: colors.surface },
            sortBy === 'recent' && { backgroundColor: colors.primary }
          ]}
          onPress={() => setSortBy('recent')}
        >
          <Text style={[
            styles.sortButtonText, 
            { color: colors.textSecondary },
            sortBy === 'recent' && { color: '#FFFFFF' }
          ]}>
            Recent Games
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {sortBy === 'points' ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Overall Rankings</Text>
            {topPlayers.map((player, index) => (
              <View key={player.id} style={[styles.rankCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.rankInfo}>
                  <View style={styles.rankIconContainer}>
                    {getRankIcon(index)}
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={[styles.playerName, { color: colors.text }]}>#{index + 1} {player.name}</Text>
                    <Text style={[styles.totalPoints, { color: colors.warning }]}>{player.total_points} points</Text>
                    <View style={styles.playerStats}>
                      <Text style={[styles.statText, { color: colors.textSecondary }]}>
                        {player.games_played} games • {getWinRate(player)}% win rate
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Game Results</Text>
            {recentGames.map((game) => (
              <View key={game.id} style={[styles.gameCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.scoreHeader}>
                  <Text style={[styles.gameName, { color: colors.text }]}>{game.game_name || 'Unnamed Game'}</Text>
                  <View style={styles.gameInfo}>
                    <Users size={16} color={colors.primary} />
                    <Text style={[styles.gamePlayerCount, { color: colors.primary }]}>{game.player_count} players</Text>
                  </View>
                  <Text style={[styles.scoreDate, { color: colors.textSecondary }]}>{formatDate(game.completed_at)}</Text>
                </View>
                
                <View style={styles.scoreDetails}>
                  <Text style={[styles.winnerText, { color: colors.warning }]}>
                    🏆 {game.winner_role} Victory
                  </Text>
                  <View style={styles.gameDuration}>
                    <Clock size={12} color={colors.textSecondary} />
                    <Text style={[styles.durationText, { color: colors.textSecondary }]}>
                      {game.duration_minutes || 0}min • {game.total_rounds} rounds
                    </Text>
                  </View>
                </View>
                
                {game.word_pair_used && (
                  <View style={[styles.wordPairUsed, { backgroundColor: colors.background }]}>
                    <Text style={[styles.wordPairText, { color: colors.text }]}>
                      Words: {game.word_pair_used.civilian} vs {game.word_pair_used.undercover}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        {(sortBy === 'points' ? topPlayers : recentGames).length === 0 && (
          <View style={styles.emptyState}>
            <Trophy size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyStateTitle, { color: colors.textSecondary }]}>No Games Played Yet</Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              Start playing games to see scores and rankings here!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  sortButtons: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 4,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  rankCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  rankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  playerInfo: {
    flex: 1,
  },
  playerStats: {
    marginTop: 4,
  },
  statText: {
    fontSize: 12,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  totalPoints: {
    fontSize: 14,
    fontWeight: '600',
  },
  gameCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  scoreHeader: {
    gap: 8,
    marginBottom: 8,
  },
  gameName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gameInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gamePlayerCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreDate: {
    fontSize: 12,
  },
  scoreDetails: {
    gap: 8,
    marginBottom: 8,
  },
  winnerText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  gameDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
  },
  wordPairUsed: {
    padding: 8,
    borderRadius: 6,
  },
  wordPairText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
});