// Reexportar o cliente Supabase oficial para evitar instâncias duplicadas
import { supabase } from '@/integrations/supabase/client';

export function getSupabaseClient() {
  return supabase;
}

export { supabase };
export default getSupabaseClient;
