import { generatePDF } from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';
import {
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  pick,
} from '@react-native-documents/picker';
import { ResumeBundle } from '../types';
import { resumeHtml } from './resumeHtml';
export async function exportPdf(bundle: ResumeBundle) {
  const name = bundle.resume.title.replace(/[^a-z0-9_-]/gi, '_').slice(0, 64) || 'Resume';
  let result;
  try {
    result = await generatePDF({
      html: resumeHtml(bundle),
      fileName: `${name}_${Date.now()}`,
      base64: false,
      width: bundle.resume.paperSize === 'A4' ? 595 : 612,
      height: bundle.resume.paperSize === 'A4' ? 842 : 792,
    });
  } catch (error) {
    throw new Error(`PDF creation failed: ${String(error)}`);
  }
  if (!result.filePath || !(await RNFS.exists(result.filePath))) {
    throw new Error('PDF creation finished without a readable file.');
  }
  const path = `${RNFS.DocumentDirectoryPath}/${name}_${Date.now()}.pdf`;
  await RNFS.copyFile(result.filePath, path);
  try {
    await Share.open({
      url: `file://${result.filePath}`,
      type: 'application/pdf',
      title: 'Share resume',
      useInternalStorage: true,
      failOnCancel: false,
    });
  } catch (error) {
    throw new Error(`PDF was saved, but sharing failed: ${String(error)}`);
  }
  return path;
}
export async function backupJson(data: unknown) {
  const path = `${RNFS.DocumentDirectoryPath}/resume_backup_${Date.now()}.json`;
  await RNFS.writeFile(path, JSON.stringify(data, null, 2), 'utf8');
  const sharePath = `${RNFS.CachesDirectoryPath}/resume_backup_${Date.now()}.json`;
  await RNFS.copyFile(path, sharePath);
  await Share.open({
    url: `file://${sharePath}`,
    type: 'application/json',
    title: 'Resume backup',
    useInternalStorage: true,
    failOnCancel: false,
  });
  return path;
}

export async function pickBackupJson(): Promise<unknown | null> {
  try {
    const [file] = await pick();
    const [copy] = await keepLocalCopy({
      files: [{ uri: file.uri, fileName: file.name ?? 'resume_backup.json' }],
      destination: 'cachesDirectory',
    });
    if (copy.status !== 'success') {
      throw new Error('Could not read the selected backup file.');
    }
    const contents = await RNFS.readFile(copy.localUri.replace(/^file:\/\//, ''), 'utf8');
    return JSON.parse(contents);
  } catch (error) {
    if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
      return null;
    }
    if (error instanceof SyntaxError) {
      throw new Error('The selected file is not a valid JSON backup.');
    }
    throw error;
  }
}
