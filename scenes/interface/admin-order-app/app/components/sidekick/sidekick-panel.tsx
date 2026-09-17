import { useLayoutStore } from '../../stores/use-layout-store';
import { m } from 'motion/react';
import React from 'react';
import { useNavigate } from 'react-router';
import { SidekickToolbar } from './sidekick-toolbar';
import { clsx } from 'clsx';
import { motionEasings } from '~/ui/tokens/motion';
import { SidekickThread } from './floating-input/sidekick-thread';
import { useSidekickThreadStore } from '~/stores/use-sidekick-thread-store';
import { SidekickField } from './floating-input/sidekick-field';


export function SidekickPanel() {
  const navigate = useNavigate();
  const isSidekickPanelOpen = useLayoutStore(
    (state) => state.isSidekickPanelOpen,
  );
  const closeSidekickPanel = useLayoutStore(
    (state) => state.closeSidekickPanel,
  );
  const [input, setInput] = React.useState('');
  const [inputFocused, setInputFocused] = React.useState(false);
  const [isShiftPressed, setIsShiftPressed] = React.useState(false);
  const turns = useSidekickThreadStore((state) => state.turns);
  const chatTitle = useSidekickThreadStore((state) => state.chatTitle);
  const isLoading = useSidekickThreadStore((state) => state.isLoading);
  const toolCallText = useSidekickThreadStore((state) => state.toolCallText);
  const submitPrompt = useSidekickThreadStore((state) => state.submitPrompt);
  const stopLoading = useSidekickThreadStore((state) => state.stopLoading);
  const clearThread = useSidekickThreadStore((state) => state.clearThread);
  const markTurnRevealed = useSidekickThreadStore(
    (state) => state.markTurnRevealed,
  );
  const panelPromptInputRef = React.useRef<HTMLInputElement>(null);
  const isAnswerStreaming = turns.some(
    (turn) => turn.user === 'sidekick' && !turn.revealed,
  );

  function submitPanelPrompt() {
    const message = input.trim();
    if (!message) return;

    submitPrompt(message);
    setInput('');
  }

  function handleCompose() {
    clearThread();
    setInput('');
    window.requestAnimationFrame(() => {
      panelPromptInputRef.current?.focus({ preventScroll: true });
    });
  }

  function handleClose() {
    clearThread();
    setInput('');
    closeSidekickPanel();
  }

  function handleNavigate() {
    if (isSidekickPanelOpen) closeSidekickPanel();
    navigate('/store/chats');
  }

  function handleOpenFloatingInput() {
    closeSidekickPanel();
  }

  React.useEffect(() => {
    if (!isSidekickPanelOpen) return;
    panelPromptInputRef.current?.focus({ preventScroll: true });
  }, [isSidekickPanelOpen]);

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

  return (
    <>
      <m.div
        className="shrink-0"
        initial={false}
        animate={{
          width: isSidekickPanelOpen ? 'calc(var(--spacing) * 90)' : 4,
          transition: {
            duration: isSidekickPanelOpen ? 0.3 : 0.4,
            ease: motionEasings.ease,
            delay: isSidekickPanelOpen ? 0.4 : 0,
          },
        }}
      />

      <m.aside
        initial={false}
        animate={{
          scale: isSidekickPanelOpen ? 1 : 0.97,
          opacity: isSidekickPanelOpen ? 1 : 0,
          filter: isSidekickPanelOpen ? 'blur(0px)' : 'blur(1px)',
        }}
        transition={{
          duration: isSidekickPanelOpen ? 2 : 0.4,
          delay: isSidekickPanelOpen ? 0.4 : 0,
          ease: motionEasings.ease,
        }}
        className={clsx(
          'absolute inset-y-0 right-1 isolate flex w-88 flex-1 flex-col overflow-hidden bg-background will-change-[opacity,transform]',
          'rounded-3xl',
          isSidekickPanelOpen ? 'z-20' : '-z-1',
        )}
      >

        <div className="flex flex-1 flex-col overflow-y-auto pt-0 pb-16">
          <SidekickToolbar
            title={chatTitle}
            onCompose={handleCompose}
            onOpenFullpage={handleNavigate}
            onOpenFloatingInput={handleOpenFloatingInput}
            showFullpageButton={isShiftPressed}
            onClose={handleClose}
          />
          <div className="px-2">
            <SidekickThread
              toolCallText={toolCallText}
              turns={turns}
              onTurnRevealComplete={markTurnRevealed}
            />
          </div>
        </div>

        <div className="px-4">
          <SidekickField
            inputRef={panelPromptInputRef}
            isFocused={inputFocused}
            isLoading={isLoading || isAnswerStreaming}
            sidekickState={
              isLoading || isAnswerStreaming
                ? 'loading'
                : inputFocused
                  ? 'active'
                  : 'idle'
            }
            showActions
            showBorder
            showSidebarButton={false}
            value={input}
            onChange={setInput}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onStopLoading={stopLoading}
            onSubmit={submitPanelPrompt}
            className="py-4"
          />
        </div>
      </m.aside>
    </>
  );
}
