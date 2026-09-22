import { SectionType, TemplateId } from '../types';
export const templates: {
  id: TemplateId;
  name: string;
  description: string;
  free: boolean;
}[] = [
  {
    id: 'mehedi',
    name: 'Navy Badge Resume',
    description: 'Compact navy headings and two-column header, based on your PDF',
    free: true,
  },
  {
    id: 'ats',
    name: 'ATS',
    description: 'Single-column serif layout with centered contact details, based on your new PDF',
    free: true,
  },
];
export const sectionLabels: Record<SectionType, string> = {
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
};
export const sectionOrder = Object.keys(sectionLabels) as SectionType[];
export const summaryExamples = [
  'Product-focused mobile developer with a record of shipping reliable, accessible applications. Skilled at translating business needs into maintainable user experiences.',
  'Results-driven professional known for clear communication, thoughtful problem solving and consistent delivery across cross-functional teams.',
  'Detail-oriented specialist with hands-on experience improving processes, supporting customers and delivering measurable operational outcomes.',
];
export const bulletExamples = [
  'Improved delivery speed by simplifying a high-friction workflow.',
  'Collaborated with cross-functional partners to deliver work on schedule.',
  'Owned quality checks, documentation and post-release follow-up.',
];
