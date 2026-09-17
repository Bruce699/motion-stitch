import { MainContentLayout } from '~/components/main-content-layout';
import { UsersSection } from '~/components/settings/users/users-section';
import { UsersToolbar } from '~/components/settings/users/users-toolbar';

export default function UsersPage() {
  return (
    <>
      <UsersToolbar />
      <MainContentLayout>
        <div className="flex flex-col gap-8 pb-16">
          <div data-breadcrumb-title-target className="grow">
            <p className="text-3xl font-medium">Users</p>
          </div>
          <UsersSection />
        </div>
      </MainContentLayout>
    </>
  );
}
