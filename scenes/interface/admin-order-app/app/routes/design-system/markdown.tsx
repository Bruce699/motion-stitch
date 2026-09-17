import type { ReactNode } from 'react';

type MarkdownBlock =
  | { type: 'heading'; depth: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'code'; language: string; code: string };

function uniqueKey(base: string, seenKeys: Map<string, number>) {
  const count = seenKeys.get(base) ?? 0;
  seenKeys.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');

  let paragraph: string[] = [];
  let listItems: string[] = [];
  let code: string[] = [];
  let codeLanguage = '';
  let inCode = false;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
    paragraph = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push({ type: 'list', items: listItems });
    listItems = [];
  };

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCode) {
        blocks.push({
          type: 'code',
          language: codeLanguage,
          code: code.join('\n'),
        });
        code = [];
        codeLanguage = '';
        inCode = false;
      } else {
        flushParagraph();
        flushList();
        codeLanguage = line.slice(3).trim();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      code.push(line);
      continue;
    }

    if (line.trim() === '') {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({
        type: 'heading',
        depth: heading[1].length,
        text: heading[2],
      });
      continue;
    }

    const listItem = /^-\s+(.+)$/.exec(line);
    if (listItem) {
      flushParagraph();
      listItems.push(listItem[1]);
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();

  return blocks;
}

function inlineCode(text: string): ReactNode[] {
  const seenKeys = new Map<string, number>();

  return text.split(/(`[^`]+`)/g).map((part) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={uniqueKey(part, seenKeys)}
          className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.92em] text-primary"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}

function blockKey(block: MarkdownBlock, seenKeys: Map<string, number>) {
  switch (block.type) {
    case 'heading':
      return uniqueKey(`heading-${block.depth}-${block.text}`, seenKeys);
    case 'paragraph':
      return uniqueKey(`paragraph-${block.text}`, seenKeys);
    case 'list':
      return uniqueKey(`list-${block.items.join('\n')}`, seenKeys);
    case 'code':
      return uniqueKey(`code-${block.language}-${block.code}`, seenKeys);
  }
}

export function Markdown({ content }: { content: string }) {
  const blocks = parseMarkdown(content);
  const seenBlockKeys = new Map<string, number>();

  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block) => {
        const key = blockKey(block, seenBlockKeys);

        if (block.type === 'heading') {
          const headingClass =
            block.depth === 1
              ? 'text-lg font-semibold'
              : block.depth === 2
                ? 'pt-3 text-base font-semibold'
                : 'pt-2 text-sm font-semibold';

          const Tag = `h${Math.min(block.depth + 1, 4)}` as 'h2';

          return (
            <Tag key={key} className={headingClass}>
              {inlineCode(block.text)}
            </Tag>
          );
        }

        if (block.type === 'paragraph') {
          return (
            <p key={key} className="text-sm leading-6 text-secondary">
              {inlineCode(block.text)}
            </p>
          );
        }

        if (block.type === 'list') {
          return (
            <ul
              key={key}
              className="flex list-disc flex-col gap-1 pl-5 text-sm leading-6 text-secondary"
            >
              {block.items.map((item) => (
                <li key={item}>{inlineCode(item)}</li>
              ))}
            </ul>
          );
        }

        return (
          <pre
            key={key}
            className="max-h-80 overflow-auto rounded-lg border border-black/8 bg-primary p-4 text-xs leading-5 text-primary-foreground"
          >
            <code>{block.code}</code>
          </pre>
        );
      })}
    </div>
  );
}
