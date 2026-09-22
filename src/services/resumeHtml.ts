import { ResumeBundle } from '../types';
import { referenceResumeHtml } from './referenceResumeHtml';
import { atsResumeHtml } from './atsResumeHtml';
import { sidebarResumeHtml } from './sidebarResumeHtml';
import { globalResumeHtml } from './globalResumeHtml';

export function resumeHtml(bundle: ResumeBundle): string {
  if (bundle.resume.templateId === 'sidebar') return sidebarResumeHtml(bundle);
  if (!['mehedi', 'ats'].includes(bundle.resume.templateId)) return globalResumeHtml(bundle);
  return bundle.resume.templateId === 'ats' ? atsResumeHtml(bundle) : referenceResumeHtml(bundle);
}
