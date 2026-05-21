import React, { useState, useMemo, useCallback, useContext, useLayoutEffect, useReducer, useRef } from 'react';
import Wenben from '@theme/Wenben';
import Xuanxiang from '@theme/Xuanxiang';
import Jiexi from '@theme/Jiexi';
import Ansinput from '@theme/Ansinput';
import { QuizContext } from '../QuizContext';
import styles from './styles.module.css';

// 解析区域组件（带动画）
function JiexiSection({ jiexiContent, initialCollapsed, forceExpandAllState }) {
  const [isExpanded, setIsExpanded] = useState(!initialCollapsed);
  const [height, setHeight] = useState(0);
  const contentRef = useRef(null);

  useLayoutEffect(() => {
    if (forceExpandAllState !== null) {
      setIsExpanded(forceExpandAllState);
    }
  }, [forceExpandAllState]);

  // 当内容或展开状态变化时，重新计算高度
  useLayoutEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [jiexiContent, isExpanded]);

  const handleTitleClick = () => {
    setIsExpanded(prev => !prev);
  };

  if (!jiexiContent) return null;

  return (
    <div className={styles.jiexi}>
      <div className={styles.jiexiTitle} onClick={handleTitleClick}>
        <span className={`${styles.jiexiToggle} ${isExpanded ? styles.expanded : ''}`}>
          ▶
        </span>
        解析
      </div>
      <div
        className={styles.jiexiContentWrapper}
        style={{ maxHeight: isExpanded ? `${height}px` : '0' }}
      >
        <div className={styles.jiexiContent} ref={contentRef}>
          {jiexiContent}
        </div>
      </div>
    </div>
  );
}

// 选择题状态 reducer
function selectionReducer(state, action) {
  switch (action.type) {
    case 'SELECT_SINGLE':
      return { ...state, userSelected: action.payload, userLocked: true, redoCount: state.redoCount };
    case 'SELECT_MULTIPLE': {
      const newSelected = typeof action.payload === 'function'
        ? action.payload(state.userSelected)
        : action.payload;
      return { ...state, userSelected: newSelected, userLocked: false, redoCount: state.redoCount };
    }
    case 'SUBMIT':
      return { ...state, userLocked: true };
    case 'RESET':
      return { userSelected: action.payload.initialSelected, userLocked: false, redoCount: state.redoCount + 1 };
    case 'FORCE_SHOW_ANS':
      return { userSelected: action.payload.selected, userLocked: true, redoCount: 0 };
    case 'CLEAR_FORCE':
      return { userSelected: action.payload.initialSelected, userLocked: false, redoCount: 0 };
    default:
      return state;
  }
}

function SelectionQuestion({ question, options, jiexiContent, jiexiShouqi }) {
  const { showAnsDirectly, showJiexiDirectly, forceExpandAllState } = useContext(QuizContext);
  const isMultiple = options.filter(o => o.isAnswer).length > 1;
  const correctAnswers = useMemo(
    () => options.map((o, idx) => (o.isAnswer ? idx : -1)).filter(i => i !== -1),
    [options]
  );

  const initialSelected = useMemo(() => {
    return isMultiple ? new Set() : null;
  }, [isMultiple]);

  const [state, dispatch] = useReducer(selectionReducer, {
    userSelected: initialSelected,
    userLocked: false,
    redoCount: 0,
  });

  // 使用 useLayoutEffect 同步更新，避免闪烁
  useLayoutEffect(() => {
    if (showAnsDirectly) {
      const forcedSelected = isMultiple ? new Set(correctAnswers) : correctAnswers[0];
      dispatch({ type: 'FORCE_SHOW_ANS', payload: { selected: forcedSelected } });
    } else {
      dispatch({ type: 'CLEAR_FORCE', payload: { initialSelected } });
    }
  }, [showAnsDirectly, isMultiple, correctAnswers, initialSelected]);

  const locked = showAnsDirectly || state.userLocked;
  const selected = showAnsDirectly
    ? (isMultiple ? new Set(correctAnswers) : correctAnswers[0])
    : state.userSelected;
  const showJiexi = showAnsDirectly || showJiexiDirectly || state.userLocked;

  const initialCollapsed = useMemo(() => {
    if (jiexiShouqi !== undefined) return jiexiShouqi;
    return false;
  }, [jiexiShouqi]);

  const handleSingleClick = useCallback((idx) => {
    if (locked) return;
    dispatch({ type: 'SELECT_SINGLE', payload: idx });
  }, [locked]);

  const handleMultipleClick = useCallback((idx) => {
    if (locked) return;
    dispatch({
      type: 'SELECT_MULTIPLE',
      payload: (prev) => {
        const newSet = new Set(prev);
        if (newSet.has(idx)) newSet.delete(idx);
        else newSet.add(idx);
        return newSet;
      },
    });
  }, [locked]);

  const handleSubmit = useCallback(() => {
    dispatch({ type: 'SUBMIT' });
  }, []);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET', payload: { initialSelected } });
  }, [initialSelected]);

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
  const showReset = !showAnsDirectly && state.userLocked;

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

          const isInsideCodeBlock = (element) => {
            // 匹配 pre 标签，以及代码块内常见的交互按钮（复制、自动换行等）
            return element.closest('pre, button, [class*="codeBlock"], [class*="copyButton"], [class*="wrapButton"]');
          };

          const handleOptionClick = (e, idx) => {
            // 如果点击发生在代码块内部，让代码块自身的按钮处理，不触发选项切换
            if (isInsideCodeBlock(e.target)) return;
            if (locked) return;
            if (isMultiple) {
              handleMultipleClick(idx);
            } else {
              handleSingleClick(idx);
            }
          };

          const handleOptionKeyDown = (e, idx) => {
            if (e.key === 'Enter' || e.key === ' ') {
              // 键盘事件时，检查当前活动元素是否在代码块内
              if (isInsideCodeBlock(document.activeElement)) return;
              e.preventDefault();
              if (locked) return;
              if (isMultiple) {
                handleMultipleClick(idx);
              } else {
                handleSingleClick(idx);
              }
            }
          };

          return (
            <div
              key={idx}
              className={optionClass}
              role="button"
              tabIndex={locked ? -1 : 0}
              aria-disabled={locked}
              onClick={(e) => handleOptionClick(e, idx)}
              onKeyDown={(e) => handleOptionKeyDown(e, idx)}
            >
              <span className={styles.optionLabel}>
                {opt.label || String.fromCharCode(65 + idx)}
              </span>
              <span className={styles.optionText}>{opt.text}</span>
            </div>
          );
        })}
      </div>

      {isMultiple && !locked && (
        <div className={styles.submitRow}>
          {state.redoCount > 0 && <span className={styles.redoCount}>重做次数: {state.redoCount}</span>}
          <button
            className={`${styles.submitBtn} ${!hasSelection ? styles.hiddenBtn : ''}`}
            onClick={handleSubmit}
            disabled={!hasSelection}
          >
            确定
          </button>
        </div>
      )}

      <div className={styles.actionBar}>
        {showReset && (
          <button className={styles.resetBtn} onClick={handleReset}>
            重置
          </button>
        )}
        {!isMultiple && !locked && state.redoCount > 0 && !showAnsDirectly && (
          <span className={styles.redoCount}>重做次数: {state.redoCount}</span>
        )}
      </div>

      {showJiexi && jiexiContent && (
        <JiexiSection
          jiexiContent={jiexiContent}
          initialCollapsed={initialCollapsed}
          forceExpandAllState={forceExpandAllState}
        />
      )}
    </div>
  );
}

// 填空题状态 reducer
function fillReducer(state, action) {
  switch (action.type) {
    case 'SET_INPUT':
      return { ...state, inputValue: action.payload };
    case 'SUBMIT':
      return { ...state, userLocked: true };
    case 'RESET':
      return { userLocked: false, inputValue: '', redoCount: state.redoCount + 1 };
    case 'FORCE_SHOW_ANS':
      return { userLocked: true, inputValue: state.inputValue, redoCount: 0 };
    case 'CLEAR_FORCE':
      return { userLocked: false, inputValue: '', redoCount: 0 };
    default:
      return state;
  }
}

function FillQuestion({ question, hasAnsinput, jiexiContent, jiexiShouqi }) {
  const { showAnsDirectly, showJiexiDirectly, forceExpandAllState } = useContext(QuizContext);
  const [state, dispatch] = useReducer(fillReducer, {
    userLocked: false,
    inputValue: '',
    redoCount: 0,
  });

  useLayoutEffect(() => {
    if (showAnsDirectly) {
      dispatch({ type: 'FORCE_SHOW_ANS' });
    } else {
      dispatch({ type: 'CLEAR_FORCE' });
    }
  }, [showAnsDirectly]);

  const locked = showAnsDirectly || state.userLocked;
  const showJiexi = showAnsDirectly || showJiexiDirectly || state.userLocked;

  const initialCollapsed = useMemo(() => {
    if (jiexiShouqi !== undefined) return jiexiShouqi;
    return false;
  }, [jiexiShouqi]);

  const handleInputChange = useCallback((e) => {
    if (locked) return;
    dispatch({ type: 'SET_INPUT', payload: e.target.value });
  }, [locked]);

  const handleSubmit = useCallback(() => {
    if (state.inputValue.trim().length === 0) return;
    dispatch({ type: 'SUBMIT' });
  }, [state.inputValue]);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const showReset = !showAnsDirectly && state.userLocked;
  const hasContent = state.inputValue.trim().length > 0;

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
            value={state.inputValue}
            onChange={handleInputChange}
          />
        </div>
      )}

      {!locked && hasAnsinput && !showAnsDirectly && (
        <div className={styles.submitRow}>
          {state.redoCount > 0 && <span className={styles.redoCount}>重做次数: {state.redoCount}</span>}
          <button
            className={`${styles.submitBtn} ${!hasContent ? styles.hiddenBtn : ''}`}
            onClick={handleSubmit}
            disabled={!hasContent}
          >
            确定
          </button>
        </div>
      )}

      <div className={styles.actionBar}>
        {showReset && (
          <button className={styles.resetBtn} onClick={handleReset}>
            重置
          </button>
        )}
      </div>

      {showJiexi && jiexiContent && (
        <JiexiSection
          jiexiContent={jiexiContent}
          initialCollapsed={initialCollapsed}
          forceExpandAllState={forceExpandAllState}
        />
      )}
    </div>
  );
}

export default function Workitem({ children, xuanze, tiankong, ...rest }) {
  const { wenbenContent, options, jiexiContent, jiexiShouqi, hasAnsinput } = useMemo(() => {
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
      jiexiShouqi: jiexi ? jiexi.props.shouqi === 'true' || jiexi.props.shouqi === true : undefined,
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
        jiexiContent={jiexiContent}
        jiexiShouqi={jiexiShouqi}
      />
    );
  }

  if (isFill) {
    return (
      <FillQuestion
        question={wenbenContent}
        hasAnsinput={hasAnsinput}
        jiexiContent={jiexiContent}
        jiexiShouqi={jiexiShouqi}
      />
    );
  }

  return (
    <div className={styles.item}>
      <div className={styles.question}>{wenbenContent}</div>
    </div>
  );
}