import React, { useState, useEffect, useRef } from 'react';
import styles from './styles.module.css';

export default function Workpapersettings({
  showAnsDirectly,
  showJiexiDirectly,
  onAnsChange,
  onJiexiChange,
  toggleForceExpandAll,
}) {
  const [internalAns, setInternalAns] = useState(showAnsDirectly);
  const [internalJiexi, setInternalJiexi] = useState(showJiexiDirectly);
  
  // ref 直接操作 DOM，绕过 Firefox session restore
  const buttonRef = useRef(null);

  useEffect(() => {
    const newAns = Boolean(showAnsDirectly);
    const newJiexi = Boolean(showJiexiDirectly);
    setInternalAns(newAns);
    setInternalJiexi(newJiexi);
    
    // 强制覆盖 Firefox 恢复的 disabled 状态
    if (buttonRef.current) {
      buttonRef.current.disabled = !(newAns || newJiexi);
    }
  }, [showAnsDirectly, showJiexiDirectly]);

  const isForceControlEnabled = internalAns || internalJiexi;

  const handleAnsChange = (e) => {
    const checked = e.target.checked;
    setInternalAns(checked);
    if (buttonRef.current) {
      buttonRef.current.disabled = !(checked || internalJiexi);
    }
    onAnsChange?.(e);
  };

  const handleJiexiChange = (e) => {
    const checked = e.target.checked;
    setInternalJiexi(checked);
    if (buttonRef.current) {
      buttonRef.current.disabled = !(internalAns || checked);
    }
    onJiexiChange?.(e);
  };

  return (
    <div className={styles.settingsCard}>
      <h3 className={styles.settingsTitle}>答题设置</h3>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={internalAns || false}
          onChange={handleAnsChange}
          autoComplete="off"
        />
        直接显示答案
      </label>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={internalJiexi || false}
          onChange={handleJiexiChange}
          disabled={internalAns}
          autoComplete="off"
        />
        直接显示解析
      </label>
      <div className={styles.controlRow}>
        <button
          ref={buttonRef}
          className={styles.toggleAllBtn}
          onClick={toggleForceExpandAll}
          disabled={!isForceControlEnabled}
          autoComplete="off"
        >
          展开/收起解析
        </button>
      </div>
    </div>
  );
}