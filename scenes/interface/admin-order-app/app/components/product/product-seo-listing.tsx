import { Image, Section } from '~/ui';

function ProductSeoListing({
  description,
  image,
  site,
  title,
}: {
  description: string;
  image: string;
  site: string;
  title: string;
}) {
  return (
    <Section noBg bleed title="Search engine listing">
      <div className="flex cursor-pointer items-start gap-5 rounded-3xl bg-muted p-4 py-4">
        <Image
          src={image}
          alt=""
          size={96}
          borderRadius="xl"
          loading="lazy"
          decoding="async"
          aria-hidden="true"
          className="shrink-0"
        />
        <div className="flex flex-col">
          <p className="text-md text-secondary">{site}</p>
          {title.trim() ? (
            <h2 className="mt-1 text-xl font-semibold text-primary">{title}</h2>
          ) : null}
          <p className="text-md mt-1 max-w-[680px] leading-snug text-secondary">
            {description}
          </p>
        </div>
      </div>
    </Section>
  );
}

export { ProductSeoListing };
