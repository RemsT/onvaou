/**
 * Hook personnalisé pour gérer l'initialisation de la base de données GTFS
 */

import { useState, useEffect } from 'react';
import {
  gtfsInitService,
  type InitializationProgress
} from '../services/gtfsInitializationService';
import { tariffService } from '../services/tariffService';

interface UseGTFSInitializationReturn {
  isInitializing: boolean;
  isInitialized: boolean;
  progress: InitializationProgress;
  error: Error | null;
  /** Indique si les données GTFS ont plus de 30 jours */
  isGTFSStale: boolean;
  /**
   * Force une réinitialisation de la base de données GTFS.
   * Si forceDownload = true, télécharge un GTFS frais depuis data.sncf.com.
   */
  initializeDatabase: (forceReset?: boolean, forceDownload?: boolean) => Promise<void>;
}

export const useGTFSInitialization = (): UseGTFSInitializationReturn => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isGTFSStale, setIsGTFSStale] = useState(false);
  const [progress, setProgress] = useState<InitializationProgress>({
    step: 'start',
    progress: 0,
    message: 'Vérification de la base de données...'
  });
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async (forceReset: boolean = false, forceDownload: boolean = false) => {
    try {
      // Forcer la suppression si demandé
      if (forceReset) {
        console.log('🔄 Suppression forcée de la base de données...');
        await gtfsInitService.resetDatabase();
      }

      // Téléchargement GTFS frais si demandé explicitement
      if (forceDownload) {
        console.log('⬇️  Mise à jour GTFS depuis data.sncf.com...');
        setIsInitializing(true);
        const ok = await gtfsInitService.downloadAndUpdateGTFS((prog) => setProgress(prog));
        if (ok) {
          // Charger les tarifs en parallèle
          await tariffService.loadTariffs();
          setIsGTFSStale(false);
          setIsInitialized(true);
          setTimeout(() => setIsInitializing(false), 1000);
        } else {
          throw new Error('Échec de la mise à jour GTFS');
        }
        return;
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

        // Vérifier la fraîcheur des données GTFS (en arrière-plan)
        gtfsInitService.isGTFSStale().then(stale => setIsGTFSStale(stale));

        // Charger les tarifs en arrière-plan (sans bloquer l'UI)
        tariffService.loadTariffs().catch(err =>
          console.warn('⚠️ Chargement des tarifs échoué :', err)
        );
        return;
      }

      // Première initialisation depuis les assets bundlés
      console.log('🚀 Initialisation de la base de données...');
      setIsInitializing(true);

      const success = await gtfsInitService.initializeDatabase((prog) => {
        setProgress(prog);
      });

      if (success) {
        // Marquer la date du premier import (depuis les assets)
        // On ne met pas de date ici pour que isGTFSStale revienne vrai
        // dès que les assets sont trop anciens (pas de timestamp = stale)

        // Charger les tarifs en arrière-plan
        tariffService.loadTariffs().catch(err =>
          console.warn('⚠️ Chargement des tarifs échoué :', err)
        );

        // Vérifier fraîcheur
        gtfsInitService.isGTFSStale().then(stale => setIsGTFSStale(stale));

        setIsInitialized(true);
        setTimeout(() => {
          setIsInitializing(false);
        }, 1000);
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
    error,
    isGTFSStale,
    initializeDatabase,
  };
};
