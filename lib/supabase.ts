'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UploadRecord = {
  id: string;
  slug: string;
  file_path: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  created_at: string;
};
