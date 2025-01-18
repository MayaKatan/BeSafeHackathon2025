import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nacnvmxfvdxwmmaevvws.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hY252bXhmdmR4d21tYWV2dndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcwNTQ2ODcsImV4cCI6MjA1MjYzMDY4N30.JvZ8gAdrMmB1UHn3giywnH50OaGMHV9egjCvqGaVPIY';

export const supabase = createClient(supabaseUrl, supabaseKey);
