import React from 'react';
import { useParams } from 'react-router';
import { ChatsToolbar } from '~/components/chats/chats-toolbar';
import { MainContentLayout } from '~/components/main-content-layout';
import { useSidekickFloatingInput } from '~/components/sidekick/floating-input/hooks/use-sidekick-floating-input';
import { SidekickThread } from '~/components/sidekick/floating-input/sidekick-thread';
import { useLayoutStore } from '~/stores/use-layout-store';
import { useSidekickThreadStore } from '~/stores/use-sidekick-thread-store';

export default function ChatsPage() {
  const { threadId } = useParams();
  useSidekickFloatingInput({ chatThreadId: threadId, inputOnly: true });
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const isSidekickPanelOpen = useLayoutStore(
    (state) => state.isSidekickPanelOpen,
  );
  const closeSidekickPanel = useLayoutStore(
    (state) => state.closeSidekickPanel,
  );
  const chatThreads = useSidekickThreadStore((state) => state.chatThreads);
  const activeThreadId = useSidekickThreadStore(
    (state) => state.activeThreadId,
  );
  const turns = useSidekickThreadStore((state) => state.turns);
  const toolCallText = useSidekickThreadStore((state) => state.toolCallText);
  const markTurnRevealed = useSidekickThreadStore(
    (state) => state.markTurnRevealed,
  );
  const selectedThread =
    chatThreads.find((thread) => thread.id === threadId) ?? null;
  const threadTurns = selectedThread?.turns ?? turns;
  const threadToolCallText =
    activeThreadId === selectedThread?.id ||
    (!selectedThread && activeThreadId === undefined)
      ? toolCallText
      : undefined;

  const scrollToBottom = React.useCallback(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, []);

  React.useEffect(() => {
    if (isSidekickPanelOpen) closeSidekickPanel();
  }, [closeSidekickPanel, isSidekickPanelOpen]);

  React.useLayoutEffect(() => {
    scrollToBottom();
  }, [scrollToBottom, threadTurns]);

  return (
    <>
      <ChatsToolbar title={selectedThread?.title} />
      <MainContentLayout variant="constrained">
        <SidekickThread
          toolCallText={threadToolCallText}
          turns={threadTurns}
          onHeightUpdate={scrollToBottom}
          onTurnRevealComplete={
            selectedThread
              ? (turnId) => markTurnRevealed(turnId, selectedThread.id)
              : markTurnRevealed
          }
        />
        <div ref={bottomRef} aria-hidden />
      </MainContentLayout>
    </>
  );
}
