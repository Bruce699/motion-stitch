type MetricTone = 'positive' | 'neutral';

export type HomeMetric = {
  id: string;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  changePrefix?: string;
  changeValue: number;
  changeSuffix: string;
  changeTone: MetricTone;
  sparklineData: number[];
  sparklineVariant: 'default' | 'positive' | 'negative';
};

export const homeMetrics: HomeMetric[] = [
  {
    id: 'sessions',
    label: 'Sessions',
    value: 32725,
    changeValue: -5,
    changeSuffix: '%',
    changeTone: 'neutral',
    sparklineData: [34, 35, 32, 33, 29, 28],
    sparklineVariant: 'default',
  },
  {
    id: 'sales',
    label: 'Sales',
    value: 1523,
    prefix: '$',
    changePrefix: '+',
    changeValue: 5,
    changeSuffix: '%',
    changeTone: 'positive',
    sparklineData: [12, 13, 15, 16, 18, 20],
    sparklineVariant: 'positive',
  },
  {
    id: 'orders',
    label: 'Orders',
    value: 1193,
    changeValue: -3,
    changeSuffix: '%',
    changeTone: 'neutral',
    sparklineData: [18, 19, 16, 17, 15, 14],
    sparklineVariant: 'default',
  },
  {
    id: 'conversion',
    label: 'Conversion',
    value: 1.86,
    suffix: '%',
    changePrefix: '+',
    changeValue: 1,
    changeSuffix: '%',
    changeTone: 'positive',
    sparklineData: [1.2, 1.23, 1.32, 1.38, 1.4, 1.45],
    sparklineVariant: 'positive',
  },
];

export const liveVisitorsMetric = {
  label: 'Live visitors',
  value: 652,
};

export const liveVisitorsHomeMetric: HomeMetric = {
  id: 'live-visitors',
  label: liveVisitorsMetric.label,
  value: liveVisitorsMetric.value,
  changeValue: 0,
  changeSuffix: '',
  changeTone: 'neutral',
  sparklineData: [],
  sparklineVariant: 'default',
};

const metricUpdateMinMs = 3_000;
const metricUpdateMaxMs = 6_000;

const metricStepRanges: Record<string, [number, number]> = {
  conversion: [0.01, 0.08],
  'live-visitors': [1, 18],
  orders: [1, 12],
  sales: [1, 25],
  sessions: [10, 180],
};

export function getNextHomeMetric(metric: HomeMetric): HomeMetric {
  return {
    ...metric,
    value: getNextMetricValue(metric),
  };
}

export function getRandomMetricUpdateDelay() {
  return randomNumberInRange(metricUpdateMinMs, metricUpdateMaxMs);
}

function getNextMetricValue(metric: HomeMetric) {
  const [minStep, maxStep] = metricStepRanges[metric.id] ?? [1, 10];
  const precision = metric.id === 'conversion' ? 2 : 0;
  const nextValue =
    metric.value + randomSign() * randomNumberInRange(minStep, maxStep);

  return roundMetric(Math.max(0, nextValue), precision);
}

function randomNumberInRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randomSign() {
  return Math.random() > 0.5 ? 1 : -1;
}

function roundMetric(value: number, fractionDigits: number) {
  return globalThis.Number.parseFloat(value.toFixed(fractionDigits));
}
