import { collections } from './collections';
import { products } from './products';

export type FileReferenceType = 'collection' | 'product';

export type FileReference = {
  id: string;
  title: string;
  type: FileReferenceType;
  href: string;
};

export type StoreFile = {
  id: string;
  url: string;
  fileName: string;
  extension: string;
  altText: string;
  dateAdded: string;
  sizeBytes: number;
  references: FileReference[];
};

type FileSource = {
  url: string;
  altText: string;
  reference: FileReference;
};

const fileDates = [
  '2026-04-01T11:10:00',
  '2026-03-21T10:26:00',
  '2026-02-27T15:44:00',
  '2025-12-20T09:15:00',
  '2025-09-29T15:29:00',
  '2025-07-04T09:58:00',
  '2025-07-03T19:52:00',
  '2025-05-21T12:00:00',
  '2025-04-16T08:40:00',
  '2024-05-21T14:04:00',
  '2024-05-14T17:20:00',
  '2024-04-17T16:35:00',
  '2024-03-21T10:26:00',
  '2024-02-27T12:32:00',
  '2023-12-20T10:12:00',
];

function normalizeFileUrl(url: string) {
  return url.startsWith('/') ? url : `/images/${url}`;
}

function getFileName(url: string) {
  const pathName = url.split('/').at(-1) ?? url;
  const fileName = pathName.replace(/\.[^.]+$/, '');

  return fileName || pathName;
}

function getExtension(url: string) {
  return (url.match(/\.([^.]+)$/)?.[1] ?? 'file').toUpperCase();
}

function getFixtureSeed(value: string) {
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) % 1000;
  }

  return hash;
}

function getFileSizeBytes(url: string) {
  const seed = getFixtureSeed(url);
  const extension = getExtension(url);

  if (extension === 'JPG' || extension === 'JPEG') {
    return 220_000 + seed * 1_620;
  }

  if (extension === 'WEBP') {
    return 120_000 + seed * 860;
  }

  return 180_000 + seed * 1_940;
}

function getFileSources(): FileSource[] {
  const productSources = products.flatMap((product) =>
    Array.from(
      new Set([
        ...product.images,
        ...product.variants.flatMap((variant) =>
          variant.image ? [variant.image] : [],
        ),
      ]),
    ).map((url) => ({
      url: normalizeFileUrl(url),
      altText: product.title,
      reference: {
        id: product.id,
        title: product.title,
        type: 'product' as const,
        href: `/store/products/${product.id}`,
      },
    })),
  );

  const collectionSources = collections.map((collection) => ({
    url: normalizeFileUrl(collection.image),
    altText: collection.title,
    reference: {
      id: collection.id,
      title: collection.title,
      type: 'collection' as const,
      href: `/store/products/collections/${collection.id}`,
    },
  }));

  return [...productSources, ...collectionSources];
}

function uniqueReferences(references: FileReference[]) {
  const referencesByKey = new Map<string, FileReference>();

  for (const reference of references) {
    referencesByKey.set(`${reference.type}:${reference.id}`, reference);
  }

  return Array.from(referencesByKey.values());
}

export const files: StoreFile[] = Array.from(
  getFileSources()
    .reduce((filesByUrl, source) => {
      const existingFile = filesByUrl.get(source.url);

      if (existingFile) {
        existingFile.references.push(source.reference);
        return filesByUrl;
      }

      filesByUrl.set(source.url, {
        id: source.url,
        url: source.url,
        fileName: getFileName(source.url),
        extension: getExtension(source.url),
        altText: source.altText,
        dateAdded: fileDates[getFixtureSeed(source.url) % fileDates.length],
        sizeBytes: getFileSizeBytes(source.url),
        references: [source.reference],
      });

      return filesByUrl;
    }, new Map<string, StoreFile>())
    .values(),
)
  .map((file) => ({
    ...file,
    references: uniqueReferences(file.references),
  }))
  .sort(
    (firstFile, secondFile) =>
      Date.parse(secondFile.dateAdded) - Date.parse(firstFile.dateAdded),
  );

export function getFile(fileId: string) {
  return files.find((file) => file.id === fileId);
}
