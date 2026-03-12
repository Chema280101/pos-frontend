'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InventoryRedirectPage(): JSX.Element {
  const router = useRouter();

  useEffect(() => {
    router.replace('/inventory/products');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo a productos...</p>
      </div>
    </div>
  );
}
