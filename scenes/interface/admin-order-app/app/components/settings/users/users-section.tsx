import { users } from '~/data/users';
import { Avatar } from '~/ui/components/avatar/avatar';
import { Badge } from '~/ui/components/badge/badge';
import { Checkbox } from '~/ui/components/checkbox/checkbox';
import { SearchBar } from '~/ui/components/search-bar/search-bar';
import { Section } from '~/ui/components/section/section';
import * as Table from '~/ui/components/table/table';

export function UsersSection() {
  return (
    <Section bleed>
      <div className="flex flex-col gap-2 py-2">
        <SearchBar
          aria-label="Search users"
          bleed
          placeholder="Search"
          className="pr-3 pl-2"
        />
        <div className="px-2">
          <Table.Root stickyHeader={false}>
            <Table.Head>
              <Table.Row>
                <Table.Header type="checkbox">
                  <Checkbox.Root aria-label="Select all users">
                    <Checkbox.Indicator />
                  </Checkbox.Root>
                </Table.Header>
                <Table.Header className="w-1/2">Name</Table.Header>
                <Table.Header className="w-1/4">Role</Table.Header>
                <Table.Header className="w-1/4">Status</Table.Header>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {users.map((user) => (
                <Table.Row key={user.id}>
                  <Table.Cell type="checkbox">
                    <Checkbox.Root aria-label={`Select ${user.name}`}>
                      <Checkbox.Indicator />
                    </Checkbox.Root>
                  </Table.Cell>
                  <Table.Cell className="w-1/2">
                    <span className="inline-flex items-center gap-3">
                      <Avatar
                        size="lg"
                        rounded
                        src={user.image}
                        initials={user.initials}
                        name={user.name}
                      />
                      <span className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {user.email}
                        </span>
                      </span>
                    </span>
                  </Table.Cell>
                  <Table.Cell className="w-1/4">{user.role}</Table.Cell>
                  <Table.Cell className="w-1/4">
                    <Badge
                      variant={user.status === 'Active' ? 'success' : 'info'}
                    >
                      {user.status}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </div>
      </div>
    </Section>
  );
}
