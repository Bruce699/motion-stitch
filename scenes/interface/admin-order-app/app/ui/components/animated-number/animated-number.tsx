import type { ComponentProps } from 'react';
import React from 'react';
import { m } from 'motion/react';
import { clsx } from 'clsx';
import { motionDurations, motionEasings } from '~/ui/tokens/motion';

const animatedNumberSizes = {
  default: '',
  lg: 'text-xl font-semibold',
} as const;

const animatedNumberTones = {
  default: '',
  neutral: 'text-secondary',
  negative: 'text-red-700',
  positive: 'text-green-700',
} as const;

export type AnimatedNumberTone = keyof typeof animatedNumberTones;
type AnimatedNumberFormatting = 'format' | 'none';

export function AnimatedNumber({
  animated = false,
  className,
  formatting = 'format',
  metric,
  prefix,
  size = 'default',
  suffix,
  tone = 'default',
  ...props
}: Omit<ComponentProps<'span'>, 'children'> & {
  metric: number;
  formatting?: AnimatedNumberFormatting;
  prefix?: string;
  size?: keyof typeof animatedNumberSizes;
  suffix?: string;
  tone?: AnimatedNumberTone;
  animated?: boolean;
}) {
  const fractionDigits = getFractionDigits(metric);
  const finalFormattedNumber = formatNumber(metric, fractionDigits, formatting);
  const animationState = useAnimatedNumberState({
    animated,
    metric,
    value: finalFormattedNumber,
  });
  const label = `${prefix ?? ''}${finalFormattedNumber}${suffix ?? ''}`;
  const addonAnimation = getAddonAnimation(
    animationState.previousValue ? true : animationState.isRevealed,
  );
  const rollDirection =
    animationState.previousNumber === undefined ||
    metric >= animationState.previousNumber
      ? 1
      : -1;

  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-baseline tabular-nums transition-colors ease-out',
        animatedNumberSizes[size],
        animatedNumberTones[tone],
        className,
      )}
      {...props}
    >
      <span className="sr-only">{label}</span>
      <AnimatedNumberAddon animation={addonAnimation}>
        {prefix}
      </AnimatedNumberAddon>
      <m.span
        layout
        transition={animatedNumberTransition}
        aria-hidden
        className="inline-grid items-baseline"
      >
        <span className="invisible col-start-1 row-start-1 whitespace-nowrap">
          {finalFormattedNumber}
        </span>
        <span className="col-start-1 row-start-1 inline-flex items-baseline">
          {animated ? (
            <AnimatedNumberValue
              isRevealed={animationState.isRevealed}
              previousValue={animationState.previousValue}
              rollDirection={rollDirection}
              value={finalFormattedNumber}
            />
          ) : (
            finalFormattedNumber
          )}
        </span>
      </m.span>
      <AnimatedNumberAddon animation={addonAnimation}>
        {suffix}
      </AnimatedNumberAddon>
    </span>
  );
}

function AnimatedNumberAddon({
  animation,
  children,
}: {
  animation: ReturnType<typeof getAddonAnimation>;
  children?: string;
}) {
  if (!children) return null;

  return (
    <m.span
      layout="position"
      transition={animatedNumberTransition}
      animate={animation}
      aria-hidden
    >
      {children}
    </m.span>
  );
}

function AnimatedNumberValue({
  isRevealed,
  previousValue,
  rollDirection,
  value,
}: {
  isRevealed: boolean;
  previousValue?: string;
  rollDirection: DigitRollDirection;
  value: string;
}) {
  const previousDigits = previousValue
    ? [...previousValue].filter(isDigit)
    : [];
  const hasPreviousValue = previousValue !== undefined;
  const currentDigitCount = [...value].filter(isDigit).length;
  let digitIndex = 0;

  return [...value].map((character, characterIndex) => {
    if (isDigit(character)) {
      const digitPositionFromEnd = currentDigitCount - digitIndex - 1;
      const previousDigitIndex =
        previousDigits.length - digitPositionFromEnd - 1;
      const previousDigit =
        previousDigitIndex >= 0
          ? globalThis.Number(previousDigits[previousDigitIndex])
          : undefined;

      digitIndex += 1;

      return (
        <SlotDigit
          key={`digit-${digitPositionFromEnd}`}
          digit={globalThis.Number(character)}
          previousDigit={previousDigit}
          isRevealed={isRevealed}
          rollDirection={rollDirection}
        />
      );
    }

    return (
      <m.span
        key={`character-${characterIndex}-${character}`}
        layout="position"
        transition={animatedNumberTransition}
        animate={getAddonAnimation(hasPreviousValue ? true : isRevealed)}
        className="leading-none"
      >
        {character}
      </m.span>
    );
  });
}

function SlotDigit({
  digit,
  isRevealed,
  previousDigit,
  rollDirection,
}: {
  digit: number;
  isRevealed: boolean;
  previousDigit?: number;
  rollDirection: DigitRollDirection;
}) {
  const hasPreviousDigit = previousDigit !== undefined;
  const shouldAnimateDigit = previousDigit !== digit;
  const digitSequence = hasPreviousDigit
    ? getRollingDigitSequence(previousDigit, digit, rollDirection)
    : getInitialDigitSequence(digit);
  const revealOffset = hasPreviousDigit
    ? digitSequence.length - 1
    : digitSequence.length;
  const initialOffset =
    hasPreviousDigit && rollDirection === -1 ? revealOffset : 0;
  const targetOffset =
    hasPreviousDigit && rollDirection === -1 ? 0 : revealOffset;
  const digitDurationMs = getDigitTransitionDuration(revealOffset);
  const isDigitRevealed = shouldAnimateDigit ? isRevealed : true;

  return (
    <m.span
      layout
      transition={animatedNumberTransition}
      className="inline-block h-[1em] overflow-hidden mask-[linear-gradient(to_bottom,transparent_0%,black_14%,black_86%,transparent_100%)] leading-none [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_14%,black_86%,transparent_100%)]"
    >
      <span
        className="flex flex-col transition-transform"
        style={{
          transform: `translateY(-${
            isDigitRevealed ? targetOffset : initialOffset
          }em)`,
          transitionDuration: `${isDigitRevealed ? digitDurationMs : 0}ms`,
          transitionTimingFunction: animatedNumberTimingFunction,
        }}
      >
        {!hasPreviousDigit ? (
          <span className="h-[1em] leading-none">&nbsp;</span>
        ) : null}
        {digitSequence.map((value) => (
          <span key={value} className="h-[1em] leading-none">
            {value}
          </span>
        ))}
      </span>
    </m.span>
  );
}

const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
type DigitRollDirection = 1 | -1;
const maxDigitRollDistance = 3;
const animatedNumberTransition = {
  duration: motionDurations.slower * 1.5,
  ease: motionEasings.easeOut,
};
const animatedNumberDurationMs = animatedNumberTransition.duration * 1000;
const animatedNumberTimingFunction = `cubic-bezier(${motionEasings.easeOut.join(
  ',',
)})`;

function getInitialDigitSequence(digit: number) {
  const start = Math.max(0, digit - maxDigitRollDistance);

  return digits.slice(start, digit + 1);
}

function getDigitTransitionDuration(offset: number) {
  if (offset === 0) return 0;

  return animatedNumberDurationMs;
}

function getRollingDigitSequence(
  from: number,
  to: number,
  direction: DigitRollDirection,
) {
  if (from === to) return [to];

  if (direction === 1) {
    const sequence = [from];
    let current = from;

    while (current !== to) {
      current = (current + direction + digits.length) % digits.length;
      sequence.push(current);
    }

    return sequence;
  }

  const sequence = [to];
  let current = to;

  while (current !== from) {
    current = (current - direction + digits.length) % digits.length;
    sequence.push(current);
  }

  return sequence;
}

function useAnimatedNumberState({
  animated,
  metric,
  value,
}: {
  animated: boolean;
  metric: number;
  value: string;
}) {
  const [state, dispatch] = React.useReducer(animatedNumberReducer, {
    isRevealed: !animated,
    metric,
    value,
  });

  React.useLayoutEffect(() => {
    if (!animated) {
      dispatch({ type: 'reset', metric, value });
      return;
    }

    dispatch({ type: 'prepare', metric, value });

    let innerFrameId = 0;
    const frameId = requestAnimationFrame(() => {
      innerFrameId = requestAnimationFrame(() => {
        dispatch({ type: 'reveal', value });
      });
    });

    return () => {
      cancelAnimationFrame(frameId);
      cancelAnimationFrame(innerFrameId);
    };
  }, [animated, metric, value]);

  if (state.value === value) return state;

  return {
    isRevealed: false,
    metric,
    previousNumber: state.metric,
    previousValue: state.value,
    value,
  };
}

type AnimatedNumberState = {
  isRevealed: boolean;
  metric: number;
  previousNumber?: number;
  previousValue?: string;
  value: string;
};

type AnimatedNumberAction =
  | { type: 'reset'; metric: number; value: string }
  | { type: 'prepare'; metric: number; value: string }
  | { type: 'reveal'; value: string };

function animatedNumberReducer(
  state: AnimatedNumberState,
  action: AnimatedNumberAction,
): AnimatedNumberState {
  switch (action.type) {
    case 'reset':
      return {
        isRevealed: true,
        metric: action.metric,
        value: action.value,
      };
    case 'prepare':
      if (state.value === action.value) return state;

      return {
        isRevealed: false,
        metric: action.metric,
        previousNumber: state.metric,
        previousValue: state.value,
        value: action.value,
      };
    case 'reveal':
      return state.value === action.value
        ? { ...state, isRevealed: true }
        : state;
  }
}

function getFractionDigits(metric: number) {
  const [, fraction = ''] = metric.toString().split('.');
  return fraction.length;
}

function formatNumber(
  metric: number,
  fractionDigits: number,
  formatting: AnimatedNumberFormatting,
) {
  if (formatting === 'none') return metric.toString();

  return metric.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function getAddonAnimation(isVisible: boolean) {
  return {
    opacity: isVisible ? 1 : 0,
    filter: isVisible ? 'blur(0px)' : 'blur(1px)',
    y: isVisible ? 0 : '0.75em',
  };
}

function isDigit(character: string) {
  return character >= '0' && character <= '9';
}
