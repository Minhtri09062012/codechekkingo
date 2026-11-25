import React from 'react';
import {
  Lesson,
  Step,
  SnapshotOf,
  TextSnapshot,
  ArraySnapshot,
  GridSnapshot,
  TableSnapshot,
} from '../../core/types.ts';
import { RegisteredLesson } from '../../core/registry.ts';
import { catalog } from '../../core/catalog.ts';
import { VarsRenderer } from './VarsRenderer.tsx';
import { ArrayRenderer } from './ArrayRenderer.tsx';
import { GridRenderer } from './GridRenderer.tsx';
import { ConsoleRenderer } from './ConsoleRenderer.tsx';
import { TableRenderer } from './TableRenderer.tsx';
import { PlaceholderRenderer } from './PlaceholderRenderer.tsx';

export type { SnapshotOf, TextSnapshot, ArraySnapshot, GridSnapshot, TableSnapshot };
export * from './VarsRenderer.tsx';
export * from './ArrayRenderer.tsx';
export * from './GridRenderer.tsx';
export * from './ConsoleRenderer.tsx';
export * from './TableRenderer.tsx';
export * from './PlaceholderRenderer.tsx';

export function resolveRenderer(
  lesson: Lesson | RegisteredLesson
): React.FC<{ step: Step }> {
  // 1. Nếu bài học có khai báo Renderer tùy biến trong file
  if ('Renderer' in lesson && lesson.Renderer) {
    return lesson.Renderer;
  }

  // 2. Nếu là RegisteredLesson có content?.Renderer
  if ('content' in lesson && lesson.content?.Renderer) {
    return lesson.content.Renderer;
  }

  // 3. Renderer mặc định theo rendererKind
  const kind =
    'rendererKind' in lesson
      ? lesson.rendererKind
      : catalog.find((c) => c.id === lesson.id)?.rendererKind || 'vars';
  switch (kind) {
    case 'text':
      return ConsoleRenderer;
    case 'vars':
      return VarsRenderer;
    case 'array':
      return ArrayRenderer;
    case 'grid':
      return GridRenderer;
    case 'table':
      return TableRenderer;
    default:
      return (props: { step: Step }) => <PlaceholderRenderer step={props.step} kind={kind} />;
  }
}

