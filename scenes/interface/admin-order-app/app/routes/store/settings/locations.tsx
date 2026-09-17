import { MainContentLayout } from '~/components/main-content-layout';
import { UnderConstruction } from '~/components/under-construction';
import { LocationsToolbar } from '~/components/settings/locations/locations-toolbar';

export default function LocationsPage() {
  return (
    <>
      <LocationsToolbar />
      <MainContentLayout variant="bleed">
        <UnderConstruction />
      </MainContentLayout>
    </>
  );
}
