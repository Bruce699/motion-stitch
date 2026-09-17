import { useEffect, useRef, useState } from 'react';
import { homeCards, type HomeCard } from '~/data/home-cards';
import { useLoadedImages } from '~/hooks/use-loaded-images';
import { clsx } from 'clsx';
import { Image } from '~/ui';

type HomeCardColumn = 'left' | 'middle' | 'right';

const homeCardColumns: HomeCardColumn[] = ['left', 'middle', 'right'];

function getColumnCards(columnIndex: number): HomeCard[] {
  return homeCards.filter(
    (_, index) => index % homeCardColumns.length === columnIndex,
  );
}

function getScrollableParent(element: HTMLElement) {
  let parent = element.parentElement;

  while (parent) {
    const { overflowY } = window.getComputedStyle(parent);
    const canScroll = /(auto|scroll|overlay)/.test(overflowY);

    if (canScroll && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }

    parent = parent.parentElement;
  }

  return window;
}

function isElementInRevealRange(
  element: HTMLElement,
  scrollRoot: HTMLElement | Window,
) {
  const elementRect = element.getBoundingClientRect();
  const rootRect =
    scrollRoot === window
      ? { top: 0, bottom: window.innerHeight }
      : (scrollRoot as HTMLElement).getBoundingClientRect();
  const revealOffset = 160;
  const visibleHeight =
    Math.min(elementRect.bottom, rootRect.bottom + revealOffset) -
    Math.max(elementRect.top, rootRect.top);

  return visibleHeight >= elementRect.height * 0.2;
}

function getHiddenCardClasses(column: HomeCardColumn) {
  if (column === 'left') return 'translate-x-[-48px] translate-y-24';
  if (column === 'right') return 'translate-x-[48px] translate-y-24';

  return 'translate-y-12';
}

function HomeCardTile({
  card,
  column,
  entranceDelay,
}: {
  card: HomeCard;
  column: HomeCardColumn;
  entranceDelay: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hasEnteredView, setHasEnteredView] = useState(false);
  const { allImagesLoaded, handleImageLoad } = useLoadedImages([
    card.visual.src,
  ]);
  const shouldReveal = hasEnteredView && allImagesLoaded;

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;

    const cardElement = element;
    const scrollRoot = getScrollableParent(cardElement);
    let animationFrame = 0;

    function checkVisibility() {
      animationFrame = 0;

      if (isElementInRevealRange(cardElement, scrollRoot)) {
        setHasEnteredView(true);
      }
    }

    function scheduleVisibilityCheck() {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(checkVisibility);
    }

    scheduleVisibilityCheck();
    scrollRoot.addEventListener('scroll', scheduleVisibilityCheck, {
      passive: true,
    });
    window.addEventListener('resize', scheduleVisibilityCheck);

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      scrollRoot.removeEventListener('scroll', scheduleVisibilityCheck);
      window.removeEventListener('resize', scheduleVisibilityCheck);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className={clsx(
        'transition-[opacity,scale,translate] ease-out',
        shouldReveal
          ? 'translate-x-0 translate-y-0 scale-100 opacity-100'
          : `scale-105 opacity-0 ${getHiddenCardClasses(column)}`,
      )}
      style={
        entranceDelay > 0 ? { transitionDelay: `${entranceDelay}s` } : undefined
      }
    >
      <div className="cursor-pointer overflow-hidden rounded-3xl bg-background shadow-sm transition-transform ease-out hover:scale-103 hover:rotate-1 active:scale-[0.975]">
        <div className="flex h-28 flex-col gap-1 p-4">
          <h2 className="line-clamp-2 font-medium text-primary">
            {card.title}
          </h2>
          <p className="line-clamp-3 text-muted-foreground">
            {card.description}
          </p>
        </div>
        <Image
          src={card.visual.src}
          alt={card.visual.alt}
          size="full"
          className="aspect-1280/725 w-full"
          borderRadius="base"
          loading="lazy"
          decoding="async"
          onLoad={() => handleImageLoad(card.visual.src)}
        />
      </div>
    </div>
  );
}

export function HomeCards({ entranceDelay = 0 }: { entranceDelay?: number }) {
  return (
    <section aria-label="Home cards" className="grid grid-cols-3 gap-6">
      {homeCardColumns.map((column, columnIndex) => (
        <div key={column} className="flex flex-col gap-6">
          {getColumnCards(columnIndex).map((card) => (
            <HomeCardTile
              key={card.id}
              card={card}
              column={column}
              entranceDelay={entranceDelay}
            />
          ))}
        </div>
      ))}
    </section>
  );
}
