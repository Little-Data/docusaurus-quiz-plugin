import React from 'react';
import styles from './styles.module.css';

export default function Workpapersettings({
  showAnsDirectly,
  showJiexiDirectlyUser,
  showJiexiDirectly,
  onAnsChange,
  onJiexiChange,
  toggleForceExpandAll,
}) {
  // 解析折叠控制按钮仅在直接显示答案或直接显示解析时可用
  const isForceControlEnabled = showAnsDirectly || showJiexiDirectly;

  return (
    <div className={styles.settingsCard}>
      <h3 className={styles.settingsTitle}>答题设置</h3>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={showAnsDirectly || false}
          onChange={onAnsChange}
        />
        直接显示答案
      </label>
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={showJiexiDirectly || false}
          onChange={onJiexiChange}
          disabled={showAnsDirectly}
        />
        直接显示解析
      </label>
      <div className={styles.controlRow}>
        <button
          className={styles.toggleAllBtn}
          onClick={toggleForceExpandAll}
          disabled={!isForceControlEnabled}
        >
          展开/收起解析
        </button>
      </div>
    </div>
  );
}