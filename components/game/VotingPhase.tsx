import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Vote, Users, Clock, CircleCheck as CheckCircle } from 'lucide-react-native';
import { Player } from '@/types/game';

interface VotingPhaseProps {
  players: Player[];
  currentRound: number;
  currentVoter: Player | null;
  votingResults: Record<string, number>;
  individualVotes: Record<string, string>;
  isProcessingVotes: boolean;
  onCastVote: (targetId: string) => void;
  getVotingPlayers: () => Player[];
  getAlivePlayers: () => Player[];
}

export const VotingPhase: React.FC<VotingPhaseProps> = ({
  players,
  currentRound,
  currentVoter,
  votingResults,
  individualVotes,
  isProcessingVotes,
  onCastVote,
  getVotingPlayers,
  getAlivePlayers,
}) => {
  const votingPlayers = getVotingPlayers();
  const alivePlayers = getAlivePlayers();
  const votedCount = Object.keys(individualVotes).length;
  const totalVoters = votingPlayers.length;

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

  if (isProcessingVotes) {
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Processing Votes...</Text>
          <Text style={styles.subtitle}>Round {currentRound}</Text>
        </View>

        <View style={styles.centerContent}>
          <View style={styles.processingCard}>
            <Clock size={32} color="#8B5CF6" />
            <Text style={styles.processingText}>Counting votes and determining elimination...</Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  if (!currentVoter) {
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Voting Complete</Text>
          <Text style={styles.subtitle}>Round {currentRound}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
      <View style={styles.header}>
        <Vote size={24} color="#8B5CF6" />
        <Text style={styles.title}>Voting Phase</Text>
        <Text style={styles.subtitle}>Round {currentRound}</Text>
      </View>

      <View style={styles.votingProgress}>
        <Text style={styles.progressText}>
          {votedCount} / {totalVoters} players have voted
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(votedCount / totalVoters) * 100}%` }
            ]} 
          />
        </View>
      </View>

      <View style={styles.currentVoterCard}>
        <Text style={styles.currentVoterLabel}>Current Voter:</Text>
        <Text style={styles.currentVoterName}>{currentVoter.name}</Text>
        {currentVoter.specialRole && (
          <Text style={styles.specialRoleText}>
            ⚡ {currentVoter.specialRole.replace('-', ' ').toUpperCase()}
          </Text>
        )}
        <Text style={styles.votingInstructions}>
          Choose who you think should be eliminated
        </Text>
      </View>

      <ScrollView style={styles.playersContainer}>
        <Text style={styles.sectionTitle}>Vote to Eliminate:</Text>
        {alivePlayers.filter(player => player.id !== currentVoter.id).map((player) => {
          const voteCount = votingResults[player.id] || 0;
          const maxVotes = Math.max(...Object.values(votingResults));
          const hasMostVotes = voteCount > 0 && voteCount === maxVotes;
          
          return (
            <TouchableOpacity
              key={player.id}
              style={[
                styles.playerCard,
                hasMostVotes && styles.mostVotedPlayerCard
              ]}
              onPress={() => onCastVote(player.id)}
            >
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerStatus}>
                  {player.isAlive ? '🟢 Alive' : '🔴 Eliminated'}
                </Text>
              </View>
              
              <View style={styles.voteInfo}>
                {voteCount > 0 && (
                  <View style={styles.voteCount}>
                    <Text style={styles.voteCountText}>{voteCount}</Text>
                  </View>
                )}
                <Text style={styles.tapToVoteText}>Tap to vote</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {votedCount > 0 && (
        <View style={styles.votingSummary}>
          <Text style={styles.summaryTitle}>Current Votes:</Text>
          <View style={styles.summaryList}>
            {Object.entries(votingResults)
              .sort(([,a], [,b]) => b - a)
              .map(([playerId, count]) => {
                const player = players.find(p => p.id === playerId);
                return player ? (
                  <View key={playerId} style={styles.summaryItem}>
                    <Text style={styles.summaryPlayerName}>{player.name}</Text>
                    <Text style={styles.summaryVoteCount}>{count} vote{count !== 1 ? 's' : ''}</Text>
                  </View>
                ) : null;
              })}
          </View>
        </View>
      )}
    </LinearGradient>
  );
};

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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  votingProgress: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
  },
  currentVoterCard: {
    backgroundColor: '#374151',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  currentVoterLabel: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  currentVoterName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  specialRoleText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  votingInstructions: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  playersContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F3F4F6',
    marginBottom: 12,
  },
  playerCard: {
    backgroundColor: '#374151',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  currentVoterPlayerCard: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#6B7280',
  },
  mostVotedPlayerCard: {
    backgroundColor: '#374151',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  playerInfo: {
    flex: 1,
    gap: 4,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  playerStatus: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  voteInfo: {
    alignItems: 'center',
    gap: 4,
  },
  voteCount: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  voteCountText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tapToVoteText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  cannotVoteText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  votingSummary: {
    backgroundColor: '#374151',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F3F4F6',
    marginBottom: 8,
  },
  summaryList: {
    gap: 4,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryPlayerName: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  summaryVoteCount: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  processingCard: {
    backgroundColor: '#374151',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
  },
  processingText: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
  },
});