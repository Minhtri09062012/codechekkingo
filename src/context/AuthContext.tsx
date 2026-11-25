import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { safeParseJson } from '../core/safeFetch.ts';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string;
  googleId?: string;
  isBot?: boolean;
  school?: string;
  totalXp: number;
  monthlyXp: number;
  weeklyXp: number;
  dailyXp: number;
  level: 'nen-tang' | 'co-ban' | 'trung-cap' | 'nang-cao';
  streak: number;
  lastActiveDate: string;
  solvedCount: number;
  lessonsCount: number;
  createdAt: string;
  updatedAt: string;
  solvedProblems: string[];
  completedLessons: string[];
}

export interface IdeFile {
  id: string;
  name: string;
  content: string;
  updatedAt: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  registerRealUser: (data: {
    name: string;
    school?: string;
    avatar?: string;
    email?: string;
    initialProgress?: any;
  }) => Promise<{ success: boolean; message?: string; error?: string }>;
  loginWithGoogleToken: (idToken?: string, accessToken?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  linkGoogleAccount: (idToken: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  logout: () => Promise<void>;
  awardXp: (activityType: string, sourceId?: string, details?: any) => Promise<number | null>;
  userFiles: IdeFile[];
  setUserFiles: React.Dispatch<React.SetStateAction<IdeFile[]>>;
  saveFilesToCloud: (files: IdeFile[]) => Promise<boolean>;
  googleClientId: string;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_STORAGE_KEY = 'codetrekking_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(SESSION_STORAGE_KEY);
  });
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userFiles, setUserFiles] = useState<IdeFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [googleClientId, setGoogleClientId] = useState<string>('1048638647413-demo.apps.googleusercontent.com');

  // Load OAuth Config
  useEffect(() => {
    fetch('/api/auth/config')
      .then((res) => safeParseJson(res))
      .then((parsed) => {
        if (parsed.ok && parsed.data.googleClientId) {
          setGoogleClientId(parsed.data.googleClientId);
        }
      })
      .catch((err) => console.warn('Could not fetch auth config:', err));
  }, []);

  // Fetch Current User
  const refreshUserData = useCallback(async () => {
    const currentToken = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (res.ok) {
        const parsed = await safeParseJson(res);
        if (parsed.ok) {
          setUser(parsed.data.user);
          if (parsed.data.files && Array.isArray(parsed.data.files)) {
            setUserFiles(parsed.data.files);
          }
        }
      } else if (res.status === 401) {
        // Token expired or invalid
        localStorage.removeItem(SESSION_STORAGE_KEY);
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.warn('Failed to verify session token:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  // Google OAuth Login
  const loginWithGoogleToken = async (idToken?: string, accessToken?: string) => {
    try {
      const res = await fetch('/api/auth/google/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, accessToken }),
      });

      const parsed = await safeParseJson(res);
      if (!parsed.ok) {
        return {
          success: false,
          error: 'SERVER_UNAVAILABLE',
          message: parsed.message,
        };
      }
      const data = parsed.data;

      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'LOGIN_FAILED',
          message: data.message || 'Đăng nhập Google không thành công.',
        };
      }

      localStorage.setItem(SESSION_STORAGE_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      if (data.files) {
        setUserFiles(data.files);
      }
      setIsLoginModalOpen(false);

      return {
        success: true,
        message: data.message || 'Đăng nhập thành công!',
      };
    } catch (err: any) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: err?.message || 'Lỗi mạng khi kết nối máy chủ xác thực.',
      };
    }
  };

  // Direct Real User Registration (No Google ID required)
  const registerRealUser = async (data: {
    name: string;
    school?: string;
    avatar?: string;
    email?: string;
    initialProgress?: any;
  }) => {
    try {
      const res = await fetch('/api/auth/register-real', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const parsed = await safeParseJson(res);
      if (!parsed.ok) {
        return {
          success: false,
          error: 'SERVER_UNAVAILABLE',
          message: parsed.message,
        };
      }
      const resData = parsed.data;
      if (!res.ok) {
        return {
          success: false,
          error: resData.error || 'REGISTER_FAILED',
          message: resData.message || 'Đăng ký không thành công.',
        };
      }

      localStorage.setItem(SESSION_STORAGE_KEY, resData.token);
      setToken(resData.token);
      setUser(resData.user);
      if (resData.files) {
        setUserFiles(resData.files);
      }
      setIsLoginModalOpen(false);

      return {
        success: true,
        message: resData.message || 'Ghi danh bảng xếp hạng thành công!',
      };
    } catch (err: any) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: err?.message || 'Lỗi mạng khi kết nối máy chủ.',
      };
    }
  };

  // Link Google Account
  const linkGoogleAccount = async (idToken: string) => {
    if (!token) return { success: false, message: 'Bạn chưa đăng nhập' };

    try {
      const res = await fetch('/api/auth/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ idToken }),
      });

      const parsed = await safeParseJson(res);
      if (!parsed.ok) {
        return { success: false, message: parsed.message };
      }
      const data = parsed.data;
      if (!res.ok) {
        return { success: false, message: data.message || 'Liên kết thất bại' };
      }

      setUser(data.user);
      return { success: true, message: data.message || 'Liên kết tài khoản Google thành công!' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Lỗi khi liên kết tài khoản' };
    }
  };

  // Logout
  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        // Ignore network errors on logout
      }
    }
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setToken(null);
    setUser(null);
    setUserFiles([]);
  };

  // Award XP
  const awardXp = async (activityType: string, sourceId?: string, details?: any): Promise<number | null> => {
    if (!token) return null;

    try {
      const res = await fetch('/api/xp/award', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activityType, sourceId, details }),
      });

      if (res.ok) {
        const parsed = await safeParseJson(res);
        if (parsed.ok && parsed.data.success && parsed.data.user) {
          setUser(parsed.data.user);
          return parsed.data.addedXp;
        }
      }
    } catch (e) {
      console.warn('Failed to award XP on server:', e);
    }
    return null;
  };

  // Save files to cloud
  const saveFilesToCloud = async (files: IdeFile[]): Promise<boolean> => {
    try {
      const res = await fetch('/api/ide/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ files }),
      });
      return res.ok;
    } catch (e) {
      console.warn('Failed to save files:', e);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn: !!user,
        isLoading,
        isLoginModalOpen,
        openLoginModal: () => setIsLoginModalOpen(true),
        closeLoginModal: () => setIsLoginModalOpen(false),
        registerRealUser,
        loginWithGoogleToken,
        linkGoogleAccount,
        logout,
        awardXp,
        userFiles,
        setUserFiles,
        saveFilesToCloud,
        googleClientId,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
