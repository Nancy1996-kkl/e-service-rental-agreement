import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import AuthCard from '../components/layout/AuthCard.jsx';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';
import Alert from '../components/common/Alert.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { getErrorMessage, getFieldErrors } from '../api/axiosInstance.js';
import { rules } from '../utils/validators.js';

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { fullName: '', mobile: '', email: '', password: '', confirmPassword: '', terms: false },
  });

  const onSubmit = async ({ confirmPassword, terms, ...values }) => {
    setServerError('');
    try {
      await registerUser(values);
      toast.success('Account created! Welcome 🎉');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      // Backend field errors-ah (e.g. "Email already registered") andha field keezha kaattrom
      const fieldErrors = getFieldErrors(err);
      Object.entries(fieldErrors).forEach(([field, message]) => setError(field, { message }));
      if (!Object.keys(fieldErrors).length) setServerError(getErrorMessage(err));
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Register to create and save rental agreements."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:underline">Log in</Link>
        </>
      }
    >
      {serverError && <Alert type="error" className="mb-5">{serverError}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label="Full Name"
          autoComplete="name"
          placeholder="e.g. Ramesh Kumar"
          required
          error={errors.fullName?.message}
          {...register('fullName', rules.fullName)}
        />
        <Input
          label="Mobile Number"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          autoComplete="tel-national"
          placeholder="10-digit mobile number"
          required
          error={errors.mobile?.message}
          {...register('mobile', rules.mobile)}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          error={errors.email?.message}
          {...register('email', rules.email)}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          hint="At least 8 characters, with a letter and a number."
          error={errors.password?.message}
          {...register('password', rules.password)}
        />
        <Input
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          required
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) => value === getValues('password') || 'Passwords do not match',
          })}
        />

        <div>
          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-primary-600"
              aria-invalid={!!errors.terms}
              {...register('terms', { required: 'Please accept to continue' })}
            />
            <span>
              I agree that my details will be used only to prepare my rental agreements.
            </span>
          </label>
          {errors.terms && <p className="mt-1 text-xs text-red-600">{errors.terms.message}</p>}
        </div>

        <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </AuthCard>
  );
}
