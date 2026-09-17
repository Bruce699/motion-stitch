import { AnimatePresence, m } from 'motion/react';
import { motionEasings, motionDurations } from '~/ui/tokens/motion';
import type { SearchGroup, SearchGroupId } from '~/data/search-data';
import { Button } from '~/ui/components/button/button';

const filterGroupIds: SearchGroupId[] = [
  'products',
  'customers',
  'orders',
  'discounts',
  'collections',
];

const filterItemVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.95, filter: 'blur(3px)' },
  visible: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
} as const;

const filterEnterDelay = 0.2;
const filterStaggerDelay = 0.05;

export function SearchFilters({
  groups,
  onActiveGroupChange,
}: {
  groups: SearchGroup[];
  onActiveGroupChange: (group: SearchGroupId) => void;
}) {
  const filterGroups = groups.filter((group) =>
    filterGroupIds.includes(group.id),
  );

  if (filterGroups.length === 0) return null;

  return (
    <div className="flex items-start gap-2 px-4">
      <AnimatePresence>
        {filterGroups.map((group, groupIndex) => (
          <m.div
            key={group.id}
            initial="hidden"
            animate="visible"
            variants={filterItemVariants}
            exit="hidden"
            transition={{
              delay: filterEnterDelay + groupIndex * filterStaggerDelay,
              duration: motionDurations.fast,
              ease: motionEasings.easeOut,
            }}
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onActiveGroupChange(group.id)}
            >
              <span>{group.label}</span>
              <span className="pl-1 text-secondary">{group.items.length}</span>
            </Button>
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
