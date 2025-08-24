import { useState, useEffect } from 'react';
import { GameService } from '@/services/gameService';
import { WordLibrary, Player } from '@/types/game';

export function useWordLibraries() {
  const [libraries, setLibraries] = useState<WordLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLibraries = async () => {
    try {
      setLoading(true);
      const data = await GameService.getAllWordLibraries();
      setLibraries(data);
      setError(null);
    } catch (err) {
      setError('Failed to load word libraries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraries();
  }, []);

  const toggleLibrary = async (libraryId: string, isActive: boolean) => {
    try {
      await GameService.toggleWordLibrary(libraryId, isActive);
      await fetchLibraries(); // Refresh data
    } catch (err) {
      setError('Failed to update library');
      console.error(err);
    }
  };

  const addCustomWordPair = async (civilianWord: string, undercoverWord: string, category: string) => {
    try {
      await GameService.addCustomWordPair(civilianWord, undercoverWord, category);
      await fetchLibraries(); // Refresh data
    } catch (err) {
      setError('Failed to add word pair');
      console.error(err);
    }
  };

  const deleteWordPair = async (pairId: string) => {
    try {
      await GameService.deleteWordPair(pairId);
      await fetchLibraries(); // Refresh data
    } catch (err) {
      setError('Failed to delete word pair');
      console.error(err);
    }
  };

  const updateWordPair = async (pairId: string, civilianWord: string, undercoverWord: string, category: string) => {
    try {
      await GameService.updateWordPair(pairId, civilianWord, undercoverWord, category);
      await fetchLibraries(); // Refresh data
    } catch (err) {
      setError('Failed to update word pair');
      console.error(err);
    }
  };

  return {
    libraries,
    loading,
    error,
    refetch: fetchLibraries,
    toggleLibrary,
    addCustomWordPair,
    deleteWordPair,
    updateWordPair,
  };
}

export function useLeaderboard() {
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [playersData, gamesData] = await Promise.all([
        GameService.getTopPlayers(20),
        GameService.getRecentGames(50),
      ]);
      
      setTopPlayers(playersData);
      setRecentGames(gamesData);
      setError(null);
    } catch (err) {
      setError('Failed to load leaderboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    topPlayers,
    recentGames,
    loading,
    error,
    refetch: fetchData,
  };
}