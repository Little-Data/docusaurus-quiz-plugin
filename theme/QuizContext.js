import { createContext } from 'react';

export const QuizContext = createContext({
  showAnsDirectly: false,
  showJiexiDirectly: false,
  forceExpandAllState: null,
  setForceExpandAllState: () => {},
});