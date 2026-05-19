import React, { useState, useMemo, useCallback } from 'react';
import Workpapersettings from '@theme/Workpapersettings';
import { QuizContext } from '../QuizContext';
import styles from './styles.module.css';

export default function Workpaper({ children }) {
  const settingsElement = useMemo(() => {
    const childrenArr = React.Children.toArray(children);
    return childrenArr.find(child => child.type === Workpapersettings);
  }, [children]);

  const initialShowAns =
    settingsElement?.props?.showans === 'true' ||
    settingsElement?.props?.showans === true;
  const initialShowJiexi =
    settingsElement?.props?.showjiexi === 'true' ||
    settingsElement?.props?.showjiexi === true;

  const [showAnsDirectly, setShowAnsDirectly] = useState(initialShowAns);
  const [showJiexiDirectlyUser, setShowJiexiDirectlyUser] = useState(initialShowJiexi);
  const [forceExpandAllState, setForceExpandAllState] = useState(null);

  const showJiexiDirectly = showAnsDirectly || showJiexiDirectlyUser;

  const handleAnsChange = useCallback(() => {
    setShowAnsDirectly(prev => !prev);
  }, []);

  const handleJiexiChange = useCallback(() => {
    setShowJiexiDirectlyUser(prev => !prev);
  }, []);

  // 首次点击强制收起
  const toggleForceExpandAll = useCallback(() => {
    setForceExpandAllState(prev => {
      if (prev === null) return false;
      return !prev;
    });
  }, []);

  const contextValue = useMemo(
    () => ({
      showAnsDirectly,
      showJiexiDirectly,
      forceExpandAllState,
      setForceExpandAllState,
      toggleForceExpandAll,
    }),
    [showAnsDirectly, showJiexiDirectly, forceExpandAllState, toggleForceExpandAll]
  );

  const renderedChildren = useMemo(() => {
    const childrenArr = React.Children.toArray(children);
    return childrenArr.map(child => {
      if (child.type === Workpapersettings) {
        return React.cloneElement(child, {
          showAnsDirectly,
          showJiexiDirectlyUser,
          showJiexiDirectly,
          onAnsChange: handleAnsChange,
          onJiexiChange: handleJiexiChange,
          toggleForceExpandAll,
        });
      }
      return child;
    });
  }, [children, showAnsDirectly, showJiexiDirectlyUser, showJiexiDirectly, handleAnsChange, handleJiexiChange, toggleForceExpandAll]);

  return (
    <QuizContext.Provider value={contextValue}>
      <div className={styles.workpaper}>{renderedChildren}</div>
    </QuizContext.Provider>
  );
}