import React from 'react';
import { m } from 'motion/react';
import {
  getNextHomeMetric,
  getRandomMetricUpdateDelay,
  homeMetrics,
  liveVisitorsHomeMetric,
  type HomeMetric,
} from '~/data/metrics';
import { AnimatedNumber, Icon, Sparkline } from '~/ui';
import { motionEasings } from '~/ui/tokens/motion';

const metricsBarEntranceDuration = 0.45;

export function MetricsBar({
  animateEntrance,
  entranceDelay,
  hasEntered,
}: {
  animateEntrance: boolean;
  entranceDelay: number;
  hasEntered: boolean;
}) {
  const [animateMetrics, setAnimateMetrics] = React.useState(!animateEntrance);
  const [metrics, setMetrics] = React.useState(homeMetrics);
  const [liveVisitors, setLiveVisitors] = React.useState(
    liveVisitorsHomeMetric,
  );
  const metricAnimationKey = animateMetrics ? 'animated' : 'pending';

  React.useEffect(() => {
    if (!animateEntrance) {
      setAnimateMetrics(true);
      return;
    }

    const timeoutId = window.setTimeout(
      () => setAnimateMetrics(true),
      (entranceDelay + metricsBarEntranceDuration) * 1000,
    );

    return () => window.clearTimeout(timeoutId);
  }, [animateEntrance, entranceDelay]);

  React.useEffect(() => {
    if (!animateMetrics) return;

    const timeoutIds = new Set<number>();

    for (const metric of homeMetrics) {
      scheduleMetricUpdate(metric.id, timeoutIds, setMetrics);
    }

    scheduleLiveVisitorsUpdate(timeoutIds, setLiveVisitors);

    return () => {
      for (const timeoutId of timeoutIds) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [animateMetrics]);

  return (
    <m.section
      aria-label="Store metrics"
      className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-8 p-4"
      initial={false}
      animate={{
        opacity: hasEntered ? 1 : 0,
        y: hasEntered ? 0 : '-100%',
      }}
      transition={{
        delay: entranceDelay,
        duration: metricsBarEntranceDuration,
        ease: motionEasings.easeOut,
      }}
      style={
        animateEntrance && !hasEntered
          ? { willChange: 'transform, opacity' }
          : undefined
      }
    >
      <div className="flex items-center gap-2 justify-self-start text-secondary">
        <Icon name="BarsFilter" />
        <span className="font-medium">30 days</span>
      </div>

      <div className="flex items-center justify-center gap-5 font-medium">
        {metrics.map((metric) => (
          <div key={metric.id} className="flex items-baseline gap-1.5">
            <span className="text-secondary">{metric.label}</span>
            <AnimatedNumber
              key={`${metricAnimationKey}-${metric.id}-value`}
              animated={animateMetrics}
              className={animateMetrics ? undefined : 'invisible'}
              metric={metric.value}
              prefix={metric.prefix}
              suffix={metric.suffix}
            />
            <Sparkline
              key={`${metricAnimationKey}-${metric.id}-sparkline`}
              animated={animateMetrics}
              data={metric.sparklineData}
              variant={metric.sparklineVariant}
              width={24}
              height={10}
              className={animateMetrics ? 'mt-0.5' : 'invisible mt-0.5'}
            />
            <AnimatedNumber
              key={`${metricAnimationKey}-${metric.id}-change`}
              animated={animateMetrics}
              className={animateMetrics ? undefined : 'invisible'}
              metric={metric.changeValue}
              prefix={metric.changePrefix}
              suffix={metric.changeSuffix}
              tone={metric.changeTone}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 justify-self-end">
        <m.span
          className="text-green-500"
          animate={{
            opacity: [1, 0.35, 1, 1],
          }}
          transition={{
            duration: 2,
            ease: 'linear',
            repeat: Infinity,
            times: [0, 0.25, 0.5, 1],
          }}
        >
          <Icon name="Live" />
        </m.span>
        <span className="text-secondary">{liveVisitors.label}</span>
        <AnimatedNumber
          key={`${metricAnimationKey}-${liveVisitors.id}-value`}
          animated={animateMetrics}
          className={animateMetrics ? 'font-medium' : 'invisible font-medium'}
          metric={liveVisitors.value}
        />
      </div>
    </m.section>
  );
}

function scheduleMetricUpdate(
  metricId: string,
  timeoutIds: Set<number>,
  setMetrics: React.Dispatch<React.SetStateAction<HomeMetric[]>>,
) {
  const timeoutId = window.setTimeout(() => {
    timeoutIds.delete(timeoutId);
    setMetrics((currentMetrics) =>
      currentMetrics.map((metric) =>
        metric.id === metricId ? getNextHomeMetric(metric) : metric,
      ),
    );
    scheduleMetricUpdate(metricId, timeoutIds, setMetrics);
  }, getRandomMetricUpdateDelay());

  timeoutIds.add(timeoutId);
}

function scheduleLiveVisitorsUpdate(
  timeoutIds: Set<number>,
  setLiveVisitors: React.Dispatch<React.SetStateAction<HomeMetric>>,
) {
  const timeoutId = window.setTimeout(() => {
    timeoutIds.delete(timeoutId);
    setLiveVisitors((currentMetric) => getNextHomeMetric(currentMetric));
    scheduleLiveVisitorsUpdate(timeoutIds, setLiveVisitors);
  }, getRandomMetricUpdateDelay());

  timeoutIds.add(timeoutId);
}
