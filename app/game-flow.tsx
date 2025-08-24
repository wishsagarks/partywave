import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Eye, EyeOff, ArrowRight, Users, Trophy, RotateCcw } from 'lucide-react-native';

interface Player {
  id: number;
  name: string;
  role: 'civilian' | 'undercover' | 'mrwhite';
  word: string;
  isAlive: boolean;
  points: number;
}

interface WordPair {
  civilian: string;
  undercover: string;
}

const WORD_PAIRS: WordPair[] = [
  { civilian: "Cat", undercover: "Dog" },
  { civilian: "Coffee", undercover: "Tea" },
  { civilian: "Pizza", undercover: "Burger" },
  { civilian: "Apple", undercover: "Orange" },
  { civilian: "Car", undercover: "Motorcycle" },
  { civilian: "Book", undercover: "Magazine" },
  { civilian: "Beach", undercover: "Lake" },
  { civilian: "Guitar", undercover: "Piano" },
  { civilian: "Summer", undercover: "Winter" },
  { civilian: "Movie", undercover: "TV Show" },
  { civilian: "Doctor", undercover: "Nurse" },
  { civilian: "Mountain", undercover: "Hill" },
  { civilian: "Chocolate", undercover: "Vanilla" },
  { civilian: "Snake", undercover: "Lizard" },
  { civilian: "Rain", undercover: "Snow" },
  { civilian: "Football", undercover: "Basketball" },
  { civilian: "Pencil", undercover: "Pen" },
  { civilian: "Lion", undercover: "Tiger" },
  { civilian: "Ocean", undercover: "River" },
  { civilian: "Sandwich", undercover: "Wrap" },
];

type GamePhase = 'setup' | 'word-distribution' | 'description' | 'discussion' | 'voting' | 'results' | 'final-results';

export default function GameFlow() {
  const { playerCount, playerNames } = useLocalSearchParams();
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPhase, setCurrentPhase] = useState<GamePhase>('setup');
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [currentDescriptionIndex, setCurrentDescriptionIndex] = useState(0);
  const [wordRevealed, setWordRevealed] = useState(false);
  const [votingResults, setVotingResults] = useState<{[key: number]: number}>({});
  const [eliminatedPlayer, setEliminatedPlayer] = useState<Player | null>(null);
  const [gameWinner, setGameWinner] = useState<string>('');
  
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const names = JSON.parse(playerNames as string);
    const count = parseInt(playerCount as string);
    
    // Get random word pair
    const wordPair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
    
    // Determine roles
    const roles = getRoles(count);
    const shuffledRoles = shuffleArray([...roles]);
    
    const newPlayers: Player[] = names.map((name: string, index: number) => ({
      id: index,
      name,
      role: shuffledRoles[index],
      word: shuffledRoles[index] === 'civilian' ? wordPair.civilian : 
            shuffledRoles[index] === 'undercover' ? wordPair.undercover : '',
      isAlive: true,
      points: 0,
    }));

    setPlayers(newPlayers);
    setCurrentPhase('word-distribution');
  };

  const getRoles = (count: number) => {
    const roles: ('civilian' | 'undercover' | 'mrwhite')[] = [];
    
    if (count <= 4) {
      roles.push(...Array(count - 1).fill('civilian'));
      roles.push('undercover');
    } else if (count <= 6) {
      roles.push(...Array(count - 2).fill('civilian'));
      roles.push('undercover', 'mrwhite');
    } else if (count <= 8) {
      roles.push(...Array(count - 3).fill('civilian'));
      roles.push('undercover', 'undercover', 'mrwhite');
    } else if (count <= 12) {
      roles.push(...Array(count - 4).fill('civilian'));
      roles.push('undercover', 'undercover', 'mrwhite', 'mrwhite');
    } else {
      roles.push(...Array(count - 5).fill('civilian'));
      roles.push('undercover', 'undercover', 'undercover', 'mrwhite', 'mrwhite');
    }
    
    return roles;
  };

  const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const nextWordDistribution = () => {
    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setWordRevealed(false);
    } else {
      setCurrentPhase('description');
      setCurrentPlayerIndex(0);
      setCurrentDescriptionIndex(0);
    }
  };

  const nextDescription = () => {
    const alivePlayers = players.filter(p => p.isAlive);
    if (currentDescriptionIndex < alivePlayers.length - 1) {
      setCurrentDescriptionIndex(currentDescriptionIndex + 1);
    } else {
      setCurrentPhase('discussion');
    }
  };

  const startVoting = () => {
    setCurrentPhase('voting');
    setVotingResults({});
  };

  const castVote = (votedForId: number) => {
    const newResults = { ...votingResults };
    newResults[votedForId] = (newResults[votedForId] || 0) + 1;
    setVotingResults(newResults);
    
    const totalVotes = Object.values(newResults).reduce((a, b) => a + b, 0);
    const alivePlayers = players.filter(p => p.isAlive);
    
    if (totalVotes >= alivePlayers.length) {
      // Determine who got the most votes
      const maxVotes = Math.max(...Object.values(newResults));
      const mostVoted = Object.entries(newResults)
        .filter(([_, votes]) => votes === maxVotes)
        .map(([id, _]) => parseInt(id));
      
      if (mostVoted.length === 1) {
        const eliminatedId = mostVoted[0];
        const eliminated = players.find(p => p.id === eliminatedId);
        if (eliminated) {
          setEliminatedPlayer(eliminated);
          eliminatePlayer(eliminatedId);
        }
      } else {
        // Tie - revote or random elimination
        Alert.alert('Tie Vote', 'There was a tie in voting. Randomly eliminating one of the tied players.', [
          { text: 'OK', onPress: () => {
            const randomEliminated = mostVoted[Math.floor(Math.random() * mostVoted.length)];
            const eliminated = players.find(p => p.id === randomEliminated);
            if (eliminated) {
              setEliminatedPlayer(eliminated);
              eliminatePlayer(randomEliminated);
            }
          }}
        ]);
      }
    }
  };

  const eliminatePlayer = (playerId: number) => {
    const newPlayers = players.map(p => 
      p.id === playerId ? { ...p, isAlive: false } : p
    );
    setPlayers(newPlayers);
    
    // Check win conditions
    const alivePlayers = newPlayers.filter(p => p.isAlive);
    const aliveCivilians = alivePlayers.filter(p => p.role === 'civilian');
    const aliveUndercovers = alivePlayers.filter(p => p.role === 'undercover');
    const aliveMrWhites = alivePlayers.filter(p => p.role === 'mrwhite');
    
    if (aliveUndercovers.length === 0 && aliveMrWhites.length === 0) {
      // Civilians win
      setGameWinner('Civilians');
      const updatedPlayers = newPlayers.map(p => 
        p.role === 'civilian' ? { ...p, points: p.points + 2 } : p
      );
      setPlayers(updatedPlayers);
      setCurrentPhase('final-results');
    } else if (aliveCivilians.length <= aliveUndercovers.length) {
      // Undercovers win
      setGameWinner('Undercover');
      const updatedPlayers = newPlayers.map(p => 
        p.role === 'undercover' ? { ...p, points: p.points + 10 } : p
      );
      setPlayers(updatedPlayers);
      setCurrentPhase('final-results');
    } else {
      // Continue game
      setTimeout(() => {
        setCurrentPhase('results');
      }, 1000);
    }
  };

  const nextRound = () => {
    setCurrentRound(currentRound + 1);
    setCurrentPhase('description');
    setCurrentDescriptionIndex(0);
    setEliminatedPlayer(null);
    setVotingResults({});
  };

  const restartGame = () => {
    setCurrentPhase('setup');
    setCurrentPlayerIndex(0);
    setCurrentRound(1);
    setCurrentDescriptionIndex(0);
    setWordRevealed(false);
    setVotingResults({});
    setEliminatedPlayer(null);
    setGameWinner('');
    initializeGame();
  };

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

  if (currentPhase === 'word-distribution') {
    const currentPlayer = players[currentPlayerIndex];
    
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Word Distribution</Text>
          <Text style={styles.subtitle}>Round {currentRound}</Text>
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.passPhoneText}>
            Pass the phone to:
          </Text>
          <Text style={styles.currentPlayerName}>
            {currentPlayer?.name}
          </Text>
          
          {!wordRevealed ? (
            <TouchableOpacity
              style={styles.revealButton}
              onPress={() => setWordRevealed(true)}
            >
              <Eye size={24} color="white" />
              <Text style={styles.revealButtonText}>Tap to See Your Word</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.wordCard}>
              <Text style={[styles.roleText, { color: getRoleColor(currentPlayer?.role || '') }]}>
                {getRoleEmoji(currentPlayer?.role || '')} {getRoleName(currentPlayer?.role || '')}
              </Text>
              {currentPlayer?.word ? (
                <Text style={styles.wordText}>{currentPlayer.word}</Text>
              ) : (
                <Text style={styles.noWordText}>No word - use your skills!</Text>
              )}
              
              <TouchableOpacity
                style={styles.nextButton}
                onPress={nextWordDistribution}
              >
                <Text style={styles.nextButtonText}>
                  {currentPlayerIndex < players.length - 1 ? 'Next Player' : 'Start Game'}
                </Text>
                <ArrowRight size={16} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>
    );
  }

  if (currentPhase === 'description') {
    const alivePlayers = players.filter(p => p.isAlive);
    const currentPlayer = alivePlayers[currentDescriptionIndex];
    
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Description Phase</Text>
          <Text style={styles.subtitle}>Round {currentRound}</Text>
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.phaseInstructions}>
            Each player describes their word in one sentence
          </Text>
          
          <View style={styles.currentTurnCard}>
            <Text style={styles.currentTurnText}>Current Turn:</Text>
            <Text style={styles.currentPlayerName}>{currentPlayer?.name}</Text>
            <Text style={styles.turnCounter}>
              {currentDescriptionIndex + 1} of {alivePlayers.length}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={nextDescription}
          >
            <Text style={styles.nextButtonText}>
              {currentDescriptionIndex < alivePlayers.length - 1 ? 'Next Player' : 'Start Discussion'}
            </Text>
            <ArrowRight size={16} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (currentPhase === 'discussion') {
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Discussion Phase</Text>
          <Text style={styles.subtitle}>Round {currentRound}</Text>
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.phaseInstructions}>
            Discuss and analyze the descriptions. Who seems suspicious?
          </Text>
          
          <View style={styles.discussionCard}>
            <Text style={styles.discussionText}>
              💭 Talk freely about the descriptions you heard
            </Text>
            <Text style={styles.discussionText}>
              🔍 Look for inconsistencies and suspicious answers
            </Text>
            <Text style={styles.discussionText}>
              🤔 Decide who to vote for elimination
            </Text>
          </View>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={startVoting}
          >
            <Text style={styles.nextButtonText}>Start Voting</Text>
            <ArrowRight size={16} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (currentPhase === 'voting') {
    const alivePlayers = players.filter(p => p.isAlive);
    
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Voting Phase</Text>
          <Text style={styles.subtitle}>Round {currentRound}</Text>
        </View>

        <ScrollView style={styles.votingContainer}>
          <Text style={styles.votingInstructions}>
            Vote to eliminate one player:
          </Text>
          
          {alivePlayers.map((player) => (
            <TouchableOpacity
              key={player.id}
              style={[
                styles.voteButton,
                { opacity: votingResults[player.id] ? 0.5 : 1 }
              ]}
              onPress={() => castVote(player.id)}
              disabled={!!votingResults[player.id]}
            >
              <Text style={styles.votePlayerName}>{player.name}</Text>
              <Text style={styles.voteCount}>
                Votes: {votingResults[player.id] || 0}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>
    );
  }

  if (currentPhase === 'results') {
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Round Results</Text>
          <Text style={styles.subtitle}>Round {currentRound}</Text>
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.eliminatedText}>Player Eliminated:</Text>
          <View style={styles.eliminatedCard}>
            <Text style={styles.eliminatedPlayerName}>{eliminatedPlayer?.name}</Text>
            <Text style={[styles.eliminatedRole, { color: getRoleColor(eliminatedPlayer?.role || '') }]}>
              {getRoleEmoji(eliminatedPlayer?.role || '')} {getRoleName(eliminatedPlayer?.role || '')}
            </Text>
            {eliminatedPlayer?.word && (
              <Text style={styles.eliminatedWord}>Word: {eliminatedPlayer.word}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={nextRound}
          >
            <Text style={styles.nextButtonText}>Continue Game</Text>
            <ArrowRight size={16} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (currentPhase === 'final-results') {
    return (
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.container}>
        <View style={styles.header}>
          <Trophy size={32} color="#F59E0B" />
          <Text style={styles.title}>Game Over</Text>
        </View>

        <ScrollView style={styles.finalResultsContainer}>
          <Text style={styles.winnerText}>{gameWinner} Win!</Text>
          
          <View style={styles.playersResultsList}>
            {players.map((player) => (
              <View key={player.id} style={styles.playerResultCard}>
                <View style={styles.playerResultInfo}>
                  <Text style={styles.playerResultName}>{player.name}</Text>
                  <Text style={[styles.playerResultRole, { color: getRoleColor(player.role) }]}>
                    {getRoleEmoji(player.role)} {getRoleName(player.role)}
                  </Text>
                  {player.word && (
                    <Text style={styles.playerResultWord}>"{player.word}"</Text>
                  )}
                </View>
                <Text style={styles.playerResultPoints}>+{player.points}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.finalButtonsContainer}>
          <TouchableOpacity
            style={styles.restartButton}
            onPress={restartGame}
          >
            <RotateCcw size={16} color="white" />
            <Text style={styles.restartButtonText}>Play Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.homeButtonText}>Back to Menu</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return <View />;
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
    flex: 1,
    justifyContent: 'center',
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
  revealButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  revealButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  wordCard: {
    backgroundColor: '#374151',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
    minWidth: 280,
  },
  roleText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  wordText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F3F4F6',
    textAlign: 'center',
  },
  noWordText: {
    fontSize: 18,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  phaseInstructions: {
    fontSize: 18,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  currentTurnCard: {
    backgroundColor: '#374151',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  currentTurnText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  turnCounter: {
    fontSize: 14,
    color: '#6B7280',
  },
  discussionCard: {
    backgroundColor: '#374151',
    padding: 24,
    borderRadius: 12,
    gap: 16,
    marginBottom: 32,
  },
  discussionText: {
    fontSize: 16,
    color: '#D1D5DB',
    lineHeight: 22,
  },
  votingContainer: {
    flex: 1,
    padding: 20,
  },
  votingInstructions: {
    fontSize: 18,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 24,
  },
  voteButton: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  eliminatedText: {
    fontSize: 18,
    color: '#D1D5DB',
    marginBottom: 16,
  },
  eliminatedCard: {
    backgroundColor: '#374151',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  eliminatedPlayerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  eliminatedRole: {
    fontSize: 16,
    fontWeight: '600',
  },
  eliminatedWord: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  finalResultsContainer: {
    flex: 1,
    padding: 20,
  },
  winnerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 32,
  },
  playersResultsList: {
    gap: 12,
  },
  playerResultCard: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerResultInfo: {
    flex: 1,
    gap: 4,
  },
  playerResultName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  playerResultRole: {
    fontSize: 14,
    fontWeight: '600',
  },
  playerResultWord: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  playerResultPoints: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  finalButtonsContainer: {
    padding: 20,
    gap: 12,
  },
  restartButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  restartButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  homeButton: {
    backgroundColor: '#374151',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  homeButtonText: {
    color: '#D1D5DB',
    fontSize: 16,
    fontWeight: '600',
  },
});