import { CustomField } from '../types';

type SectionDraft = { id?: string; title: string; fields: CustomField[] };
const pending = new Map<string, SectionDraft>();
export function putCustomSectionDraft(resumeId: string, draft: SectionDraft) {
  pending.set(resumeId, draft);
}
export function takeCustomSectionDraft(resumeId: string): SectionDraft | undefined {
  const draft = pending.get(resumeId);
  pending.delete(resumeId);
  return draft;
}
