export const PRIMARY_NAV_GROUPS = [
  {
    title: undefined,
    sectionIds: [
      'home',
      'orders',
      'products',
      'customers',
      'growth',
      'markets',
      'finance',
      'content',
      'chats',
    ],
  },
  {
    title: 'Channels',
    sectionIds: ['online-store'],
  },
  {
    title: 'Apps',
    sectionIds: ['inbox'],
  },
] as const;

export const PRIMARY_NAV_SECTION_IDS = PRIMARY_NAV_GROUPS.flatMap(
  (group) => group.sectionIds,
);
