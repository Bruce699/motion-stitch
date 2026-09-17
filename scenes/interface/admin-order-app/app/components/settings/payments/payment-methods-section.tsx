import { useState } from 'react';
import { paymentMethods } from '~/data/payment-methods';
import { Section, Table } from '~/ui';
import { Switch } from '~/ui/components/switch/switch';

function PaymentMethodsSection() {
  const [enabledMethodIds, setEnabledMethodIds] = useState(
    () => new Set(paymentMethods.map((method) => method.id)),
  );
  const [managedPaymentMethods, setManagedPaymentMethods] = useState(false);

  return (
    <Section
      bleed
      wrapperContent={
        <div className="flex flex-col gap-3 px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <p className="font-medium">Managed payment methods</p>
              <p className="text-secondary">
                Show personalized options at checkout and add new methods when
                they become available
              </p>
            </div>
            <Switch
              ariaLabel="Managed payment methods"
              checked={managedPaymentMethods}
              onCheckedChange={(checked) => {
                setManagedPaymentMethods(checked);
                if (checked) {
                  setEnabledMethodIds(
                    new Set(paymentMethods.map((method) => method.id)),
                  );
                }
              }}
            />
          </div>
        </div>
      }
    >
      <div className="p-3">
        <Table.Root stickyHeader={false}>
          <Table.Head>
            <Table.Row>
              <Table.Header>Method</Table.Header>
              <Table.Header>Online</Table.Header>
              <Table.Header>In-person</Table.Header>
              <Table.Header className="text-right">Status</Table.Header>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {paymentMethods.map((method) => (
              <Table.Row key={method.name}>
                <Table.Cell>
                  <div className="flex items-center gap-3">
                    <PaymentMethodIcon src={method.icon} />
                    <p className="font-medium">{method.name}</p>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-secondary tabular-nums">
                    {method.online}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-secondary">{method.inPerson}</span>
                </Table.Cell>
                <Table.Cell className="text-right">
                  <Switch
                    ariaLabel={`${method.name} enabled`}
                    checked={enabledMethodIds.has(method.id)}
                    disabled={managedPaymentMethods}
                    onCheckedChange={(checked) => {
                      if (managedPaymentMethods) return;

                      setEnabledMethodIds((currentMethodIds) => {
                        const nextMethodIds = new Set(currentMethodIds);
                        if (checked) {
                          nextMethodIds.add(method.id);
                        } else {
                          nextMethodIds.delete(method.id);
                        }

                        return nextMethodIds;
                      });
                    }}
                  />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </div>
    </Section>
  );
}

function PaymentMethodIcon({ src }: { src: string }) {
  return (
    <span className="flex h-6 w-[35px] shrink-0 items-center justify-center overflow-hidden">
      <img
        alt=""
        className="h-6 w-[35px] translate-y-px object-contain"
        src={src}
      />
    </span>
  );
}

export { PaymentMethodsSection };
