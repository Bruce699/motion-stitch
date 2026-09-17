# Section — titled content surface

import { Section } from '~/ui'
Props: title subtitle action children dashed bleed wrapperBg wrapperContent

Use for: grouping related page content inside a consistent rounded surface.
Do: keep titles and subtitles short and use one section per related group.
Do: pass section-level controls, menus, and buttons through action so the shared header owns alignment and spacing.
Do: omit bleed for normal padded content; Section already provides default padding.
Do: use bleed only for flush tables, edge-to-edge media, or custom internal spacing that intentionally differs from the default.
Do: pass wrapperContent for notice/card surfaces that need a wrapper background behind flush child rows. wrapperBg defaults to bg-muted and accepts any background color class.
Do: toggle wrapperContent by passing content or null; Section animates the wrapper without changing its API.
Don't: pass bleed and then add p-5, px-5, or equivalent default padding to the only child.
Don't: hand-roll section wrappers, h2 headers, header flex rows, action menus, or rounded/shadowed content surfaces when Section's title, subtitle, action, bleed, and wrapperContent props fit.
Don't: use for the whole page shell or for interactive disclosure.

Example:

  <Section title="Campaign settings">
    <p>Configure discount rules and eligibility.</p>
  </Section>

  <Section
    title="Customs information"
    action={<Menu trigger={<Button size="icon" variant="plain">...</Button>} />}
  >
    <p>Configure customs defaults.</p>
  </Section>

  <Section wrapperBg="bg-destructive">
    <p>Replace your Shopify Scripts with Shopify Functions</p>
  </Section>

  <Section wrapperBg="bg-blue-200">
    <p>Informational detail</p>
  </Section>

  <Section wrapperBg="bg-[color:var(--color-blue-200)]">
    <p>Custom informational detail</p>
  </Section>

  <Section wrapperContent={enabled ? <p>Extra settings</p> : null}>
    <Switch checked={enabled} onCheckedChange={setEnabled} />
  </Section>
