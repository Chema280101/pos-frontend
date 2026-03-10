import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  Users,
  AlertCircle,
  Loader2,
  X,
  Save,
  ArrowLeft,
  Download,
  Upload,
} from 'lucide-react';
import { SupplierMetrics } from './SupplierMetrics';

interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    stockEntries: number;
  };
}

interface NewSupplierData {
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
}

export function SuppliersPage(): JSX.Element {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState<NewSupplierData>({
    name: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
  });

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async (): Promise<Supplier[]> => {
      const { data } = await api.get('/api/inventory/suppliers');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: NewSupplierData) => {
      const response = await api.post('/api/inventory/suppliers', {
        name: data.name.trim(),
        contactName: data.contactName.trim() || undefined,
        phone: data.phone.trim() || undefined,
        email: data.email.trim() || undefined,
        address: data.address.trim() || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setShowCreateModal(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/inventory/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setShowDeleteDialog(false);
      setSelectedSupplier(null);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
    });
  };

  const handleCreateSupplier = () => {
    if (!formData.name.trim()) return;
    createMutation.mutate(formData);
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDeleteDialog(true);
  };

  const filteredSuppliers =
    suppliers?.filter((supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) ?? [];

  const totalSuppliers = suppliers?.length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--unit-surface)] via-[var(--unit-surface-elevated)] to-[var(--unit-surface)]">
      <div className="relative max-w-7xl mx-auto p-6">

        {/* HEADER */}

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2">
            Proveedores
          </h1>
          <p className="text-[var(--unit-text-muted)]">
            Administra tu red de proveedores
          </p>

          <div className="flex justify-center gap-4 mt-6 flex-wrap">

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 text-white font-bold"
            >
              <Plus className="h-5 w-5" />
              Nuevo proveedor
            </button>

            <Link
              href="/inventory"
              className="flex items-center gap-2 px-6 py-3 rounded-xl border"
            >
              <ArrowLeft className="h-5 w-5" />
              Volver
            </Link>

            <div className="flex items-center gap-2 px-4 py-2 border rounded-lg">
              Total: <b>{totalSuppliers}</b>
            </div>

          </div>
        </div>

        {/* MÉTRICAS */}

        <SupplierMetrics suppliers={suppliers || []} />

        {/* SEARCH */}

        <div className="mt-8 mb-8 flex gap-4">

          <div className="flex-1 relative">

            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />

            <input
              type="text"
              placeholder="Buscar proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border rounded-xl"
            />

          </div>

          <button className="px-6 py-3 border rounded-xl flex gap-2 items-center">
            <Filter className="h-4 w-4" />
            Filtros
          </button>

        </div>

        {/* TABLA */}

        <div className="overflow-hidden rounded-2xl border bg-white">

          <table className="w-full">

            <thead>

              <tr className="border-b bg-gray-50">

                <th className="p-4 text-left">Proveedor</th>
                <th className="p-4 text-left">Contacto</th>
                <th className="p-4 text-left">Teléfono</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-center">Acciones</th>

              </tr>

            </thead>

            <tbody>

              {isLoading && (
                <tr>
                  <td colSpan={5} className="text-center p-8">
                    <Loader2 className="animate-spin mx-auto" />
                  </td>
                </tr>
              )}

              {!isLoading &&
                filteredSuppliers.map((supplier) => (

                  <tr key={supplier.id} className="border-b hover:bg-gray-50">

                    <td className="p-4 font-bold">{supplier.name}</td>

                    <td className="p-4">
                      {supplier.contactName || '—'}
                    </td>

                    <td className="p-4">
                      {supplier.phone || '—'}
                    </td>

                    <td className="p-4">
                      {supplier.email || '—'}
                    </td>

                    <td className="p-4 text-center flex justify-center gap-2">

                      <button className="p-2 bg-purple-100 rounded">
                        <Edit className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteSupplier(supplier)}
                        className="p-2 bg-red-100 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                    </td>

                  </tr>

                ))}

            </tbody>

          </table>

        </div>
      </div>

      {/* CREATE MODAL */}

      {showCreateModal && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

          <div className="bg-white rounded-xl p-6 w-full max-w-lg">

            <h2 className="text-xl font-bold mb-4">
              Nuevo proveedor
            </h2>

            <div className="space-y-4">

              <input
                placeholder="Nombre proveedor"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full border p-3 rounded"
              />

              <input
                placeholder="Contacto"
                value={formData.contactName}
                onChange={(e) =>
                  setFormData({ ...formData, contactName: e.target.value })
                }
                className="w-full border p-3 rounded"
              />

              <input
                placeholder="Teléfono"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full border p-3 rounded"
              />

              <input
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full border p-3 rounded"
              />

              <textarea
                placeholder="Dirección"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full border p-3 rounded"
              />

            </div>

            <div className="flex gap-4 mt-6">

              <button
                onClick={handleCreateSupplier}
                className="flex-1 bg-purple-600 text-white py-3 rounded"
              >
                Crear
              </button>

              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 border py-3 rounded"
              >
                Cancelar
              </button>

            </div>

          </div>

        </div>

      )}

      {/* DELETE MODAL */}

      {showDeleteDialog && selectedSupplier && (

        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

          <div className="bg-white p-6 rounded-xl w-full max-w-md">

            <h3 className="text-lg font-bold mb-4">
              Eliminar proveedor
            </h3>

            <p className="mb-6">
              ¿Seguro que deseas eliminar a{" "}
              <b>{selectedSupplier.name}</b>?
            </p>

            <div className="flex gap-4">

              <button
                onClick={() =>
                  deleteMutation.mutate(selectedSupplier.id)
                }
                className="flex-1 bg-red-600 text-white py-3 rounded"
              >
                Eliminar
              </button>

              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 border py-3 rounded"
              >
                Cancelar
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}