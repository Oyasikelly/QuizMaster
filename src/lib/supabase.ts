// import { createClient, SupabaseClient } from "@supabase/supabase-js";

// const supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL;
// const supabaseAnonKey: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// // Ensure the environment variables are set
// if (!supabaseUrl || !supabaseAnonKey) {
//   throw new Error(
//     "Supabase URL and Anon Key must be provided in environment variables."
//   );
// }

// // Create a typed Supabase client
// export const supabase: SupabaseClient = createClient(
//   supabaseUrl,
//   supabaseAnonKey
// );

// import { createClient } from "@supabase/supabase-js";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
export const supabase = createClientComponentClient();
