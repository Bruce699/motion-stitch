# Banner — inline notice surface

import { Banner } from '~/ui'
Props: children, icon, actionLabel, onActionClick, variant(caution), className, plus div attributes.

Use for: concise notices and contextual page banners.
Do: keep children to one concise sentence.
Do: pass a concise actionLabel and onActionClick when the banner has one action.
Do: pair icon and actionLabel only when they help clarify the notice.
Don't: use for broad record statuses — use Badge or StatusIndicator.
Don't: put forms, menus, or multi-action layouts inside Banner.

Example:

  <Banner
    variant="caution"
    icon={<Icon name="CartAlert" />}
    actionLabel="Place test order"
    onActionClick={handlePlaceTestOrder}
  >
    Place test orders on checkout without processing real payments
  </Banner>

  <Banner icon={<Icon name="Info" />}>
    Customer payment details are checked before the order is created
  </Banner>
