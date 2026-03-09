import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Building2, Plus, Search, Filter, Phone, Mail, MapPin, Edit, Trash2, Users, UserCheck, TrendingUp, AlertCircle, Loader2, X, Save, ArrowLeft, Download, Upload } from 'lucide-react';
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
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
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
      const { data } = await api.get<Supplier[]>('/api/inventory/suppliers');
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

  const handleDeleteSupplier = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este proveedor?')) {
      deleteMutation.mutate(id);
    }
  };

  // Filter suppliers based on search
  const filteredSuppliers = suppliers?.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone?.includes(searchTerm) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) ?? [];

  // Calculate stats
  const totalSuppliers = suppliers?.length ?? 0;
  const activeSuppliers = suppliers?.filter(s => s.isActive).length ?? 0;
  const newSuppliersThisMonth = suppliers?.filter(s => {
    const createdDate = new Date(s.createdAt);
    const now = new Date();
    return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
  }).length ?? 0;
  const suppliersWithContact = suppliers?.filter(s => s.phone || s.email).length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--unit-surface)] via-[var(--unit-surface-elevated)] to-[var(--unit-surface)]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto p-6">
        {/* Enhanced Header - Exacto estilo AppointmentsPage */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 mb-4">
              <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></div>
              <span className="text-sm font-medium text-[var(--unit-text)]">
                Gestión de Proveedores
              </span>
            </div>
            <h1 className="text-4xl font-bold text-[var(--unit-text)] mb-2 drop-shadow-lg">Proveedores</h1>
            <p className="text-[var(--unit-text-muted)]">
              Administra tu red de proveedores y contactos comerciales
            </p>
          </div>

          {/* Supplier Metrics - Nueva sección de métricas espectaculares */}
          <SupplierMetrics suppliers={suppliers || []} />

          {/* Enhanced Action Buttons - Exacto estilo AppointmentsPage */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--unit-accent)] to-[var(--unit-primary)] text-white font-bold shadow-lg border-2 border-[var(--unit-accent)]/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-5 w-5" />
              Nuevo Proveedor
            </button>
            <button className="inline-flex items-center gap-3 px-6 py-3 rounded-xl border-2 border-[var(--unit-accent)]/50 text-[var(--unit-accent)] font-bold bg-[var(--unit-surface)] hover:bg-[var(--unit-accent)] hover:text-white transition-all hover:shadow-lg active:scale-[0.98]">
              <Download className="h-5 w-5" />
              Exportar
            </button>
            <button className="inline-flex items-center gap-3 px-6 py-3 rounded-xl border-2 border-[var(--unit-accent)]/50 text-[var(--unit-accent)] font-bold bg-[var(--unit-surface)] hover:bg-[var(--unit-accent)] hover:text-white transition-all hover:shadow-lg active:scale-[0.98]">
              <Upload className="h-5 w-5" />
              Importar
            </button>
            <Link href="/inventory" className="inline-flex items-center gap-3 px-6 py-3 rounded-xl border-2 border-[var(--unit-border)]/50 text-[var(--unit-text)] font-bold bg-[var(--unit-surface)] hover:bg-[var(--unit-text)] hover:text-[var(--unit-surface)] transition-all hover:shadow-lg active:scale-[0.98]">
              <ArrowLeft className="h-5 w-5" />
              Volver a Inventario
            </Link>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
              <span className="text-xs text-[var(--unit-text)]">Total:</span>
              <span className="text-xs font-bold text-[var(--unit-accent)]">{totalSuppliers}</span>
            </div>
          </div>
        </div>

        {/* Enhanced Search Section - Estilo AppointmentsPage Filters */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-[var(--unit-border)]/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 mb-8">
          {/* Search Header */}
          <div className="relative bg-gradient-to-r from-[var(--unit-accent)]/10 to-[var(--unit-primary)]/10 px-6 py-4 border-b border-[var(--unit-border)]/30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--unit-accent)] to-[var(--unit-primary)] shadow-lg">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--unit-text)]">Búsqueda de Proveedores</h3>
                  <p className="text-sm text-[var(--unit-text-muted)]">Refina tu búsqueda</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--unit-text-muted)]" />
              <input
                type="text"
                placeholder="Buscar proveedores por nombre, contacto, teléfono o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--unit-accent)]/50 focus:border-[var(--unit-accent)] transition-all"
              />
            </div>
            <button className="inline-flex items-center gap-3 px-6 py-3 rounded-xl border-2 border-[var(--unit-accent)]/50 text-[var(--unit-accent)] font-bold bg-[var(--unit-surface)] hover:bg-[var(--unit-accent)] hover:text-white transition-all hover:shadow-lg active:scale-[0.98]">
              <Filter className="h-5 w-5" />
              Filtros
            </button>
          </div>
        </div>

        {/* Enhanced Table */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-purple-500/50 bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-sm shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-500/30 bg-purple-50/50">
                  <th className="px-6 py-4 text-left">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-purple-600" />
                      <span className="font-bold text-purple-900">Proveedor</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="font-bold text-purple-900">Contacto</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-purple-600" />
                      <span className="font-bold text-purple-900">Teléfono</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-purple-600" />
                      <span className="font-bold text-purple-900">Email</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-purple-600" />
                      <span className="font-bold text-purple-900">Estado</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <span className="font-bold text-purple-900">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                        <p className="text-[var(--unit-text-muted)]">Cargando proveedores...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Building2 className="h-12 w-12 text-[var(--unit-text-muted)]" />
                        <p className="text-[var(--unit-text-muted)] font-medium">
                          {searchTerm ? 'No se encontraron proveedores' : 'No hay proveedores registrados'}
                        </p>
                        {!searchTerm && (
                          <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold shadow-lg border-2 border-purple-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <span className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              Crear primer proveedor
                            </span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="border-b border-purple-500/20 hover:bg-purple-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-[var(--unit-text)]">{supplier.name}</p>
                          <p className="text-sm text-[var(--unit-text-muted)]">
                            {supplier._count.stockEntries} {supplier._count.stockEntries === 1 ? 'entrada' : 'entradas'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <Users className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-[var(--unit-text)]">{supplier.contactName || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {supplier.phone ? (
                            <>
                              <Phone className="h-4 w-4 text-purple-600" />
                              <span className="text-[var(--unit-text)]">{supplier.phone}</span>
                            </>
                          ) : (
                            <span className="text-[var(--unit-text-muted)]">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {supplier.email ? (
                            <>
                              <Mail className="h-4 w-4 text-purple-600" />
                              <span className="text-[var(--unit-text)]">{supplier.email}</span>
                            </>
                          ) : (
                            <span className="text-[var(--unit-text-muted)]">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${supplier.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className={`text-sm font-medium ${supplier.isActive ? 'text-green-700' : 'text-red-700'}`}>
                            {supplier.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditingSupplier(supplier)}
                            className="p-2 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-600 transition-colors"
                            title="Editar proveedor"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(supplier.id)}
                            className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                            title="Eliminar proveedor"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Supplier Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="relative overflow-hidden rounded-2xl border-2 border-purple-500/50 bg-gradient-to-br from-white/95 to-white/85 backdrop-blur-md shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-purple-500/10 to-purple-600/10 px-6 py-4 border-b border-purple-500/30 -mx-6 -mt-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                    <Plus className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--unit-text)]">Nuevo Proveedor</h3>
                    <p className="text-sm text-[var(--unit-text-muted)]">Registra un nuevo proveedor en el sistema</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-xl bg-[var(--unit-surface)] hover:bg-[var(--unit-surface-elevated)] border-2 border-[var(--unit-border)]/50 transition-all hover:scale-105"
                >
                  <X className="h-3 w-3 text-[var(--unit-text)]" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-4 w-4 text-purple-600" />
                  <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Información básica</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Nombre del Proveedor *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Distribuidora de Productos S.A."
                      className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Nombre de Contacto</label>
                    <input
                      type="text"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder="Ej: Juan Pérez"
                      className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Phone className="h-4 w-4 text-purple-600" />
                  <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Información de contacto</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Teléfono</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Ej: +51 987 654 321"
                      className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Ej: contacto@proveedor.com"
                      className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-4 w-4 text-purple-600" />
                  <h4 className="text-sm font-bold text-[var(--unit-text)] uppercase tracking-wider">Ubicación</h4>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--unit-text)] mb-2">Dirección</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Ej: Av. Principal 123, Lima, Perú"
                    rows={3}
                    className="w-full rounded-xl border-2 border-[var(--unit-border)]/50 px-4 py-3 text-[var(--unit-text)] bg-[var(--unit-surface)] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleCreateSupplier}
                disabled={!formData.name.trim() || createMutation.isPending}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold shadow-lg border-2 border-purple-500/50 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creando proveedor...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Save className="h-4 w-4" />
                    Crear Proveedor
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="flex-1 px-6 py-3 rounded-xl border-2 border-purple-500/50 text-purple-600 font-bold bg-[var(--unit-surface)] hover:bg-purple-500 hover:text-white transition-all hover:shadow-lg active:scale-[0.98]"
              >
                <span className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Cancelar
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
