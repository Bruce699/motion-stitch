import { getCustomerInitials } from '~/data/customers';
import type { SearchItem } from '~/data/search-data';
import { Avatar } from '~/ui/components/avatar/avatar';

export function SearchThumbnail({ item }: { item: SearchItem }) {
  if (item.navigationIcon) {
    return (
      <span
        aria-label={item.title}
        className="flex size-8 items-center justify-center rounded-md bg-gray-300 text-secondary"
        title={item.title}
      >
        {item.navigationIcon}
      </span>
    );
  }

  if (item.image) {
    return <Avatar name={item.title} size="lg" src={item.image} />;
  }

  if (item.group === 'customers') {
    return (
      <Avatar
        initials={getCustomerInitials(item.title)}
        name={item.title}
        rounded
        size="lg"
      />
    );
  }

  return <Avatar iconName={item.icon} name={item.title} size="lg" />;
}
