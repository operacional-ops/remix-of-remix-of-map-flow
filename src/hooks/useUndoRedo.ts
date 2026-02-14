import { useState, useCallback } from 'react';

export interface UndoRedoEntry {
  rowId: string;
  field: string;
  oldValue: any;
  newValue: any;
}

export function useUndoRedo() {
  const [history, setHistory] = useState<UndoRedoEntry[]>([]);
  const [pointer, setPointer] = useState(-1);

  const pushChange = useCallback((entry: UndoRedoEntry) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, pointer + 1);
      return [...trimmed, entry];
    });
    setPointer(prev => prev + 1);
  }, [pointer]);

  const canUndo = pointer >= 0;
  const canRedo = pointer < history.length - 1;

  const undo = useCallback(() => {
    if (!canUndo) return null;
    const entry = history[pointer];
    setPointer(p => p - 1);
    return { id: entry.rowId, field: entry.field, value: entry.oldValue };
  }, [canUndo, history, pointer]);

  const redo = useCallback(() => {
    if (!canRedo) return null;
    const entry = history[pointer + 1];
    setPointer(p => p + 1);
    return { id: entry.rowId, field: entry.field, value: entry.newValue };
  }, [canRedo, history, pointer]);

  return { pushChange, undo, redo, canUndo, canRedo };
}
