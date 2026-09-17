import type { ReactNode } from 'react';

import { Icon, type IconName } from '~/ui/components/icon/icon';
import { Switch } from '~/ui/components/switch/switch';

export type SettingsActionListItem = {
  title: string;
  icon: IconName;
  description?: ReactNode;
  value?: string;
  control?: 'switch';
  defaultChecked?: boolean;
};

function SettingsActionList({ items }: { items: SettingsActionListItem[] }) {
  return (
    <div className="flex flex-col gap-1">
      {items.map((item, index) => (
        <div key={item.title}>
          {item.control === 'switch' ? (
            <div className="flex items-center justify-between gap-5 py-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-muted-foreground">
                  <Icon name={item.icon} />
                </span>
                <div className="flex flex-col gap-0.5">
                  <p>{item.title}</p>
                  {item.description ? (
                    <p className="text-muted-foreground">{item.description}</p>
                  ) : null}
                </div>
              </div>
              <Switch
                ariaLabel={item.title}
                defaultChecked={item.defaultChecked ?? true}
                onCheckedChange={() => {}}
              />
            </div>
          ) : (
            <button
              className="flex w-full items-center justify-between gap-4 py-3 text-left"
              type="button"
            >
              <span className="flex items-center gap-3">
                <span className="text-muted-foreground">
                  <Icon name={item.icon} />
                </span>
                <p>{item.title}</p>
              </span>
              <span className="flex shrink-0 items-center gap-1.5 text-primary">
                {item.value ? <span>{item.value}</span> : null}
                <span className="text-muted-foreground">
                  <Icon
                    name={item.value ? 'ChevronExpandY' : 'ChevronRight'}
                    size={14}
                  />
                </span>
              </span>
            </button>
          )}
          {index < items.length - 1 ? (
            <div className="w-full ps-6.5">
              <hr className="h-px w-full shrink-0 rounded-full border-0 bg-border" />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export { SettingsActionList };
