import React from 'react';
import { useParams } from 'react-router';
import { CustomerAside } from '~/components/customer/customer-aside';
import { CustomerOrders } from '~/components/customer/customer-orders';
import { CustomerStoreCredit } from '~/components/customer/customer-store-credit';
import { CustomerTitle } from '~/components/customer/customer-title';
import { CustomerToolbar } from '~/components/customer/customer-toolbar';
import { MainContentLayout } from '~/components/main-content-layout';
import { customers, type Customer } from '~/data/customers';
import { orders } from '~/data/orders';

type CustomerFormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  segment: string;
  emailSubscribed: boolean;
  smsSubscribed: boolean;
  tag: string;
  note: string;
  storeCreditAmount: string;
  storeCreditExpiryDate: string;
};

type CustomerFormReducerState = {
  customerId: string;
  values: CustomerFormState;
  baseline: CustomerFormState;
  dirtyFields: Set<CustomerFormField>;
};

type CustomerFormField = keyof CustomerFormState;

type CustomerFormAction =
  | { type: 'setName'; value: string }
  | { type: 'setEmailSubscribed'; value: boolean }
  | { type: 'setSmsSubscribed'; value: boolean }
  | { type: 'setTag'; value: string }
  | { type: 'setNote'; value: string }
  | { type: 'setStoreCreditAmount'; value: string }
  | { type: 'setStoreCreditExpiryDate'; value: string }
  | { type: 'resetResource'; customerId: string; value: CustomerFormState }
  | { type: 'save' }
  | { type: 'reset' };

function getCustomer(customerId: string) {
  return (
    customers.find((customer) => customer.id === customerId) ?? customers[0]
  );
}

function customerFormReducer(
  state: CustomerFormReducerState,
  action: CustomerFormAction,
): CustomerFormReducerState {
  switch (action.type) {
    case 'setName':
      return setCustomerFormField(state, 'name', action.value);
    case 'setEmailSubscribed':
      return setCustomerFormField(state, 'emailSubscribed', action.value);
    case 'setSmsSubscribed':
      return setCustomerFormField(state, 'smsSubscribed', action.value);
    case 'setTag':
      return setCustomerFormField(state, 'tag', action.value);
    case 'setNote':
      return setCustomerFormField(state, 'note', action.value);
    case 'setStoreCreditAmount':
      return setCustomerFormField(state, 'storeCreditAmount', action.value);
    case 'setStoreCreditExpiryDate':
      return setCustomerFormField(state, 'storeCreditExpiryDate', action.value);
    case 'resetResource':
      return initCustomerFormReducerState(action.customerId, action.value);
    case 'save':
      return {
        ...state,
        baseline: state.values,
        dirtyFields: new Set<CustomerFormField>(),
      };
    case 'reset':
      return {
        ...state,
        values: state.baseline,
        dirtyFields: new Set<CustomerFormField>(),
      };
  }
}

function initCustomerFormReducerState(
  customerId: string,
  value: CustomerFormState,
): CustomerFormReducerState {
  return {
    customerId,
    values: value,
    baseline: value,
    dirtyFields: new Set<CustomerFormField>(),
  };
}

function setCustomerFormField<K extends CustomerFormField>(
  state: CustomerFormReducerState,
  field: K,
  value: CustomerFormState[K],
): CustomerFormReducerState {
  const values = { ...state.values, [field]: value };
  const dirtyFields = new Set(state.dirtyFields);

  if (Object.is(value, state.baseline[field])) {
    dirtyFields.delete(field);
  } else {
    dirtyFields.add(field);
  }

  return { ...state, values, dirtyFields };
}

function initCustomerForm(customer: Customer): CustomerFormState {
  return {
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    segment: customer.segment ?? 'Promising',
    emailSubscribed: customer.emailSubscribed,
    smsSubscribed: customer.smsSubscribed,
    tag: '',
    note: '',
    storeCreditAmount: '100',
    storeCreditExpiryDate: '2028-01-01',
  };
}

export default function CustomerDetailPage() {
  const { customerId = '' } = useParams();
  const customer = React.useMemo(() => getCustomer(customerId), [customerId]);
  const initialFormState = React.useMemo(
    () => initCustomerForm(customer),
    [customer],
  );
  const [reducerState, dispatch] = React.useReducer(
    customerFormReducer,
    initialFormState,
    (value) => initCustomerFormReducerState(customer.id, value),
  );
  const formState =
    reducerState.customerId === customer.id
      ? reducerState
      : initCustomerFormReducerState(customer.id, initialFormState);

  React.useEffect(() => {
    if (reducerState.customerId === customer.id) return;

    dispatch({
      type: 'resetResource',
      customerId: customer.id,
      value: initialFormState,
    });
  }, [customer.id, initialFormState, reducerState.customerId]);

  const {
    values: {
      address,
      city,
      email,
      emailSubscribed,
      name,
      note,
      phone,
      segment,
      smsSubscribed,
      storeCreditAmount,
      storeCreditExpiryDate,
      tag,
    },
  } = formState;
  const customerOrders = React.useMemo(
    () => orders.filter((order) => order.customerId === customer.id),
    [customer.id],
  );
  const hasChanges = formState.dirtyFields.size > 0;
  const handleSave = React.useCallback(() => dispatch({ type: 'save' }), []);
  const handleDiscard = React.useCallback(
    () => dispatch({ type: 'reset' }),
    [],
  );
  const handleEmailSubscribedChange = React.useCallback(
    (value: boolean) => dispatch({ type: 'setEmailSubscribed', value }),
    [],
  );
  const handleNoteChange = React.useCallback(
    (value: string) => dispatch({ type: 'setNote', value }),
    [],
  );
  const handleSmsSubscribedChange = React.useCallback(
    (value: boolean) => dispatch({ type: 'setSmsSubscribed', value }),
    [],
  );
  const handleTagChange = React.useCallback(
    (value: string) => dispatch({ type: 'setTag', value }),
    [],
  );
  const handleStoreCreditAmountChange = React.useCallback(
    (value: string) => dispatch({ type: 'setStoreCreditAmount', value }),
    [],
  );
  const handleStoreCreditExpiryDateChange = React.useCallback(
    (value: string) => dispatch({ type: 'setStoreCreditExpiryDate', value }),
    [],
  );

  return (
    <>
      <CustomerToolbar
        customer={customer}
        name={name}
        hasChanges={hasChanges}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
      <MainContentLayout
        aside={
          <CustomerAside
            customer={customer}
            customerName={name}
            emailSubscribed={emailSubscribed}
            note={note}
            orders={customerOrders}
            segment={segment}
            smsSubscribed={smsSubscribed}
            tag={tag}
            onEmailSubscribedChange={handleEmailSubscribedChange}
            onNoteChange={handleNoteChange}
            onSmsSubscribedChange={handleSmsSubscribedChange}
            onTagChange={handleTagChange}
          />
        }
        variant="constrained"
      >
        <div className="flex flex-col gap-8">
          <CustomerTitle
            address={address}
            city={city}
            customer={customer}
            email={email}
            name={name}
            phone={phone}
          />
          <CustomerOrders customerName={name} orders={customerOrders} />
          <CustomerStoreCredit
            amount={storeCreditAmount}
            expiryDate={storeCreditExpiryDate}
            onAmountChange={handleStoreCreditAmountChange}
            onExpiryDateChange={handleStoreCreditExpiryDateChange}
          />
        </div>
      </MainContentLayout>
    </>
  );
}
