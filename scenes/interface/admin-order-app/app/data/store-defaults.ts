export const currencyOptions = [
  { value: 'cad', label: 'Canadian dollars (CAD $)' },
  { value: 'usd', label: 'United States dollars (USD $)' },
  { value: 'eur', label: 'Euro (EUR €)' },
  { value: 'gbp', label: 'British pounds (GBP £)' },
];

export const regionOptions = [
  { value: 'Canada', label: 'Canada', flagSrc: '/images/flags/ca.svg' },
  {
    value: 'United States',
    label: 'United States',
    flagSrc: '/images/flags/us.svg',
  },
  {
    value: 'United Kingdom',
    label: 'United Kingdom',
    flagSrc: '/images/flags/gb.svg',
  },
  { value: 'Australia', label: 'Australia', flagSrc: '/images/flags/au.svg' },
];

export const timeZoneOptions = [
  { value: 'eastern', label: '(GMT-05:00) Eastern Time (US & Canada)' },
  { value: 'central', label: '(GMT-06:00) Central Time (US & Canada)' },
  { value: 'mountain', label: '(GMT-07:00) Mountain Time (US & Canada)' },
  { value: 'pacific', label: '(GMT-08:00) Pacific Time (US & Canada)' },
];

export const unitSystemOptions = [
  { value: 'metric', label: 'Metric system' },
  { value: 'imperial', label: 'Imperial system' },
];

export const weightUnitOptions = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'lb', label: 'Pound (lb)' },
  { value: 'oz', label: 'Ounce (oz)' },
];

export const initialStoreDefaults = {
  currency: 'cad',
  region: 'Canada',
  timeZone: 'eastern',
  unitSystem: 'metric',
  weightUnit: 'kg',
};
