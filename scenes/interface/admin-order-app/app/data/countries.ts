export type Country = {
  code: string;
  flag: string;
  name: string;
};

export const countries: Country[] = [
  { code: 'US', flag: '🇺🇸', name: 'United States' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: 'JP', flag: '🇯🇵', name: 'Japan' },
];
