import { ResumeBundle } from '../types';
import { referenceResumeHtml } from './referenceResumeHtml';
import { atsResumeHtml } from './atsResumeHtml';

export function resumeHtml(bundle: ResumeBundle): string {
  return bundle.resume.templateId === 'ats' ? atsResumeHtml(bundle) : referenceResumeHtml(bundle);
}
