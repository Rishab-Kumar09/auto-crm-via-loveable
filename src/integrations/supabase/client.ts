// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://ljbygdktdvdrgdwnqryn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqYnlnZGt0ZHZkcmdkd25xcnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0OTY3MDUsImV4cCI6MjA1MzA3MjcwNX0.rOr7NKi3RJsOrXF1RDAsBHTqlZ4k80HD1MzTej0y7o4";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);