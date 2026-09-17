const buttonBaseClasses =
  'ease-out group relative isolate inline-flex shrink-0 active:scale-[0.975] items-center justify-center overflow-hidden rounded-full leading-none font-medium whitespace-nowrap no-underline select-none focus:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer transition-[background-color,color,transform]';

const buttonSizes: Record<string, string> = {
  default: 'gap-2 h-7.5 px-3 text-base has-[>svg]:px-2',
  sm: 'gap-1.5 h-6.5 px-2.5 text-sm has-[>svg]:px-2',
  icon: 'size-7.5',
  'sm-icon': 'size-6.5',
};

const buttonVariants: Record<string, string> = {
  primary:
    'bg-gray-900 hover:bg-gray-950 shadow-button-primary bg-[radial-gradient(50%_50%_at_50%_0%,--theme(--color-white/15%),transparent),radial-gradient(50%_33%_at_50%_100%,--theme(--color-white/10%),transparent_66%)] text-white dark:bg-white dark:hover:bg-gray-200 dark:bg-[radial-gradient(50%_50%_at_50%_0%,--theme(--color-black/18%),transparent),radial-gradient(70%_44%_at_50%_100%,--theme(--color-black/14%),transparent_72%)] dark:text-gray-950 dark:shadow-none',
  elevated:
    'bg-white hover:bg-gray-50 shadow-button-elevated text-shadow-2xs text-shadow-white dark:border-none dark:bg-gray-900 dark:from-gray-900 dark:to-gray-950 dark:ring-1 dark:inset-shadow-[0_1px_0,0_1px_0,0_0_0_1px] dark:ring-black/40 dark:inset-shadow-white/2 dark:text-shadow-black dark:text-shadow-xs',
  secondary:
    'shadow-none bg-gray-200 hover:bg-gray-300 dark:bg-white/16 dark:hover:bg-white/24',
  plain:
    'bg-transparent shadow-none ring-0 inset-shadow-none hover:bg-black/5 dark:hover:bg-white/8 dark:inset-shadow-none hover:text-primary',
};

const buttonTones: Record<string, string> = {
  default: '',
  destructive:
    'text-destructive-foreground hover:text-destructive-foreground hover:bg-white/15',
};

function buttonBaseClass(size: string = 'default'): string {
  return `${buttonBaseClasses} ${buttonSizes[size] ?? buttonSizes.default}`;
}

export function buttonClass(
  variant: string = 'primary',
  size: string = 'default',
  tone: string = 'default',
): string {
  return `${buttonBaseClass(size)} ${
    buttonVariants[variant] ?? buttonVariants.primary
  } ${buttonTones[tone] ?? buttonTones.default}`;
}
