/**
 * Hook personnalisé pour gérer l'initialisation de la base de données GTFS
 */

import { useState, useEffect } from 'react';
import {
  gtfsInitService,
  type InitializationProgress
} from '../services/gtfsInitializationService';

interface UseGTFSInitializationReturn {
  isInitializing: boolean;
  isInitialized: boolean;
  progress: InitializationProgress;
  error: Error | null;
}

export const useGTFSInitialization = (): UseGTFSInitializationReturn => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [progress, setProgress] = useState<InitializationProgress>({
    step: 'start',
    progress: 0,
    message: 'Vérification de la base de données...'
  });
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async (forceReset: boolean = false) => {
    try {
      // Forcer la suppression si demandé
      if (forceReset) {
        console.log('🔄 Suppression forcée de la base de données...');
        await gtfsInitService.resetDatabase();
      }

      // Vérifier si déjà initialisée
      const alreadyInitialized = await gtfsInitService.isDatabaseInitialized();

      if (alreadyInitialized && !forceReset) {
        console.log('✅ Base de données déjà initialisée');
        setProgress({
          step: 'complete',
          progress: 100,
          message: 'Base de données prête'
        });
        setIsInitialized(true);
        setIsInitializing(false);
        return;
      }

      // Initialiser avec callback de progression
      console.log('🚀 Initialisation de la base de données...');
      setIsInitializing(true);

      const success = await gtfsInitService.initializeDatabase((prog) => {
        setProgress(prog);
      });

      if (success) {
        setIsInitialized(true);
        setTimeout(() => {
          setIsInitializing(false);
        }, 1000); // Petit délai pour montrer "Terminé"
      } else {
        throw new Error('Échec de l\'initialisation de la base de données');
      }
    } catch (err) {
      console.error('❌ Erreur lors de l\'initialisation:', err);
      setError(err instanceof Error ? err : new Error('Erreur inconnue'));
      setProgress({
        step: 'error',
        progress: 0,
        message: err instanceof Error ? err.message : 'Erreur inconnue'
      });
      setIsInitializing(false);
    }
  };

  return {
    isInitializing,
    isInitialized,
    progress,
    error
  };
};
