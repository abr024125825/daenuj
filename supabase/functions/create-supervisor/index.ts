import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const supervisorEmail = "supervisor@test.com";
    const supervisorPassword = "supervisor123";

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === supervisorEmail);

    if (existingUser) {
      return new Response(
        JSON.stringify({
          message: "Supervisor account already exists",
          credentials: {
            email: supervisorEmail,
            password: supervisorPassword,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: supervisorEmail,
      password: supervisorPassword,
      email_confirm: true,
      user_metadata: {
        first_name: "أحمد",
        last_name: "المشرف",
      },
    });

    if (authError) throw authError;

    const userId = authData.user.id;

    // Update profile to supervisor role
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        first_name: "أحمد",
        last_name: "المشرف",
        role: "supervisor",
      })
      .eq("user_id", userId);

    if (profileError) throw profileError;

    // Update user_roles
    const { error: roleError } = await supabase
      .from("user_roles")
      .update({ role: "supervisor" })
      .eq("user_id", userId);

    if (roleError) throw roleError;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Supervisor account created successfully",
        credentials: {
          email: supervisorEmail,
          password: supervisorPassword,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
