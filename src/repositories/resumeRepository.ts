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

const defaultAccent: Record<TemplateId, string> = {
  custom: '#174A92',
  ats: '#173B57',
  sidebar: '#5689A4',
  international: '#0E4C77',
  profile: '#16439B',
  structured: '#81878E',
  navy: '#0D3156',
  timeline: '#154989',
  executive: '#D69B33',
};

const supportedBackupTemplateIds = [
  'classic',
  'modern',
  'minimal',
  'europass',
  'ats',
  'custom',
  'sidebar',
  'international',
  'profile',
  'structured',
  'navy',
  'timeline',
  'executive',
];
const sectionTypes: SectionType[] = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
  'leadership',
  'awards',
  'references',
  'custom',
];

type Backup = {
  schemaVersion: 1;
  resumes: ResumeBundle[];
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string';
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

function readBackup(value: unknown): Backup {
  if (
    !isObject(value) ||
    value.schemaVersion !== 1 ||
    !Array.isArray(value.resumes)
  ) {
    throw new Error('This file is not a supported Resume Studio backup.');
  }

  const resumeIds = new Set<string>();
  const childIds = new Set<string>();
  for (const bundle of value.resumes) {
    if (
      !isObject(bundle) ||
      !isObject(bundle.resume) ||
      !Array.isArray(bundle.entries) ||
      !Array.isArray(bundle.sections)
    ) {
      throw new Error('The backup contains incomplete resume data.');
    }
    const r = bundle.resume;
    const personal = r.personal;
    if (
      !isString(r.id) ||
      !r.id ||
      resumeIds.has(r.id) ||
      !isString(r.title) ||
      !isString(r.templateId) ||
      !supportedBackupTemplateIds.includes(r.templateId) ||
      !isObject(personal) ||
      !['fullName', 'headline', 'email', 'phone', 'location', 'website'].every(
        key => isString(personal[key]),
      ) ||
      (personal.photoUri !== undefined && !isString(personal.photoUri)) ||
      (personal.github !== undefined && !isString(personal.github)) ||
      (personal.portfolio !== undefined && !isString(personal.portfolio)) ||
      (personal.gender !== undefined && !isString(personal.gender)) ||
      (personal.dateOfBirth !== undefined && !isString(personal.dateOfBirth)) ||
      (personal.interests !== undefined && !isString(personal.interests)) ||
      (personal.nationality !== undefined && !isString(personal.nationality)) ||
      !isString(r.summary) ||
      !isString(r.accent) ||
      !isFiniteNumber(r.fontScale) ||
      (r.style !== undefined &&
        (!isObject(r.style) ||
          (r.style.fontFamily !== undefined &&
            !['sans', 'serif', 'mono'].includes(String(r.style.fontFamily))) ||
          (r.style.colors !== undefined &&
            (!isObject(r.style.colors) ||
              Object.entries(r.style.colors).some(
                ([key, color]) =>
                  ![
                    'page',
                    'header',
                    'sidebar',
                    'name',
                    'headline',
                    'contact',
                    'sectionHeading',
                    'entryTitle',
                    'meta',
                    'body',
                  ].includes(key) ||
                  typeof color !== 'string' ||
                  !/^#[0-9a-fA-F]{6}$/.test(color),
              ))))) ||
      (r.paperSize !== 'A4' && r.paperSize !== 'Letter') ||
      !isString(r.createdAt) ||
      !isString(r.updatedAt)
    ) {
      throw new Error('The backup contains an invalid resume.');
    }
    resumeIds.add(r.id);

    for (const entry of bundle.entries) {
      if (
        !isObject(entry) ||
        !isString(entry.id) ||
        !entry.id ||
        childIds.has(entry.id) ||
        entry.resumeId !== r.id ||
        !isString(entry.type) ||
        !sectionTypes.includes(entry.type as SectionType) ||
        !['title', 'subtitle', 'startDate', 'endDate', 'details', 'meta'].every(
          key => isString(entry[key]),
        ) ||
        !isFiniteNumber(entry.sortOrder) ||
        (entry.sectionId !== undefined && !isString(entry.sectionId))
      ) {
        throw new Error('The backup contains an invalid resume entry.');
      }
      childIds.add(entry.id);
    }
    for (const section of bundle.sections) {
      if (
        !isObject(section) ||
        !isString(section.id) ||
        !section.id ||
        !/^[A-Za-z0-9_-]+$/.test(section.id) ||
        childIds.has(section.id) ||
        section.resumeId !== r.id ||
        !isString(section.type) ||
        !sectionTypes.includes(section.type as SectionType) ||
        typeof section.visible !== 'boolean' ||
        !isFiniteNumber(section.sortOrder) ||
        (section.title !== undefined && !isString(section.title)) ||
        (section.color !== undefined &&
          (!isString(section.color) ||
            (!!section.color && !/^#[0-9a-fA-F]{6}$/.test(section.color)))) ||
        (section.type === 'custom' &&
          (!isString(section.title) || !section.title.trim()))
      ) {
        throw new Error('The backup contains an invalid resume section.');
      }
      childIds.add(section.id);
    }
    for (const entry of bundle.entries) {
      if (
        entry.type === 'custom' &&
        !bundle.sections.some(
          (section: any) =>
            section.id === entry.sectionId && section.type === 'custom',
        )
      )
        throw new Error('A custom entry has no matching section.');
    }
  }
  return value as Backup;
}
const rowResume = (x: any): Resume => ({
  ...x,
  personal: JSON.parse(x.personalJson),
  ...JSON.parse(x.themeJson),
});
const themeJson = (r: Resume) =>
  JSON.stringify({
    accent: r.accent,
    fontScale: r.fontScale,
    style: r.style ?? {},
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
  async create(templateId: TemplateId = 'custom') {
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
        github: '',
        portfolio: '',
        gender: '',
        dateOfBirth: '',
        interests: '',
        nationality: '',
      },
      summary: '',
      accent: defaultAccent[templateId],
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
        themeJson(resume),
        resume.paperSize,
        now,
        now,
      ]);
      const initialOrder = sectionOrder;
      for (let i = 0; i < initialOrder.length; i++)
        tx.executeSql(
          'INSERT INTO sections(id,resumeId,type,visible,sortOrder) VALUES(?,?,?,?,?)',
          [makeId(), id, initialOrder[i], 1, i],
        );
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
        themeJson(r),
        r.paperSize,
        new Date().toISOString(),
        r.id,
      ],
    );
  },
  async saveBundle(bundle: ResumeBundle) {
    const d = await db();
    const r = bundle.resume;
    await d.transaction(tx => {
      tx.executeSql(
        'UPDATE resumes SET title=?,templateId=?,personalJson=?,summary=?,themeJson=?,paperSize=?,updatedAt=? WHERE id=?',
        [
          r.title,
          r.templateId,
          JSON.stringify(r.personal),
          r.summary,
          themeJson(r),
          r.paperSize,
          new Date().toISOString(),
          r.id,
        ],
      );
      tx.executeSql('DELETE FROM entries WHERE resumeId=?', [r.id]);
      for (const e of bundle.entries) {
        tx.executeSql(
          'INSERT INTO entries(id,resumeId,type,title,subtitle,startDate,endDate,details,meta,sortOrder,sectionId) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
          [
            e.id,
            r.id,
            e.type,
            e.title,
            e.subtitle,
            e.startDate,
            e.endDate,
            e.details,
            e.meta,
            e.sortOrder,
            e.sectionId ?? '',
          ],
        );
      }
      tx.executeSql('DELETE FROM sections WHERE resumeId=?', [r.id]);
      for (const s of bundle.sections)
        tx.executeSql(
          'INSERT INTO sections(id,resumeId,type,visible,sortOrder,title,color) VALUES(?,?,?,?,?,?,?)',
          [
            s.id,
            r.id,
            s.type,
            s.visible ? 1 : 0,
            s.sortOrder,
            s.title ?? '',
            s.color ?? '',
          ],
        );
    });
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
      'INSERT INTO entries(id,resumeId,type,title,subtitle,startDate,endDate,details,meta,sortOrder,sectionId) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
      [
        e.id,
        e.resumeId,
        e.type,
        e.title,
        e.subtitle,
        e.startDate,
        e.endDate,
        e.details,
        e.meta,
        e.sortOrder,
        e.sectionId ?? '',
      ],
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
        tx.executeSql('UPDATE sections SET visible=?,sortOrder=? WHERE id=?', [
          s.visible ? 1 : 0,
          s.sortOrder,
          s.id,
        ]);
    });
  },
  async remove(id: string) {
    await (await db()).executeSql('DELETE FROM resumes WHERE id=?', [id]);
  },
  async duplicate(id: string) {
    const src = await this.bundle(id),
      newId = await this.create(src.resume.templateId),
      copy = await this.bundle(newId);
    const sectionIds = new Map(src.sections.map(s => [s.id, makeId()]));
    await this.saveBundle({
      resume: {
        ...src.resume,
        id: newId,
        title: `${src.resume.title} Copy`,
        createdAt: copy.resume.createdAt,
        updatedAt: copy.resume.updatedAt,
      },
      sections: src.sections.map(s => ({
        ...s,
        id: sectionIds.get(s.id)!,
        resumeId: newId,
      })),
      entries: src.entries.map(e => ({
        ...e,
        id: makeId(),
        resumeId: newId,
        sectionId: e.sectionId ? sectionIds.get(e.sectionId) : undefined,
      })),
    });
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
  async restoreAll(value: unknown) {
    const backup = readBackup(value);
    const d = await db();
    await d.transaction(tx => {
      tx.executeSql('DELETE FROM resumes');
      for (const bundle of backup.resumes) {
        const r = bundle.resume;
        tx.executeSql('INSERT INTO resumes VALUES(?,?,?,?,?,?,?,?,?)', [
          r.id,
          r.title,
          ['classic', 'modern', 'minimal', 'europass'].includes(r.templateId)
            ? 'custom'
            : r.templateId,
          JSON.stringify(r.personal),
          r.summary,
          themeJson(r),
          r.paperSize,
          r.createdAt,
          r.updatedAt,
        ]);
        for (const entry of bundle.entries) {
          tx.executeSql(
            'INSERT INTO entries(id,resumeId,type,title,subtitle,startDate,endDate,details,meta,sortOrder,sectionId) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
            [
              entry.id,
              entry.resumeId,
              entry.type,
              entry.title,
              entry.subtitle,
              entry.startDate,
              entry.endDate,
              entry.details,
              entry.meta,
              entry.sortOrder,
              entry.sectionId ?? '',
            ],
          );
        }
        for (const section of bundle.sections) {
          tx.executeSql(
            'INSERT INTO sections(id,resumeId,type,visible,sortOrder,title,color) VALUES(?,?,?,?,?,?,?)',
            [
              section.id,
              section.resumeId,
              section.type,
              section.visible ? 1 : 0,
              section.sortOrder,
              section.title ?? '',
              section.color ?? '',
            ],
          );
        }
        for (const type of sectionOrder) {
          if (!bundle.sections.some(section => section.type === type)) {
            tx.executeSql(
              'INSERT INTO sections(id,resumeId,type,visible,sortOrder) VALUES(?,?,?,?,?)',
              [
                makeId(),
                r.id,
                type,
                1,
                bundle.sections.length + sectionOrder.indexOf(type),
              ],
            );
          }
        }
      }
    });
    return backup.resumes.length;
  },
  async deleteAll() {
    await (await db()).executeSql('DELETE FROM resumes');
  },
};
