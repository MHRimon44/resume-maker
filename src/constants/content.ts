import { SectionType, TemplateId } from '../types';
export const templates: {
  id: TemplateId;
  name: string;
  description: string;
  free: boolean;
}[] = [
  {
    id: 'modern',
    name: 'Modern Slate',
    description: 'Bold header and crisp two-column feel',
    free: true,
  },
  {
    id: 'classic',
    name: 'Executive Classic',
    description: 'Traditional, ATS-friendly structure',
    free: true,
  },
  {
    id: 'minimal',
    name: 'Quiet Minimal',
    description: 'Whitespace-led editorial layout',
    free: true,
  },
  {
    id: 'europass',
    name: 'European CV',
    description: 'Europass-inspired structure for experience, education and skills',
    free: true,
  },
  {
    id: 'ats',
    name: 'ATS Simple',
    description: 'Single-column layout with standard headings and readable text',
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
