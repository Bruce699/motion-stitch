import { Button, Icon, Section } from '~/ui';

function ScriptsNotice() {
  return (
    <Section
      wrapperBg="bg-destructive"
      wrapperContent={
        <div className="flex items-center gap-3 px-5 py-3 text-sm text-destructive-foreground">
          <Icon name="TriangleWarning" />
          <p>
            Action required by June 30, 2026. Scripts that power your checkout
            will stop working.
          </p>
        </div>
      }
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">
            <Icon name="ReplaceObjs" />
          </span>
          <p className="font-medium">
            Replace your Shopify Scripts with Shopify Functions
          </p>
        </div>
        <Button onClick={() => {}}>Review</Button>
      </div>
    </Section>
  );
}

export { ScriptsNotice };
