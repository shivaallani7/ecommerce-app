import React from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import Layout from '../../components/layout/Layout';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface LoginForm { email: string; password: string; }

const Login: NextPage = () => {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>();

  const redirect = (router.query.redirect as string) || '/';

  const onSubmit = async ({ email, password }: LoginForm) => {
    try {
      const { data } = await authService.login(email, password);
      setUser(data.data.user);
      setTokens(data.data.accessToken, data.data.refreshToken);
      toast.success(`Welcome back, ${data.data.user.firstName}!`);
      router.push(redirect);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Login failed');
    }
  };

  return (
    <Layout title="Sign In – ShopAzure">
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 mt-2">Sign in to your account</p>
          </div>

          <div className="card p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  {...register('email', { required: 'Email is required' })}
                  className="input-field"
                  placeholder="you@example.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <Link href="/auth/forgot-password" className="text-xs text-primary-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  {...register('password', { required: 'Password is required' })}
                  className="input-field"
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="text-center mt-6 text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-primary-600 font-medium hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
