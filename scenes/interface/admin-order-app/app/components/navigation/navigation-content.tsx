import React from 'react';
import clsx from 'clsx';
import { m } from 'motion/react';
import { SECTIONS_BY_ID } from '../../data/navigation';
import { PRIMARY_NAV_GROUPS } from '../../data/navigation-groups';
import { NavigationGroupHeader } from './navigation-group-header';
import { NavigationItem } from './navigation-item';

export function NavigationContent({
  activePath,
  isNavOpen,
  isSecondaryNavigationActive,
  isSharedTooltipOpen,
  onCollapsedEmptySpaceClick,
}: {
  activePath: string;
  isNavOpen: boolean;
  isSecondaryNavigationActive: boolean;
  isSharedTooltipOpen: boolean;
  onCollapsedEmptySpaceClick: () => void;
}) {
  const canExpandFromEmptySpace = !isNavOpen && !isSecondaryNavigationActive;

  return (
    <m.nav
      className={clsx(
        'flex w-full flex-1 shrink-0 flex-col overflow-y-auto transition-opacity ease-out group-hover/settings-active:opacity-100 group-hover/settings-active:duration-100',
        isSecondaryNavigationActive && !isSharedTooltipOpen && 'opacity-50',
      )}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.01,
          },
        },
      }}
    >
      {PRIMARY_NAV_GROUPS.map((group, groupIndex) => (
        <React.Fragment key={group.title ?? groupIndex}>
          {group.title && (
            <NavigationGroupHeader title={group.title} isNavOpen={isNavOpen} />
          )}

          {group.sectionIds.map((id) => {
            const section = SECTIONS_BY_ID.get(id);
            if (!section) return null;

            return (
              <NavigationItem
                key={id}
                section={section}
                isNavOpen={isNavOpen}
                activePath={activePath}
              />
            );
          })}
        </React.Fragment>
      ))}

      <div
        aria-hidden
        className={clsx(
          'min-h-0 flex-1',
          canExpandFromEmptySpace && 'cursor-e-resize',
        )}
        onClick={
          canExpandFromEmptySpace ? onCollapsedEmptySpaceClick : undefined
        }
      />
    </m.nav>
  );
}
