import { Users, UserPlus, UserCheck, UserX, CreditCard, Award, Star, Target } from 'lucide-react';
import { Client } from '@/types/client';
import { isToday, isThisWeek, isThisMonth, differenceInDays } from 'date-fns';
import { KPICard } from '@/components/ui/KPICard';

interface ClientsMetricsProps {
  clients: Client[];
  total?: number; // New prop for total clients from backend
}

export function ClientsMetrics({ clients, total }: ClientsMetricsProps) {
  const totalClients = total ?? clients.length;
  const today = new Date();
  
  const todayClients = clients.filter(client => {
    const clientDate = new Date(client.createdAt);
    return isToday(clientDate);
  });

  const activeClients = clients.filter(client => !client.isBlocked);
  const blockedClients = clients.filter(client => client.isBlocked);
  const totalCreditBalance = clients.reduce((sum, client) => sum + client.creditBalance, 0);

  const loyalClients = clients.filter(client => 
    client._count?.appointments && client._count.appointments >= 5
  );

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

  const channels = [
    { name: 'Referidos', count: referralClients.length },
    { name: 'Redes Sociales', count: socialMediaClients.length },
    { name: 'Walk-in', count: walkInClients.length },
    { name: 'Otros', count: clients.length - referralClients.length - socialMediaClients.length - walkInClients.length }
  ];
  const bestChannel = channels.reduce((best, channel) => 
    channel.count > best.count ? channel : best
  , channels[0]);

  const clientsWithPreferredEmployee = clients.filter(client => client.preferredEmployeeId);
  const preferredEmployeeRate = clients.length > 0 
    ? (clientsWithPreferredEmployee.length / clients.length) * 100 
    : 0;

  return (
    <div className="space-y-4 mb-6">
      {/* First Row - 4 Core Clients Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Clientes"
          value={totalClients}
          description="Directorio consolidado"
          color="blue"
          icon={<Users className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Nuevos Hoy"
          value={todayClients.length}
          description="Registrados el día de hoy"
          color="green"
          icon={<UserPlus className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Clientes Activos"
          value={activeClients.length}
          description="Habilitados para citas"
          color="teal"
          icon={<UserCheck className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Saldo a Favor"
          value={totalCreditBalance.toFixed(2)}
          unit="S/"
          description="Crédito acumulado"
          color="purple"
          icon={<CreditCard className="h-6 w-6 text-white" />}
        />
      </div>

      {/* Second Row - 4 Additional Clients Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Bloqueados"
          value={blockedClients.length}
          description="Restringidos temporalmente"
          color="red"
          critical={blockedClients.length > 0}
          icon={<UserX className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Frecuentes / VIP"
          value={loyalClients.length}
          description="5 o más visitas"
          color="amber"
          icon={<Award className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Fidelidad Empleado"
          value={`${Number(preferredEmployeeRate || 0).toFixed(1)}%`}
          description="Con especialista favorito"
          color="indigo"
          icon={<Star className="h-6 w-6 text-white" />}
        />
        <KPICard
          title="Canal Principal"
          value={bestChannel.name}
          subtitle={`${bestChannel.count} registros`}
          description="Mayor vía de captación"
          color="pink"
          icon={<Target className="h-6 w-6 text-white" />}
        />
      </div>
    </div>
  );
}
