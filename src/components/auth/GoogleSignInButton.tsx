import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Loader2 } from 'lucide-react';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (err: string) => void;
  text?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

declare global {
  interface Window {
    google?: any;
    __handleGoogleCredential?: (response: any) => void;
  }
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  text = 'Đăng nhập bằng Google',
  className = '',
  size = 'md',
}) => {
  const { loginWithGoogleToken, googleClientId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const gsiContainerRef = useRef<HTMLDivElement>(null);

  // Initialize Google Identity Services
  useEffect(() => {
    let scriptLoaded = false;
    const existingScript = document.getElementById('google-gsi-script');

    const initGsi = () => {
      if (!window.google?.accounts?.id || !googleClientId) return;

      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response: any) => {
            if (response?.credential) {
              setIsLoading(true);
              const res = await loginWithGoogleToken(response.credential);
              setIsLoading(false);
              if (res.success) {
                onSuccess?.();
              } else {
                onError?.(res.message || 'Đăng nhập thất bại');
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Try to render official button if container exists
        if (gsiContainerRef.current) {
          gsiContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(gsiContainerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: size === 'lg' ? 'large' : size === 'sm' ? 'small' : 'medium',
            text: 'signin_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: size === 'lg' ? 260 : 220,
            locale: 'vi',
          });
        }
      } catch (err) {
        console.warn('Google GSI initialization notice:', err);
      }
    };

    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        scriptLoaded = true;
        initGsi();
      };
      document.body.appendChild(script);
    } else {
      initGsi();
    }

    return () => {
      // cleanup if needed
    };
  }, [googleClientId, loginWithGoogleToken, size, onSuccess, onError]);

  // Fallback click handler that launches GSI prompt or simulated OAuth credential dialog
  const handleClick = async () => {
    if (isLoading) return;

    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Prompt could not display (e.g. third-party cookies disabled or in iframe)
            triggerOauthPopup();
          }
        });
        return;
      } catch (e) {
        console.warn('GSI prompt failed, falling back to popup:', e);
      }
    }

    triggerOauthPopup();
  };

  const triggerOauthPopup = async () => {
    setIsLoading(true);
    try {
      // In web app, we can use Google OAuth token client if available
      if (window.google?.accounts?.oauth2) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.access_token) {
              const res = await loginWithGoogleToken(undefined, tokenResponse.access_token);
              setIsLoading(false);
              if (res.success) {
                onSuccess?.();
              } else {
                onError?.(res.message || 'Đăng nhập không thành công');
              }
            } else {
              setIsLoading(false);
              onError?.('Không nhận được token xác thực từ Google');
            }
          },
        });
        client.requestAccessToken();
      } else {
        // Fallback to direct verification
        onError?.('Trình duyệt đang tải thư viện Google, vui lòng bấm lại sau 2 giây.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setIsLoading(false);
      onError?.(err?.message || 'Lỗi khi kích hoạt cửa sổ Google OAuth.');
    }
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <div className="flex flex-col items-center">
      {/* Official GSI Render Container */}
      <div ref={gsiContainerRef} className="empty:hidden" />

      {/* Styled Official-looking button fallback / primary action */}
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className={`group relative flex items-center justify-center gap-3 rounded-full border border-slate-700 bg-white font-medium text-slate-900 shadow-md transition-all hover:bg-slate-100 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 active:scale-[0.98] disabled:opacity-70 cursor-pointer ${sizeStyles[size]} ${className}`}
        aria-label="Đăng nhập bằng tài khoản Google"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        ) : (
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
            />
          </svg>
        )}
        <span className="font-semibold tracking-wide text-slate-800">
          {isLoading ? 'Đang xác thực Google...' : text}
        </span>
      </button>
    </div>
  );
};
