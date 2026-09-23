import { ResumeBundle, ResumeSection, SectionType } from '../types';
import { entriesForSection, sectionTitle } from '../utils/resumeStyle';
import { sectionLabels } from '../constants/content';
import { entryExtraLines, parseEntryExtras } from '../utils/entryFields';

const esc = (s: string = '') => s.replace(/[&<>"']/g, x =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]!));
const sidebarTypes: SectionType[] = ['skills', 'languages'];
const primaryTypes: SectionType[] = ['summary', 'experience', 'projects', 'leadership'];

export function globalResumeHtml(bundle: ResumeBundle): string {
  const { resume, entries, sections } = bundle;
  const p = resume.personal;
  const variant = resume.templateId;
  const color = /^#[0-9a-fA-F]{6}$/.test(resume.accent) ? resume.accent : '#174A92';
  const side = variant === 'profile' || variant === 'navy' || variant === 'timeline';
  const twoColumn = variant === 'executive';
  const label = (section: ResumeSection) => sectionTitle(section);
  const sectionHtml = (section: ResumeSection) => {
    const type = section.type;
    const records = entriesForSection(bundle, section);
    if (type === 'summary' ? !resume.summary : !records.length) return '';
    const body = type === 'summary' ? `<p>${esc(resume.summary)}</p>` : records.map(e => {
      const extra = parseEntryExtras(e.meta);
      const period = [e.startDate, e.endDate].filter(Boolean).join(' – ');
      const rest = entryExtraLines(type, e.meta).filter(x => !x.startsWith('Work location:') && !x.startsWith('Campus / location:'));
      return `<article><div class="period">${esc(period)}${extra.location ? ` · ${esc(extra.location)}` : ''}</div>
        <div class="entry-head"><strong>${esc(e.title)}</strong><span>${esc(e.subtitle)}</span></div>
        ${e.details ? `<div class="details">${e.details.split('\n').map(x => x.trim()).filter(Boolean).map(x =>
          `<div>${type === 'experience' || type === 'leadership' ? '• ' : ''}${esc(x.replace(/^[•›-]\s*/, ''))}</div>`).join('')}</div>` : ''}
        ${rest.map(x => `<div class="meta">${esc(x)}</div>`).join('')}</article>`;
    }).join('');
    return `<section data-section="${section.id}" class="section-${type}"><h2>${esc(label(section))}</h2>${body}</section>`;
  };
  const enabled = sections.filter(s => s.visible).sort((a, b) => a.sortOrder - b.sortOrder);
  const renderSections = (filter: (type: SectionType) => boolean) => enabled.filter(s => filter(s.type)).map(s => sectionHtml(s)).join('');
  const contacts = [p.phone, p.email, p.location, p.website, p.github, p.portfolio, p.nationality].filter(Boolean)
    .map(x => `<span>${esc(x)}</span>`).join('');
  const photo = p.photoUri?.startsWith('data:image/') ? `<img class="photo" src="${p.photoUri}" />` : '';
  const sideDetails = `<div class="side-details">${photo}<h1>${esc(p.fullName || 'Your Name')}</h1>
    <div class="role">${esc(p.headline)}</div>${[p.gender, p.dateOfBirth, p.phone, p.email, p.website, p.location, p.github, p.portfolio]
    .concat(p.nationality).filter(Boolean).map(x => `<div class="contact-item">${esc(x)}</div>`).join('')}
    ${renderSections(type => sidebarTypes.includes(type))}
    ${p.interests ? `<section><h2>Interests</h2><p>${esc(p.interests)}</p></section>` : ''}</div>`;
  const main = renderSections(type => !side || !sidebarTypes.includes(type));
  const header = `<header>${photo}<div><h1>${esc(p.fullName || 'Your Name')}</h1><div class="role">${esc(p.headline)}</div>
    <div class="contacts">${contacts}</div></div></header>`;
  let body = '';
  if (side) body = `<div class="sidebar-bg"></div><div class="columns"><aside>${sideDetails}</aside><main>${renderSections(type => !sidebarTypes.includes(type))}</main></div>`;
  else if (twoColumn) body = `<div class="executive-head">${header}${resume.summary ? `<p>${esc(resume.summary)}</p>` : ''}</div>
    <div class="contact-strip">${contacts}</div><div class="executive-columns"><div>${renderSections(type => primaryTypes.includes(type) && type !== 'summary')}</div>
    <div>${renderSections(type => !primaryTypes.includes(type))}</div></div>`;
  else body = `${header}<main class="single">${main}</main>`;
  const css = `@page{size:${resume.paperSize};margin:0}*{box-sizing:border-box}
    body{margin:0;background:#fff;color:#333;font:${12 * resume.fontScale}px Arial,sans-serif;line-height:1.3}
    .page{position:relative;min-height:100vh}.photo{width:80px;height:80px;border-radius:50%;object-fit:cover}
    h1{font-size:25px;margin:0 0 4px}.role{font-size:14px;margin-bottom:7px}
    .contacts{display:flex;flex-wrap:wrap;gap:4px 13px;font-size:10px}.contact-item{overflow-wrap:anywhere;margin:7px 0}
    header{padding:35px 38px 20px;display:flex;gap:18px;align-items:center}
    .single{padding:0 38px 36px}section{margin:0 0 17px;break-inside:avoid}
    h2{font-size:13px;text-transform:uppercase;border-bottom:2px solid ${color};padding:0 0 3px;margin:0 0 8px;color:#272e34}
    article{margin:0 0 13px;break-inside:avoid}.period{font-size:10px;color:#647078;margin-bottom:3px}
    .entry-head{display:flex;gap:6px;flex-wrap:wrap;border-bottom:1px solid #c4ced3;padding-bottom:2px}
    .entry-head strong{font-weight:800}.details{margin:5px 0 0 12px}.meta{font-size:10px;margin-top:3px}
    p{margin:0}.sidebar-bg{position:fixed;left:0;top:0;bottom:0;width:30%;background:#f3f6f8}
    .columns{display:flex;position:relative}.columns aside{width:30%;padding:32px 19px;flex-shrink:0}
    .columns main{width:70%;padding:38px 31px}.side-details h1{font-size:19px;margin:12px 0}
    .side-details .photo{display:block;margin-bottom:10px}.side-details section{margin-top:20px}
    .side-details h2{font-size:11px}.side-details article{font-size:10px}.side-details .entry-head{border:0}
    .side-details .period{display:none}.side-details .details{margin-left:0}
    .executive-head{margin:28px 34px 0;padding:0 4px 17px;border:1px solid ${color};border-radius:8px}
    .executive-head header{padding:13px 14px 7px}.executive-head p{padding:0 14px}
    .contact-strip{margin:8px 34px 20px;background:#20394d;color:white;padding:11px 15px;border-radius:5px}
    .contact-strip span{display:inline-block;margin:3px 15px 3px 0}
    .executive-columns{display:flex;gap:25px;margin:0 34px;padding-bottom:35px}
    .executive-columns>div{width:50%}.executive-columns h2{color:#20394d}
    body.international header{display:block;background:${color};color:white;margin:32px 35px 12px;padding:24px}
    body.international header .photo{float:right;width:65px;height:65px}
    body.international h1{font-size:20px}body.international .single{padding:0 55px}
    body.international section h2:before,body.structured section h2:before{content:'•';color:${color};margin-left:-17px;margin-right:7px}
    body.international section h2,body.structured section h2{border-bottom-width:1px}
    body.structured header{padding:45px 36px 25px;background:#fafafa}
    body.structured .single{padding:20px 54px}body.structured h2{border-color:#92989d}
    body.profile .sidebar-bg{background:#f7f8fa}body.profile .columns main{padding-top:72px}
    body.profile .columns main article{border-left:1px solid ${color};padding-left:17px;position:relative}
    body.profile .columns main article:before,body.timeline .columns main article:before{content:'';position:absolute;left:-4px;top:6px;width:8px;height:8px;border-radius:50%;background:${color}}
    body.navy .sidebar-bg{background:#0c3154}body.navy aside{color:#fff}
    body.navy aside h2{color:#fff;border-color:#6184a3}body.navy .columns main{padding-top:35px}
    body.timeline .sidebar-bg{background:#e5f0fc}body.timeline .columns main{padding-top:80px}
    body.timeline .columns main article{border-left:1px solid ${color};padding-left:18px;position:relative}
    body.timeline .columns main h2{letter-spacing:1px;font-size:11px}
    body.executive .role{color:${color}}body.executive .executive-columns .details div:before{content:'• ';color:${color}}
    `;
  return `<!doctype html><html><head><meta charset="utf-8"/><style>${css}</style></head><body class="${variant}"><div class="page">${body}</div></body></html>`;
}
