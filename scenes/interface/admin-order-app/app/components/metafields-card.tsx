import { useState } from 'react';
import type { ProductMetafield } from '~/data/products';
import { Icon } from '~/ui/components/icon/icon';
import { InputButton } from '~/ui/components/input-button/input-button';
import { Section } from '~/ui/components/section/section';

type ValueListValue = {
  id?: string;
  label: string;
  color?: string;
};

type ValueList = {
  name: string;
  values: ValueListValue[];
};

function ValueListCard<TList extends ValueList>({
  lists,
  onListsChange,
  title,
}: {
  lists: TList[];
  onListsChange: (lists: TList[]) => void;
  title: string;
}) {
  const [newValueKey, setNewValueKey] = useState<string | undefined>();

  if (lists.length === 0) return null;

  const renameValue = (
    listName: string,
    valueIndex: number,
    nextLabel: string,
  ) => {
    const trimmedLabel = nextLabel.trim();

    onListsChange(
      lists.map((list) =>
        list.name === listName
          ? ({
              ...list,
              values: list.values.flatMap((value, index) => {
                if (index !== valueIndex) return [value];
                if (!trimmedLabel) return [];

                return [{ ...value, label: trimmedLabel }];
              }),
            } as TList)
          : list,
      ),
    );
  };

  const removeValue = (listName: string, valueIndex: number) => {
    onListsChange(
      lists.map((list) =>
        list.name === listName
          ? ({
              ...list,
              values: list.values.filter(
                (_value, index) => index !== valueIndex,
              ),
            } as TList)
          : list,
      ),
    );
  };

  const addValue = (listName: string) => {
    onListsChange(
      lists.map((list) => {
        if (list.name !== listName) return list;

        const nextList = addValueToList(list);
        const newValue = nextList.values[nextList.values.length - 1];
        if (newValue) setNewValueKey(getValueKey(list.name, newValue));

        return nextList;
      }),
    );
  };

  return (
    <Section title={title}>
      <dl className="-my-0.5 divide-y divide-border">
        {lists.map((list) => {
          return (
            <div
              key={list.name}
              className="grid grid-cols-[160px_1fr] items-start gap-4 py-3 first:pt-0 last:pb-0"
            >
              <dt className="text-md pt-1.5 text-primary">{list.name}</dt>
              <dd>
                <div className="flex flex-wrap gap-1">
                  {list.values.map((value, index) =>
                    value.color ? (
                      <InputButton.Picker
                        key={getValueKey(list.name, value)}
                        focusOnMount={
                          newValueKey === getValueKey(list.name, value)
                        }
                        label={value.label}
                        squared
                        value={value.label}
                        swatch={value.color}
                      />
                    ) : (
                      <InputButton.Text
                        key={getValueKey(list.name, value)}
                        editOnMount={
                          newValueKey === getValueKey(list.name, value)
                        }
                        label={value.label || 'Value'}
                        placeholder="Value"
                        onRemove={() => removeValue(list.name, index)}
                        onValueChange={(nextLabel) =>
                          renameValue(list.name, index, nextLabel)
                        }
                        showPill={false}
                        squared
                        value={value.label}
                      />
                    ),
                  )}
                  <InputButton.Picker
                    aria-label={`Add ${list.name} value`}
                    icon={<Icon name="Plus" size={14} />}
                    label=""
                    onClick={() => addValue(list.name)}
                    squared
                    value=""
                  />
                </div>
              </dd>
            </div>
          );
        })}
      </dl>
    </Section>
  );
}

function MetafieldsCard({
  metafields,
  onMetafieldsChange,
}: {
  metafields: ProductMetafield[];
  onMetafieldsChange: (metafields: ProductMetafield[]) => void;
}) {
  return (
    <ValueListCard
      title="Metafields"
      lists={metafields}
      onListsChange={onMetafieldsChange}
    />
  );
}

function addValueToList<TList extends ValueList>(list: TList): TList {
  const hasColorValues = list.values.some((value) => value.color);
  const valueNumber = list.values.length + 1;
  const newValue: ValueListValue = hasColorValues
    ? {
        id: getNewValueId(list.name),
        label: `Color ${valueNumber}`,
        color: '#cccccc',
      }
    : {
        id: getNewValueId(list.name),
        label: '',
      };

  return {
    ...list,
    values: [...list.values, newValue],
  };
}

function getValueKey(listName: string, value: ValueListValue) {
  const valueKey = value.id ?? `${value.label}:${value.color ?? ''}`;

  return `${listName}:${valueKey}`;
}

function getNewValueId(listName: string) {
  return `${listName.toLowerCase().replaceAll(/\s+/g, '-')}-${crypto.randomUUID()}`;
}

export { MetafieldsCard, ValueListCard };
