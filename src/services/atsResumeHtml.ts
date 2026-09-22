import { ResumeBundle, ResumeSection, SectionType } from '../types';
import { entriesForSection, sectionTitle } from '../utils/resumeStyle';
import { sectionLabels } from '../constants/content';
import { entryExtraLines, parseEntryExtras } from '../utils/entryFields';

const esc = (s: string = '') => s.replace(/[&<>"']/g, x =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]!));
const lines = (s: string, bullet: boolean) => s.split('\n').map(x => x.trim()).filter(Boolean)
  .map(x => `<div class="detail">${bullet ? '<span class="bullet">•</span>' : ''}${esc(x.replace(/^[•›-]\s*/, ''))}</div>`).join('');

export function atsResumeHtml(bundle: ResumeBundle): string {
  const { resume, sections } = bundle;
  const p = resume.personal;
  const accent = /^#[0-9a-fA-F]{6}$/.test(resume.accent) ? resume.accent : '#173B57';
  const contact = [p.location, p.phone, p.email].filter(Boolean).map(esc).join(' &nbsp; | &nbsp; ');
  const links = [p.website, p.github, p.portfolio].filter(Boolean).map(esc).join(' &nbsp; | &nbsp; ');
  const section = (item: ResumeSection) => {
    const type = item.type;
    const items = entriesForSection(bundle, item);
    if (type === 'summary' ? !resume.summary : !items.length) return '';
    const heading = type === 'summary' ? 'Professional Summary' :
      type === 'experience' ? 'Professional Experience' :
      type === 'skills' ? 'Technical Skills' : type === 'projects' ? 'Selected Projects' : sectionTitle(item);
    const content = type === 'summary' ? `<p>${esc(resume.summary)}</p>` : items.map(e => {
      const extra = parseEntryExtras(e.meta);
      const date = [e.startDate, e.endDate].filter(Boolean).join(' – ');
      const right = type === 'projects' ? e.subtitle : date;
      const metadata = entryExtraLines(type, e.meta)
        .filter(x => !x.startsWith('Work location:') && !x.startsWith('Campus / location:'))
        .map(x => `<div class="meta">${esc(x)}</div>`).join('');
      if (type === 'skills') return `<article class="skill"><strong>${esc(e.title)}${e.title && !e.title.endsWith(':') ? ':' : ''}</strong> ${esc(e.details)}${metadata}</article>`;
      return `<article><div class="row"><strong>${esc(e.title)}</strong><span>${esc(right)}</span></div>
        ${type !== 'projects' && (e.subtitle || extra.location) ? `<div class="row secondary"><i>${esc(e.subtitle)}</i><i>${esc(extra.location)}</i></div>` : ''}
        ${e.details ? `<div class="details">${lines(e.details, type === 'experience' || type === 'leadership' || type === 'awards')}</div>` : ''}${metadata}</article>`;
    }).join('');
    return `<section data-section="${item.id}"><h2>${esc(heading)}</h2>${content}</section>`;
  };
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @page{size:${resume.paperSize};margin:0}*{box-sizing:border-box}
  body{margin:0;background:white;color:#171717;font:${12 * resume.fontScale}px Georgia,'Times New Roman',serif;line-height:1.21}
  .page{padding:39px 40px 43px}header{text-align:center;margin-bottom:10px}
  .photo{width:55px;height:55px;border-radius:50%;object-fit:cover;display:block;margin:0 auto 5px}
  h1{font-size:22px;margin:0;font-weight:bold}.headline{font-size:12px;margin:2px 0}
  .contact{font-size:10px;margin-top:2px}section{margin-top:9px}
  h2{font-size:13px;color:${accent};border-bottom:1px solid ${accent};padding-bottom:1px;margin:0 0 2px}
  p{margin:0;text-align:justify}article{break-inside:avoid;margin-bottom:3px}
  .row{display:flex;justify-content:space-between;gap:10px}.row strong{flex:1}.row span,.row i:last-child{white-space:nowrap;text-align:right}
  .secondary{font-size:11px}.secondary i:first-child{flex:1}.details{text-align:justify}
  .detail{position:relative;padding-left:12px}.bullet{position:absolute;left:1px}
  .meta{font-size:10px}.skill{margin-bottom:0}
  </style></head><body><div class="page"><header>
  ${p.photoUri?.startsWith('data:image/') ? `<img class="photo" src="${p.photoUri}">` : ''}
  <h1>${esc(p.fullName || 'Your Name')}</h1><div class="headline">${esc(p.headline)}</div>
  <div class="contact">${contact}</div><div class="contact">${links}</div></header>
  ${sections.filter(s => s.visible).sort((a, b) => a.sortOrder - b.sortOrder).map(s => section(s)).join('')}
  </div></body></html>`;
}
