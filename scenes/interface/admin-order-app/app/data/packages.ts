export type Package = {
  id: string;
  name: string;
};

export const packages: Package[] = [
  { id: 'deck-mailer', name: 'Deck Mailer (86cm x 25cm x 6cm)' },
  { id: 'apparel-mailer', name: 'Apparel Mailer (35cm x 25cm x 5cm)' },
  { id: 'hardware-box', name: 'Hardware Box (18cm x 18cm x 10cm)' },
];

export const createShippingLabelPackages: Package[] = [
  { id: 'clothing-box', name: 'Clothing box (30cm x 30cm)' },
  { id: 'mailer', name: 'Recycled mailer (35cm x 45cm)' },
  { id: 'small-box', name: 'Small box (20cm x 25cm)' },
];
