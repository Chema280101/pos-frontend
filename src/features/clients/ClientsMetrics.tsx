import { TrendingUp, TrendingDown, Users, UserPlus, UserCheck, UserX, DollarSign, Star, Calendar, Phone, CreditCard, AlertTriangle, Award, Target, Activity, BarChart3, Heart } from 'lucide-react';
import { Client } from '@/types/client';
import { format, startOfDay, endOfDay, subDays, isToday, isThisWeek, isThisMonth, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClientsMetricsProps {
  clients: Client[];
}

export function ClientsMetrics({ clients }: ClientsMetricsProps) {
  // Today's new clients
  const today = new Date();
  const todayClients = clients.filter(client => {
    const clientDate = new Date(client.createdAt);
    return isToday(clientDate);
  });

  // This week new clients
  const weekClients = clients.filter(client => {
    const clientDate = new Date(client.createdAt);
    return isThisWeek(clientDate, { weekStartsOn: 1 });
  });

  // This month new clients
  const monthClients = clients.filter(client => {
    const clientDate = new Date(client.createdAt);
    return isThisMonth(clientDate);
  });

  // Status breakdown
  const activeClients = clients.filter(client => !client.isBlocked);
  const blockedClients = clients.filter(client => client.isBlocked);
  const clientsWithCredit = clients.filter(client => client.creditBalance > 0);
  const clientsWithDebt = clients.filter(client => client.creditBalance < 0);

  // Gender breakdown
  const maleClients = clients.filter(client => client.gender === 'MASCULINO');
  const femaleClients = clients.filter(client => client.gender === 'FEMENINO');

  // Client engagement metrics
  const clientsWithAppointments = clients.filter(client => client._count?.appointments && client._count.appointments > 0);
  const clientsWithSales = clients.filter(client => client._count?.sales && client._count.sales > 0);
  const loyalClients = clients.filter(client => 
    client._count?.appointments && client._count.appointments >= 5
  );

  // Financial metrics
  const totalCreditBalance = clients.reduce((sum, client) => sum + client.creditBalance, 0);
  const avgCreditBalance = clients.length > 0 ? totalCreditBalance / clients.length : 0;

  // How they found us breakdown
  const referralClients = clients.filter(client => 
    client.howFoundUs && client.howFoundUs.toLowerCase().includes('refer')
  );
  const socialMediaClients = clients.filter(client => 
    client.howFoundUs && (
      client.howFoundUs.toLowerCase().includes('instagram') ||
      client.howFoundUs.toLowerCase().includes('facebook') ||
      client.howFoundUs.toLowerCase().includes('social')
    )
  );
  const walkInClients = clients.filter(client => 
    client.howFoundUs && client.howFoundUs.toLowerCase().includes('walk')
  );

  // Best acquisition channel
  const channels = [
    { name: 'Referidos', count: referralClients.length },
    { name: 'Redes Sociales', count: socialMediaClients.length },
    { name: 'Walk-in', count: walkInClients.length },
    { name: 'Otros', count: clients.length - referralClients.length - socialMediaClients.length - walkInClients.length }
  ];
  const bestChannel = channels.reduce((best, channel) => 
    channel.count > best.count ? channel : best
  , channels[0]);

  // Client retention metrics
  const recentClients = clients.filter(client => {
    const clientDate = new Date(client.createdAt);
    return differenceInDays(today, clientDate) <= 30;
  });
  const establishedClients = clients.filter(client => {
    const clientDate = new Date(client.createdAt);
    return differenceInDays(today, clientDate) > 30;
  });

  // Preferred employee metrics
  const clientsWithPreferredEmployee = clients.filter(client => client.preferredEmployeeId);
  const preferredEmployeeRate = clients.length > 0 
    ? (clientsWithPreferredEmployee.length / clients.length) * 100 
    : 0;

  return (
    <>
      {/* First Row - 4 Core Clients Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Clients */}
        <div className="relative overflow-hidden rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-50 to-blue-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-blue-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-600 shadow-lg group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-blue-800 bg-white px-3 py-1 rounded-full border border-blue-300 shadow-sm">Total</span>
            </div>
            <p className="text-3xl font-bold text-blue-900 tabular-nums mb-2">{clients.length}</p>
            <p className="text-sm text-blue-700 font-medium">Clientes totales</p>
          </div>
        </div>

        {/* New Clients Today */}
        <div className="relative overflow-hidden rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-green-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-green-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 border-2 border-green-600 shadow-lg group-hover:scale-110 transition-transform">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-green-800 bg-white px-3 py-1 rounded-full border border-green-300 shadow-sm">Hoy</span>
            </div>
            <p className="text-3xl font-bold text-green-900 tabular-nums mb-2">{todayClients.length}</p>
            <p className="text-sm text-green-700 font-medium">Nuevos hoy</p>
          </div>
        </div>

        {/* Active Clients */}
        <div className="relative overflow-hidden rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 to-emerald-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 border-2 border-emerald-600 shadow-lg group-hover:scale-110 transition-transform">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-300 shadow-sm">Activos</span>
            </div>
            <p className="text-3xl font-bold text-emerald-900 tabular-nums mb-2">{activeClients.length}</p>
            <p className="text-sm text-emerald-700 font-medium">Clientes activos</p>
          </div>
        </div>

        {/* Total Credit Balance */}
        <div className="relative overflow-hidden rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-50 to-purple-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-purple-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-purple-600 shadow-lg group-hover:scale-110 transition-transform">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-purple-800 bg-white px-3 py-1 rounded-full border border-purple-300 shadow-sm">Crédito</span>
            </div>
            <p className="text-3xl font-bold text-purple-900 tabular-nums mb-2">S/{Number(totalCreditBalance || 0).toFixed(2)}</p>
            <p className="text-sm text-purple-700 font-medium">Saldo total</p>
          </div>
        </div>
      </div>

      {/* Second Row - 4 Additional Clients Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Blocked Clients */}
        <div className="relative overflow-hidden rounded-xl border-2 border-red-500/30 bg-gradient-to-br from-red-50 to-red-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-red-100/50 to-red-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 border-2 border-red-600 shadow-lg group-hover:scale-110 transition-transform">
                <UserX className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-red-800 bg-white px-3 py-1 rounded-full border border-red-300 shadow-sm">Bloqueados</span>
            </div>
            <p className="text-3xl font-bold text-red-900 tabular-nums mb-2">{blockedClients.length}</p>
            <p className="text-sm text-red-700 font-medium">Clientes bloqueados</p>
          </div>
        </div>

        {/* Loyal Clients */}
        <div className="relative overflow-hidden rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-50 to-amber-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-amber-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 border-2 border-amber-600 shadow-lg group-hover:scale-110 transition-transform">
                <Award className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-amber-800 bg-white px-3 py-1 rounded-full border border-amber-300 shadow-sm">Leales</span>
            </div>
            <p className="text-3xl font-bold text-amber-900 tabular-nums mb-2">{loyalClients.length}</p>
            <p className="text-sm text-amber-700 font-medium">Clientes leales (5+ citas)</p>
          </div>
        </div>

        {/* Preferred Employee Rate */}
        <div className="relative overflow-hidden rounded-xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/50 to-indigo-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 border-2 border-indigo-600 shadow-lg group-hover:scale-110 transition-transform">
                <Star className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-indigo-800 bg-white px-3 py-1 rounded-full border border-indigo-300 shadow-sm">Preferencia</span>
            </div>
            <p className="text-3xl font-bold text-indigo-900 tabular-nums mb-2">{Number(preferredEmployeeRate || 0).toFixed(1)}%</p>
            <p className="text-sm text-indigo-700 font-medium">Con empleado preferido</p>
          </div>
        </div>

        {/* Best Acquisition Channel */}
        <div className="relative overflow-hidden rounded-xl border-2 border-pink-500/30 bg-gradient-to-br from-pink-50 to-pink-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-100/50 to-pink-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 border-2 border-pink-600 shadow-lg group-hover:scale-110 transition-transform">
                <Target className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-pink-800 bg-white px-3 py-1 rounded-full border border-pink-300 shadow-sm">Mejor</span>
            </div>
            <p className="text-lg font-bold text-pink-900 tabular-nums mb-1 truncate">
              {bestChannel.name}
            </p>
            <p className="text-sm text-pink-700 font-medium">
              {bestChannel.count} clientes
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
