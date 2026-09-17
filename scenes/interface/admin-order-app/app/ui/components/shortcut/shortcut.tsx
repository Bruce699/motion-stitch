import { Icon, type IconName } from '../icon/icon';
import clsx from 'clsx';

type ShortcutModifier = 'command' | 'shift';
type ShortcutAction = 'enter';

export type ShortcutKey =
  | { type: 'modifier'; name: ShortcutModifier }
  | { type: 'action'; name: ShortcutAction }
  | { type: 'character'; value: string };

const shortcutModifierIcons: Record<ShortcutModifier, IconName> = {
  command: 'Command',
  shift: 'ArrowBoldUp',
};

const shortcutActionIcons: Record<ShortcutAction, IconName> = {
  enter: 'ArrowTurnLeft',
};

function getShortcutIcon(key: Exclude<ShortcutKey, { type: 'character' }>) {
  if (key.type === 'modifier') return shortcutModifierIcons[key.name];

  return shortcutActionIcons[key.name];
}

export function Shortcut({ keys }: { keys: ShortcutKey[] }) {
  return (
    <span
      className={clsx(
        'flex h-5 items-center gap-0.5 rounded-sm bg-black/8 px-1.5 py-1 text-secondary',
        'dark:bg-white/8',
      )}
    >
      {keys.map((key, index) => {
        const iconName = key.type === 'character' ? null : getShortcutIcon(key);

        return (
          <span key={`${key.type}-${index}`}>
            {iconName ? (
              <Icon name={iconName} size={12} strokeWidth={1.75} />
            ) : (
              key.type === 'character' && <span>{key.value}</span>
            )}
          </span>
        );
      })}
    </span>
  );
}
