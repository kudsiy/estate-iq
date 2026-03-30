import { DesignState } from "./types";

/**
 * HistoryManager: Handles undo/redo operations for the DesignState.
 */
export class HistoryManager {
  private past: DesignState[] = [];
  private future: DesignState[] = [];
  private maxHistory: number = 50;

  constructor(maxHistory = 50) {
    this.maxHistory = maxHistory;
  }

  /**
   * Add a new state to the history. 
   * Clears the future (redo stack).
   */
  push(state: DesignState) {
    // Basic optimization: don't push identical states
    if (this.past.length > 0) {
      const current = this.past[this.past.length - 1];
      if (JSON.stringify(current) === JSON.stringify(state)) {
        return;
      }
    }

    this.past.push(state);
    this.future = []; // Clear redo stack on new action

    if (this.past.length > this.maxHistory) {
      this.past.shift();
    }
  }

  /**
   * Undo to the previous state.
   * Returns the new current state, or null if cannot undo.
   */
  undo(currentState: DesignState): DesignState | null {
    if (this.past.length === 0) return null;
    
    // Add current state to redo stack
    this.future.push(currentState);
    
    // Get last state
    return this.past.pop() || null;
  }

  /**
   * Redo to the next state.
   * Returns the new current state, or null if cannot redo.
   */
  redo(currentState: DesignState): DesignState | null {
    if (this.future.length === 0) return null;

    // Push current back to past
    this.past.push(currentState);
    
    // Get next from future
    return this.future.pop() || null;
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }
}

/**
 * Hook-friendly wrapper if needed, but usually we use a ref to class in the component.
 */
