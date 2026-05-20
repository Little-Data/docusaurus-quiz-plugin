import React, { useState, useCallback, useLayoutEffect, useRef, useMemo } from 'react';
import Workpapersettings from '@theme/Workpapersettings';
import { QuizContext } from '../QuizContext';
import styles from './styles.module.css';

export default function Workpaper({ children }) {
  const initialSettings = useMemo(() => {
    const settingsElement = React.Children.toArray(children).find(
      child => child.type === Workpapersettings
    );
    return {
      showAns: settingsElement?.props?.showans === 'true' || settingsElement?.props?.showans === true,
      showJiexi: settingsElement?.props?.showjiexi === 'true' || settingsElement?.props?.showjiexi === true,
    };
  }, []);

  // 使用单一状态对象，确保所有状态原子性更新
  const [settings, setSettings] = useState({
    showAnsDirectly: initialSettings.showAns,
    showJiexiDirectlyUser: initialSettings.showJiexi,
    forceExpandAllState: null,
  });

  const { showAnsDirectly, showJiexiDirectlyUser, forceExpandAllState } = settings;

  // 使用 ref 追踪上一次的初始设置值
  const prevInitialRef = useRef(initialSettings);
  const hasMountedRef = useRef(false);

  // 使用 useLayoutEffect 确保在浏览器绘制前同步状态
  useLayoutEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const prev = prevInitialRef.current;
    if (prev.showAns !== initialSettings.showAns || prev.showJiexi !== initialSettings.showJiexi) {
      setSettings({
        showAnsDirectly: initialSettings.showAns,
        showJiexiDirectlyUser: initialSettings.showJiexi,
        forceExpandAllState: null,
      });
      prevInitialRef.current = initialSettings;
    }
  }, [initialSettings]);

  const showJiexiDirectly = Boolean(showAnsDirectly) || Boolean(showJiexiDirectlyUser);

  const handleAnsChange = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      showAnsDirectly: !prev.showAnsDirectly,
    }));
  }, []);

  const handleJiexiChange = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      showJiexiDirectlyUser: !prev.showJiexiDirectlyUser,
    }));
  }, []);

  const toggleForceExpandAll = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      forceExpandAllState: prev.forceExpandAllState === null ? false : !prev.forceExpandAllState,
    }));
  }, []);

  const contextValue = useMemo(() => ({
    showAnsDirectly,
    showJiexiDirectly,
    forceExpandAllState,
    setForceExpandAllState: (val) => setSettings(prev => ({ ...prev, forceExpandAllState: val })),
  }), [showAnsDirectly, showJiexiDirectly, forceExpandAllState]);

  const modifiedChildren = React.Children.map(children, child => {
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

  return (
    <QuizContext.Provider value={contextValue}>
      <div className={styles.workpaper}>{modifiedChildren}</div>
    </QuizContext.Provider>
  );
}