import type { ComponentProps } from 'react';
import { Button } from '~/ui/components/button/button';
import { Icon } from '~/ui/components/icon/icon';
import { Input } from '~/ui/components/input/input';
import { clsx } from 'clsx';

type SearchBarProps = Omit<
  ComponentProps<typeof Input>,
  'prefix' | 'variant'
> & {
  bleed?: boolean;
  onFilterClick?: () => void;
};

function SearchBar({
  bleed = false,
  className,
  onFilterClick,
  ...props
}: SearchBarProps) {
  return (
    <div
      className={clsx(
        'flex items-center gap-2',
        !bleed && 'rounded-xl bg-background px-1.5 py-0.75 pe-1.5 shadow-sm',
        className,
      )}
    >
      <Input
        type="search"
        variant="borderless"
        prefix={
          <span className="text-muted-foreground">
            <Icon name="Search" />
          </span>
        }
        {...props}
      />
      <div className="text-secondary">
        <Button
          variant="plain"
          size="icon"
          type="button"
          aria-label="Filter"
          onClick={onFilterClick}
        >
          <Icon name="BarsFilter" />
        </Button>
      </div>
    </div>
  );
}

export { SearchBar };
