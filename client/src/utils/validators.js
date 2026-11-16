// Frontend validation rules — react-hook-form kooda use pannuvom.
// (Backend-layum same rules irukku: server/src/utils/validators.js)

export const rules = {
  fullName: {
    required: 'Full name is required',
    minLength: { value: 2, message: 'Enter your full name' },
    maxLength: { value: 80, message: 'Name is too long' },
  },
  mobile: {
    required: 'Mobile number is required',
    pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit mobile number' },
  },
  email: {
    required: 'Email is required',
    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, message: 'Enter a valid email address' },
  },
  password: {
    required: 'Password is required',
    pattern: {
      value: /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/,
      message: 'Use 8+ characters with at least one letter and one number',
    },
  },
};
