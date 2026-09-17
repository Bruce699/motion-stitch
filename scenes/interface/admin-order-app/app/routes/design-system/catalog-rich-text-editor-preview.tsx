import { useState } from 'react';
import { RichTextEditor, type RichTextEditorValue } from '~/ui';

function RichTextEditorPreview() {
  const [value, setValue] = useState<RichTextEditorValue>([
    {
      type: 'paragraph',
      children: [{ text: 'Describe what makes this collection special.' }],
    },
  ]);

  return (
    <div className="w-full max-w-sm">
      <RichTextEditor
        value={value}
        onChange={setValue}
        aria-label="Collection description"
      />
    </div>
  );
}

export { RichTextEditorPreview };
