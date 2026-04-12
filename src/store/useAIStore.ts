import { create } from 'zustand';
import type { AICorrection } from '../services/aiService';

export interface PopoverState {
  correctionId: string;
  suggestion: string;
  type: string;
  explanation: string;
  anchorRect: { top: number; left: number; width: number };
}

interface AIState {
  corrections: AICorrection[];
  isAnalyzing: boolean;
  analyzeProgress: { done: number; total: number };
  activePopover: PopoverState | null;

  setCorrections: (corrections: AICorrection[]) => void;
  addCorrections: (corrections: AICorrection[]) => void;
  removeCorrection: (id: string) => void;
  clearCorrections: () => void;
  setAnalyzing: (v: boolean, total?: number) => void;
  setProgress: (done: number, total: number) => void;
  setActivePopover: (state: PopoverState | null) => void;
}

export const useAIStore = create<AIState>()((set) => ({
  corrections: [],
  isAnalyzing: false,
  analyzeProgress: { done: 0, total: 1 },
  activePopover: null,

  setCorrections: (corrections) => set({ corrections }),
  addCorrections: (corrections) =>
    set((s) => ({ corrections: [...s.corrections, ...corrections] })),
  removeCorrection: (id) =>
    set((s) => ({ corrections: s.corrections.filter((c) => c.id !== id) })),
  clearCorrections: () => set({ corrections: [], activePopover: null }),
  setAnalyzing: (v, total = 1) =>
    set({ isAnalyzing: v, analyzeProgress: { done: 0, total } }),
  setProgress: (done, total) => set({ analyzeProgress: { done, total } }),
  setActivePopover: (state) => set({ activePopover: state }),
}));
