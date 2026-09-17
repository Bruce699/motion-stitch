import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import type { SharedPopoverHandle } from './shared-popover-types';

const createHandle = BaseTooltip.createHandle as <
  Payload,
>() => SharedPopoverHandle<Payload>;

export { createHandle };
