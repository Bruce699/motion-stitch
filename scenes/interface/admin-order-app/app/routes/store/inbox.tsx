import { InboxToolbar } from '~/components/inbox/inbox-toolbar';
import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';

export default function InboxPage() {
  return (
    <>
      <InboxToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
