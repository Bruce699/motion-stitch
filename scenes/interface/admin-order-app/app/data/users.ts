export type User = {
  id: string;
  name: string;
  initials: string;
  image: string;
  email: string;
  role: string;
  status: 'Active' | 'Invited';
};

export const users: User[] = [
  {
    id: 'arda-karacizmeli',
    name: 'Arda Karacizmeli',
    initials: 'AK',
    email: 'arda@mvse.com',
    image: '/images/staff/staff-2.jpg',
    role: 'Store owner',
    status: 'Active',
  },
  {
    id: 'kevin-clark',
    name: 'Kevin Clark',
    initials: 'KC',
    email: 'kevin@mvse.com',
    image: '/images/staff/staff-3.jpg',
    role: 'Administrator',
    status: 'Active',
  },
  {
    id: 'derek-briggs',
    name: 'Derek Briggs',
    initials: 'DB',
    email: 'derek@mvse.com',
    image: '/images/staff/staff-1.jpg',
    role: 'Staff',
    status: 'Invited',
  },
  {
    id: 'tobi-lutke',
    name: 'Tobi Lutke',
    initials: 'TL',
    email: 'tobi@mvse.com',
    image: '/images/staff/tobi.jpg',
    role: 'Developer',
    status: 'Active',
  },
];
