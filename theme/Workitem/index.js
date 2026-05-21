import React, { useState, useMemo, useCallback, useContext, useLayoutEffect, useReducer, useRef, useEffect } from 'react';
import Wenben from '@theme/Wenben';
import Xuanxiang from '@theme/Xuanxiang';
import Jiexi from '@theme/Jiexi';
import Ansinput from '@theme/Ansinput';
import { QuizContext } from '../QuizContext';
import styles from './styles.module.css';

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

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

function FillQuestion({ question, hasAnsinput, hasKaTeX, jiexiContent, jiexiShouqi }) {
  const { showAnsDirectly, showJiexiDirectly, forceExpandAllState } = useContext(QuizContext);

  const [state, dispatch] = useReducer(fillReducer, {
    userLocked: false,
    inputValue: '',
    redoCount: 0,
  });

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [submittedAnswerRaw, setSubmittedAnswerRaw] = useState('');
  const [submittedDisplayMode, setSubmittedDisplayMode] = useState('rendered');

  const previewContainerRef = useRef(null);
  const answerContainerRef = useRef(null);
  const pendingRenderRef = useRef(false);

  const [errorExpanded, setErrorExpanded] = useState(true);
  const errorContentRef = useRef(null);
  const [errorHeight, setErrorHeight] = useState(0);

  // 测量错误内容高度
  useEffect(() => {
    if (errorContentRef.current) {
      setErrorHeight(errorContentRef.current.scrollHeight);
    }
  }, [previewError]);

  const toggleErrorExpand = () => {
    setErrorExpanded(!errorExpanded);
  };

  // 渲染混合内容
  const renderMixedContent = useCallback((content, container, setErrorFn) => {
    if (!container) return;
    if (setErrorFn) setErrorFn(null);
    
    container.innerHTML = '';
    if (!content.trim()) return;

    const patterns = [
      { regex: /```math\s*([\s\S]*?)\s*```/g, displayMode: true },
      { regex: /\$\$([\s\S]+?)\$\$/g, displayMode: true },
      { regex: /\$([^\$]+?)\$/g, displayMode: false }
    ];

    let matches = [];
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      let match;
      while ((match = regex.exec(content)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          raw: match[0],
          math: match[1],
          displayMode: pattern.displayMode
        });
      }
    }
    matches.sort((a, b) => a.start - b.start);

    let cursor = 0;
    const fragments = [];
    for (const match of matches) {
      if (match.start < cursor) continue;
      if (match.start > cursor) {
        fragments.push({ type: 'text', content: content.substring(cursor, match.start) });
      }
      fragments.push({ type: 'math', content: match.math, displayMode: match.displayMode });
      cursor = match.end;
    }
    if (cursor < content.length) {
      fragments.push({ type: 'text', content: content.substring(cursor) });
    }

    // 收集错误消息
    const errorMessages = [];
    
    for (const frag of fragments) {
      if (frag.type === 'text') {
        const span = document.createElement('span');
        span.style.whiteSpace = 'pre-wrap';
        span.innerText = frag.content;
        container.appendChild(span);
      } else {
        try {
          const elem = document.createElement('span');
          if (frag.displayMode) {
            elem.style.display = 'block';
            elem.style.textAlign = 'center';
            elem.style.margin = '0.5em 0';
          }
          if (window.katex) {
            window.katex.render(frag.content, elem, {
              throwOnError: true,
              displayMode: frag.displayMode,
              output: 'html',
              strict: false,
              trust: true
            });
          } else {
            throw new Error('KaTeX not loaded');
          }
          container.appendChild(elem);
        } catch (err) {
          // 收集错误信息，不中断渲染
          errorMessages.push(`公式「${frag.content}」渲染失败: ${err.message}`);
          // 显示原始文本作为降级
          const errSpan = document.createElement('span');
          errSpan.style.color = 'var(--ifm-color-danger)';
          errSpan.style.backgroundColor = 'var(--ifm-color-danger-lightest)';
          errSpan.style.padding = '0.2em 0.4em';
          errSpan.style.borderRadius = '4px';
          errSpan.style.fontFamily = 'monospace';
          errSpan.innerText = frag.content;
          container.appendChild(errSpan);
        }
      }
    }
    
    // 统一设置错误信息
    if (errorMessages.length > 0) {
      if (setErrorFn) setErrorFn(errorMessages.join(' | '));
    } else {
      if (setErrorFn) setErrorFn(null);
    }
  }, []);

  const openOrRefreshPreview = useCallback(() => {
    if (!hasKaTeX || !hasAnsinput) return;
    const currentContent = state.inputValue.trim();
    if (!currentContent) return;
    if (!previewOpen) {
      setPreviewOpen(true);
      setTimeout(() => {
        if (previewContainerRef.current && currentContent) {
          renderMixedContent(currentContent, previewContainerRef.current, setPreviewError);
        }
      }, 0);
    } else {
      if (previewContainerRef.current && currentContent) {
        renderMixedContent(currentContent, previewContainerRef.current, setPreviewError);
      }
    }
  }, [previewOpen, hasKaTeX, hasAnsinput, state.inputValue, renderMixedContent]);

  const closePreview = useCallback(() => {
    setPreviewOpen(false);
    setPreviewError(null);
    if (previewContainerRef.current) previewContainerRef.current.innerHTML = '';
  }, []);

  const debouncedRenderPreview = useMemo(
    () => debounce((content) => {
      if (previewOpen && previewContainerRef.current) {
        renderMixedContent(content, previewContainerRef.current, setPreviewError);
      }
    }, 500),
    [previewOpen, renderMixedContent]
  );

  const locked = showAnsDirectly || state.userLocked;
  const showJiexi = showAnsDirectly || showJiexiDirectly || state.userLocked;
  const isKaTeXMode = hasKaTeX && hasAnsinput;
  const hasContent = state.inputValue.trim().length > 0;
  const initialCollapsed = useMemo(() => {
    if (jiexiShouqi !== undefined) return jiexiShouqi;
    return false;
  }, [jiexiShouqi]);
  const showReset = !showAnsDirectly && state.userLocked;

  const handleInputChange = useCallback((e) => {
    if (locked) return;
    const newValue = e.target.value;
    dispatch({ type: 'SET_INPUT', payload: newValue });
    if (previewOpen) {
      // 新输入时先清除之前的错误
      setPreviewError(null);
      debouncedRenderPreview(newValue);
    }
  }, [locked, previewOpen, debouncedRenderPreview]);

  const handleSubmit = useCallback(() => {
    if (!hasContent) return;
    setSubmittedAnswerRaw(state.inputValue);
    setSubmittedDisplayMode('rendered');
    dispatch({ type: 'SUBMIT' });
    setPreviewOpen(false);
    pendingRenderRef.current = true;
  }, [state.inputValue, hasContent]);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
    setPreviewOpen(false);
    setPreviewError(null);
    setSubmittedAnswerRaw('');
    setSubmittedDisplayMode('rendered');
    if (previewContainerRef.current) previewContainerRef.current.innerHTML = '';
    pendingRenderRef.current = false;
  }, []);

  const toggleDisplayMode = useCallback(() => {
    setSubmittedDisplayMode(prev => {
      const newMode = prev === 'rendered' ? 'raw' : 'rendered';
      return newMode;
    });
    pendingRenderRef.current = true;
  }, []);

  const setAnswerRef = useCallback((node) => {
    answerContainerRef.current = node;
    if (node && pendingRenderRef.current && state.userLocked && submittedAnswerRaw) {
      if (isKaTeXMode && submittedDisplayMode === 'rendered') {
        // KaTeX 模式且需要渲染公式
        renderMixedContent(submittedAnswerRaw, node, () => {});
      } else {
        // 非 KaTeX 模式，或 KaTeX 模式但选择了“显示原文”：纯文本显示
        node.innerHTML = '';
        const pre = document.createElement('pre');
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.margin = '0';
        pre.style.fontFamily = 'inherit';
        pre.style.padding = '0.5rem';
        pre.style.background = 'var(--ifm-color-emphasis-100)';
        pre.style.borderRadius = 'var(--ifm-card-border-radius)';
        pre.innerText = submittedAnswerRaw;
        node.appendChild(pre);
      }
      pendingRenderRef.current = false;
    }
  }, [state.userLocked, submittedAnswerRaw, submittedDisplayMode, isKaTeXMode, renderMixedContent]);

  useLayoutEffect(() => {
    if (showAnsDirectly) {
      dispatch({ type: 'FORCE_SHOW_ANS' });
    } else {
      dispatch({ type: 'CLEAR_FORCE' });
    }
  }, [showAnsDirectly]);

  if (!locked) {
    return (
      <div className={styles.item}>
        <div className={styles.question}>{question}</div>
        {hasAnsinput && (
          <div className={styles.fillArea}>
            <textarea
              className={styles.textarea}
              rows={4}
              placeholder={isKaTeXMode ?
                "请输入你的答案... 支持KaTeX数学公式代码" :
                "请输入你的答案..."}
              value={state.inputValue}
              onChange={handleInputChange}
            />
            {isKaTeXMode && previewOpen && (
              <div className={styles.previewArea}>
                <div className={styles.previewHeader}>
                  <span className={styles.previewTitle}>渲染效果</span>
                  <button className={styles.closePreviewBtn} onClick={closePreview} aria-label="关闭预览" title="关闭预览">×</button>
                </div>
                <div className={styles.previewContent} ref={previewContainerRef} />
                  {previewError && (
                    <div className={styles.previewErrorWrapper}>
                      <div className={styles.previewErrorHeader} onClick={toggleErrorExpand}>
                        <span className={`${styles.previewErrorArrow} ${errorExpanded ? styles.expanded : ''}`}>▶</span>
                        <span className={styles.previewErrorTitle}>渲染错误详情</span>
                      </div>
                      <div
                        className={styles.previewErrorContentWrapper}
                        style={{ maxHeight: errorExpanded ? `${errorHeight}px` : '0' }}
                      >
                        <div className={styles.previewErrorContent} ref={errorContentRef}>
                          {previewError}
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}
        <div className={styles.submitRow}>
          {state.redoCount > 0 && <span className={styles.redoCount}>重做次数: {state.redoCount}</span>}
          <div className={styles.buttonGroup}>
            {isKaTeXMode && (
              <button
                className={`${previewOpen ? styles.refreshBtn : styles.previewBtn} ${!hasContent ? styles.hiddenBtn : ''}`}
                onClick={openOrRefreshPreview}
                disabled={!hasContent}
                title={previewOpen ? "强制刷新预览" : "打开预览面板"}
              >
                {previewOpen ? "刷新" : "预览"}
              </button>
            )}
            <button
              className={`${styles.submitBtn} ${!hasContent ? styles.hiddenBtn : ''}`}
              onClick={handleSubmit}
              disabled={!hasContent}
            >
              确定
            </button>
          </div>
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

  return (
    <div className={styles.item}>
      <div className={styles.question}>{question}</div>
      {state.userLocked && !showAnsDirectly && hasAnsinput && (
        <div className={styles.submittedAnswerContainer}>
          <div className={styles.submittedAnswerHeader}>
            <span className={styles.submittedAnswerTitle}>你的答案</span>
            {isKaTeXMode && (
              <button className={styles.toggleRenderBtn} onClick={toggleDisplayMode}>
                {submittedDisplayMode === 'rendered' ? '显示原文' : '显示渲染'}
              </button>
            )}
          </div>
          <div className={styles.submittedAnswerContent} ref={setAnswerRef} />
        </div>
      )}
      <div className={styles.actionBar}>
        {showReset && <button className={styles.resetBtn} onClick={handleReset}>重置</button>}
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
  const { wenbenContent, options, jiexiContent, jiexiShouqi, hasAnsinput, hasKaTeX } = useMemo(() => {
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
      hasKaTeX: ansinput?.props?.katex === true,
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
        hasKaTeX={hasKaTeX}
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