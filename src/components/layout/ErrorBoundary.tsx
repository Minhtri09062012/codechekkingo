import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RotateCcw, RefreshCw } from 'lucide-react';

interface Props {
  fallbackTitle?: string;
  onReset?: () => void;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary caught an error]', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.hash = '#/';
  };

  handleReloadApp = (): void => {
    // Vị trí DUY NHẤT được phép gọi window.location.reload() theo Quy tắc 19
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle || 'Bài này đang gặp lỗi';
      const errorMessage = this.state.error?.message || 'Đã xảy ra lỗi không mong muốn trong quá trình kết xuất.';

      return (
        <div className="p-6 sm:p-10 max-w-2xl mx-auto my-8 rounded-3xl bg-slate-900/90 border border-rose-500/40 shadow-2xl space-y-6 animate-fade-in text-slate-100">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-rose-300 tracking-tight">
                {title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Hệ thống đã cách ly lỗi để bảo vệ khung ứng dụng. Thanh điều hướng và thanh bên vẫn hoạt động bình thường, bạn có thể chuyển sang bài khác hoặc quay về Trang chủ.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-rose-300/90 overflow-x-auto whitespace-pre-wrap max-h-48">
            {errorMessage}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thử lại</span>
            </button>

            <button
              type="button"
              onClick={this.handleGoHome}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Về Trang chủ</span>
            </button>

            <button
              type="button"
              onClick={this.handleReloadApp}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-medium text-xs border border-slate-800 transition-all flex items-center gap-2 cursor-pointer ml-auto"
              title="Chỉ dùng khi ứng dụng bị lỗi trạng thái nghiêm trọng"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tải lại ứng dụng</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
