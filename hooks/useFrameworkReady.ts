import { useEffect } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
    eliminatePlayer?: (playerId: string) => void;
    endVotingPhase?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    // Trigger game framework readiness
    window.frameworkReady?.();

    // Patch elimination logic to avoid stuck voting when Mr. White is eliminated
    const originalEliminate = window.eliminatePlayer;
    window.eliminatePlayer = (playerId: string) => {
      if (originalEliminate) {
        originalEliminate(playerId);
      }

      // If Mr. White is eliminated, ensure voting phase ends cleanly
      if (playerId === "mrwhite" && window.endVotingPhase) {
        window.endVotingPhase();
      }
    };

    // Cleanup on unmount to restore original
    return () => {
      if (originalEliminate) {
        window.eliminatePlayer = originalEliminate;
      }
    };
  }, []);
}
