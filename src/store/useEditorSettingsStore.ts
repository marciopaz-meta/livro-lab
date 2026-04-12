import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EditorSettingsState {
  isPrintMode: boolean;
  isPreviewMode: boolean;
  zoom: number;
  activeBookId: string | null;
  activeChapterId: string | null;
  setPrintMode: (v: boolean) => void;
  setPreviewMode: (v: boolean) => void;
  setZoom: (v: number) => void;
  setActiveBook: (bookId: string | null) => void;
  setActiveChapter: (chapterId: string | null) => void;
}

export const useEditorSettingsStore = create<EditorSettingsState>()(
  persist(
    (set) => ({
      isPrintMode: false,
      isPreviewMode: false,
      zoom: 100,
      activeBookId: null,
      activeChapterId: null,
      setPrintMode: (v) => set({ isPrintMode: v }),
      setPreviewMode: (v) => set({ isPreviewMode: v }),
      setZoom: (v) => set({ zoom: v }),
      setActiveBook: (bookId) => set({ activeBookId: bookId }),
      setActiveChapter: (chapterId) => set({ activeChapterId: chapterId }),
    }),
    { name: 'livro-lab-editor-settings' }
  )
);
