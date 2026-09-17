import React from 'react';
import { files, type StoreFile } from '~/data/files';
import * as Checkbox from '~/ui/components/checkbox/checkbox';
import { Icon } from '~/ui/components/icon/icon';
import { Image } from '~/ui/components/image/image';
import { SearchBar } from '~/ui/components/search-bar/search-bar';
import * as Table from '~/ui/components/table/table';

const monthLabels = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sept',
  'Oct',
  'Nov',
  'Dec',
];

function formatDateAdded(dateAdded: string) {
  const [date = '', time = ''] = dateAdded.split('T');
  const [year = '', month = '', day = ''] = date.split('-');
  const [hour = '', minute = ''] = time.split(':');
  const monthLabel = monthLabels[Number(month) - 1] ?? '';
  const dayLabel = String(Number(day));

  if (year === '2026') {
    return `${dayLabel} ${monthLabel} at ${hour}:${minute}`;
  }

  return `${dayLabel} ${monthLabel} ${year}`;
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1_000_000) {
    return `${formatDecimal(sizeBytes / 1_000, 2)} KB`;
  }

  return `${formatDecimal(sizeBytes / 1_000_000, 2)} MB`;
}

function formatDecimal(value: number, maximumFractionDigits: number) {
  return new Intl.NumberFormat('de-DE', {
    maximumFractionDigits,
    minimumFractionDigits: value < 10 ? 2 : 1,
  }).format(value);
}

function referenceLabel(file: StoreFile) {
  const referenceCount = file.references.length;
  const [reference] = file.references;

  if (referenceCount === 0 || !reference) return '';

  if (referenceCount === 1) {
    return `1 ${reference.type}`;
  }

  const sharedType = file.references.every(
    (fileReference) => fileReference.type === reference.type,
  )
    ? reference.type
    : 'reference';

  return `${referenceCount} ${sharedType}s`;
}

export function FilesTable() {
  const [selectedFileIds, setSelectedFileIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const hasSelectedFiles = selectedFileIds.size > 0;
  const allFilesSelected = selectedFileIds.size === files.length;
  const someFilesSelected = hasSelectedFiles && !allFilesSelected;

  function setAllFilesSelected(checked: boolean) {
    setSelectedFileIds(
      checked ? new Set(files.map((file) => file.id)) : new Set(),
    );
  }

  function setFileSelected(fileId: string, checked: boolean) {
    setSelectedFileIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (checked) {
        nextIds.add(fileId);
      } else {
        nextIds.delete(fileId);
      }

      return nextIds;
    });
  }

  return (
    <section>
      <div className="flex flex-col gap-3">
        <SearchBar
          aria-label="Search files"
          className="mx-3"
          placeholder="Search and filter"
        />

        <Table.Root bleed dense stickyHeader={false}>
          <Table.Head>
            <Table.Row>
              <Table.Header type="checkbox">
                <Checkbox.Root
                  aria-label="Select all files"
                  aria-checked={someFilesSelected ? 'mixed' : undefined}
                  checked={hasSelectedFiles}
                  onCheckedChange={() => setAllFilesSelected(!allFilesSelected)}
                >
                  <Checkbox.Indicator
                    variant={someFilesSelected ? 'indeterminate' : 'check'}
                  />
                </Checkbox.Root>
              </Table.Header>
              <Table.Header className="w-120">File name</Table.Header>
              <Table.Header className="w-96">Alt text</Table.Header>
              <Table.Header>
                <span className="inline-flex items-center gap-1">
                  Date added
                  <Icon name="ChevronDown" size={12} aria-hidden />
                </span>
              </Table.Header>
              <Table.Header className="text-right">Size</Table.Header>
              <Table.Header>References</Table.Header>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {files.map((file) => (
              <Table.Row key={file.id} title={file.fileName}>
                <Table.Cell type="checkbox">
                  <Checkbox.Root
                    aria-label={`Select ${file.fileName}`}
                    checked={selectedFileIds.has(file.id)}
                    onCheckedChange={(checked) =>
                      setFileSelected(file.id, checked === true)
                    }
                  >
                    <Checkbox.Indicator />
                  </Checkbox.Root>
                </Table.Cell>
                <Table.Cell className="w-120">
                  <span className="inline-flex items-center gap-2.5">
                    <Image
                      src={file.url}
                      alt=""
                      size={40}
                      borderRadius="lg"
                      objectFit="contain"
                      shadow="sm"
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="flex flex-col">
                      <span className="block max-w-96 truncate font-medium text-foreground">
                        {file.fileName}
                      </span>
                      <span className="text-secondary">{file.extension}</span>
                    </span>
                  </span>
                </Table.Cell>
                <Table.Cell className="w-96">
                  <span className="block max-w-92 truncate">
                    {file.altText}
                  </span>
                </Table.Cell>
                <Table.Cell>{formatDateAdded(file.dateAdded)}</Table.Cell>
                <Table.Cell className="text-right tabular-nums">
                  {formatFileSize(file.sizeBytes)}
                </Table.Cell>
                <Table.Cell>{referenceLabel(file)}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </div>
    </section>
  );
}
