import { Banknote, Unlock, TrendingUp, Calendar, Calculator, TrendingDown, Activity, Award } from 'lucide-react';
import { CashRegister } from '@/types/cash';
import { KPICard } from '@/components/ui/KPICard';

interface CashRegisterMetricsProps {
  cashRegisters: CashRegister[];
}

export function CashRegisterMetrics({ cashRegisters }: CashRegisterMetricsProps) {
  const total = cashRegisters.length;
  const open = cashRegisters.filter(cr => cr.status === 'OPEN').length;
  
  // Today's registers
  const today = new Date();
  const todayRegisters = cashRegisters.filter(cr => {
    const registerDate = new Date(cr.openedAt);
    return registerDate.toDateString() === today.toDateString();
  });
  
  // Financial calculations
  const totalOpeningAmount = cashRegisters.reduce((sum, cr) => {
    const amount = Number(cr.openingAmount) || 0;
    return sum + amount;
  }, 0);
  
  const totalExpenses = cashRegisters.reduce((sum, cr) => {
    const expenses = cr.expenses || [];
    const expensesSum = expenses.reduce((eSum, e) => eSum + (e.amount || 0), 0);
    return sum + expensesSum;
  }, 0);

  const totalSales = cashRegisters.reduce((sum, cr) => {
    const closingDeclared = Number(cr.closingDeclared) || 0;
    return sum + closingDeclared;
  }, 0);

  const averageOpening = total > 0 ? totalOpeningAmount / total : 0;
  const barberiaCount = cashRegisters.filter(cr => cr.unit === 'BARBERIA').length;
  const bestRegister = cashRegisters.length > 0 ? 
    cashRegisters.reduce((max, cr) => Number(cr.openingAmount) > Number(max.openingAmount) ? cr : max, cashRegisters[0]) : null;
  
  const todayOpening = todayRegisters.reduce((sum, cr) => {
    const amount = Number(cr.openingAmount) || 0;
    return sum + amount;
  }, 0);

  return (
    <div className="space-y-4 mb-6">
      {/* First Row - 4 Primary Cash Register Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Cajas Totales"
          value={total}
          description="Sesiones de caja"
          color="blue"
          icon={<Banknote className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Cajas Abiertas"
          value={open}
          description="En operación actual"
          color="green"
          icon={<Unlock className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Ganancia Neta"
          value={Number((totalSales || 0) - totalExpenses).toFixed(2)}
          unit="S/"
          description="Ventas menos egresos"
          color="teal"
          icon={<TrendingUp className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Apertura Hoy"
          value={todayOpening.toFixed(2)}
          unit="S/"
          description="Monto base de hoy"
          color="purple"
          icon={<Calendar className="h-6 w-6 text-white" />}
        />
      </div>

      {/* Second Row - 4 Additional Cash Register Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Apertura Promedio"
          value={averageOpening.toFixed(2)}
          unit="S/"
          description="Base promedio inicial"
          color="indigo"
          icon={<Calculator className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Gastos Totales"
          value={totalExpenses.toFixed(2)}
          unit="S/"
          description="Egresos reportados"
          color="red"
          critical={totalExpenses > 0}
          icon={<TrendingDown className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Cajas Barbería"
          value={barberiaCount}
          description="Sesiones registradas"
          color="pink"
          icon={<Activity className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Caja Destacada"
          value={bestRegister ? `${bestRegister.unit} #${bestRegister.id.slice(-4)}` : 'N/A'}
          subtitle={`Base S/ ${Number(bestRegister?.openingAmount || 0).toFixed(2)}`}
          description="Mayor fondo de apertura"
          color="amber"
          icon={<Award className="h-6 w-6 text-white" />}
        />
      </div>
    </div>
  );
}
