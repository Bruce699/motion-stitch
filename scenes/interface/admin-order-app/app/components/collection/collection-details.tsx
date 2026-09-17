import type { Collection } from '~/data/collections';
import {
  Image,
  InputHero,
  RichTextEditor,
  type RichTextEditorValue,
} from '~/ui';

function CollectionDetails({
  collection,
  description,
  title,
  onDescriptionChange,
  onTitleChange,
}: {
  collection: Collection;
  description: RichTextEditorValue;
  title: string;
  onDescriptionChange: (value: RichTextEditorValue) => void;
  onTitleChange: (value: string) => void;
}) {
  return (
    <div className="flex items-start gap-8">
      <div className="flex flex-1 flex-col gap-4">
        <div data-breadcrumb-title-target>
          <InputHero
            label="Collection title"
            placeholder="Collection name"
            value={title}
            onChange={(event) => onTitleChange(event.currentTarget.value)}
          />
        </div>
        <hr className="border-t border-border" />
        <RichTextEditor
          aria-label="Collection description"
          label="Description"
          value={description}
          onChange={onDescriptionChange}
          placeholder="Add a collection description"
        />
      </div>
      <div className="group mt-1 hidden shrink-0 cursor-pointer @4xl:block">
        <div className="transition-transform ease-out group-hover:scale-103 group-hover:rotate-1 group-active:scale-[0.975]">
          <Image
            src={`/images/${collection.image}`}
            size={120}
            withBorder
            shadow="md"
          />
        </div>
      </div>
    </div>
  );
}

export { CollectionDetails };
