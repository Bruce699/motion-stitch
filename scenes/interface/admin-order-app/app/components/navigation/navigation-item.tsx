import { m } from 'motion/react';
import { motionEasings } from '~/ui/tokens/motion';
import type { PrimaryNavigationSection } from '../../data/navigation';
import {
  NavigationAccordion,
  PRIMARY_NAV_SELECTION_LAYOUT_ID,
} from './navigation-accordion';


export function NavigationItem({
  section,
  isNavOpen,
  activePath,
}: {
  section: PrimaryNavigationSection;
  isNavOpen: boolean;
  activePath: string;
}) {
  return (
    <m.div
      transition={{ duration: 0.4, ease: motionEasings.ease }}
      className="relative shrink-0"
      variants={{
        hidden: {
          opacity: 0,
          filter: 'blur(2px)',
          x: -60,
        },
        visible: {
          opacity: 1,
          filter: 'blur(0px)',
          x: 0,
        },
      }}
    >
      <NavigationAccordion
        title={section.title}
        href={section.href}
        quantity={section.quantity}
        icon={section.icon}
        isNavigationPanelExpanded={isNavOpen}
        exactMatch={section.exactMatch}
        activePath={activePath}
        items={section.items}
        selectionLayoutId={PRIMARY_NAV_SELECTION_LAYOUT_ID}
      />
    </m.div>
  );
}
