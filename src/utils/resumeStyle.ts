import {
  ColorRole,
  FontFamily,
  Resume,
  ResumeBundle,
  ResumeSection,
} from '../types';

export const colorRoles: { key: ColorRole; label: string }[] = [
  { key: 'page', label: 'Page background' },
  { key: 'header', label: 'Header / banner' },
  { key: 'sidebar', label: 'Sidebar background' },
  { key: 'name', label: 'Name' },
  { key: 'headline', label: 'Professional headline' },
  { key: 'contact', label: 'Contact details' },
  { key: 'sectionHeading', label: 'Section headings' },
  { key: 'entryTitle', label: 'Entry titles' },
  { key: 'meta', label: 'Dates and subtitles' },
  { key: 'body', label: 'Descriptions and body text' },
];
export const fontFamilies: {
  key: FontFamily;
  label: string;
  pdf: string;
  native: string;
}[] = [
  {
    key: 'sans',
    label: 'Sans serif',
    pdf: 'Arial, sans-serif',
    native: 'sans-serif',
  },
  { key: 'serif', label: 'Serif', pdf: 'Georgia, serif', native: 'serif' },
  { key: 'mono', label: 'Monospace', pdf: 'monospace', native: 'monospace' },
];
export const validColor = (value: string): boolean =>
  /^#[0-9a-fA-F]{6}$/.test(value);
export function fontFor(resume: Resume): FontFamily {
  return (
    resume.style?.fontFamily ?? (resume.templateId === 'ats' ? 'serif' : 'sans')
  );
}
export const sectionTitle = (section: ResumeSection): string =>
  section.type === 'custom'
    ? section.title?.trim() || 'Custom section'
    : (
        {
          summary: 'Professional summary',
          experience: 'Experience',
          education: 'Education',
          skills: 'Skills',
          projects: 'Projects',
          certifications: 'Certifications',
          languages: 'Languages',
          leadership: 'Leadership Activities',
          awards: 'Awards',
          references: 'References',
        } as Record<string, string>
      )[section.type];
export const entriesForSection = (
  bundle: ResumeBundle,
  section: ResumeSection,
) =>
  bundle.entries.filter(entry =>
    section.type === 'custom'
      ? entry.type === 'custom' && entry.sectionId === section.id
      : entry.type === section.type,
  );

export function htmlStyleOverrides(
  resume: Resume,
  sections: ResumeSection[],
): string {
  const colors = resume.style?.colors ?? {};
  const font = fontFamilies.find(x => x.key === fontFor(resume))!.pdf;
  const rules = [`body, body * { font-family: ${font} !important; }`];
  const put = (key: ColorRole, selectors: string, property: string) => {
    const color = colors[key];
    if (color && validColor(color))
      rules.push(`${selectors} { ${property}: ${color} !important; }`);
  };
  put(
    'page',
    'body, .page, .single, .right, .main, .columns main, .executive-columns',
    'background-color',
  );
  put(
    'header',
    'header, .banner, .top, .executive-head, .contact-strip',
    'background-color',
  );
  put(
    'sidebar',
    'aside, .sidebar-bg, .left, .side-details',
    'background-color',
  );
  put('name', 'h1, .name', 'color');
  put('headline', '.headline, .role', 'color');
  put(
    'contact',
    '.contacts, .contact, .contact span, .contact-item, .side-contact, .contact-strip',
    'color',
  );
  put('sectionHeading', 'section h2, section h2 span, .section-title', 'color');
  put(
    'entryTitle',
    'article strong, .entry-head strong, .item-title strong, .row strong',
    'color',
  );
  put(
    'meta',
    '.period, .meta, .subtitle, .location, .right, .item-sub, .item-date',
    'color',
  );
  put(
    'body',
    'article, p, .summary, .details, .detail, .description, .skill, .side-item',
    'color',
  );
  for (const section of sections) {
    if (section.color && validColor(section.color)) {
      // Section identifiers are app-generated UUIDs, so they cannot inject CSS.
      const id = section.id.replace(/[^a-zA-Z0-9_-]/g, '');
      rules.push(
        `[data-section="${id}"] h2, [data-section="${id}"] h2 span { color: ${section.color} !important; }`,
      );
    }
  }
  return rules.join('\n');
}
export function decorateResumeHtml(html: string, bundle: ResumeBundle): string {
  return html.replace(
    '</style>',
    `${htmlStyleOverrides(bundle.resume, bundle.sections)}</style>`,
  );
}
