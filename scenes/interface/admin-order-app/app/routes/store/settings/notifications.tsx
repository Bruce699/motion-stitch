import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { NotificationsToolbar } from '~/components/settings/notifications/notifications-toolbar';

export default function NotificationsPage() {
  return (
    <>
      <NotificationsToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
