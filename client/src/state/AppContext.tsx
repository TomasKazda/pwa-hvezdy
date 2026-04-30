/**
 * Globální app stav. Drží UI/derivované hodnoty z `useMe()`.
 * Serverová data zůstávají v TanStack Query cache.
 */
import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { useMe } from '../api/queries';
import type { MeResponse, UserRole } from '../types';

const ACTIVE_CHILD_KEY = 'hvezdy:activeChildId';

export interface AppState {
  user: MeResponse | null;
  role: UserRole | null;
  isAdmin: boolean;
  activeChildId: number | null;
}

export type AppAction =
  | { type: 'SET_USER'; payload: MeResponse | null }
  | { type: 'SELECT_CHILD'; payload: number | null };

const initialState: AppState = {
  user: null,
  role: null,
  isAdmin: false,
  activeChildId: readActiveChild(),
};

function readActiveChild(): number | null {
  try {
    const raw = localStorage.getItem(ACTIVE_CHILD_KEY);
    return raw ? Number.parseInt(raw, 10) || null : null;
  } catch {
    return null;
  }
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        role: action.payload?.role ?? null,
        isAdmin: action.payload?.isAdmin ?? false,
      };
    case 'SELECT_CHILD':
      try {
        if (action.payload === null) localStorage.removeItem(ACTIVE_CHILD_KEY);
        else localStorage.setItem(ACTIVE_CHILD_KEY, String(action.payload));
      } catch {
        /* ignore */
      }
      return { ...state, activeChildId: action.payload };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const meQuery = useMe();

  useEffect(() => {
    if (meQuery.data) {
      dispatch({ type: 'SET_USER', payload: meQuery.data });
    } else if (meQuery.isError) {
      dispatch({ type: 'SET_USER', payload: null });
    }
  }, [meQuery.data, meQuery.isError]);

  const value: AppContextValue = {
    state,
    dispatch,
    isLoading: meQuery.isLoading,
    isAuthenticated: !!state.user,
    isOnboarded: !!state.user?.familyId && !!state.user?.role,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// ---------- Online status (oddělený hook, čte navigator.onLine) ----------

function subscribeOnline(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
}
