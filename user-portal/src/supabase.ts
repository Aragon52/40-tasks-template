import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {};
const isConfigured: boolean = !!(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY);

const supabaseUrl: string = env.VITE_SUPABASE_URL || 'https://zxamlpfvggvoynhssbzd.supabase.co';
const supabaseAnonKey: string = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4YW1scGZ2Z2d2b3luaHNzYnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4OTcxNDYsImV4cCI6MjA5NzQ3MzE0Nn0.ooXFK1txYdWUhuW9KQ7ekXRDFCwI8YXmdXllC2nsMO4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export { isConfigured };
