import { ResumeBundle, ResumeSection, SectionType } from '../types';
import { entriesForSection, sectionTitle } from '../utils/resumeStyle';
import { sectionLabels } from '../constants/content';
import { entryExtraLines, parseEntryExtras } from '../utils/entryFields';

const esc = (value: string = '') => value.replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));

const detailLines = (details: string, bullets: boolean) => details
  .split('\n')
  .map(line => line.trim().replace(/^[•›-]\s*/, ''))
  .filter(Boolean)
  .map(line => `<div class="detail">${bullets ? '<span class="chevron">›</span>' : ''}${esc(line)}</div>`)
  .join('');

export function referenceResumeHtml(bundle: ResumeBundle) {
  const { resume, sections } = bundle;
  const p = resume.personal;
  const accent = /^#[0-9a-fA-F]{6}$/.test(resume.accent) ? resume.accent : '#174A92';
  const contact = [
    ['Phone', p.phone], ['Email', p.email], ['LinkedIn', p.website],
    ['GitHub', p.github], ['Portfolio', p.portfolio], ['Location', p.location],
  ].filter((pair): pair is [string, string] => !!pair[1])
    .map(([label, value]) => `<div class="contact"><span>${label}:</span> ${esc(value)}</div>`)
    .join('');
  const sectionHtml = (section: ResumeSection) => {
    const type = section.type;
    const items = entriesForSection(bundle, section);
    if (type === 'summary' && !resume.summary) return '';
    if (type !== 'summary' && !items.length) return '';
    const body = type === 'summary'
      ? `<p class="summary">${esc(resume.summary)}</p>`
      : items.map(item => {
        const extra = parseEntryExtras(item.meta);
        const date = [item.startDate, item.endDate].filter(Boolean).join(' - ');
        const right = type === 'projects' ? item.subtitle : date;
        const subtitle = type !== 'projects' && item.subtitle
          ? `<div class="subtitle">${esc(item.subtitle)}</div>` : '';
        const location = extra.location
          ? `<div class="location">${esc(extra.location)}</div>` : '';
        const extras = entryExtraLines(type, item.meta)
          .filter(line => !line.startsWith('Work location:') && !line.startsWith('Campus / location:'))
          .map(line => `<div class="meta">${esc(line)}</div>`).join('');
        if (type === 'skills') {
          return `<article class="skill"><strong>${esc(item.title)}</strong> ${esc(item.details)}${extras}</article>`;
        }
        return `<article class="item">
          <div class="row"><strong>${esc(item.title)}</strong><span class="right">${esc(right)}</span></div>
          ${subtitle}${location}
          ${item.details ? `<div class="details">${detailLines(item.details, ['experience', 'projects', 'leadership', 'awards'].includes(type))}</div>` : ''}
          ${extras}
        </article>`;
      }).join('');
    return `<section><h2><span>${esc(sectionTitle(section))}</span></h2>${body}</section>`;
  };
  return `<!doctype html><html><head><meta charset="utf-8"/><style>
    @page { size: ${resume.paperSize}; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #fff; color: #171717; font: ${11.4 * resume.fontScale}px Arial, sans-serif; line-height: 1.25; }
    .page { padding: 30px 38px 36px; }
    header { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
    .photo { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; }
    .identity { flex: 1; min-width: 0; }
    h1 { font-size: 27px; line-height: 1.08; font-weight: 800; margin: 0; color: #101010; }
    .headline { font-style: italic; color: #343434; margin-top: 3px; }
    .contacts { width: 34%; font-size: 9px; line-height: 1.3; overflow-wrap: anywhere; }
    .contact span { color: ${accent}; font-weight: 700; }
    section { margin-top: 15px; }
    h2 { margin: 0 0 7px; font-size: 11px; line-height: 1; font-weight: 800; }
    h2 span { display: inline-block; color: #fff; background: ${accent}; padding: 4px 7px; }
    .summary { margin: 0 0 0 7px; }
    .summary:before { content: '• '; }
    article { break-inside: avoid; margin: 0 0 7px 7px; }
    .row { display: flex; justify-content: space-between; gap: 10px; }
    .row strong { flex: 1; font-size: 11.3px; }
    .right { white-space: nowrap; color: #353535; font-size: 10px; }
    .projects .right { color: ${accent}; font-weight: 700; }
    .subtitle { font-style: italic; color: #505050; }
    .location { font-style: italic; color: #505050; text-align: right; }
    .details { margin-top: 3px; }
    .detail { padding-left: 13px; position: relative; }
    .chevron { position: absolute; left: 3px; font-size: 15px; line-height: 11px; }
    .skill strong { margin-right: 5px; }
    .meta { color: #505050; }
    .references .meta { margin-left: 6px; }
    section + section { break-before: auto; }
  </style></head><body><div class="page">
    <header>
      ${p.photoUri && p.photoUri.startsWith('data:image/') ? `<img class="photo" src="${p.photoUri}"/>` : ''}
      <div class="identity"><h1>${esc(p.fullName || 'Your Name')}</h1><div class="headline">${esc(p.headline)}</div></div>
      <div class="contacts">${contact}</div>
    </header>
    ${sections.filter(item => item.visible).sort((a, b) => a.sortOrder - b.sortOrder)
      .map(item => sectionHtml(item).replace('<section>', `<section data-section="${item.id}" class="${item.type}">`)).join('')}
  </div></body></html>`;
}
