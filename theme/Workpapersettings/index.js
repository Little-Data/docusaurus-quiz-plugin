import React from 'react';
import styles from './styles.module.css';

export default function Workpapersettings({
  showAnsDirectly,
  showJiexiDirectlyUser,
  showJiexiDirectly,
  onAnsChange,
  onJiexiChange,
}) {
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
    </div>
  );
}