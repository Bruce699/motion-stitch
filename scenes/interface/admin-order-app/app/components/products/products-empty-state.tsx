import { Button, Icon, Link } from '~/ui';
import { ProductsEmptyStateVisual } from './products-empty-state-visual';

export function ProductsEmptyState() {
  return (
    <div className="relative isolate flex flex-1 items-center overflow-hidden rounded-3xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(0_0_0/0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgb(0_0_0/0.02)_1px,transparent_1px)] bg-size-[64px_64px] bg-center"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--tw-gradient-from)_0%,transparent_10%,transparent_90%,var(--tw-gradient-from)_100%),linear-gradient(to_bottom,var(--tw-gradient-from)_0%,transparent_10%,transparent_90%,var(--tw-gradient-from)_100%)] from-background"
      />
      <ProductsEmptyStateVisual />
      <div className="relative z-2 mx-auto flex w-220 flex-col">
        <div className="text-3xl font-medium">
          <h1 className="mb-1 text-3xl">Products</h1>
          <p className="text-muted-foreground">Where it all starts</p>
        </div>
        <div className="mt-10 inline-flex gap-3">
          <Button
            href="/store/products/mvse-libertee"
            prefix={<Icon name="Plus" />}
          >
            Add product
          </Button>
          <Button
            onClick={() => {}}
            type="button"
            variant="secondary"
            prefix={<Icon name="Import" />}
          >
            Import
          </Button>
        </div>

        <p className="mt-20 w-92 text-muted-foreground">
          <span className="font-medium text-primary">
            Don't have an idea yet?
          </span>{' '}
          Dropshipping or print on demand products ship directly from the
          supplier to your customer and you only have to pay for what you sell.{' '}
          <Link
            to="/store/products"
            className="inline-flex items-center gap-0.75 font-medium text-primary hover:underline"
          >
            Learn more
            <span className="pt-0.25">
              <Icon name="ChevronRight" size={10} strokeWidth={2} />
            </span>
          </Link>
        </p>
      </div>
    </div>
  );
}
