import { redirect } from 'react-router';

export function loader() {
  throw redirect('/store');
}

export default function HomeRedirect() {
  return null;
}
