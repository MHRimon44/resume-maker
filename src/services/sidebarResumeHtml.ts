import { ResumeBundle, SectionType } from '../types';
import { sectionLabels } from '../constants/content';
import { entryExtraLines, parseEntryExtras } from '../utils/entryFields';

const esc = (s: string = '') => s.replace(/[&<>"']/g, x =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]!));

export function sidebarResumeHtml({ resume, entries, sections }: ResumeBundle): string {
  const p = resume.personal;
  const accent = /^#[0-9a-fA-F]{6}$/.test(resume.accent) ? resume.accent : '#5689A4';
  const visible = (type: SectionType) => sections.some(s => s.type === type && s.visible);
  const items = (type: SectionType) => visible(type) ? entries.filter(e => e.type === type) : [];
  const sideList = (type: SectionType, title: string) => {
    const data = items(type);
    if (!data.length) return '';
    return `<div class="side-section"><h2>${title}</h2>${data.map(e => `<div class="side-item"><strong>${esc(e.title)}</strong>
      ${e.subtitle ? `<div>${esc(e.subtitle)}</div>` : ''}${e.details ? `<div>${esc(e.details).replace(/\n/g, '<br>')}</div>` : ''}</div>`).join('')}</div>`;
  };
  const personal = [p.gender, p.dateOfBirth, p.nationality, p.phone, p.email, p.website, p.location, p.github, p.portfolio]
    .filter(Boolean).map((x, i) => `<div class="side-contact">${esc(x)}</div>`).join('');
  const main = sections.filter(s => s.visible && !(['skills', 'awards', 'certifications', 'languages'] as SectionType[]).includes(s.type))
    .sort((a, b) => a.sortOrder - b.sortOrder).map(section => {
      const type = section.type;
      if (type === 'summary') return resume.summary ? `<section><h2><span>OBJECTIVE</span></h2><p>${esc(resume.summary)}</p></section>` : '';
      const data = items(type);
      if (!data.length) return '';
      const title = type === 'experience' ? 'WORK EXPERIENCE' : type === 'leadership' ? 'ACTIVITIES' : sectionLabels[type].toUpperCase();
      return `<section><h2><span>${esc(title)}</span></h2>${data.map(e => {
        const extra = parseEntryExtras(e.meta);
        const period = [e.startDate, e.endDate].filter(Boolean).join(' - ');
        const meta = entryExtraLines(type, e.meta).filter(x => !x.startsWith('Work location:') && !x.startsWith('Campus / location:'));
        return `<article><div class="item-title"><strong>${esc(e.title)}</strong><span>${esc(period)}</span></div>
          ${e.subtitle || extra.location ? `<div class="item-sub"><span>${esc(e.subtitle)}</span><span>${esc(extra.location)}</span></div>` : ''}
          ${e.details ? `<div class="details">${e.details.split('\n').filter(Boolean).map(x => `<div>${type === 'experience' || type === 'leadership' ? '• &nbsp;' : ''}${esc(x.replace(/^[•›-]\s*/, ''))}</div>`).join('')}</div>` : ''}
          ${meta.map(x => `<div class="details">${esc(x)}</div>`).join('')}</article>`;
      }).join('')}</section>`;
    }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{size:${resume.paperSize};margin:0}*{box-sizing:border-box}
    body{margin:0;color:#2d333a;background:#f8fafc;font:${12 * resume.fontScale}px Arial,sans-serif;line-height:1.4}
    .sidebar-bg{position:fixed;top:0;bottom:0;left:0;width:31%;background:#293844}
    .content{position:relative}.banner{height:92px;background:${accent};color:white;display:flex;align-items:center;padding:15px 24px;margin-top:20px}
    .identity{flex:1;min-width:0}h1{font-size:26px;letter-spacing:.5px;margin:0;font-weight:800}
    .headline{font-size:15px;letter-spacing:1px}.photo{width:100px;height:100px;border-radius:50%;border:5px solid white;object-fit:cover;margin-right:12px}
    .columns{display:flex;align-items:stretch}.left{width:31%;color:#f2f5f7;padding:24px 17px;flex-shrink:0}
    .right{width:69%;padding:21px 22px 32px;background:#f8fafc}
    .side-contact{margin-bottom:10px;overflow-wrap:anywhere;font-size:11px}
    .side-section{border-top:1px solid #c4ccd1;padding-top:14px;margin-top:18px;break-inside:avoid}
    .side-section h2{font-size:14px;letter-spacing:.5px;color:white;margin:0 0 10px}
    .side-item{margin-bottom:11px;overflow-wrap:anywhere}.side-item strong{display:block;margin-bottom:3px}
    section{margin-bottom:22px;break-inside:auto}section h2{display:flex;align-items:center;gap:10px;font-size:14px;letter-spacing:.5px;margin:0 0 10px}
    section h2:after{content:'';height:1px;background:#4a5055;flex:1}p{margin:0}article{position:relative;break-inside:avoid;padding-left:17px;margin-bottom:15px}
    article:before{content:'•';position:absolute;left:0;top:0;font-size:16px}
    .item-title,.item-sub{display:flex;justify-content:space-between;gap:7px}
    .item-title span,.item-sub span:last-child{white-space:nowrap;text-align:right;font-size:10px}
    .item-title strong{flex:1}.item-sub{color:#5d646b}.item-sub span:first-child{flex:1}
    .details{margin-top:4px;color:#4a5158}
  </style></head><body><div class="sidebar-bg"></div><div class="content">
  <div class="banner"><div class="identity"><h1>${esc(p.fullName || 'Your Name')}</h1><div class="headline">${esc(p.headline)}</div></div>
  ${p.photoUri?.startsWith('data:image/') ? `<img class="photo" src="${p.photoUri}">` : ''}</div>
  <div class="columns"><aside class="left">${personal}
    ${sideList('skills', 'SKILLS')}${sideList('languages', 'LANGUAGES')}
    ${sideList('awards', 'HONORS & AWARDS')}${sideList('certifications', 'CERTIFICATIONS')}
    ${p.interests ? `<div class="side-section"><h2>INTERESTS</h2><div>${esc(p.interests)}</div></div>` : ''}
  </aside><main class="right">${main}</main></div></div></body></html>`;
}
