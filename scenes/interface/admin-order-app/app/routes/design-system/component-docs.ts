const componentDocs = import.meta.glob<string>('../../ui/components/*/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
});

const metricsBarDocs = import.meta.glob<string>('../../ui/metrics-bar/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
});

function fileSlug(path: string) {
  const fileName = path.split('/').at(-1) ?? path;
  return fileName.replace(/\.md$/, '');
}

const docsBySlug = new Map<string, string>();

for (const [path, content] of Object.entries({
  ...componentDocs,
  ...metricsBarDocs,
})) {
  docsBySlug.set(fileSlug(path), content);
}

export function getComponentDocs(slug: string) {
  return docsBySlug.get(slug);
}
