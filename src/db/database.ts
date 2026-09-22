import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
SQLite.enablePromise(true);
let instance: SQLiteDatabase | undefined;
const migrations = [
  `CREATE TABLE IF NOT EXISTS migrations(version INTEGER PRIMARY KEY, appliedAt TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS resumes(id TEXT PRIMARY KEY,title TEXT NOT NULL,templateId TEXT NOT NULL,personalJson TEXT NOT NULL,summary TEXT NOT NULL DEFAULT '',themeJson TEXT NOT NULL,paperSize TEXT NOT NULL DEFAULT 'A4',createdAt TEXT NOT NULL,updatedAt TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS entries(id TEXT PRIMARY KEY,resumeId TEXT NOT NULL,type TEXT NOT NULL,title TEXT NOT NULL DEFAULT '',subtitle TEXT NOT NULL DEFAULT '',startDate TEXT NOT NULL DEFAULT '',endDate TEXT NOT NULL DEFAULT '',details TEXT NOT NULL DEFAULT '',meta TEXT NOT NULL DEFAULT '',sortOrder INTEGER NOT NULL DEFAULT 0,FOREIGN KEY(resumeId) REFERENCES resumes(id) ON DELETE CASCADE);
  CREATE TABLE IF NOT EXISTS sections(id TEXT PRIMARY KEY,resumeId TEXT NOT NULL,type TEXT NOT NULL,visible INTEGER NOT NULL DEFAULT 1,sortOrder INTEGER NOT NULL,FOREIGN KEY(resumeId) REFERENCES resumes(id) ON DELETE CASCADE);
  CREATE INDEX IF NOT EXISTS idx_entries_resume_type ON entries(resumeId,type,sortOrder);
  CREATE INDEX IF NOT EXISTS idx_sections_resume ON sections(resumeId,sortOrder);
  CREATE INDEX IF NOT EXISTS idx_resumes_updated ON resumes(updatedAt DESC);`,
  `UPDATE sections SET sortOrder=sortOrder+2 WHERE type='references';
  INSERT INTO sections(id,resumeId,type,visible,sortOrder)
    SELECT lower(hex(randomblob(16))), id, 'leadership', 1, 7 FROM resumes;
  INSERT INTO sections(id,resumeId,type,visible,sortOrder)
    SELECT lower(hex(randomblob(16))), id, 'awards', 1, 8 FROM resumes;`,
  `UPDATE resumes SET templateId='custom' WHERE templateId<>'custom';`,
  `ALTER TABLE sections ADD COLUMN title TEXT NOT NULL DEFAULT '';
   ALTER TABLE sections ADD COLUMN color TEXT NOT NULL DEFAULT '';
   ALTER TABLE entries ADD COLUMN sectionId TEXT NOT NULL DEFAULT '';`,
];
export async function db() {
  if (instance) return instance;
  instance = await SQLite.openDatabase({
    name: 'resume_studio.db',
    location: 'default',
  });
  await instance.executeSql('PRAGMA foreign_keys=ON');
  await instance.executeSql(
    'CREATE TABLE IF NOT EXISTS migrations(version INTEGER PRIMARY KEY, appliedAt TEXT NOT NULL)',
  );
  for (let i = 0; i < migrations.length; i++) {
    const [r] = await instance.executeSql(
      'SELECT version FROM migrations WHERE version=?',
      [i + 1],
    );
    if (r.rows.length === 0) {
      await instance.transaction(tx => {
        for (const s of migrations[i]!.split(';')
          .map(x => x.trim())
          .filter(Boolean))
          tx.executeSql(s);
        tx.executeSql('INSERT INTO migrations(version,appliedAt) VALUES(?,?)', [
          i + 1,
          new Date().toISOString(),
        ]);
      });
    }
  }
  return instance;
}
