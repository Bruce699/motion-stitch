import { Button } from '~/ui/components/button/button';
import { Icon } from '~/ui/components/icon/icon';
import { Menu } from '~/ui/components/menu/menu';
import { Section } from '~/ui/components/section/section';
import { Select } from '~/ui/components/select/select';

export function CustomsInformationSection() {
  return (
    <Section
      title="Customs information"
      action={
        <Menu
          align="end"
          trigger={
            <Button
              onClick={() => {}}
              aria-label="Customs information actions"
              size="icon"
              variant="plain"
            >
              <Icon name="Dots" />
            </Button>
          }
          options={[
            { label: 'Edit country of origin' },
            { label: 'Edit HS codes' },
          ]}
        />
      }
      wrapperContent={
        <div className="flex w-full items-center justify-between gap-4 px-5 py-2.5 pe-2">
          <span className="font-medium">Default country of origin</span>
          <div>
            <Select
              aria-label="Default country of origin"
              defaultValue="Canada"
              variant="borderless"
              prefix={
                <span aria-hidden className="text-lg leading-none">
                  🇨🇦
                </span>
              }
              options={[
                {
                  value: 'Canada',
                  label: 'Canada',
                },
              ]}
            />
          </div>
        </div>
      }
    >
      <div className="flex gap-4">
        <div className="flex flex-1 flex-col justify-between gap-2">
          <h3 className="font-medium">Country of origin</h3>
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <p className="text-muted-foreground">Included in</p>
              <p>21 of 41 variants</p>
            </div>
            <ProductImageStack />
          </div>
        </div>
        <div className="my-1 w-px self-stretch bg-border" aria-hidden />
        <div className="flex flex-1 flex-col justify-between gap-2">
          <h3 className="font-medium">Harmonized System (HS) codes</h3>
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <p className="text-muted-foreground">Included in</p>
              <p>0 out of 41 variants</p>
            </div>
            <Button onClick={() => {}} variant="secondary">
              Bulk edit
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}

function ProductImageStack() {
  return (
    <div className="relative h-12 w-18 shrink-0" aria-hidden>
      <img
        src="/images/product/mvse-libertee-natural.png"
        alt=""
        className="absolute top-1.5 left-1 size-10.5 rotate-[-10deg] rounded-xl border-3 border-white bg-white object-contain shadow-sm"
      />
      <img
        src="/images/product/mvse-libertee-sage.png"
        alt=""
        className="absolute top-1.5 right-1 size-10.5 rotate-[10deg] rounded-xl border-3 border-white bg-white object-contain shadow-sm"
      />
      <img
        src="/images/product/mvse-libertee-black.png"
        alt=""
        className="absolute top-1 left-1/2 z-1 size-11 -translate-x-1/2 rounded-xl border-3 border-white bg-white object-contain shadow-sm"
      />
    </div>
  );
}
