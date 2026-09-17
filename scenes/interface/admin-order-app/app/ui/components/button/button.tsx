import { clsx } from 'clsx';
import { AnimatePresence, m, type HTMLMotionProps } from 'motion/react';
import React from 'react';
import { Link, type LinkAsLinkProps } from '../link/link';
import { buttonClass } from './button-class';
import { motionDurations, motionEasings } from '~/ui/tokens/motion';

const buttonMotionTransition = {
  duration: motionDurations.base,
  ease: motionEasings.easeOut,
};

export function Button({
  variant = 'primary',
  size = 'default',
  tone = 'default',
  type = 'button',
  href,
  prefix,
  suffix,
  className: cls,
  disabled,
  onClick,
  children,
  ...props
}: Omit<HTMLMotionProps<'button'>, 'children' | 'layout' | 'prefix'> & {
  children?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'elevated' | 'secondary' | 'plain';
  tone?: 'default' | 'destructive';
  size?: 'default' | 'sm' | 'icon' | 'sm-icon';
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  href?: string;
}) {
  const prefixKey = getButtonAddonKey(prefix, 'prefix');
  const labelKey = getButtonAddonKey(children, 'label');
  const suffixKey = getButtonAddonKey(suffix, 'suffix');
  const className = clsx(buttonClass(variant, size, tone), cls);

  const content = (
    <>
      <ButtonAddon slotKey={prefixKey}>{prefix}</ButtonAddon>
      <ButtonLabel slotKey={labelKey}>{children}</ButtonLabel>
      <ButtonAddon slotKey={suffixKey}>{suffix}</ButtonAddon>
    </>
  );

  if (href) {
    return (
      <Link
        className={className}
        to={href}
        {...({ disabled, onClick, ...props } as Omit<LinkAsLinkProps, 'to'>)}
      >
        {content}
      </Link>
    );
  }

  return (
    <m.button
      className={className}
      disabled={disabled}
      onClick={onClick}
      type={type}
      {...props}
    >
      {content}
    </m.button>
  );
}

function ButtonLabel({
  children,
  slotKey,
}: {
  children?: React.ReactNode;
  slotKey: React.Key;
}) {
  if (children === undefined || children === null || children === false) {
    return null;
  }

  return (
    <span className="relative inline-flex shrink">
      <AnimatePresence initial={false} mode="popLayout">
        <m.span
          key={slotKey}
          className="inline-flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={buttonMotionTransition}
        >
          {children}
        </m.span>
      </AnimatePresence>
    </span>
  );
}

function ButtonAddon({
  children,
  slotKey,
}: {
  children?: React.ReactNode;
  slotKey: React.Key;
}) {
  return (
    <AnimatePresence initial={false} mode="popLayout">
      {children && (
        <m.span
          key={slotKey}
          className="-mx-0.5 inline-flex shrink-0 items-center"
          initial={{ opacity: 0, scale: 0.3, filter: 'blur(2px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.3, filter: 'blur(2px)' }}
          transition={buttonMotionTransition}
        >
          {children}
        </m.span>
      )}
    </AnimatePresence>
  );
}

function getButtonAddonKey(
  node: React.ReactNode,
  fallback: React.Key,
): React.Key {
  if (typeof node === 'string' || typeof node === 'number') return node;

  if (React.isValidElement<{ name?: unknown }>(node)) {
    if (node.key != null) return node.key;
    if (typeof node.props.name === 'string') return node.props.name;
  }

  return fallback;
}
