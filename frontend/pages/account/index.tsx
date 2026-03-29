import React, { useEffect } from 'react';
import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import Layout from '../../components/layout/Layout';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

interface ProfileForm {
  firstName: string;
  lastName: string;
  phone?: string;
}

const Account: NextPage = () => {
  const router = useRouter();
  const { user, setUser, isAuthenticated } = useAuthStore();

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<ProfileForm>();

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    if (user) reset({ firstName: user.firstName, lastName: user.lastName, phone: user.phone });
  }, [isAuthenticated, user, router, reset]);

  const onSubmit = async (data: ProfileForm) => {
    try {
      const res = await authService.updateProfile(data);
      setUser(res.data.data);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  if (!user) return null;

  return (
    <Layout title="My Account – ShopAzure">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Account</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-2">
            {[
              { href: '/account', label: 'Profile' },
              { href: '/account/orders', label: 'Order History' },
              { href: '/account/security', label: 'Security' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-600
                           hover:bg-primary-50 hover:text-primary-600 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Main */}
          <div className="md:col-span-2">
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input {...register('firstName', { required: true })} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input {...register('lastName', { required: true })} className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={user.email} disabled className="input-field bg-gray-50 cursor-not-allowed" />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input {...register('phone')} className="input-field" placeholder="+1 (555) 000-0000" />
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Account;
