import clsx from 'clsx';
import { AnimatePresence, m } from 'motion/react';
import React from 'react';
import { useNavigate } from 'react-router';
import { SidekickToolbar } from '../sidekick-toolbar';
import { SidekickField } from './sidekick-field';
import { SidekickFieldWrapper } from './sidekick-field-wrapper';
import { SidekickThread } from './sidekick-thread';
import { useLayoutStore } from '~/stores/use-layout-store';
import { useSidekickThreadStore } from '~/stores/use-sidekick-thread-store';
import { motionEasings } from '~/ui/tokens/motion';

export function SidekickFloatingInput({
  chatThreadId,
  inputOnly = false,
  isVisible = true,
  position = 'absolute',
}: {
  chatThreadId?: string;
  inputOnly?: boolean;
  isVisible?: boolean;
  position?: 'absolute' | 'static';
}) {
  const navigate = useNavigate();
  const [value, setValue] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isShiftPressed, setIsShiftPressed] = React.useState(false);
  const scrollViewRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const openSidekickPanel = useLayoutStore((state) => state.openSidekickPanel);
  const isSidekickPanelOpen = useLayoutStore(
    (state) => state.isSidekickPanelOpen,
  );
  const turns = useSidekickThreadStore((state) => state.turns);
  const chatTitle = useSidekickThreadStore((state) => state.chatTitle);
  const toolCallText = useSidekickThreadStore((state) => state.toolCallText);
  const isLoading = useSidekickThreadStore((state) => state.isLoading);
  const activeThreadId = useSidekickThreadStore(
    (state) => state.activeThreadId,
  );
  const submitPrompt = useSidekickThreadStore((state) => state.submitPrompt);
  const stopLoading = useSidekickThreadStore((state) => state.stopLoading);
  const markTurnRevealed = useSidekickThreadStore(
    (state) => state.markTurnRevealed,
  );
  const clearThread = useSidekickThreadStore((state) => state.clearThread);
  const hasMessages = turns.length > 0;
  const shouldShowThread = hasMessages && !inputOnly;
  const isAnswerStreaming = turns.some(
    (turn) => turn.user === 'sidekick' && !turn.revealed,
  );
  const isPromptLoading = isLoading && activeThreadId === chatThreadId;
  const isExpanded = inputOnly || isFocused || shouldShowThread;
  const showPromptActions = inputOnly || isHovered || isFocused || hasMessages;
  const isStatic = position === 'static';

  const scrollToThreadBottom = React.useCallback(() => {
    const scrollView = scrollViewRef.current;
    if (!scrollView) return;

    scrollView.scrollTop = scrollView.scrollHeight;
  }, []);

  React.useLayoutEffect(() => {
    scrollToThreadBottom();
  }, [scrollToThreadBottom, turns]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') setIsShiftPressed(true);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') setIsShiftPressed(false);
    };

    const handleWindowBlur = () => {
      setIsShiftPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  function handleSubmit() {
    const message = value.trim();
    if (!message) return;

    submitPrompt(message, chatThreadId);
    setValue('');
  }

  function handleCloseThread() {
    clearThread();
    setValue('');
  }

  function handleCompose() {
    clearThread();
    setValue('');
    window.requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
  }

  function handleOpenSidekickPanel() {
    openSidekickPanel();
    setIsFocused(false);
  }

  function handleOpenChats() {
    setIsFocused(false);
    navigate('/store/chats');
  }

  return (
    <AnimatePresence initial={false}>
      {(isStatic || (isVisible && !isSidekickPanelOpen)) && (
        <m.div
          initial={{
            y: 'calc(var(--spacing) * 6 + 100%)',
          }}
          animate={{
            y: 0,
            transition: {
              visualDuration: 0.4,
              bounce: 0.25,
              type: 'spring',
              delay: 0.1,
            },
          }}
          exit={{
            y: 'calc(var(--spacing) * 6 + 100%)',
            transition: { duration: 0.4, ease: motionEasings.easeIn },
          }}
          className={clsx(
            'z-50 transition-[width] duration-300 ease-out',
            isStatic ? 'w-full' : 'absolute bottom-3 left-1/2 -translate-x-1/2',
            !isStatic && (isExpanded ? 'w-xl' : 'w-xs'),
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <SidekickFieldWrapper hasMessages={shouldShowThread}>
            <div
              ref={scrollViewRef}
              className="max-h-[300px] overflow-scroll overscroll-none"
            >
              {shouldShowThread ? (
                <SidekickToolbar
                  title={chatTitle}
                  onCompose={handleCompose}
                  onOpenFullpage={handleOpenChats}
                  onOpenSidebar={handleOpenSidekickPanel}
                  showFullpageButton={isShiftPressed}
                  onClose={handleCloseThread}
                />
              ) : null}
              {shouldShowThread ? (
                <div className="px-3">
                  <SidekickThread
                    toolCallText={toolCallText}
                    turns={turns}
                    onHeightUpdate={scrollToThreadBottom}
                    onTurnRevealComplete={markTurnRevealed}
                  />
                </div>
              ) : null}
            </div>
            <div className={shouldShowThread ? 'px-5' : 'px-3'}>
              <SidekickField
                inputRef={inputRef}
                isFocused={isFocused}
                isLoading={isPromptLoading || isAnswerStreaming}
                sidekickState={
                  isPromptLoading || isAnswerStreaming
                    ? 'loading'
                    : isFocused
                      ? 'active'
                      : 'idle'
                }
                showActions={showPromptActions}
                showBorder={shouldShowThread}
                showSidebarButton={!shouldShowThread && !inputOnly}
                value={value}
                onChange={setValue}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onOpenSidekickPanel={handleOpenSidekickPanel}
                onStopLoading={stopLoading}
                onSubmit={handleSubmit}
                className={shouldShowThread ? 'py-4' : 'py-3'}
              />
            </div>
          </SidekickFieldWrapper>
        </m.div>
      )}
    </AnimatePresence>
  );
}
