import { MainContentLayout } from '~/components/main-content-layout';
import { FilesTable } from '~/components/content/files/files-table';
import { FilesToolbar } from '~/components/content/files-toolbar';

export default function FilesPage() {
  return (
    <>
      <FilesToolbar />
      <MainContentLayout variant="fullWidth">
        <FilesTable />
      </MainContentLayout>
    </>
  );
}
