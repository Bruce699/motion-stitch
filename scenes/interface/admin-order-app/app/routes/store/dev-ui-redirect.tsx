import { redirect } from 'react-router';

export function loader() {
  throw redirect('/store/settings/dev-ui');
}

export default function DevUiRedirect() {
  return null;
}
