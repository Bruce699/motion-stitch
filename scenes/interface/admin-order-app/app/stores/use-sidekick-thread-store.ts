import { create } from 'zustand';
import {
  demoResponseScripts,
  fallbackDemoResponseScript,
  initialChatThreads,
  type ChatThread,
  type DemoResponseScript,
} from '~/data/chats';

export type SidekickTurn = {
  id: string;
  user: 'sidekick' | 'merchant';
  message: string;
  revealed?: boolean;
};

export const defaultSidekickChatTitle = 'New chat';

let nextTurnId = 0;
let responseTimeout = 0;
let toolCallTimeout = 0;

function clearSidekickTimers() {
  if (typeof window === 'undefined') return;

  window.clearTimeout(responseTimeout);
  window.clearTimeout(toolCallTimeout);
}

function createTurnId(user: SidekickTurn['user']) {
  return `${user}-${nextTurnId++}`;
}

function normalizePrompt(prompt: string) {
  return prompt
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function promptMatches(normalizedPrompt: string, match: string) {
  return new RegExp(`(^| )${match}( |$)`).test(normalizedPrompt);
}

function getDemoResponseScript(prompt: string) {
  const normalizedPrompt = normalizePrompt(prompt);

  return (
    demoResponseScripts.find((script) =>
      script.matches.some((match) => promptMatches(normalizedPrompt, match)),
    ) ?? fallbackDemoResponseScript
  );
}

function scheduleToolCallCycle(script: DemoResponseScript) {
  if (typeof window === 'undefined' || script.toolCalls.length === 0) return;

  let cursor = 0;
  const step = () => {
    toolCallTimeout = window.setTimeout(() => {
      const state = useSidekickThreadStore.getState();
      if (!state.isLoading) return;

      cursor = (cursor + 1) % script.toolCalls.length;
      useSidekickThreadStore.setState({
        toolCallText: script.toolCalls[cursor],
      });
      step();
    }, 900);
  };

  step();
}

function getResponseDelay(script: DemoResponseScript) {
  return script.toolCalls.length * 900 + 520;
}

export const useSidekickThreadStore = create<{
  chatThreads: Array<ChatThread>;
  activeThreadId?: string;
  turns: Array<SidekickTurn>;
  chatTitle: string;
  isLoading: boolean;
  toolCallText: string;
  submitPrompt: (message: string, threadId?: string) => boolean;
  stopLoading: () => void;
  markTurnRevealed: (turnId: string, threadId?: string) => void;
  clearThread: () => void;
}>((set) => ({
  chatThreads: initialChatThreads,
  activeThreadId: undefined,
  turns: [],
  chatTitle: defaultSidekickChatTitle,
  isLoading: false,
  toolCallText: '',
  submitPrompt: (message, threadId) => {
    const prompt = message.trim();
    if (!prompt) return false;

    clearSidekickTimers();

    const script = getDemoResponseScript(prompt);
    const merchantTurn: SidekickTurn = {
      id: createTurnId('merchant'),
      user: 'merchant',
      message: prompt,
    };

    set((state) => ({
      activeThreadId: threadId,
      chatThreads: threadId
        ? state.chatThreads.map((thread) =>
            thread.id === threadId
              ? { ...thread, turns: [...thread.turns, merchantTurn] }
              : thread,
          )
        : state.chatThreads,
      turns: threadId ? state.turns : [...state.turns, merchantTurn],
      isLoading: true,
      toolCallText: script.toolCalls[0] ?? '',
    }));

    scheduleToolCallCycle(script);

    if (typeof window !== 'undefined') {
      responseTimeout = window.setTimeout(() => {
        window.clearTimeout(toolCallTimeout);
        const sidekickTurn: SidekickTurn = {
          id: createTurnId('sidekick'),
          user: 'sidekick',
          message: script.answer,
          revealed: false,
        };

        set((state) => ({
          chatThreads: threadId
            ? state.chatThreads.map((thread) =>
                thread.id === threadId
                  ? { ...thread, turns: [...thread.turns, sidekickTurn] }
                  : thread,
              )
            : state.chatThreads,
          turns: threadId ? state.turns : [...state.turns, sidekickTurn],
          isLoading: false,
          toolCallText: '',
        }));
      }, getResponseDelay(script));
    }

    return true;
  },
  stopLoading: () => {
    clearSidekickTimers();
    set((state) => ({
      isLoading: false,
      toolCallText: '',
      chatThreads: state.activeThreadId
        ? state.chatThreads.map((thread) =>
            thread.id === state.activeThreadId
              ? {
                  ...thread,
                  turns: thread.turns.map((turn) =>
                    turn.user === 'sidekick' && !turn.revealed
                      ? { ...turn, revealed: true }
                      : turn,
                  ),
                }
              : thread,
          )
        : state.chatThreads,
      turns: state.turns.map((turn) =>
        turn.user === 'sidekick' && !turn.revealed
          ? { ...turn, revealed: true }
          : turn,
      ),
    }));
  },
  markTurnRevealed: (turnId, threadId) =>
    set((state) => ({
      chatThreads: threadId
        ? state.chatThreads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  turns: thread.turns.map((turn) =>
                    turn.id === turnId ? { ...turn, revealed: true } : turn,
                  ),
                }
              : thread,
          )
        : state.chatThreads,
      turns: state.turns.map((turn) =>
        turn.id === turnId ? { ...turn, revealed: true } : turn,
      ),
    })),
  clearThread: () => {
    clearSidekickTimers();
    set({
      turns: [],
      chatTitle: defaultSidekickChatTitle,
      isLoading: false,
      toolCallText: '',
      activeThreadId: undefined,
    });
  },
}));
