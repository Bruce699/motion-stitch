import { redirect } from 'react-router';

export function loader() {
  throw redirect('/store/settings/general');
}

export default function SettingsRedirect() {
  return null;
}
