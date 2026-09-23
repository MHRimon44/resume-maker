import { ResumeBundle } from '../types';
import { referenceResumeHtml } from './referenceResumeHtml';
import { atsResumeHtml } from './atsResumeHtml';
import { sidebarResumeHtml } from './sidebarResumeHtml';
import { globalResumeHtml } from './globalResumeHtml';
import { decorateResumeHtml } from '../utils/resumeStyle';

export function resumeHtml(bundle: ResumeBundle): string {
  const html =
    bundle.resume.templateId === 'sidebar'
      ? sidebarResumeHtml(bundle)
      : !['custom', 'ats'].includes(bundle.resume.templateId)
      ? globalResumeHtml(bundle)
      : bundle.resume.templateId === 'ats'
      ? atsResumeHtml(bundle)
      : referenceResumeHtml(bundle);
  return decorateResumeHtml(html, bundle);
}
