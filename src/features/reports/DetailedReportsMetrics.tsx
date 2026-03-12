import { TrendingUp, TrendingDown, DollarSign, FileText, Users, Calendar, Download, BarChart3, Target, Award, Clock, CheckCircle, Building2, Package, Receipt, Filter, Search, Eye, Activity } from 'lucide-react';
import { format, startOfDay, endOfDay, subDays, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface UnifiedReportData {
  id: string;
  type: 'sale' | 'appointment' | 'client' | 'product' | 'commission' | 'cash-register';
  referenceId: string;
  title: string;
  subtitle?: string;
  amount?: number;
  status?: string;
  date: string;
  unit: 'SPA' | 'BARBERIA';
  customer?: string;
  employee?: string;
  details?: Record<string, any>;
}

interface DetailedReportsMetricsProps {
  data: UnifiedReportData[];
  filteredData: UnifiedReportData[];
  selectedType: string;
  selectedStatus: string;
  searchTerm: string;
  unit: string;
  dateFrom: Date;
  dateTo: Date;
}

export function DetailedReportsMetrics({ 
  data, 
  filteredData, 
  selectedType, 
  selectedStatus, 
  searchTerm, 
  unit, 
  dateFrom, 
  dateTo 
}: DetailedReportsMetricsProps) {
  // Calculate metrics
  const totalRecords = data.length;
  const filteredRecords = filteredData.length;
  
  // Today's records
  const todayRecords = data.filter(item => {
    const itemDate = new Date(item.date);
    return isToday(itemDate);
  });

  // This week records
  const weekRecords = data.filter(item => {
    const itemDate = new Date(item.date);
    return isThisWeek(itemDate, { weekStartsOn: 1 });
  });

  // Type breakdown
  const typeBreakdown = data.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Unit breakdown
  const spaRecords = data.filter(item => item.unit === 'SPA').length;
  const barberiaRecords = data.filter(item => item.unit === 'BARBERIA').length;

  // Status breakdown
  const statusBreakdown = data.reduce((acc, item) => {
    if (item.status) {
      acc[item.status] = (acc[item.status] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Financial metrics
  const totalAmount = data.reduce((sum, item) => sum + (item.amount || 0), 0);
  const avgAmount = data.filter(item => item.amount).length > 0 
    ? totalAmount / data.filter(item => item.amount).length 
    : 0;

  // Most active type
  const mostActiveType = Object.entries(typeBreakdown).reduce((best, [type, count]) => 
    count > best.count ? { type, count } : best
  , { type: '', count: 0 });

  // Filter effectiveness
  const filterEffectiveness = totalRecords > 0 ? ((totalRecords - filteredRecords) / totalRecords) * 100 : 0;

  // Date range coverage
  const daysDiff = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
  const recordsPerDay = daysDiff > 0 ? totalRecords / daysDiff : 0;

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sale': return <DollarSign className="h-6 w-6 text-white" />;
      case 'appointment': return <Calendar className="h-6 w-6 text-white" />;
      case 'client': return <Users className="h-6 w-6 text-white" />;
      case 'product': return <Package className="h-6 w-6 text-white" />;
      case 'commission': return <Receipt className="h-6 w-6 text-white" />;
      case 'cash-register': return <Building2 className="h-6 w-6 text-white" />;
      default: return <FileText className="h-6 w-6 text-white" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'sale': return 'Ventas';
      case 'appointment': return 'Citas';
      case 'client': return 'Clientes';
      case 'product': return 'Productos';
      case 'commission': return 'Comisiones';
      case 'cash-register': return 'Caja';
      default: return 'General';
    }
  };

  return (
    <>
      {/* First Row - 4 Core Detailed Reports Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Records */}
        <div className="relative overflow-hidden rounded-xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-50 to-blue-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-blue-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-600 shadow-lg group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-blue-800 bg-white px-3 py-1 rounded-full border border-blue-300 shadow-sm">Total</span>
            </div>
            <p className="text-3xl font-bold text-blue-900 tabular-nums mb-2">{totalRecords.toLocaleString()}</p>
            <p className="text-sm text-blue-700 font-medium">Registros totales</p>
          </div>
        </div>

        {/* Filtered Records */}
        <div className="relative overflow-hidden rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-50 to-purple-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-purple-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-purple-600 shadow-lg group-hover:scale-110 transition-transform">
                <Filter className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-purple-800 bg-white px-3 py-1 rounded-full border border-purple-300 shadow-sm">Filtrados</span>
            </div>
            <p className="text-3xl font-bold text-purple-900 tabular-nums mb-2">{filteredRecords.toLocaleString()}</p>
            <p className="text-sm text-purple-700 font-medium">Registros visibles</p>
          </div>
        </div>

        {/* Today's Records */}
        <div className="relative overflow-hidden rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-green-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-green-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 border-2 border-green-600 shadow-lg group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-green-800 bg-white px-3 py-1 rounded-full border border-green-300 shadow-sm">Hoy</span>
            </div>
            <p className="text-3xl font-bold text-green-900 tabular-nums mb-2">{todayRecords.length}</p>
            <p className="text-sm text-green-700 font-medium">Registros de hoy</p>
          </div>
        </div>

        {/* Most Active Type */}
        <div className="relative overflow-hidden rounded-xl border-2 border-pink-500/30 bg-gradient-to-br from-pink-50 to-pink-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-100/50 to-pink-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 border-2 border-pink-600 shadow-lg group-hover:scale-110 transition-transform">
                {getTypeIcon(mostActiveType.type)}
              </div>
              <span className="text-xs font-bold text-pink-800 bg-white px-3 py-1 rounded-full border border-pink-300 shadow-sm">Top</span>
            </div>
            <p className="text-lg font-bold text-pink-900 tabular-nums mb-1 truncate">
              {getTypeName(mostActiveType.type)}
            </p>
            <p className="text-sm text-pink-700 font-medium">
              {mostActiveType.count} registros
            </p>
          </div>
        </div>
      </div>

      {/* Second Row - 4 Additional Detailed Reports Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Unit Distribution */}
        <div className="relative overflow-hidden rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-50 to-amber-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-amber-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 border-2 border-amber-600 shadow-lg group-hover:scale-110 transition-transform">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-amber-800 bg-white px-3 py-1 rounded-full border border-amber-300 shadow-sm">Unidades</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                <span className="text-sm font-bold text-amber-900">SPA: {spaRecords}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-stone-600"></div>
                <span className="text-sm font-bold text-amber-900">Barbería: {barberiaRecords}</span>
              </div>
            </div>
            <p className="text-sm text-amber-700 font-medium">Distribución por unidad</p>
          </div>
        </div>

        {/* Records Per Day */}
        <div className="relative overflow-hidden rounded-xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/50 to-indigo-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 border-2 border-indigo-600 shadow-lg group-hover:scale-110 transition-transform">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-indigo-800 bg-white px-3 py-1 rounded-full border border-indigo-300 shadow-sm">Frecuencia</span>
            </div>
            <p className="text-3xl font-bold text-indigo-900 tabular-nums mb-2">{recordsPerDay.toFixed(1)}</p>
            <p className="text-sm text-indigo-700 font-medium">Registros por día</p>
          </div>
        </div>

        {/* Total Amount */}
        <div className="relative overflow-hidden rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-100/50 to-emerald-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 border-2 border-emerald-600 shadow-lg group-hover:scale-110 transition-transform">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-300 shadow-sm">Monto</span>
            </div>
            <p className="text-3xl font-bold text-emerald-900 tabular-nums mb-2">S/{totalAmount.toFixed(2)}</p>
            <p className="text-sm text-emerald-700 font-medium">Suma total</p>
          </div>
        </div>

        {/* Filter Efficiency */}
        <div className="relative overflow-hidden rounded-xl border-2 border-teal-500/30 bg-gradient-to-br from-teal-50 to-teal-100 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-100/50 to-teal-200/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 border-2 border-teal-600 shadow-lg group-hover:scale-110 transition-transform">
                <Target className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-bold text-teal-800 bg-white px-3 py-1 rounded-full border border-teal-300 shadow-sm">Eficiencia</span>
            </div>
            <p className="text-3xl font-bold text-teal-900 tabular-nums mb-2">{(100 - filterEffectiveness).toFixed(1)}%</p>
            <p className="text-sm text-teal-700 font-medium">Precisión de filtros</p>
          </div>
        </div>
      </div>
    </>
  );
}
