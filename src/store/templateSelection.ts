import { TemplateId } from '../types';

const pending = new Map<string, TemplateId>();

export function chooseTemplateForEditor(resumeId: string, templateId: TemplateId) {
  pending.set(resumeId, templateId);
}

export function takeTemplateForEditor(resumeId: string): TemplateId | undefined {
  const selection = pending.get(resumeId);
  pending.delete(resumeId);
  return selection;
}
