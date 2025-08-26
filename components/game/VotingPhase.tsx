import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Player } from '@/types/game';

interface VotingPhaseProps {
  players: Player[];
  currentRound: number;
  currentVoter: Player | null;
  votingResults: {[key: string]: number};
  individualVotes: {[voterId: string]: string};
  isProcessingVotes: boolean;
  onCastVote: (votedForId: string) => void;
  getVotingPlayers: () => Player[];
  getAlivePlayers: () => Player[];
}

export function VotingPhase({
  players,
  currentRound,
  currentVoter,
  votingResults,
  individualVotes,
  isProcessingVotes,
  onCastVote,
  getVotingPlayers,
  getAlivePlayers,
}: VotingPhaseProps) {
  const votingPlayers = getVotingPlayers();
  const alivePlayers = getAlivePlayers();
  const hasVoted = currentVoter ? individualVotes[currentVoter.id] : false;
  const currentVoterIndex = votingPlayers.findIndex(p => p.id === currentVoter?.id);

  return (
    <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voting Phase</Text>
        <Text style={styles.subtitle}>
          Round {currentRound} • Voter {currentVoterIndex + 1}/{votingPlayers.length}
        </Text>
      </View>

      <View style={styles.centerContent}>
        <Text style={styles.passPhoneText}>Pass the phone to:</Text>
        <Text style={styles.currentPlayerName}>{currentVoter?.name}</Text>
        
        <Text style={styles.votingInstructions}>
          Vote to eliminate the most suspicious player:
        </Text>
      </View>

      <ScrollView style={styles.votingContainer}>
        {alivePlayers
          .filter(player => player.id !== currentVoter?.id)
          .map((player) => (
          <TouchableOpacity
            key={player.id}
            style={[
              styles.voteButton,
              hasVoted && { opacity: 0.5 }
            ]}
            onPress={() => onCastVote(player.id)}
            disabled={hasVoted || isProcessingVotes}
          >
            <Text style={styles.votePlayerName}>{player.name}</Text>
            <Text style={styles.voteCount}>
              Current Votes: {votingResults[player.id] || 0}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {hasVoted && currentVoter && (
        <View style={styles.votedConfirmation}>
          <Text style={styles.votedText}>
            ✓ Vote cast for {players.find(p => p.id === individualVotes[currentVoter.id])?.name}
          </Text>
          <Text style={styles.waitingText}>
            Waiting for {votingPlayers.length - Object.keys(individualVotes).length} more players to vote...
          </Text>
        </View>
      )}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  centerContent: {
    alignItems: 'center',
    padding: 20,
  },
  passPhoneText: {
    fontSize: 18,
    color: '#D1D5DB',
    marginBottom: 12,
  },
  currentPlayerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 32,
  },
  votingInstructions: {
    fontSize: 18,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 24,
  },
  votingContainer: {
    flex: 1,
    padding: 20,
  },
  voteButton: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  votePlayerName: {
    fontSize: 16,
    color: '#F3F4F6',
    fontWeight: '600',
  },
  voteCount: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  votedConfirmation: {
    backgroundColor: '#374151',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  votedText: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
  },
  waitingText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});