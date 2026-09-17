export type StaffMember = {
  id: string;
  name: string;
  initials: string;
  image: string;
  email?: string;
};

export const staffMembers: StaffMember[] = [
  {
    id: 'arda-karacizmeli',
    name: 'Arda Karaçizmeli',
    initials: 'AK',
    email: 'arda@mvse.com',
    image: '/images/staff/staff-2.jpg',
  },
  {
    id: 'kevin-clark',
    name: 'Kevin Clark',
    initials: 'KC',
    email: 'kevin@mvse.com',
    image: '/images/staff/staff-3.jpg',
  },
  {
    id: 'derek-briggs',
    name: 'Derek Briggs',
    initials: 'DB',
    email: 'derek@mvse.com',
    image: '/images/staff/staff-1.jpg',
  },
  {
    id: 'tobi-lutke',
    name: 'Tobi Lütke',
    initials: 'TL',
    email: 'tobi@mvse.com',
    image: '/images/staff/tobi.jpg',
  },
];

export const currentStaffMember = staffMembers[3];
