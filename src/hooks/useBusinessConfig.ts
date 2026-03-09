import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface BusinessConfig {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
}

export function useBusinessConfig() {
  return useQuery({
    queryKey: ['config', 'business'],
    queryFn: async (): Promise<BusinessConfig> => {
      const { data } = await api.get<BusinessConfig>('/api/config/business');
      return data;
    },
  });
}
