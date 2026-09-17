import React from 'react';
import { useParams } from 'react-router';
import { MainContentLayout } from '~/components/main-content-layout';
import { CollectionAside } from '~/components/collection/collection-aside';
import { CollectionDetails } from '~/components/collection/collection-details';
import { CollectionToolbar } from '~/components/collection/collection-toolbar';
import { CollectionMetafields } from '~/components/collection/collection-metafields';
import { CollectionProducts } from '~/components/collection/collection-products';
import { CollectionRules } from '~/components/collection/collection-rules';
import { catalogs as catalogData } from '~/data/catalogs';
import { channels as channelData } from '~/data/channels';
import { getProductsForCollectionRuleSets } from '~/data/collection-rule-products';
import {
  collectionThemeTemplates,
  type Collection,
  type CollectionRuleSet,
  collections,
} from '~/data/collections';
import type { ProductMetafield } from '~/data/products';
import { tags as tagData } from '~/data/tags';
import type { RichTextEditorValue } from '~/ui';

type CollectionFormState = {
  title: string;
  description: RichTextEditorValue;
  status: string;
  channels: string[];
  catalogs: string[];
  themeTemplate: string;
  tags: string[];
  metafields: ProductMetafield[];
  ruleSets: CollectionRuleSet[];
};

type CollectionFormReducerState = {
  collectionId: string;
  values: CollectionFormState;
  baseline: CollectionFormState;
  dirtyFields: Set<CollectionFormField>;
};

type CollectionFormField = keyof CollectionFormState;

type CollectionFormAction =
  | { type: 'setTitle'; value: string }
  | { type: 'setDescription'; value: RichTextEditorValue }
  | { type: 'setStatus'; value: string }
  | { type: 'setChannels'; value: string[] }
  | { type: 'setCatalogs'; value: string[] }
  | { type: 'setThemeTemplate'; value: string }
  | { type: 'setTags'; value: string[] }
  | { type: 'setMetafields'; value: ProductMetafield[] }
  | { type: 'setRuleSets'; value: CollectionRuleSet[] }
  | { type: 'resetResource'; collectionId: string; value: CollectionFormState }
  | { type: 'save' }
  | { type: 'reset' };

function getCollection(collectionId: string) {
  return (
    collections.find((collection) => collection.id === collectionId) ??
    collections[0]
  );
}

function initCollectionForm(collection: Collection): CollectionFormState {
  return {
    title: collection.title,
    description: collection.description,
    status: collection.status,
    channels: collection.channelIds,
    catalogs: collection.catalogIds,
    themeTemplate: collection.themeTemplate,
    tags: collection.tagIds,
    metafields: collection.metafields,
    ruleSets: collection.ruleSets,
  };
}

function collectionFormReducer(
  state: CollectionFormReducerState,
  action: CollectionFormAction,
): CollectionFormReducerState {
  switch (action.type) {
    case 'setTitle':
      return setCollectionFormField(state, 'title', action.value);
    case 'setDescription':
      return setCollectionFormField(state, 'description', action.value);
    case 'setStatus':
      return setCollectionFormField(state, 'status', action.value);
    case 'setChannels':
      return setCollectionFormField(state, 'channels', action.value);
    case 'setCatalogs':
      return setCollectionFormField(state, 'catalogs', action.value);
    case 'setThemeTemplate':
      return setCollectionFormField(state, 'themeTemplate', action.value);
    case 'setTags':
      return setCollectionFormField(state, 'tags', action.value);
    case 'setMetafields':
      return setCollectionFormField(state, 'metafields', action.value);
    case 'setRuleSets':
      return setCollectionFormField(state, 'ruleSets', action.value);
    case 'resetResource':
      return initCollectionFormReducerState(action.collectionId, action.value);
    case 'save':
      return {
        ...state,
        baseline: state.values,
        dirtyFields: new Set<CollectionFormField>(),
      };
    case 'reset':
      return {
        ...state,
        values: state.baseline,
        dirtyFields: new Set<CollectionFormField>(),
      };
  }
}

function initCollectionFormReducerState(
  collectionId: string,
  value: CollectionFormState,
): CollectionFormReducerState {
  return {
    collectionId,
    values: value,
    baseline: value,
    dirtyFields: new Set<CollectionFormField>(),
  };
}

function setCollectionFormField<K extends CollectionFormField>(
  state: CollectionFormReducerState,
  field: K,
  value: CollectionFormState[K],
): CollectionFormReducerState {
  const values = { ...state.values, [field]: value };
  const dirtyFields = new Set(state.dirtyFields);

  if (isCollectionFormFieldEqual(field, value, state.baseline[field])) {
    dirtyFields.delete(field);
  } else {
    dirtyFields.add(field);
  }

  return { ...state, values, dirtyFields };
}

function isCollectionFormFieldEqual<K extends CollectionFormField>(
  field: K,
  value: CollectionFormState[K],
  baselineValue: CollectionFormState[K],
) {
  switch (field) {
    case 'channels':
    case 'catalogs':
    case 'tags':
      return areStringArraysEqual(value as string[], baselineValue as string[]);
    case 'description':
    case 'metafields':
    case 'ruleSets':
      return areJsonEqual(value, baselineValue);
    default:
      return Object.is(value, baselineValue);
  }
}

function areStringArraysEqual(a: string[], b: string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function areJsonEqual(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function CollectionPageInner() {
  const { collectionId = '' } = useParams();
  const collection = React.useMemo(
    () => getCollection(collectionId),
    [collectionId],
  );
  const initialFormState = React.useMemo(
    () => initCollectionForm(collection),
    [collection],
  );
  const [reducerState, dispatch] = React.useReducer(
    collectionFormReducer,
    initialFormState,
    (value) => initCollectionFormReducerState(collection.id, value),
  );
  const formState =
    reducerState.collectionId === collection.id
      ? reducerState
      : initCollectionFormReducerState(collection.id, initialFormState);

  React.useEffect(() => {
    if (reducerState.collectionId === collection.id) return;

    dispatch({
      type: 'resetResource',
      collectionId: collection.id,
      value: initialFormState,
    });
  }, [collection.id, initialFormState, reducerState.collectionId]);

  const {
    values: {
      catalogs,
      channels,
      description,
      metafields,
      ruleSets,
      status,
      tags,
      themeTemplate,
      title,
    },
  } = formState;
  const hasChanges = formState.dirtyFields.size > 0;
  const handleSave = React.useCallback(() => dispatch({ type: 'save' }), []);
  const handleDiscard = React.useCallback(
    () => dispatch({ type: 'reset' }),
    [],
  );
  const handleStatusChange = React.useCallback(
    (value: string) => dispatch({ type: 'setStatus', value }),
    [],
  );
  const handleTagsChange = React.useCallback(
    (value: string[]) => dispatch({ type: 'setTags', value }),
    [],
  );
  const handleThemeTemplateChange = React.useCallback(
    (value: string) => dispatch({ type: 'setThemeTemplate', value }),
    [],
  );
  const handleDescriptionChange = React.useCallback(
    (value: RichTextEditorValue) => dispatch({ type: 'setDescription', value }),
    [],
  );
  const handleTitleChange = React.useCallback(
    (value: string) => dispatch({ type: 'setTitle', value }),
    [],
  );
  const handleMetafieldsChange = React.useCallback(
    (value: ProductMetafield[]) => dispatch({ type: 'setMetafields', value }),
    [],
  );
  const handleRuleSetsChange = React.useCallback(
    (value: CollectionRuleSet[]) => dispatch({ type: 'setRuleSets', value }),
    [],
  );
  const collectionProducts = React.useMemo(
    () => getProductsForCollectionRuleSets({ ruleSets }),
    [ruleSets],
  );
  const handlePublishingChange = React.useCallback((value: string[]) => {
    const nextChannels: string[] = [];
    const nextCatalogs: string[] = [];

    for (const item of value) {
      if (item.startsWith('channel:')) {
        nextChannels.push(item.replace('channel:', ''));
      } else if (item.startsWith('catalog:')) {
        nextCatalogs.push(item.replace('catalog:', ''));
      }
    }

    dispatch({ type: 'setChannels', value: nextChannels });
    dispatch({ type: 'setCatalogs', value: nextCatalogs });
  }, []);
  return (
    <>
      <CollectionToolbar
        collection={collection}
        collectionId={collectionId}
        title={title}
        hasChanges={hasChanges}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
      <MainContentLayout
        aside={
          <CollectionAside
            catalogs={catalogData}
            channels={channelData}
            collectionThemeTemplates={collectionThemeTemplates}
            metrics={collection.metrics}
            selectedCatalogs={catalogs}
            selectedChannels={channels}
            selectedTags={tags}
            status={status}
            tags={tagData}
            themeTemplate={themeTemplate}
            onPublishingChange={handlePublishingChange}
            onStatusChange={handleStatusChange}
            onTagsChange={handleTagsChange}
            onThemeTemplateChange={handleThemeTemplateChange}
          />
        }
      >
        <div className="flex flex-col gap-8">
          <CollectionDetails
            collection={collection}
            description={description}
            title={title}
            onDescriptionChange={handleDescriptionChange}
            onTitleChange={handleTitleChange}
          />
          <CollectionRules
            ruleSets={ruleSets}
            onRuleSetsChange={handleRuleSetsChange}
          />
          <CollectionProducts collectionProducts={collectionProducts} />
          <CollectionMetafields
            key={`metafields:${collection.id}`}
            metafields={metafields}
            onMetafieldsChange={handleMetafieldsChange}
          />
        </div>
      </MainContentLayout>
    </>
  );
}

export default function CollectionPage() {
  return <CollectionPageInner />;
}
