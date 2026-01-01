import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = 'https://iqavqgnbviuzmvzwiiqg.supabase.co';
const supabaseAnonKey = 'sb_publishable_ney6_XwpKYYfSylz20oGSg_WFtZK-pJ';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
