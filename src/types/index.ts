export type TemplateId =
  | 'custom'
  | 'ats'
  | 'sidebar'
  | 'international'
  | 'profile'
  | 'structured'
  | 'navy'
  | 'timeline'
  | 'executive';
export type PaperSize = 'A4' | 'Letter';
export type SectionType =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages'
  | 'leadership'
  | 'awards'
  | 'references'
  | 'custom';
export type FontFamily = 'sans' | 'serif' | 'mono';
export type ColorRole =
  | 'page'
  | 'header'
  | 'sidebar'
  | 'name'
  | 'headline'
  | 'contact'
  | 'sectionHeading'
  | 'entryTitle'
  | 'meta'
  | 'body';
export type ResumeStyle = {
  fontFamily?: FontFamily;
  colors?: Partial<Record<ColorRole, string>>;
};
export type Personal = {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  github?: string;
  portfolio?: string;
  photoUri?: string;
  gender?: string;
  dateOfBirth?: string;
  interests?: string;
  nationality?: string;
};
export type Resume = {
  id: string;
  title: string;
  templateId: TemplateId;
  personal: Personal;
  summary: string;
  accent: string;
  fontScale: number;
  style?: ResumeStyle;
  paperSize: PaperSize;
  createdAt: string;
  updatedAt: string;
};
export type Entry = {
  id: string;
  resumeId: string;
  type: SectionType;
  title: string;
  subtitle: string;
  startDate: string;
  endDate: string;
  details: string;
  meta: string;
  sortOrder: number;
  sectionId?: string;
};
export type ResumeSection = {
  id: string;
  resumeId: string;
  type: SectionType;
  visible: boolean;
  sortOrder: number;
  title?: string;
  color?: string;
};
export type ResumeBundle = {
  resume: Resume;
  entries: Entry[];
  sections: ResumeSection[];
};
export type RootStackParamList = {
  Home: undefined;
  Templates: { resumeId?: string } | undefined;
  Editor: { resumeId: string };
  Preview: { resumeId: string; draft?: ResumeBundle };
  Settings: undefined;
};
