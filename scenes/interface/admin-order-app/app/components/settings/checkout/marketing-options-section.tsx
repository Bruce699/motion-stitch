import React from 'react';
import { Icon, Radio, Section } from '~/ui';
import { Switch } from '~/ui/components/switch/switch';

function MarketingOptionsSection() {
  const [emailMarketingEnabled, setEmailMarketingEnabled] =
    React.useState(true);

  return (
    <div className="flex flex-col gap-5">
      <Section
        title="Marketing options"
        subtitle="Display a checkbox for customers to sign up for email or SMS marketing."
        wrapperContent={
          emailMarketingEnabled ? (
            <div className="flex flex-col gap-3 px-5 py-4 pt-5">
              <div className="flex items-center justify-between gap-5">
                <p>Enable checkbox by default in…</p>
                <Radio.Group
                  direction="row"
                  defaultValue="custom"
                  aria-label="Email marketing regions"
                >
                  <Radio.Root value="recommended" label="Recommended regions" />
                  <Radio.Root value="custom" label="Custom" />
                </Radio.Group>
              </div>
              <hr className="h-px w-full shrink-0 rounded-full border-0 bg-gray-300" />
              <button className="flex w-full items-center gap-4" type="button">
                <span className="flex flex-1 flex-col gap-0.5 text-left">
                  <span>28 regions selected</span>
                  <span className="text-secondary">
                    Canada, United States, Ireland, Japan, Portugal, Mexico,
                    Taiwan, +21 more
                  </span>
                </span>
                <span className="text-muted-foreground">
                  <Icon name="ChevronRight" size={14} />
                </span>
              </button>
            </div>
          ) : null
        }
      >
        <div className="flex items-center justify-between gap-5 pt-0.5">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">
              <Icon name="Envelope" />
            </span>
            <p className="font-medium">Email</p>
          </div>
          <Switch
            ariaLabel="Email marketing"
            checked={emailMarketingEnabled}
            onCheckedChange={setEmailMarketingEnabled}
          />
        </div>
      </Section>
      <Section>
        <div className="flex items-center justify-between gap-5 pt-0.5">
          <div className="flex flex-1 items-center gap-3">
            <span className="text-muted-foreground">
              <Icon name="Mobile" />
            </span>
            <p className="font-medium">SMS</p>
          </div>
          <Switch
            ariaLabel="SMS marketing"
            onCheckedChange={() => {}}
          />
        </div>
      </Section>
    </div>
  );
}

export { MarketingOptionsSection };
