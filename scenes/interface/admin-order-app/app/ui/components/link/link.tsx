import React from 'react';
import {
  Link as ReactRouterLink,
  type LinkProps as ReactRouterLinkProps,
  useNavigate,
} from 'react-router';
import { useChangesStore } from '~/stores/use-changes-store';

type LinkAsLinkProps = ReactRouterLinkProps & {
  as?: 'link';
  ref?: React.Ref<HTMLAnchorElement>;
};

type LinkAsButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'type'
> &
  Pick<ReactRouterLinkProps, 'to' | 'state'> & {
    as: 'button';
    ref?: React.Ref<HTMLButtonElement>;
    type?: React.ButtonHTMLAttributes<HTMLButtonElement>['type'];
  };

type LinkProps = LinkAsLinkProps | LinkAsButtonProps;

function Link(props: LinkProps) {
  return props.as === 'button' ? (
    <ButtonLink {...props} />
  ) : (
    <AnchorLink {...props} />
  );
}

function ButtonLink({
  to,
  state,
  onClick,
  ref,
  type = 'button',
  ...buttonProps
}: LinkAsButtonProps) {
  const navigate = useNavigate();
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    if (
      useChangesStore.getState().blockNavigationIfUnsavedChanges({ to, state })
    ) {
      event.preventDefault();
      return;
    }

    navigate(to, { state });
  };

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      {...buttonProps}
      onClick={handleClick}
    />
  );
}

function AnchorLink({
  as,
  onClick,
  prefetch = 'intent',
  ref,
  state,
  to,
  ...linkProps
}: LinkAsLinkProps) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    if (
      useChangesStore.getState().blockNavigationIfUnsavedChanges({ to, state })
    ) {
      event.preventDefault();
    }
  };

  return (
    <ReactRouterLink
      ref={ref as React.Ref<HTMLAnchorElement>}
      prefetch={prefetch}
      state={state}
      to={to}
      {...linkProps}
      onClick={handleClick}
    />
  );
}

export { Link };
export type { LinkAsButtonProps, LinkAsLinkProps, LinkProps };
