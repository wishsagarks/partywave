import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { Plus, Minus, Play, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { GameService } from '@/services/gameService';

export default function GameSetupScreen() {
  const [playerCount, setPlayerCount] = useState(6);
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '', '', '', '']);
  const [isCreatingGame, setIsCreatingGame] = useState(false);

  const updatePlayerCount = (count: number) => {
    const newCount = Math.max(3, Math.min(20, count));
    setPlayerCount(newCount);
    
    const newNames = [...playerNames];
    if (newCount > playerNames.length) {
      // Add empty names for new players
      for (let i = playerNames.length; i < newCount; i++) {
        newNames.push('');
      }
    } else {
      // Remove excess names
      newNames.splice(newCount);
    }
    setPlayerNames(newNames);
  };

  const updatePlayerName = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const startGame = async () => {
    // Check if all players have names
    const hasEmptyNames = playerNames.some(name => name.trim() === '');
    if (hasEmptyNames) {
      Alert.alert('Missing Names', 'Please enter names for all players before starting the game.');
      return;
    }

    // Check for duplicate names
    const uniqueNames = new Set(playerNames.map(name => name.trim().toLowerCase()));
    if (uniqueNames.size !== playerNames.length) {
      Alert.alert('Duplicate Names', 'Please ensure all player names are unique.');
      return;
    }

    try {
      setIsCreatingGame(true);
      
      // Create player records in database
      const playerIds = await Promise.all(
        playerNames.map(name => GameService.createOrUpdatePlayer(name.trim()))
      );
      
      // Create game record
      const gameId = await GameService.createGame(playerCount);
      
      router.push({
        pathname: '/game-flow',
        params: {
          gameId,
          playerCount: playerCount.toString(),
          playerNames: JSON.stringify(playerNames),
          playerIds: JSON.stringify(playerIds),
        },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to start game. Please try again.');
      console.error('Game creation error:', error);
    } finally {
      setIsCreatingGame(false);
    }
  };

  const roles = GameService.getRoleDistribution(playerCount);

  return (
    <LinearGradient
      colors={['#1F2937', '#111827']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#F3F4F6" />
        </TouchableOpacity>
        <Text style={styles.title}>Game Setup</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Player Count</Text>
          <View style={styles.playerCountContainer}>
            <TouchableOpacity 
              style={styles.countButton}
              onPress={() => updatePlayerCount(playerCount - 1)}
            >
              <Minus size={20} color="white" />
            </TouchableOpacity>
            
            <Text style={styles.playerCountText}>{playerCount}</Text>
            
            <TouchableOpacity 
              style={styles.countButton}
              onPress={() => updatePlayerCount(playerCount + 1)}
            >
              <Plus size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.roleDistribution}>
            <View style={styles.roleCard}>
              <Text style={styles.roleEmoji}>👥</Text>
              <Text style={styles.roleName}>Civilians</Text>
              <Text style={styles.roleCount}>{roles.civilians}</Text>
            </View>
            <View style={styles.roleCard}>
              <Text style={styles.roleEmoji}>🕵️</Text>
              <Text style={styles.roleName}>Undercover</Text>
              <Text style={styles.roleCount}>{roles.undercover}</Text>
            </View>
            <View style={styles.roleCard}>
              <Text style={styles.roleEmoji}>❓</Text>
              <Text style={styles.roleName}>Mr. White</Text>
              <Text style={styles.roleCount}>{roles.mrWhite}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Player Names</Text>
          {playerNames.map((name, index) => (
            <View key={index} style={styles.playerInputContainer}>
              <Text style={styles.playerNumber}>P{index + 1}</Text>
              <TextInput
                style={styles.playerInput}
                value={name}
                onChangeText={(text) => updatePlayerName(index, text)}
                placeholder={`Player ${index + 1} name`}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.startButton}
        onPress={startGame}
        disabled={isCreatingGame}
      >
        <LinearGradient
          colors={['#8B5CF6', '#7C3AED']}
          style={styles.startButtonGradient}
        >
          <Play size={20} color="white" />
          <Text style={styles.startButtonText}>
            {isCreatingGame ? 'Creating Game...' : 'Start Game'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F3F4F6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F3F4F6',
    marginBottom: 16,
  },
  playerCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 20,
  },
  countButton: {
    backgroundColor: '#8B5CF6',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerCountText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F3F4F6',
    minWidth: 60,
    textAlign: 'center',
  },
  roleDistribution: {
    flexDirection: 'row',
    gap: 12,
  },
  roleCard: {
    flex: 1,
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  roleEmoji: {
    fontSize: 24,
  },
  roleName: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '500',
  },
  roleCount: {
    color: '#8B5CF6',
    fontSize: 18,
    fontWeight: 'bold',
  },
  playerInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  playerNumber: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: 'bold',
    width: 32,
  },
  playerInput: {
    flex: 1,
    backgroundColor: '#374151',
    color: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  startButton: {
    margin: 20,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 18,
    borderRadius: 12,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});