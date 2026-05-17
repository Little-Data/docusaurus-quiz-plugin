import React, { useState, useCallback, useMemo } from 'react';
import Workpapersettings from '@theme/Workpapersettings';
import { QuizContext } from '../QuizContext';
import styles from './styles.module.css';

export default function Workpaper({ children }) {
  // 从 children 中提取 Workpapersettings 的初始属性
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

  const showJiexiDirectly = showAnsDirectly || showJiexiDirectlyUser;

  const handleAnsChange = useCallback(() => {
    setShowAnsDirectly(prev => !prev);
  }, []);

  const handleJiexiChange = useCallback(() => {
    setShowJiexiDirectlyUser(prev => !prev);
  }, []);

  const contextValue = useMemo(
    () => ({ showAnsDirectly, showJiexiDirectly }),
    [showAnsDirectly, showJiexiDirectly]
  );

  // 重新渲染 children，将 Workpapersettings 替换为注入状态和回调的版本
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
        });
      }
      return child;
    });
  }, [children, showAnsDirectly, showJiexiDirectlyUser, showJiexiDirectly, handleAnsChange, handleJiexiChange]);

  return (
    <QuizContext.Provider value={contextValue}>
      <div className={styles.workpaper}>{renderedChildren}</div>
    </QuizContext.Provider>
  );
}