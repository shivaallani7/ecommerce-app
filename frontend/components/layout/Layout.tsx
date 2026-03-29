import React from 'react';
import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from '../cart/CartDrawer';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function Layout({
  children,
  title = 'ShopAzure – Premium E-Commerce',
  description = 'Shop the latest products at ShopAzure, powered by Microsoft Azure.',
}: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
      </div>
    </>
  );
}
