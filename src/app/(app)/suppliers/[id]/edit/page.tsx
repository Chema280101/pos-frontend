'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function SupplierEditRedirectPage(): JSX.Element {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params?.id) {
      router.replace(`/inventory/suppliers/${params.id}/edit`);
    }
  }, [router, params]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo a edición de proveedor...</p>
      </div>
    </div>
  );
}
