import React from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import Layout from '../../components/layout/Layout';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: NextPage = () => {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>();

  const password = watch('password');

  const onSubmit = async ({ firstName, lastName, email, password }: RegisterForm) => {
    try {
      const { data } = await authService.register({ firstName, lastName, email, password });
      setUser(data.data.user);
      setTokens(data.data.accessToken, data.data.refreshToken);
      toast.success('Account created! Welcome aboard.');
      router.push('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Registration failed');
    }
  };

  return (
    <Layout title="Sign Up – ShopAzure">
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create your account</h1>
            <p className="text-gray-500 mt-2">Start shopping in minutes</p>
          </div>

          <div className="card p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    {...register('firstName', { required: 'Required' })}
                    className="input-field"
                    placeholder="John"
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    {...register('lastName', { required: 'Required' })}
                    className="input-field"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
                  })}
                  className="input-field"
                  placeholder="you@example.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Minimum 8 characters' },
                    pattern: {
                      value: /^(?=.*[A-Z])(?=.*[0-9])/,
                      message: 'Must contain uppercase and a number',
                    },
                  })}
                  className="input-field"
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (v) => v === password || 'Passwords do not match',
                  })}
                  className="input-field"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3 mt-2">
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          </div>

          <p className="text-center mt-6 text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary-600 font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Register;
