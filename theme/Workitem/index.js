import React, { useState, useMemo, useCallback, useContext, useLayoutEffect } from 'react';
import Wenben from '@theme/Wenben';
import Xuanxiang from '@theme/Xuanxiang';
import Jiexi from '@theme/Jiexi';
import Ansinput from '@theme/Ansinput';
import { QuizContext } from '../QuizContext';
import styles from './styles.module.css';

export default function Workitem({ children, xuanze, tiankong, ...rest }) {
  const { wenbenContent, options, jiexiContent, hasAnsinput } = useMemo(() => {
    const items = React.Children.toArray(children);
    const wenben = items.find(child => child.type === Wenben);
    const opts = items.filter(child => child.type === Xuanxiang);
    const jiexi = items.find(child => child.type === Jiexi);
    const ansinput = items.find(child => child.type === Ansinput);

    return {
      wenbenContent: wenben ? wenben.props.children : '',
      options: opts.map(opt => ({
        text: opt.props.children,
        isAnswer: opt.props.ans !== undefined,
        label: opt.props.label || null,
      })),
      jiexiContent: jiexi ? jiexi.props.children : null,
      hasAnsinput: !!ansinput,
    };
  }, [children]);

  const isSelection = xuanze !== undefined;
  const isFill = tiankong !== undefined;

  if (isSelection) {
    return (
      <SelectionQuestion
        question={wenbenContent}
        options={options}
        jiexi={jiexiContent}
      />
    );
  }

  if (isFill) {
    return (
      <FillQuestion
        question={wenbenContent}
        hasAnsinput={hasAnsinput}
        jiexi={jiexiContent}
      />
    );
  }

  return (
    <div className={styles.item}>
      <div className={styles.question}>{wenbenContent}</div>
    </div>
  );
}

function SelectionQuestion({ question, options, jiexi }) {
  const { showAnsDirectly, showJiexiDirectly } = useContext(QuizContext);
  const isMultiple = options.filter(o => o.isAnswer).length > 1;
  const correctAnswers = useMemo(
    () => options.map((o, idx) => (o.isAnswer ? idx : -1)).filter(i => i !== -1),
    [options]
  );

  // 用户交互状态
  const [userSelected, setUserSelected] = useState(isMultiple ? new Set() : null);
  const [userLocked, setUserLocked] = useState(false);
  const [redoCount, setRedoCount] = useState(0);

  // 当 showAnsDirectly 或 showJiexiDirectly 变化时，重置用户状态（除非 showAnsDirectly 开启）
  useLayoutEffect(() => {
    if (showAnsDirectly) {
      setUserSelected(isMultiple ? new Set(correctAnswers) : correctAnswers[0]);
      setUserLocked(true);
    } else {
      setUserSelected(isMultiple ? new Set() : null);
      setUserLocked(false);
      setRedoCount(0);
    }
  }, [showAnsDirectly, showJiexiDirectly, isMultiple, correctAnswers]);

  // 计算实际状态
  const locked = showAnsDirectly || userLocked;
  const selected = showAnsDirectly ? (isMultiple ? new Set(correctAnswers) : correctAnswers[0]) : userSelected;
  const showJiexi = showAnsDirectly || showJiexiDirectly || userLocked;

  const handleSingleClick = useCallback(
    (idx) => {
      if (locked) return;
      setUserSelected(idx);
      setUserLocked(true);
    },
    [locked]
  );

  const handleMultipleClick = useCallback(
    (idx) => {
      if (locked) return;
      setUserSelected(prev => {
        const newSet = new Set(prev);
        if (newSet.has(idx)) newSet.delete(idx);
        else newSet.add(idx);
        return newSet;
      });
    },
    [locked]
  );

  const handleSubmit = useCallback(() => {
    setUserLocked(true);
  }, []);

  const handleReset = useCallback(() => {
    setUserSelected(isMultiple ? new Set() : null);
    setUserLocked(false);
    setRedoCount(prev => prev + 1);
  }, [isMultiple]);

  const isCorrect = (idx) => {
    if (!locked) return null;
    const isSelected = selected.has ? selected.has(idx) : selected === idx;
    const isAns = correctAnswers.includes(idx);
    if (isAns && isSelected) return 'correct';
    if (!isAns && isSelected) return 'incorrect';
    if (isAns && !isSelected) return 'missed';
    return null;
  };

  const hasSelection = isMultiple ? selected.size > 0 : selected !== null;
  const showReset = !showAnsDirectly && locked;

  return (
    <div className={styles.item}>
      <div className={styles.question}>{question}</div>
      <div className={`${styles.options} ${isMultiple ? styles.multiple : ''}`}>
        {options.map((opt, idx) => {
          const status = isCorrect(idx);
          let optionClass = styles.option;
          if (locked) {
            if (status === 'correct') optionClass += ` ${styles.correct}`;
            else if (status === 'incorrect') optionClass += ` ${styles.incorrect}`;
            else if (status === 'missed') optionClass += ` ${styles.missed}`;
          } else {
            if (isMultiple ? selected.has(idx) : selected === idx) {
              optionClass += ` ${styles.selected}`;
            }
          }
          return (
            <button
              key={idx}
              className={optionClass}
              onClick={() =>
                isMultiple ? handleMultipleClick(idx) : handleSingleClick(idx)
              }
              disabled={locked}
            >
              <span className={styles.optionLabel}>
                {opt.label || String.fromCharCode(65 + idx)}
              </span>
              <span className={styles.optionText}>{opt.text}</span>
            </button>
          );
        })}
      </div>

      {isMultiple && !locked && (
        <button
          className={`${styles.submitBtn} ${!hasSelection ? styles.hiddenBtn : ''}`}
          onClick={handleSubmit}
          disabled={!hasSelection}
        >
          确定
        </button>
      )}

      {showReset && (
        <button className={styles.resetBtn} onClick={handleReset}>
          重置
        </button>
      )}
      {!locked && redoCount > 0 && (
        <span className={styles.redoCount}>重做次数: {redoCount}</span>
      )}

      {showJiexi && jiexi && (
        <div className={styles.jiexi}>
          <div className={styles.jiexiTitle}>解析</div>
          <div className={styles.jiexiContent}>{jiexi}</div>
        </div>
      )}
    </div>
  );
}

function FillQuestion({ question, hasAnsinput, jiexi }) {
  const { showAnsDirectly, showJiexiDirectly } = useContext(QuizContext);

  const [userLocked, setUserLocked] = useState(false);
  const [redoCount, setRedoCount] = useState(0);
  const [inputValue, setInputValue] = useState('');

  useLayoutEffect(() => {
    if (showAnsDirectly) {
      setUserLocked(true);
    } else {
      setUserLocked(false);
      setRedoCount(0);
      setInputValue('');
    }
  }, [showAnsDirectly]);

  const locked = showAnsDirectly || userLocked;
  const showJiexi = showAnsDirectly || showJiexiDirectly || userLocked;

  const handleSubmit = useCallback(() => {
    setUserLocked(true);
  }, []);

  const handleReset = useCallback(() => {
    setUserLocked(false);
    setRedoCount(prev => prev + 1);
    setInputValue('');
  }, []);

  const showReset = !showAnsDirectly && locked;
  const hasContent = inputValue.trim().length > 0;

  return (
    <div className={styles.item}>
      <div className={styles.question}>{question}</div>
      {hasAnsinput && !showAnsDirectly && (
        <div className={styles.fillArea}>
          <textarea
            className={styles.textarea}
            rows={4}
            placeholder="请输入你的答案..."
            readOnly={locked}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          {!locked && (
            <button
              className={`${styles.submitBtn} ${!hasContent ? styles.hiddenBtn : ''}`}
              onClick={handleSubmit}
              disabled={!hasContent}
            >
              确定
            </button>
          )}
        </div>
      )}

      {showReset && (
        <button className={styles.resetBtn} onClick={handleReset}>
          重置
        </button>
      )}
      {!locked && redoCount > 0 && (
        <span className={styles.redoCount}>重做次数: {redoCount}</span>
      )}

      {showJiexi && jiexi && (
        <div className={styles.jiexi}>
          <div className={styles.jiexiTitle}>解析</div>
          <div className={styles.jiexiContent}>{jiexi}</div>
        </div>
      )}
    </div>
  );
}