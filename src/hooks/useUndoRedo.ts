'use client';

import { useState, useCallback } from 'react';

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UndoRedoActions<T> {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: (newState: T) => void;
  clear: () => void;
  addToHistory: (state: T) => void;
  currentState: T;
}

export const useUndoRedo = <T>(initialState: T, maxHistory: number = 50): UndoRedoActions<T> => {
  const [state, setState] = useState<UndoRedoState<T>>({
    past: [],
    present: initialState,
    future: []
  });

  const undo = useCallback(() => {
    setState(currentState => {
      if (currentState.past.length === 0) return currentState;
      
      const previous = currentState.past[currentState.past.length - 1];
      const newPast = currentState.past.slice(0, currentState.past.length - 1);
      
      return {
        past: newPast,
        present: previous,
        future: [currentState.present, ...currentState.future]
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(currentState => {
      if (currentState.future.length === 0) return currentState;
      
      const next = currentState.future[0];
      const newFuture = currentState.future.slice(1);
      
      return {
        past: [...currentState.past, currentState.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  const reset = useCallback((newState: T) => {
    setState({
      past: [],
      present: newState,
      future: []
    });
  }, []);

  const clear = useCallback(() => {
    setState({
      past: [],
      present: state.present,
      future: []
    });
  }, [state.present]);

  const addToHistory = useCallback((newState: T) => {
    setState(currentState => {
      const newPast = [...currentState.past, currentState.present];
      // Limitar el tamaño del historial
      const trimmedPast = newPast.length > maxHistory ? newPast.slice(-maxHistory) : newPast;
      
      return {
        past: trimmedPast,
        present: newState,
        future: []
      };
    });
  }, [maxHistory]);

  return {
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    reset,
    clear,
    addToHistory,
    currentState: state.present
  };
};

// Hook específico para acciones críticas con confirmación
export const useUndoRedoWithConfirmation = <T>(
  initialState: T,
  onAction: (action: 'undo' | 'redo', fromState: T, toState: T) => Promise<boolean>,
  maxHistory: number = 50
) => {
  const [state, setState] = useState<UndoRedoState<T>>({
    past: [],
    present: initialState,
    future: []
  });

  const undo = useCallback(async () => {
    if (state.past.length === 0) return;
    
    const previous = state.past[state.past.length - 1];
    const confirmed = await onAction('undo', state.present, previous);
    
    if (confirmed) {
      setState(currentState => ({
        past: currentState.past.slice(0, currentState.past.length - 1),
        present: previous,
        future: [currentState.present, ...currentState.future]
      }));
    }
  }, [state.past, state.present, onAction]);

  const redo = useCallback(async () => {
    if (state.future.length === 0) return;
    
    const next = state.future[0];
    const confirmed = await onAction('redo', state.present, next);
    
    if (confirmed) {
      setState(currentState => ({
        past: [...currentState.past, currentState.present],
        present: next,
        future: currentState.future.slice(1)
      }));
    }
  }, [state.future, state.present, onAction]);

  const reset = useCallback((newState: T) => {
    setState({
      past: [],
      present: newState,
      future: []
    });
  }, []);

  const clear = useCallback(() => {
    setState({
      past: [],
      present: state.present,
      future: []
    });
  }, [state.present]);

  const addToHistory = useCallback((newState: T) => {
    setState(currentState => {
      const newPast = [...currentState.past, currentState.present];
      const trimmedPast = newPast.length > maxHistory ? newPast.slice(-maxHistory) : newPast;
      
      return {
        past: trimmedPast,
        present: newState,
        future: []
      };
    });
  }, [maxHistory]);

  return {
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    reset,
    clear,
    addToHistory,
    currentState: state.present
  };
};
