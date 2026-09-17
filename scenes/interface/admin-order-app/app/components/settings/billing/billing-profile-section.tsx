import { Badge } from '~/ui/components/badge/badge';
import { Button } from '~/ui/components/button/button';
import { Icon } from '~/ui/components/icon/icon';
import { Image } from '~/ui/components/image/image';
import { Section } from '~/ui/components/section/section';

const mastercardIcon = '/images/payment-settings/small-cards/mastercard.svg';

export function BillingProfileSection() {
  return (
    <Section
      title="Billing profile"
      wrapperBg="bg-yellow-200"
      wrapperContent={
        <div className="flex items-center gap-3 px-5 py-3 text-sm text-yellow-900">
          <Icon name="TriangleWarning" />
          <p>
            Your sales will be interrupted when your credit card expires soon
          </p>
        </div>
      }
      action={
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {}}
            variant="secondary"
            prefix={<Icon name="CircleDollar" />}
            suffix={<Icon name="ChevronDown" size={12} />}
          >
            USD
          </Button>
          <Button
            onClick={() => {}}
            variant="secondary"
            prefix={<Icon name="Plus" />}
          >
            Add method
          </Button>
        </div>
      }
    >
      <div className="flex items-center gap-4">
        <Image
          alt=""
          borderRadius="none"
          objectFit="contain"
          size={44}
          src={mastercardIcon}
        />
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex-start flex gap-2">
            <p className="font-medium">Mastercard</p>
            <Badge variant="caution">Expires 07/24</Badge>
          </div>
          <p className="text-muted-foreground tabular-nums">
            <span aria-hidden>{'\u2022\u2022\u2022\u2022'}</span> 0029
          </p>
        </div>
        <Button onClick={() => {}}>Update</Button>
      </div>
    </Section>
  );
}
