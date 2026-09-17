import React from 'react';
import { useLocation } from 'react-router';
import { useNavigationStore } from '~/stores/use-navigation-store';

function isChatsPath(pathname: string) {
  return pathname === '/store/chats' || pathname.startsWith('/store/chats/');
}

export function useChatsReturnPath() {
  const { pathname } = useLocation();
  const previousPathRef = React.useRef(pathname);
  const setStoredChatsPath = useNavigationStore(
    (state) => state.setStoredChatsPath,
  );

  React.useEffect(() => {
    const previousPath = previousPathRef.current;

    if (isChatsPath(pathname) && !isChatsPath(previousPath)) {
      setStoredChatsPath(previousPath);
    }

    previousPathRef.current = pathname;
  }, [pathname, setStoredChatsPath]);
}
