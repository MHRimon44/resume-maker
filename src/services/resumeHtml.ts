import { sectionLabels } from '../constants/content';
import { Entry, ResumeBundle, SectionType, TemplateId } from '../types';

const esc = (value = '') => value.replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
const lines = (value: string) => esc(value).split('\n').filter(Boolean).map(line =>
  `<div class="detail">${line.startsWith('•') ? '' : '• '}${line}</div>`).join('');
const templateName: Record<TemplateId, string> = {
  modern: 'Modern Slate', classic: 'Executive Classic', minimal: 'Quiet Minimal',
  europass: 'European CV', ats: 'ATS Simple',
};

export function resumeHtml({ resume, entries, sections }: ResumeBundle) {
  const p = resume.personal;
  const visible = sections.filter(item => item.visible).sort((a, b) => a.sortOrder - b.sortOrder);
  const isModern = resume.templateId === 'modern';
  const isEuropass = resume.templateId === 'europass';
  const isAts = resume.templateId === 'ats';
  const accent = isAts ? '#111827' : isEuropass ? '#165A86' : resume.accent;
  const labels: Partial<Record<SectionType, string>> = isEuropass ? {
    summary: 'Personal profile', experience: 'Work experience',
    education: 'Education and training', skills: 'Personal skills',
    languages: 'Language skills',
  } : {};

  const sectionHtml = (type: SectionType) => {
    const title = labels[type] || sectionLabels[type];
    if (type === 'summary') {
      return resume.summary ? `<section class="section ${type}"><h2>${title}</h2><p>${esc(resume.summary)}</p></section>` : '';
    }
    const items = entries.filter(entry => entry.type === type);
    if (!items.length) return '';
    return `<section class="section ${type}"><h2>${title}</h2>${items.map((entry: Entry) => `
      <article>
        <div class="dates">${esc(entry.startDate)}${entry.startDate || entry.endDate ? ' - ' : ''}${esc(entry.endDate || (entry.startDate ? 'Present' : ''))}</div>
        <div class="entry">
          <h3>${esc(entry.title)}</h3>
          ${entry.subtitle ? `<div class="sub">${esc(entry.subtitle)}</div>` : ''}
          ${entry.details ? `<div class="details">${lines(entry.details)}</div>` : ''}
          ${entry.meta ? `<div class="meta">${esc(entry.meta)}</div>` : ''}
        </div>
      </article>`).join('')}</section>`;
  };

  const sectionsBy = (types: SectionType[]) => visible.filter(item => types.includes(item.type)).map(item => sectionHtml(item.type)).join('');
  const contact = [p.phone, p.email, p.location, p.website].filter(Boolean).map(esc).join(' &nbsp; • &nbsp; ');
  const sidebarTypes: SectionType[] = ['skills', 'languages', 'certifications', 'references'];
  const content = isModern
    ? `<div class="columns"><aside>${sectionsBy(sidebarTypes)}</aside><main>${sectionsBy(visible.map(x => x.type).filter(type => !sidebarTypes.includes(type)))}</main></div>`
    : `<main>${visible.map(item => sectionHtml(item.type)).join('')}</main>`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:${resume.paperSize};margin:0}*{box-sizing:border-box}
    body{margin:0;background:#fff;color:#172433;font-family:Arial,sans-serif;font-size:${13 * resume.fontScale}px;line-height:1.46}
    .page{min-height:100vh;padding:${isModern ? '0 42px 42px' : '42px 48px'}}
    header{padding:${isModern ? '34px 30px 28px' : '0 0 22px'};${isModern ? `background:linear-gradient(110deg,${accent},#173C5B);color:white;border-radius:0 0 22px 22px` : `border-bottom:2px solid ${accent}`}}
    .template-label{font-size:9px;text-transform:uppercase;letter-spacing:2px;font-weight:700;opacity:.72;margin-bottom:8px}
    h1{font-size:${isAts ? 29 : 35}px;line-height:1.08;margin:0;color:${isModern ? '#fff' : accent};letter-spacing:.2px}
    .headline{font-size:16px;font-weight:600;margin-top:5px}.contact{font-size:10.5px;margin-top:12px;${isModern ? 'color:#e8f3f3' : 'color:#53636f'}}
    main{min-width:0}.columns{display:grid;grid-template-columns:30% 1fr;gap:24px;margin-top:22px}
    aside{background:#f3f7f7;border:1px solid #dce6e5;border-radius:16px;padding:2px 17px 18px}
    .section{margin-top:21px;break-inside:avoid}.section h2{font-size:11.5px;line-height:1.2;text-transform:uppercase;letter-spacing:${isAts ? '.4px' : '1.8px'};color:${accent};margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid ${accent}}
    article{display:grid;grid-template-columns:${isEuropass ? '112px 1fr' : '1fr'};gap:14px;margin:0 0 14px;break-inside:avoid}
    .dates{font-size:10px;color:#65727b;${isEuropass ? '' : 'text-align:right;grid-row:1;grid-column:1'}}
    .entry{${isEuropass ? '' : 'grid-row:1;grid-column:1'}}h3{font-size:14px;margin:0;padding-right:${isEuropass ? '0' : '130px'};color:#111827}
    .sub{font-size:11.5px;font-weight:600;color:#51616d;margin:2px 0 5px}.details{margin-top:5px}.detail{margin:2px 0}.meta{font-size:10px;color:#60717d;margin-top:4px}
    p{margin:0}.ats .section{margin-top:18px}
    ${isAts ? '.template-label{display:none}.page{padding:40px 50px}header{border-bottom:1px solid #111827}.section h2{color:#111827;border-bottom:1px solid #111827}article{display:block}.dates{text-align:left;margin:2px 0}.entry h3{padding:0}' : ''}
    ${resume.templateId === 'classic' ? 'body{font-family:Georgia,serif}.section h2{letter-spacing:.8px}.page{padding:46px 54px}' : ''}
    ${resume.templateId === 'minimal' ? '.page{padding:54px 62px}header{border:0;padding-bottom:28px}.section h2{border:0;padding:0}.section{margin-top:26px}' : ''}
    ${isModern ? 'aside .section h2{font-size:10px}aside article{display:block}aside .dates{display:none}aside h3{padding:0;font-size:12px}aside .detail{font-size:11px}main article{display:block}main .dates{float:right}main h3{padding-right:130px}' : ''}
  </style></head><body class="${resume.templateId}"><div class="page">
    <header><div class="template-label">${templateName[resume.templateId]}</div><h1>${esc(p.fullName || 'Your Name')}</h1>
      <div class="headline">${esc(p.headline)}</div><div class="contact">${contact}</div></header>
    ${content}
  </div></body></html>`;
}
