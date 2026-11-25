import React from 'react';

// =======================================================================
// NGUỒN CHÂN LÝ DUY NHẤT CHO NHẬN DIỆN THƯƠNG HIỆU (BRANDING)
// =======================================================================

export const APP_NAME = 'CodeTrekking';
export const APP_TAGLINE = 'Hành trình chinh phục thuật toán, từng bước một';
export const APP_SHORT_NAME = 'CodeTrek';
export const EXPORT_PREFIX = 'codetrekking';

/**
 * Biểu tượng (Icon) núi và đường mòn zích zắc:
 * Gợi hình ảnh đỉnh núi tri thức và con đường leo núi từng bước (step-by-step).
 */
export const BrandIcon: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  const dim = sizeMap[size] || sizeMap.md;

  return React.createElement(
    'div',
    {
      className: `relative rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-1.5 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white shrink-0 ${dim} ${className}`,
      'aria-hidden': 'true',
    },
    React.createElement(
      'svg',
      {
        viewBox: '0 0 32 32',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        className: 'w-full h-full',
      },
      React.createElement('path', {
        d: 'M17 10L26 25H12L17 10Z',
        fill: 'currentColor',
        fillOpacity: '0.35',
      }),
      React.createElement('path', {
        d: 'M11 6L21 26H1L11 6Z',
        fill: 'currentColor',
        fillOpacity: '0.75',
      }),
      React.createElement('path', {
        d: 'M11 6L14 12L12 14L10 13L8 14L11 6Z',
        fill: '#FFFFFF',
      }),
      React.createElement('path', {
        d: 'M4 25C7 24 10 23 8 20C6 17 12 17 10 14C8 11 11 8 11 6',
        stroke: '#F59E0B',
        strokeWidth: '2',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeDasharray: '1.5 2',
      }),
      React.createElement('circle', { cx: '8', cy: '20', r: '1.2', fill: '#FDE68A' }),
      React.createElement('circle', { cx: '10', cy: '14', r: '1.2', fill: '#FDE68A' }),
      React.createElement('circle', { cx: '11', cy: '6', r: '1.5', fill: '#EF4444' })
    )
  );
};

/**
 * Wordmark hoàn chỉnh: Biểu tượng Núi & Đường mòn + Tên thương hiệu.
 * Tự động thu gọn thành APP_SHORT_NAME trên màn hình hẹp (mobile header).
 */
export const BrandLogo: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  shortOnMobile?: boolean;
  className?: string;
}> = ({ size = 'md', showTagline = false, shortOnMobile = false, className = '' }) => {
  const icon = React.createElement(BrandIcon, { size });

  let nameEl: React.ReactNode;
  if (shortOnMobile) {
    nameEl = React.createElement(
      React.Fragment,
      null,
      React.createElement(
        'span',
        {
          className:
            'font-black text-base sm:hidden tracking-tight bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 bg-clip-text text-transparent',
        },
        APP_SHORT_NAME
      ),
      React.createElement(
        'span',
        {
          className:
            'font-black text-base lg:text-lg hidden sm:inline tracking-tight bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 bg-clip-text text-transparent',
        },
        APP_NAME
      )
    );
  } else {
    nameEl = React.createElement(
      'span',
      {
        className: `font-black tracking-tight bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 bg-clip-text text-transparent ${
          size === 'lg' ? 'text-2xl sm:text-3xl' : 'text-base lg:text-lg'
        }`,
      },
      APP_NAME
    );
  }

  const titleRow = React.createElement(
    'div',
    { className: 'flex items-center gap-2' },
    nameEl
  );

  const taglineEl = showTagline
    ? React.createElement(
        'span',
        { className: 'text-xs text-slate-400 font-medium' },
        APP_TAGLINE
      )
    : null;

  const textCol = React.createElement(
    'div',
    { className: 'flex flex-col' },
    titleRow,
    taglineEl
  );

  return React.createElement(
    'div',
    { className: `flex items-center gap-2.5 ${className}` },
    icon,
    textCol
  );
};
