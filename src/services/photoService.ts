import RNFS from 'react-native-fs';
import {
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  pick,
} from '@react-native-documents/picker';

export async function chooseResumePhoto(): Promise<string | null> {
  try {
    const [file] = await pick({ type: ['image/jpeg', 'image/png'] });
    const mime = file.type === 'image/png' || /\.png$/i.test(file.name ?? '')
      ? 'image/png'
      : file.type === 'image/jpeg' || /\.jpe?g$/i.test(file.name ?? '')
        ? 'image/jpeg'
        : undefined;
    if (!mime) throw new Error('Choose a JPG or PNG photo.');
    if (file.size !== null && file.size > 3 * 1024 * 1024) {
      throw new Error('Choose a photo smaller than 3 MB.');
    }
    const [copy] = await keepLocalCopy({
      files: [{ uri: file.uri, fileName: file.name ?? 'resume-photo.jpg' }],
      destination: 'cachesDirectory',
    });
    if (copy.status !== 'success') throw new Error('Could not read the photo.');
    const path = copy.localUri.replace(/^file:\/\//, '');
    const encoded = await RNFS.readFile(path, 'base64');
    if (encoded.length > 4 * 1024 * 1024) {
      throw new Error('Choose a photo smaller than 3 MB.');
    }
    return `data:${mime};base64,${encoded}`;
  } catch (error) {
    if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
      return null;
    }
    throw error;
  }
}
