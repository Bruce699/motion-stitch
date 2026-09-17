# RichTextEditor — plain paragraph editor

import { RichTextEditor } from '~/ui'

Props: value onChange label aria-label placeholder
Types: RichTextEditorValue, RichTextEditorProps

Use for: compact rich text fields that currently store paragraph-only Slate values.
Do: control the value from route or form state.
Don't: use for markdown, HTML editing, or formatting toolbars; this implementation only renders paragraphs.

Uses Slate with React and a focused surface treatment. When provided, the optional label names the editor and shares the editor hover treatment. Content is clipped after four lines, and the editor scrolls back to the top on blur so long content returns to a stable preview position.

Example:
<RichTextEditor value={description} onChange={setDescription} label="Description" />
