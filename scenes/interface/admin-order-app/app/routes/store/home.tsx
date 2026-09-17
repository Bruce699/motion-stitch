import React from 'react';
import { HomeCards } from '~/components/home/home-cards';
import { MetricsBar } from '~/components/home/metrics-bar';
import { SidekickSection } from '~/components/home/sidekick-section';
import { MainContentLayout } from '../../components/main-content-layout';
import { useLocation, useNavigate } from 'react-router';
import { HomeToolbar } from '~/components/home/home-toolbar';
import { useMainContent } from '~/components/main-content/hooks/use-main-content';

const homeEntranceDelay = 0.4;

export default function HomePage() {
  const { hash, pathname, search, state } = useLocation();
  const navigate = useNavigate();
  useMainContent({ showBottomScrim: false });
  const shouldAnimateFromLoginRef = React.useRef(
    (
      state as {
        shouldStaggerPrimaryNav?: boolean;
      } | null
    )?.shouldStaggerPrimaryNav === true,
  );
  const shouldAnimateFromLogin = shouldAnimateFromLoginRef.current;
  const [hasMetricsBarEntered, setHasMetricsBarEntered] = React.useState(
    !shouldAnimateFromLogin,
  );
  const [hasSidekickEntered, setHasSidekickEntered] = React.useState(
    !shouldAnimateFromLogin,
  );

  React.useEffect(() => {
    if (!shouldAnimateFromLoginRef.current) return;

    navigate(`${pathname}${search}${hash}`, {
      replace: true,
      state: null,
    });
  }, [hash, navigate, pathname, search]);

  React.useEffect(() => {
    if (!shouldAnimateFromLoginRef.current) return;

    setHasMetricsBarEntered(true);
    setHasSidekickEntered(true);
  }, []);

  return (
    <>
      <HomeToolbar />
      <>
        <MetricsBar
          animateEntrance={shouldAnimateFromLogin}
          entranceDelay={shouldAnimateFromLogin ? homeEntranceDelay : 0}
          hasEntered={hasMetricsBarEntered}
        />
        <MainContentLayout variant="constrainedWide">
          <div className="flex flex-col gap-28">
            <SidekickSection
              entranceDelay={shouldAnimateFromLogin ? homeEntranceDelay : 0}
              hasEntered={hasSidekickEntered}
            />
            <HomeCards
              entranceDelay={shouldAnimateFromLogin ? homeEntranceDelay : 0}
            />
          </div>
        </MainContentLayout>
      </>
    </>
  );
}
