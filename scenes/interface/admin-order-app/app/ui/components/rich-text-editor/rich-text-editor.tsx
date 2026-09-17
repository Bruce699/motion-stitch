import React from 'react';
import { createEditor, type BaseEditor } from 'slate';
import {
  Editable,
  ReactEditor,
  Slate,
  type RenderElementProps,
  withReact,
} from 'slate-react';
import { clsx } from 'clsx';

type RichTextEditorElement = {
  type: 'paragraph';
  children: RichTextEditorText[];
};
type RichTextEditorText = {
  text: string;
};
type RichTextEditorValue = RichTextEditorElement[];

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: RichTextEditorElement;
    Text: RichTextEditorText;
  }
}

type RichTextEditorProps = {
  value: RichTextEditorValue;
  onChange: (value: RichTextEditorValue) => void;
  'aria-label'?: string;
  label?: string;
  placeholder?: string;
};

function RichTextEditor({
  value,
  onChange,
  'aria-label': ariaLabel,
  label,
  placeholder = 'Write something...',
}: RichTextEditorProps) {
  const editor = React.useMemo(() => withReact(createEditor()), []);
  const generatedLabelId = React.useId();
  const labelId = label ? generatedLabelId : undefined;
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const renderElement = React.useCallback(
    ({ attributes, children }: RenderElementProps) => (
      <p className="not-first:mt-3" {...attributes}>
        {children}
      </p>
    ),
    [],
  );

  return (
    <div className="group/rich-text-editor flex flex-col gap-0.5">
      {label && (
        <span
          id={labelId}
          className="mb-1 cursor-default font-medium text-muted-foreground"
          onPointerDown={(event) => {
            event.preventDefault();
            ReactEditor.focus(editor);
          }}
        >
          {label}
        </span>
      )}
      <div
        className={clsx(
          'relative isolate rounded-md text-primary transition-colors ease-out focus-within:text-primary',
          'before:pointer-events-none before:absolute before:-inset-x-2 before:-inset-y-1.5 before:-z-1 before:rounded-xl before:bg-transparent before:transition-[background-color,shadow] before:ease-out',
          'group-hover/rich-text-editor:before:bg-gray-50 focus-within:before:bg-white focus-within:before:shadow-input-focus hover:before:bg-gray-50 focus-within:hover:before:bg-background dark:group-hover/rich-text-editor:before:bg-white/5 dark:focus-within:before:bg-white/5 dark:hover:before:bg-white/5',
        )}
      >
        <div ref={scrollContainerRef} className="max-h-24 overflow-hidden">
          <Slate
            editor={editor}
            initialValue={value}
            onChange={(nextValue) => onChange(nextValue as RichTextEditorValue)}
          >
            <Editable
              aria-label={label ? undefined : ariaLabel}
              aria-labelledby={labelId}
              placeholder={placeholder}
              renderElement={renderElement}
              className="outline-none placeholder:text-secondary"
              onBlur={() => {
                scrollContainerRef.current?.scrollTo({ top: 0 });
              }}
            />
          </Slate>
        </div>
      </div>
    </div>
  );
}

export { RichTextEditor };
export type { RichTextEditorProps, RichTextEditorValue };
