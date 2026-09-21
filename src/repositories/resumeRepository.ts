import { db } from '../db/database';
import {
  Entry,
  Resume,
  ResumeBundle,
  ResumeSection,
  SectionType,
  TemplateId,
} from '../types';
import { makeId } from '../utils/id';
import { sectionOrder } from '../constants/content';
const rowResume = (x: any): Resume => ({
  ...x,
  personal: JSON.parse(x.personalJson),
  ...JSON.parse(x.themeJson),
});
export const resumeRepository = {
  async list() {
    const d = await db();
    const [r] = await d.executeSql(
      'SELECT * FROM resumes ORDER BY updatedAt DESC',
    );
    return Array.from({ length: r.rows.length }, (_, i) =>
      rowResume(r.rows.item(i)),
    );
  },
  async create(templateId: TemplateId = 'modern') {
    const d = await db(),
      id = makeId(),
      now = new Date().toISOString();
    const resume: Resume = {
      id,
      title: 'My Resume',
      templateId,
      personal: {
        fullName: '',
        headline: '',
        email: '',
        phone: '',
        location: '',
        website: '',
      },
      summary: '',
      accent: '#5B5CE2',
      fontScale: 1,
      paperSize: 'A4',
      createdAt: now,
      updatedAt: now,
    };
    await d.transaction(tx => {
      tx.executeSql('INSERT INTO resumes VALUES(?,?,?,?,?,?,?,?,?)', [
        id,
        resume.title,
        templateId,
        JSON.stringify(resume.personal),
        '',
        JSON.stringify({ accent: resume.accent, fontScale: 1 }),
        resume.paperSize,
        now,
        now,
      ]);
      const initialOrder = templateId === 'europass'
        ? (['experience', 'education', 'skills', 'languages', 'summary', 'projects', 'certifications', 'references'] as SectionType[])
        : sectionOrder;
      for (let i = 0; i < initialOrder.length; i++)
        tx.executeSql('INSERT INTO sections VALUES(?,?,?,?,?)', [
          makeId(),
          id,
          initialOrder[i],
          1,
          i,
        ]);
    });
    return id;
  },
  async bundle(id: string): Promise<ResumeBundle> {
    const d = await db();
    const [a, b, c] = await Promise.all([
      d.executeSql('SELECT * FROM resumes WHERE id=?', [id]),
      d.executeSql(
        'SELECT * FROM entries WHERE resumeId=? ORDER BY type,sortOrder',
        [id],
      ),
      d.executeSql(
        'SELECT * FROM sections WHERE resumeId=? ORDER BY sortOrder',
        [id],
      ),
    ]);
    if (!a[0].rows.length) throw new Error('Resume not found');
    return {
      resume: rowResume(a[0].rows.item(0)),
      entries: Array.from({ length: b[0].rows.length }, (_, i) =>
        b[0].rows.item(i),
      ),
      sections: Array.from({ length: c[0].rows.length }, (_, i) => ({
        ...c[0].rows.item(i),
        visible: !!c[0].rows.item(i).visible,
      })),
    };
  },
  async save(r: Resume) {
    const d = await db();
    await d.executeSql(
      'UPDATE resumes SET title=?,templateId=?,personalJson=?,summary=?,themeJson=?,paperSize=?,updatedAt=? WHERE id=?',
      [
        r.title,
        r.templateId,
        JSON.stringify(r.personal),
        r.summary,
        JSON.stringify({ accent: r.accent, fontScale: r.fontScale }),
        r.paperSize,
        new Date().toISOString(),
        r.id,
      ],
    );
  },
  async addEntry(resumeId: string, type: SectionType) {
    const d = await db(),
      e: Entry = {
        id: makeId(),
        resumeId,
        type,
        title: '',
        subtitle: '',
        startDate: '',
        endDate: '',
        details: '',
        meta: '',
        sortOrder: Date.now(),
      };
    await d.executeSql(
      'INSERT INTO entries VALUES(?,?,?,?,?,?,?,?,?,?,?)',
      Object.values(e),
    );
    return e;
  },
  async saveEntry(e: Entry) {
    const d = await db();
    await d.executeSql(
      'UPDATE entries SET title=?,subtitle=?,startDate=?,endDate=?,details=?,meta=?,sortOrder=? WHERE id=?',
      [
        e.title,
        e.subtitle,
        e.startDate,
        e.endDate,
        e.details,
        e.meta,
        e.sortOrder,
        e.id,
      ],
    );
  },
  async deleteEntry(id: string) {
    await (await db()).executeSql('DELETE FROM entries WHERE id=?', [id]);
  },
  async setSections(items: ResumeSection[]) {
    const d = await db();
    await d.transaction(tx => {
      for (const s of items)
        tx.executeSql(
          'UPDATE sections SET visible=?,sortOrder=? WHERE id=?',
          [s.visible ? 1 : 0, s.sortOrder, s.id],
        );
    });
  },
  async remove(id: string) {
    await (await db()).executeSql('DELETE FROM resumes WHERE id=?', [id]);
  },
  async duplicate(id: string) {
    const src = await this.bundle(id),
      newId = await this.create(src.resume.templateId),
      copy = await this.bundle(newId);
    await this.save({
      ...src.resume,
      id: newId,
      title: `${src.resume.title} Copy`,
      createdAt: copy.resume.createdAt,
      updatedAt: copy.resume.updatedAt,
    });
    const d = await db();
    for (const e of src.entries)
      await d.executeSql('INSERT INTO entries VALUES(?,?,?,?,?,?,?,?,?,?,?)', [
        makeId(),
        newId,
        e.type,
        e.title,
        e.subtitle,
        e.startDate,
        e.endDate,
        e.details,
        e.meta,
        e.sortOrder,
      ]);
    return newId;
  },
  async exportAll() {
    const all = await this.list();
    return {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      resumes: await Promise.all(all.map(x => this.bundle(x.id))),
    };
  },
  async deleteAll() {
    await (await db()).executeSql('DELETE FROM resumes');
  },
};
