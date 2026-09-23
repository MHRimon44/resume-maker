import { SectionType } from '../types';

type ExtraKey = 'location' | 'technology' | 'url' | 'credentialId' | 'email' | 'phone';
type ExtraField = { key: ExtraKey; label: string; placeholder?: string };

export type EntryFields = {
  title: string;
  subtitle?: string;
  startDate?: string;
  endDate?: string;
  details?: string;
  detailsMultiline?: boolean;
  extras?: ExtraField[];
};

export const entryFields: Record<Exclude<SectionType, 'summary'>, EntryFields> = {
  experience: {
    title: 'Job title', subtitle: 'Company / employer',
    startDate: 'Start date', endDate: 'End date (or Present)',
    details: 'Responsibilities and achievements (one per line)', detailsMultiline: true,
    extras: [{ key: 'location', label: 'Work location' }],
  },
  education: {
    title: 'Institution / school', subtitle: 'Degree / qualification',
    startDate: 'Start year', endDate: 'Graduation year',
    details: 'Grade / CGPA',
    extras: [{ key: 'location', label: 'Campus / location' }],
  },
  skills: {
    title: 'Skill category', details: 'Skills (comma separated)',
    detailsMultiline: true,
  },
  projects: {
    title: 'Project name', subtitle: 'Platform (Android / iOS / Web)',
    details: 'What you built and its impact', detailsMultiline: true,
    extras: [
      { key: 'technology', label: 'Technologies used' },
      { key: 'url', label: 'Project / store link' },
    ],
  },
  certifications: {
    title: 'Certificate / award name', subtitle: 'Issuing organization',
    startDate: 'Issue date', endDate: 'Expiry date (if any)',
    details: 'Description (optional)', detailsMultiline: true,
    extras: [
      { key: 'credentialId', label: 'Credential ID' },
      { key: 'url', label: 'Certificate link' },
    ],
  },
  languages: {
    title: 'Language', subtitle: 'Proficiency level',
    details: 'Additional details (optional)',
  },
  leadership: {
    title: 'Role / activity', subtitle: 'Organization',
    startDate: 'Start date (optional)', endDate: 'End date (optional)',
    details: 'What you contributed (optional)', detailsMultiline: true,
  },
  awards: {
    title: 'Award / achievement', subtitle: 'Issuing organization',
    startDate: 'Award date', details: 'Description', detailsMultiline: true,
    extras: [{ key: 'url', label: 'Certificate link' }],
  },
  references: {
    title: 'Full name', subtitle: 'Job title / position',
    details: 'Department and organization', detailsMultiline: true,
    extras: [
      { key: 'email', label: 'Email address' },
      { key: 'phone', label: 'Phone number' },
    ],
  },
  custom: {
    title: 'Item title', subtitle: 'Subtitle / organization (optional)',
    startDate: 'Start date (optional)', endDate: 'End date (optional)',
    details: 'Description (one point per line)', detailsMultiline: true,
    extras: [{ key: 'url', label: 'Link (optional)' }],
  },
};

const marker = 'resume-studio:extras:v1:';
export type EntryExtras = Partial<Record<ExtraKey, string>> & { legacy?: string };

export function parseEntryExtras(meta: string): EntryExtras {
  if (!meta.startsWith(marker)) return meta ? { legacy: meta } : {};
  try {
    const value: unknown = JSON.parse(meta.slice(marker.length));
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.fromEntries(
        Object.entries(value).filter(([, item]) => typeof item === 'string'),
      ) as EntryExtras;
    }
  } catch {
    // Keep an older or damaged metadata value visible and editable.
  }
  return { legacy: meta };
}

export function serializeEntryExtras(extras: EntryExtras): string {
  const filled = Object.fromEntries(
    Object.entries(extras).filter(([, value]) => typeof value === 'string' && value.trim()),
  );
  if (!Object.keys(filled).length) return '';
  if (Object.keys(filled).length === 1 && typeof filled.legacy === 'string') {
    return filled.legacy;
  }
  return marker + JSON.stringify(filled);
}

export function entryExtraLines(type: SectionType, meta: string): string[] {
  const extras = parseEntryExtras(meta);
  const fields = type === 'summary' ? [] : entryFields[type].extras ?? [];
  return [
    ...fields.map(field => {
      const value = extras[field.key];
      return value ? `${field.label}: ${value}` : '';
    }).filter(Boolean),
    ...(extras.legacy ? [extras.legacy] : []),
  ];
}
