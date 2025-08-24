import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { Trophy, Award, Star, Medal, Calendar, Users, Clock } from 'lucide-react-native';
import { useLeaderboard } from '@/hooks/useGameData';


export default function LeaderboardScreen() {
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
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#1F2937', '#111827']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        <Text style={styles.subtitle}>Hall of Fame</Text>
      </View>

      <View style={styles.sortButtons}>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'points' && styles.activeSortButton]}
          onPress={() => setSortBy('points')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'points' && styles.activeSortButtonText]}>
            Top Players
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'recent' && styles.activeSortButton]}
          onPress={() => setSortBy('recent')}
        >
          <Text style={[styles.sortButtonText, sortBy === 'recent' && styles.activeSortButtonText]}>
            Recent Games
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {sortBy === 'points' ? (
          <>
            <Text style={styles.sectionTitle}>Overall Rankings</Text>
            {topPlayers.map((player, index) => (
              <View key={player.id} style={styles.rankCard}>
                <View style={styles.rankInfo}>
                  <View style={styles.rankIconContainer}>
                    {getRankIcon(index)}
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>#{index + 1} {player.name}</Text>
                    <Text style={styles.totalPoints}>{player.total_points} points</Text>
                    <View style={styles.playerStats}>
                      <Text style={styles.statText}>
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
            <Text style={styles.sectionTitle}>Recent Game Results</Text>
            {recentGames.map((game) => (
              <View key={game.id} style={styles.gameCard}>
                <View style={styles.scoreHeader}>
                  <Text style={styles.gameName}>{game.game_name || 'Unnamed Game'}</Text>
                  <View style={styles.gameInfo}>
                    <Users size={16} color="#8B5CF6" />
                    <Text style={styles.gamePlayerCount}>{game.player_count} players</Text>
                  </View>
                  <Text style={styles.scoreDate}>{formatDate(game.completed_at)}</Text>
                </View>
                
                <View style={styles.scoreDetails}>
                  <Text style={styles.winnerText}>
                    🏆 {game.winner_role} Victory
                  </Text>
                  <View style={styles.gameDuration}>
                    <Clock size={12} color="#9CA3AF" />
                    <Text style={styles.durationText}>
                      {game.duration_minutes || 0}min • {game.total_rounds} rounds
                    </Text>
                  </View>
                </View>
                
                {game.word_pair_used && (
                  <View style={styles.wordPairUsed}>
                    <Text style={styles.wordPairText}>
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
            <Trophy size={48} color="#4B5563" />
            <Text style={styles.emptyStateTitle}>No Games Played Yet</Text>
            <Text style={styles.emptyStateText}>
              Start playing games to see scores and rankings here!
            </Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
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
    color: '#F3F4F6',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  sortButtons: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 4,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeSortButton: {
    backgroundColor: '#8B5CF6',
  },
  sortButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  activeSortButtonText: {
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F3F4F6',
    marginBottom: 16,
  },
  rankCard: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4B5563',
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
    color: '#6B7280',
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F3F4F6',
    marginBottom: 4,
  },
  totalPoints: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
  },
  gameCard: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  scoreHeader: {
    gap: 8,
    marginBottom: 8,
  },
  gameName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F3F4F6',
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
    color: '#8B5CF6',
    fontWeight: '600',
  },
  scoreDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  scoreDetails: {
    gap: 8,
    marginBottom: 8,
  },
  winnerText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: 'bold',
  },
  gameDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  wordPairUsed: {
    backgroundColor: '#1F2937',
    padding: 8,
    borderRadius: 6,
  },
  wordPairText: {
    fontSize: 12,
    color: '#D1D5DB',
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
    color: '#9CA3AF',
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
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
    color: '#9CA3AF',
    fontSize: 16,
  },
});