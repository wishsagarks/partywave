import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Trophy, Award, Star, Medal } from 'lucide-react-native';

interface ScoreRecord {
  id: number;
  playerName: string;
  role: 'civilian' | 'undercover' | 'mrwhite';
  points: number;
  date: string;
  gameId: string;
}

export default function LeaderboardScreen() {
  // Mock data - in a real app, this would come from persistent storage
  const [scores] = useState<ScoreRecord[]>([
    {
      id: 1,
      playerName: "Alice",
      role: "undercover",
      points: 10,
      date: "2024-01-15",
      gameId: "game-001"
    },
    {
      id: 2,
      playerName: "Bob",
      role: "civilian",
      points: 8,
      date: "2024-01-15",
      gameId: "game-001"
    },
    {
      id: 3,
      playerName: "Charlie",
      role: "mrwhite",
      points: 6,
      date: "2024-01-14",
      gameId: "game-002"
    },
    {
      id: 4,
      playerName: "Diana",
      role: "civilian",
      points: 6,
      date: "2024-01-14",
      gameId: "game-002"
    },
    {
      id: 5,
      playerName: "Alice",
      role: "civilian",
      points: 4,
      date: "2024-01-13",
      gameId: "game-003"
    },
    {
      id: 6,
      playerName: "Eve",
      role: "undercover",
      points: 10,
      date: "2024-01-13",
      gameId: "game-003"
    },
  ]);

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

  const getPlayerTotals = () => {
    const totals: { [key: string]: number } = {};
    scores.forEach(score => {
      totals[score.playerName] = (totals[score.playerName] || 0) + score.points;
    });
    
    return Object.entries(totals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  };

  const sortedScores = [...scores].sort((a, b) => {
    if (sortBy === 'points') {
      return b.points - a.points;
    } else {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  const playerTotals = getPlayerTotals();

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy size={20} color="#F59E0B" />;
      case 1: return <Medal size={20} color="#D1D5DB" />;
      case 2: return <Award size={20} color="#CD7F32" />;
      default: return <Star size={16} color="#6B7280" />;
    }
  };

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
            {playerTotals.map((player, index) => (
              <View key={player.name} style={styles.rankCard}>
                <View style={styles.rankInfo}>
                  <View style={styles.rankIconContainer}>
                    {getRankIcon(index)}
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>#{index + 1} {player.name}</Text>
                    <Text style={styles.totalPoints}>Total Points: {player.total}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Recent Game Results</Text>
            {sortedScores.map((score, index) => (
              <View key={score.id} style={styles.scoreCard}>
                <View style={styles.scoreHeader}>
                  <Text style={styles.playerName}>{score.playerName}</Text>
                  <Text style={styles.scoreDate}>{score.date}</Text>
                </View>
                
                <View style={styles.scoreDetails}>
                  <Text style={[styles.roleText, { color: getRoleColor(score.role) }]}>
                    {getRoleEmoji(score.role)} {getRoleName(score.role)}
                  </Text>
                  <Text style={styles.pointsEarned}>+{score.points} pts</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {scores.length === 0 && (
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
  scoreCard: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  scoreDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pointsEarned: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F59E0B',
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
});