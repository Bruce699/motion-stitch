import React from 'react';
import {
  currencyOptions,
  initialStoreDefaults,
  regionOptions,
  timeZoneOptions,
  unitSystemOptions,
  weightUnitOptions,
} from '~/data/store-defaults';
import { Section } from '~/ui/components/section/section';
import { Select } from '~/ui/components/select/select';
import { Image } from '~/ui/components/image/image';

const regionSelectOptions = regionOptions.map((region) => ({
  value: region.value,
  label: (
    <span className="flex items-center gap-2">
      <Image
        alt=""
        borderRadius="sm"
        className="shrink-0"
        objectFit="cover"
        size="full"
        src={region.flagSrc}
        style={{ width: 20, height: 15 }}
      />
      <span>{region.label}</span>
    </span>
  ),
}));

function StoreDefaultsSection() {
  const [storeDefaults, setStoreDefaults] =
    React.useState(initialStoreDefaults);
  const selectedRegion =
    regionOptions.find((region) => region.value === storeDefaults.region) ??
    regionOptions[0];

  function updateStoreDefault(
    field: keyof typeof initialStoreDefaults,
    value: unknown,
  ) {
    if (typeof value === 'string') {
      setStoreDefaults((defaults) => ({ ...defaults, [field]: value }));
    }
  }

  return (
    <Section title="Store defaults">
      <div className="flex flex-col gap-4">
        <Select
          label="Currency"
          options={currencyOptions}
          value={storeDefaults.currency}
          onValueChange={(value) => updateStoreDefault('currency', value)}
        />
        <Select
          label="Region"
          helper="Determines settings for customers outside of your markets"
          options={regionSelectOptions}
          prefix={
            <Image
              alt=""
              borderRadius="sm"
              className="shrink-0"
              objectFit="cover"
              size="full"
              src={selectedRegion.flagSrc}
              style={{ width: 20, height: 15 }}
            />
          }
          value={storeDefaults.region}
          onValueChange={(value) => updateStoreDefault('region', value)}
        />
        <Select
          label="Time zone"
          helper="Sets the time for when orders and analytics are recorded"
          options={timeZoneOptions}
          value={storeDefaults.timeZone}
          onValueChange={(value) => updateStoreDefault('timeZone', value)}
        />
        <div className="flex gap-4">
          <Select
            label="Unit system"
            options={unitSystemOptions}
            value={storeDefaults.unitSystem}
            onValueChange={(value) => updateStoreDefault('unitSystem', value)}
          />
          <Select
            label="Default weight unit"
            options={weightUnitOptions}
            value={storeDefaults.weightUnit}
            onValueChange={(value) => updateStoreDefault('weightUnit', value)}
          />
        </div>
      </div>
    </Section>
  );
}

export { StoreDefaultsSection };
