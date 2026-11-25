import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Mode, ProgressState, Level, ContestTag, LevelProgress, ErrorEntry, PlacementResult } from '../core/types.ts';
import { getLesson, getLessons, RegisteredLesson, devErrors } from '../core/registry.ts';
import { catalog } from '../core/catalog.ts';
import { EXPORT_PREFIX } from '../core/brand.ts';

export type ContentTab = 'lesson' | 'quiz';

export interface KindFilter {
  level: Level | 'all';
  contest: ContestTag | 'all';
  onlyReady: boolean;
  search: string;
}

export interface AppState {
  mode: Mode;
  activeLessonId: string;
  activeTab: ContentTab;
  currentInput: Record<string, string>;
  inputErrors: Record<string, string>;
  classroomMode: boolean; // Chế độ chiếu lớp
  isSidebarOpen: boolean; // Ngăn kéo điện thoại
  progress: ProgressState;
  isOnline: boolean;
  runFeedback: string | null;
  filters: {
    concept: KindFilter;
    algorithm: KindFilter;
  };
}

export type AppAction =
  | { type: 'SET_MODE'; payload: Mode }
  | { type: 'SELECT_LESSON'; payload: string }
  | { type: 'SET_TAB'; payload: ContentTab }
  | { type: 'UPDATE_INPUT_FIELD'; payload: { key: string; value: string } }
  | { type: 'APPLY_PRESET'; payload: Record<string, string> }
  | { type: 'RANDOMIZE_INPUT'; payload: Record<string, string> }
  | { type: 'RUN_SAMPLE' }
  | { type: 'TOGGLE_CLASSROOM_MODE' }
  | { type: 'TOGGLE_SIDEBAR'; payload?: boolean }
  | { type: 'TOGGLE_UNDERSTOOD'; payload: string }
  | { type: 'SET_FILTER'; payload: { kind: 'concept' | 'algorithm'; field: keyof KindFilter; value: any } }
  | { type: 'RESET_FILTER'; payload: 'concept' | 'algorithm' }
  | { type: 'IMPORT_PROGRESS'; payload: ProgressState }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | {
      type: 'UPDATE_LEVEL_PROGRESS';
      payload: {
        sourceId: string;
        level: number;
        data: Partial<LevelProgress>;
      };
    }
  | {
      type: 'RECORD_SUBMISSION';
      payload: {
        sourceId: string;
        score: number;
        errors?: ErrorEntry[];
      };
    }
  | { type: 'SAVE_PLACEMENT'; payload: PlacementResult }
  | { type: 'UPDATE_PLACEMENT_MANUAL'; payload: Partial<PlacementResult> }
  | { type: 'RECORD_LAST_VISITED'; payload: { path: string; title: string } };

const initialKindFilter: KindFilter = {
  level: 'all',
  contest: 'all',
  onlyReady: false,
  search: '',
};

const initialProgress: ProgressState = {
  version: 1,
  understood: [],
  levels: {},
  solved: {},
  errorBook: [],
};

const OLD_STORAGE_BACKUP_KEY = 'codelens_backup_progress';
const NEW_STORAGE_BACKUP_KEY = `${EXPORT_PREFIX}_backup_progress`;

function getBackupProgressWithMigration(): ProgressState | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const newStored = localStorage.getItem(NEW_STORAGE_BACKUP_KEY);
    if (newStored) {
      const parsed = JSON.parse(newStored);
      if (parsed && typeof parsed === 'object') return parsed;
    }
    const oldStored = localStorage.getItem(OLD_STORAGE_BACKUP_KEY);
    if (oldStored) {
      // Di chuyển sang khóa mới và xóa khóa cũ
      localStorage.setItem(NEW_STORAGE_BACKUP_KEY, oldStored);
      localStorage.removeItem(OLD_STORAGE_BACKUP_KEY);
      const parsed = JSON.parse(oldStored);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {
    console.warn('Lỗi khi đọc/chuyển đổi tiến độ dự phòng từ localStorage:', e);
  }
  return null;
}

function createInitialState(): AppState {
  const initialMode: Mode = 'concept';
  const readyConcepts = getLessons('concept').filter((l) => l.status === 'ready');
  const firstLesson = readyConcepts[0] || getLessons('concept')[0];
  const initialId = firstLesson ? firstLesson.id : '';
  const initialInput = firstLesson?.content?.sample.defaultInput
    ? { ...firstLesson.content.sample.defaultInput }
    : {};

  const backupProgress = getBackupProgressWithMigration();

  return {
    mode: initialMode,
    activeLessonId: initialId,
    activeTab: 'lesson',
    currentInput: initialInput,
    inputErrors: {},
    classroomMode: false,
    isSidebarOpen: false,
    progress: backupProgress || initialProgress,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    runFeedback: null,
    filters: {
      concept: { ...initialKindFilter },
      algorithm: { ...initialKindFilter },
    },
  };
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_MODE': {
      if (action.payload === state.mode) return state;
      const newMode = action.payload;
      let targetId = '';
      let targetInput: Record<string, string> = {};

      if (newMode === 'concept' || newMode === 'algorithm') {
        const readyList = getLessons(newMode).filter((l) => l.status === 'ready');
        const targetLesson = readyList[0] || getLessons(newMode)[0];
        if (targetLesson) {
          targetId = targetLesson.id;
          targetInput = targetLesson.content?.sample.defaultInput
            ? { ...targetLesson.content.sample.defaultInput }
            : {};
        }
      }

      return {
        ...state,
        mode: newMode,
        activeLessonId: targetId,
        activeTab: 'lesson',
        currentInput: targetInput,
        inputErrors: {},
        runFeedback: null,
      };
    }

    case 'SELECT_LESSON': {
      const lesson = getLesson(action.payload);
      if (!lesson) return state;
      const targetInput = lesson.content?.sample.defaultInput
        ? { ...lesson.content.sample.defaultInput }
        : {};

      return {
        ...state,
        mode: lesson.kind,
        activeLessonId: lesson.id,
        activeTab: 'lesson',
        currentInput: targetInput,
        inputErrors: {},
        runFeedback: null,
      };
    }

    case 'SET_TAB': {
      return {
        ...state,
        activeTab: action.payload,
      };
    }

    case 'UPDATE_INPUT_FIELD': {
      const lesson = getLesson(state.activeLessonId);
      const newInputs = {
        ...state.currentInput,
        [action.payload.key]: action.payload.value,
      };

      if (!lesson || !lesson.content) {
        return { ...state, currentInput: newInputs };
      }

      const parseResult = lesson.content.sample.parse(newInputs);
      if (!parseResult.ok) {
        return {
          ...state,
          currentInput: newInputs,
          inputErrors: {
            ...state.inputErrors,
            [action.payload.key]: parseResult.error,
          },
          runFeedback: null,
        };
      }

      const cleaned = { ...state.inputErrors };
      delete cleaned[action.payload.key];
      return {
        ...state,
        currentInput: newInputs,
        inputErrors: cleaned,
        runFeedback: null,
      };
    }

    case 'APPLY_PRESET': {
      const lesson = getLesson(state.activeLessonId);
      const newInputs = { ...action.payload };
      let errors: Record<string, string> = {};

      if (lesson && lesson.content) {
        const res = lesson.content.sample.parse(newInputs);
        if (!res.ok) {
          errors = { _global: res.error };
        }
      }

      return {
        ...state,
        currentInput: newInputs,
        inputErrors: errors,
        runFeedback: null,
      };
    }

    case 'RANDOMIZE_INPUT': {
      return {
        ...state,
        currentInput: { ...action.payload },
        inputErrors: {},
        runFeedback: null,
      };
    }

    case 'RUN_SAMPLE': {
      const lesson = getLesson(state.activeLessonId);
      if (!lesson || !lesson.content) return state;

      const parseResult = lesson.content.sample.parse(state.currentInput);
      if (!parseResult.ok) {
        return {
          ...state,
          inputErrors: { _global: parseResult.error },
          runFeedback: null,
        };
      }

      const expected = lesson.content.reference(parseResult.value);
      return {
        ...state,
        inputErrors: {},
        runFeedback: `Dữ liệu hợp lệ! Kết quả đối chiếu chuẩn: ${expected} (Mô phỏng chi tiết sẽ hiển thị ở Prompt 2)`,
      };
    }

    case 'TOGGLE_CLASSROOM_MODE': {
      return {
        ...state,
        classroomMode: !state.classroomMode,
      };
    }

    case 'TOGGLE_SIDEBAR': {
      return {
        ...state,
        isSidebarOpen: action.payload !== undefined ? action.payload : !state.isSidebarOpen,
      };
    }

    case 'TOGGLE_UNDERSTOOD': {
      const id = action.payload;
      const isCompleted = state.progress.understood.includes(id);
      const updated = isCompleted
        ? state.progress.understood.filter((item) => item !== id)
        : [...state.progress.understood, id];

      return {
        ...state,
        progress: {
          ...state.progress,
          understood: updated,
        },
      };
    }

    case 'SET_FILTER': {
      const { kind, field, value } = action.payload;
      return {
        ...state,
        filters: {
          ...state.filters,
          [kind]: {
            ...state.filters[kind],
            [field]: value,
          },
        },
      };
    }

    case 'RESET_FILTER': {
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload]: { ...initialKindFilter },
        },
      };
    }

    case 'IMPORT_PROGRESS': {
      // Quy tắc 14: Giữ nguyên trường lạ, bỏ qua id không còn trong catalog
      const catalogIdSet = new Set(catalog.map((c) => c.id));
      const rawPayload = action.payload as any;
      const rawUnderstood: string[] = Array.isArray(rawPayload.understood)
        ? rawPayload.understood
        : Array.isArray(rawPayload.completedLessons)
        ? rawPayload.completedLessons
        : [];

      const validUnderstood = rawUnderstood.filter((id) => catalogIdSet.has(id));

      return {
        ...state,
        progress: {
          version: 1,
          levels: {},
          solved: {},
          errorBook: [],
          ...rawPayload, // Giữ nguyên trường lạ
          understood: validUnderstood,
        },
      };
    }

    case 'SET_ONLINE_STATUS': {
      return {
        ...state,
        isOnline: action.payload,
      };
    }

    case 'UPDATE_LEVEL_PROGRESS': {
      const { sourceId, level, data } = action.payload;
      const key = `${sourceId}|${level}`;
      const existing: LevelProgress = state.progress.levels[key] || {
        attempts: 0,
        matchedIdeas: [],
        hintLevel: 1,
        codeUnlocked: false,
        stagesDone: 0,
        predictRight: 0,
        predictTotal: 0,
      };

      const updated: LevelProgress = {
        ...existing,
        ...data,
      };

      return {
        ...state,
        progress: {
          ...state.progress,
          levels: {
            ...state.progress.levels,
            [key]: updated,
          },
        },
      };
    }

    case 'RECORD_SUBMISSION': {
      const { sourceId, score, errors } = action.payload;
      const existing = state.progress.solved[sourceId] || { bestScore: 0, attempts: 0, lastAt: '' };
      const updatedSolved = {
        ...state.progress.solved,
        [sourceId]: {
          bestScore: Math.max(existing.bestScore, score),
          attempts: existing.attempts + 1,
          lastAt: new Date().toISOString(),
        },
      };

      const newErrorBook = errors && errors.length > 0
        ? [...state.progress.errorBook, ...errors]
        : state.progress.errorBook;

      return {
        ...state,
        progress: {
          ...state.progress,
          solved: updatedSolved,
          errorBook: newErrorBook,
        },
      };
    }

    case 'SAVE_PLACEMENT': {
      return {
        ...state,
        progress: {
          ...state.progress,
          placement: action.payload,
        },
      };
    }

    case 'UPDATE_PLACEMENT_MANUAL': {
      if (!state.progress.placement) return state;
      return {
        ...state,
        progress: {
          ...state.progress,
          placement: {
            ...state.progress.placement,
            ...action.payload,
          },
        },
      };
    }

    case 'RECORD_LAST_VISITED': {
      return {
        ...state,
        progress: {
          ...state.progress,
          lastVisited: {
            path: action.payload.path,
            title: action.payload.title,
            at: new Date().toISOString(),
          },
        },
      };
    }

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  activeLesson: RegisteredLesson | undefined;
  devErrors: string[];
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialState);
  const activeLesson = getLesson(state.activeLessonId);

  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
    const handleOffline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Tự động lưu bản sao dự phòng tiến độ sang localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage && state.progress) {
      try {
        localStorage.setItem(NEW_STORAGE_BACKUP_KEY, JSON.stringify(state.progress));
      } catch (e) {
        // Bỏ qua lỗi quota
      }
    }
  }, [state.progress]);

  return (
    <AppContext.Provider value={{ state, dispatch, activeLesson, devErrors }}>
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
