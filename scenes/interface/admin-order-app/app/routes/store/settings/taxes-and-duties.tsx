import { MainContentLayout } from '~/components/main-content-layout';
import { TaxesAndDutiesToolbar } from '~/components/settings/taxes-and-duties/taxes-and-duties-toolbar';
import { CustomsInformationSection } from '~/components/settings/taxes-and-duties/customs-information-section';
import { DutiesAndImportTaxesSection } from '~/components/settings/taxes-and-duties/duties-and-import-taxes-section';
import { OtherTaxSettingsSection } from '~/components/settings/taxes-and-duties/other-tax-settings-section';
import { TaxRegionsSection } from '~/components/settings/taxes-and-duties/tax-regions-section';

export default function TaxesAndDutiesPage() {
  return (
    <>
      <TaxesAndDutiesToolbar />
      <MainContentLayout>
        <div className="flex flex-col gap-8 pb-16">
          <div data-breadcrumb-title-target className="grow">
            <p className="text-3xl font-medium">Taxes and duties</p>
          </div>
          <TaxRegionsSection />
          <DutiesAndImportTaxesSection />
          <CustomsInformationSection />
          <OtherTaxSettingsSection />
        </div>
      </MainContentLayout>
    </>
  );
}
