import {
  vscodeDark,
  monokai,
  dracula,
  githubDark,
  githubLight,
} from '@uiw/codemirror-themes-all';
import { oneDark } from '@codemirror/theme-one-dark';
import { Extension } from '@codemirror/state';

export type ThemeId =
  | 'vscode-dark'
  | 'monokai'
  | 'dracula'
  | 'github-dark'
  | 'one-dark-pro'
  | 'light-modern';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  isDark: boolean;
  themeExtension: Extension;
  badgeBg: string;
}

export const IDE_THEMES: Record<ThemeId, ThemeOption> = {
  'vscode-dark': {
    id: 'vscode-dark',
    name: 'Dark+ (VS Code)',
    isDark: true,
    themeExtension: vscodeDark,
    badgeBg: 'bg-blue-600',
  },
  'monokai': {
    id: 'monokai',
    name: 'Monokai',
    isDark: true,
    themeExtension: monokai,
    badgeBg: 'bg-amber-600',
  },
  'dracula': {
    id: 'dracula',
    name: 'Dracula',
    isDark: true,
    themeExtension: dracula,
    badgeBg: 'bg-purple-600',
  },
  'github-dark': {
    id: 'github-dark',
    name: 'GitHub Dark',
    isDark: true,
    themeExtension: githubDark,
    badgeBg: 'bg-slate-700',
  },
  'one-dark-pro': {
    id: 'one-dark-pro',
    name: 'One Dark Pro',
    isDark: true,
    themeExtension: oneDark,
    badgeBg: 'bg-cyan-700',
  },
  'light-modern': {
    id: 'light-modern',
    name: 'Light Modern',
    isDark: false,
    themeExtension: githubLight,
    badgeBg: 'bg-slate-300',
  },
};

export interface EditorSettings {
  theme: ThemeId;
  fontSize: number; // 12, 14, 16, 18, 20
  fontFamily: string; // 'Fira Code', 'JetBrains Mono', etc.
  lineHeight: number; // 1.4, 1.6, 1.8
  tabSize: number; // 2, 4
  wordWrap: boolean;
  showMinimap: boolean;
}

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  theme: 'vscode-dark',
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace",
  lineHeight: 1.6,
  tabSize: 4,
  wordWrap: false,
  showMinimap: true,
};
