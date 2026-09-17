import { InputHero, RichTextEditor, type RichTextEditorValue } from '~/ui';

type ProductTitleAndDescriptionProps = {
  title: string;
  description: RichTextEditorValue;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: RichTextEditorValue) => void;
};

function ProductTitleAndDescription({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: ProductTitleAndDescriptionProps) {
  return (
    <div className="flex flex-col gap-4">
      <div data-breadcrumb-title-target className="flex-1">
        <InputHero
          label="Product name"
          placeholder="Add product name"
          value={title}
          onChange={(event) => onTitleChange(event.currentTarget.value)}
        />
      </div>
      <hr className="border-t border-border" />
      <RichTextEditor
        label="Description"
        value={description}
        onChange={onDescriptionChange}
        placeholder="Add a product description"
      />
    </div>
  );
}

export { ProductTitleAndDescription };
