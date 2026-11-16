// Backend validation — frontend validation-ah bypass panni direct API call pannalaam,
// adhanaala backend-layum kandippa check pannanum.

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MOBILE_REGEX = /^[6-9]\d{9}$/; // Indian 10-digit mobile
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/; // 8+ chars, letter + number

const str = (v) => (typeof v === 'string' ? v.trim() : '');

export function validateRegister(body = {}) {
  const data = {
    fullName: str(body.fullName),
    mobile: str(body.mobile),
    email: str(body.email).toLowerCase(),
    password: typeof body.password === 'string' ? body.password : '',
  };
  const errors = {};

  if (data.fullName.length < 2 || data.fullName.length > 80) errors.fullName = 'Enter your full name';
  if (!MOBILE_REGEX.test(data.mobile)) errors.mobile = 'Enter a valid 10-digit mobile number';
  if (!EMAIL_REGEX.test(data.email)) errors.email = 'Enter a valid email address';
  if (!PASSWORD_REGEX.test(data.password))
    errors.password = 'Password must be 8+ characters with at least one letter and one number';

  return { data, errors, isValid: Object.keys(errors).length === 0 };
}

export function validateLogin(body = {}) {
  const data = {
    email: str(body.email).toLowerCase(),
    password: typeof body.password === 'string' ? body.password : '',
  };
  const errors = {};
  if (!EMAIL_REGEX.test(data.email)) errors.email = 'Enter a valid email address';
  if (!data.password) errors.password = 'Enter your password';
  return { data, errors, isValid: Object.keys(errors).length === 0 };
}
