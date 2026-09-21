import * as yup from 'yup';
export const resumeSchema = yup.object({
  title: yup.string().trim().required('Resume title is required').max(60),
  fullName: yup.string().trim().required('Full name is required').max(80),
  email: yup
    .string()
    .trim()
    .email('Enter a valid email')
    .required('Email is required'),
  phone: yup.string().trim().max(30),
  headline: yup.string().trim().max(100),
  location: yup.string().trim().max(100),
  website: yup.string().trim().max(160),
  summary: yup.string().trim().max(1000),
});
export const parseErrors = (error: unknown) =>
  error instanceof yup.ValidationError
    ? Object.fromEntries(error.inner.map(x => [x.path ?? 'form', x.message]))
    : {};
