import { useEffect, useRef } from 'react';
import { navigationHistory } from '../lib/navigationHistory';

export interface UseBackHandlerOptions {
  id: string;
  isOpen: boolean;
  onBack: () => void;
  metadata?: Record<string, any>;
  disabled?: boolean;
}

/**
 * Hook to register a back-handler for Android Hardware Back / Browser Navigation.
 * 
 * - When `isOpen` becomes true: pushes state to browser history & registers handler.
 * - When Android Back / popstate occurs: pops entry and executes `onBack()`.
 * - When `isOpen` becomes false via UI or unmounts: cleanly rolls back browser history.
 */
export function useBackHandler({
  id,
  isOpen,
  onBack,
  metadata,
  disabled = false,
}: UseBackHandlerOptions): void {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  const metadataRef = useRef(metadata);
  metadataRef.current = metadata;

  useEffect(() => {
    if (!isOpen || disabled) {
      if (navigationHistory.has(id)) {
        navigationHistory.pop(id);
      }
      return;
    }

    const cleanup = navigationHistory.push(
      id,
      () => onBackRef.current(),
      metadataRef.current
    );

    return () => {
      cleanup();
    };
  }, [id, isOpen, disabled]);
}
