import React from 'react';
import { useParams } from 'react-router-dom';
import { ProblemListPage } from './ProblemListPage.tsx';
import { ProblemDetailPage } from './ProblemDetailPage.tsx';

export const ProblemPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (id) {
    return <ProblemDetailPage />;
  }

  return <ProblemListPage />;
};

export default ProblemPage;
