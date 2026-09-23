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
  {
    id: 'sidebar',
    name: 'Professional Sidebar',
    description: 'Photo, colored name banner and dark information sidebar',
    free: true,
  },
  { id: 'international', name: 'International Standard', description: 'Wide color header and straightforward sections for global applications', free: true },
  { id: 'profile', name: 'Profile Timeline', description: 'Photo and personal details beside a clean work and education timeline', free: true },
  { id: 'structured', name: 'Structured Classic', description: 'Detailed single-column CV with clear dates, headings and skills', free: true },
  { id: 'navy', name: 'Navy Professional', description: 'Dark blue sidebar with compact experience and education details', free: true },
  { id: 'timeline', name: 'Modern Timeline', description: 'Soft blue photo sidebar and milestone-style career history', free: true },
  { id: 'executive', name: 'Contemporary Two-Column', description: 'Introductory profile, contact strip and balanced career columns', free: true },
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
  custom: 'Custom section',
};
export const sectionOrder = Object.keys(sectionLabels).filter(x => x !== 'custom') as SectionType[];
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
