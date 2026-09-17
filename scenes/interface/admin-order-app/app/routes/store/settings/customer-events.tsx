import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { CustomerEventsToolbar } from '~/components/settings/customer-events/customer-events-toolbar';

export default function CustomerEventsPage() {
  return (
    <>
      <CustomerEventsToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
