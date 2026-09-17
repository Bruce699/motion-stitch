const sidekickOrbColorGroupDurationSeconds = 4;

const colorArray = [
  ['#FF221E', '#1673FF', '#FF6A00'],
  ['#3888ff', '#ffd500', '#4bff1e'],
  ['#16F3FF', '#FF0000', '#FF1EEC'],
] as const;

const sidekickOrbSlots = [0, 1, 2] as const;

const sidekickOrbColorCycleDurationSeconds =
  sidekickOrbColorGroupDurationSeconds * colorArray.length;

const sidekickOrbBlobFillClasses =
  'absolute inset-0 rounded-full motion-reduce:animate-none';

const sidekickOrbConfigs = [
  {
    fillClassName: 'sidekick-orb__background-fill--0',
    transformClassName: 'transform-[translate(0px,-7px)_scale(1.02)]',
    rotateClassName:
      'animate-[sidekick-orb-rotate_3.6s_linear_infinite] group-data-[state=loading]:animate-[sidekick-orb-rotate_1.8s_linear_infinite]',
  },
  {
    fillClassName: 'sidekick-orb__background-fill--1',
    transformClassName: 'transform-[translate(7px,0px)_scale(0.98)]',
    rotateClassName:
      'animate-[sidekick-orb-rotate_3.6s_linear_infinite_-1.2s] group-data-[state=loading]:animate-[sidekick-orb-rotate_1.8s_linear_infinite_-0.6s]',
  },
  {
    fillClassName: 'sidekick-orb__background-fill--2',
    transformClassName: 'transform-[translate(-7px,0px)_scale(1.03)]',
    rotateClassName:
      'animate-[sidekick-orb-rotate_3.6s_linear_infinite_-2.4s] group-data-[state=loading]:animate-[sidekick-orb-rotate_1.8s_linear_infinite_-1.2s]',
  },
] as const;

function sidekickOrbColorKeyframes(orbIndex: (typeof sidekickOrbSlots)[number]) {
  const colorStops = colorArray
    .map((colorGroup, index) => {
      const percent = (index / colorArray.length) * 100;

      return `${percent}% { background-color: ${colorGroup[orbIndex]}; }`;
    })
    .join('\n');

  return `
  @keyframes sidekick-orb-color-${orbIndex} {
    ${colorStops}
    100% { background-color: ${colorArray[0][orbIndex]}; }
  }

  .sidekick-orb__background-fill--${orbIndex} {
    background-color: ${colorArray[0][orbIndex]};
    animation: sidekick-orb-color-${orbIndex} ${sidekickOrbColorCycleDurationSeconds}s ease-in-out infinite;
  }
  `;
}

const sidekickOrbStyles = `
@keyframes sidekick-orb-rotate {
  0%, 100% { transform: translate(0px, -7px) scale(1.02); }
  12.5% { transform: translate(5px, -5px) scale(1.04); }
  25% { transform: translate(7px, 0px) scale(0.98); }
  37.5% { transform: translate(5px, 5px) scale(1.03); }
  50% { transform: translate(0px, 7px) scale(1); }
  62.5% { transform: translate(-5px, 5px) scale(0.97); }
  75% { transform: translate(-7px, 0px) scale(1.03); }
  87.5% { transform: translate(-5px, -5px) scale(0.99); }
}
${sidekickOrbSlots.map(sidekickOrbColorKeyframes).join('\n')}
`;

export function SidekickBackgroundOrbs({
  opacity = 40,
}: {
  opacity?: number;
}) {
  const opacityClassName = `opacity-${opacity}`;
  const blurClassName = `blur-sm`;
  const sidekickOrbBlobBaseClasses =
    `ease-out absolute z-1 size-[80%] ${blurClassName} saturate-300 origin-center rounded-full transition-[opacity,transform] will-change-transform motion-reduce:animate-none`;

  return (
    <>
      <style>{sidekickOrbStyles}</style>
      <span
        className={`absolute inset-0 z-1 ${opacityClassName}`}
        aria-hidden="true"
      >
        {sidekickOrbConfigs.map((orb) => (
          <span
            key={orb.fillClassName}
            className={`${sidekickOrbBlobBaseClasses} ${orb.transformClassName} ${orb.rotateClassName}`}
          >
            <span
              className={`${sidekickOrbBlobFillClasses} ${orb.fillClassName}`}
            />
          </span>
        ))}
      </span>
    </>
  );
}

export function SidekickBackgroundOrbsClip() {
  return (
    <div className="absolute inset-0 z-1">
      <SidekickBackgroundOrbs />
    </div>
  );
}
