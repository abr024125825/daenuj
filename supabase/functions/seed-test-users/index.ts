import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const testUsers = [
      {
        email: 'admin@volunteer.jo',
        password: 'admin123',
        role: 'admin',
        first_name: 'Admin',
        last_name: 'User'
      },
      {
        email: 'volunteer@volunteer.jo',
        password: 'volunteer123',
        role: 'volunteer',
        first_name: 'Mohammed',
        last_name: 'Ahmad'
      }
    ];

    const results = [];

    for (const testUser of testUsers) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === testUser.email);

      if (existingUser) {
        console.log(`User ${testUser.email} already exists, skipping...`);
        results.push({ email: testUser.email, status: 'already_exists' });
        continue;
      }

      // Create user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
        user_metadata: {
          first_name: testUser.first_name,
          last_name: testUser.last_name
        }
      });

      if (authError) {
        console.error(`Error creating user ${testUser.email}:`, authError);
        results.push({ email: testUser.email, status: 'error', error: authError.message });
        continue;
      }

      console.log(`Created user ${testUser.email} with ID ${authData.user.id}`);

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          email: testUser.email,
          first_name: testUser.first_name,
          last_name: testUser.last_name,
          role: testUser.role,
          is_active: true
        });

      if (profileError) {
        console.error(`Error creating profile for ${testUser.email}:`, profileError);
      }

      // Create user role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: testUser.role
        });

      if (roleError) {
        console.error(`Error creating role for ${testUser.email}:`, roleError);
      }

      // If volunteer, create volunteer application and record
      if (testUser.role === 'volunteer') {
        // Get a faculty and major
        const { data: faculties } = await supabaseAdmin
          .from('faculties')
          .select('id')
          .limit(1);
        
        const { data: majors } = await supabaseAdmin
          .from('majors')
          .select('id')
          .limit(1);

        if (faculties?.length && majors?.length) {
          const { data: application, error: appError } = await supabaseAdmin
            .from('volunteer_applications')
            .insert({
              user_id: authData.user.id,
              first_name: testUser.first_name,
              father_name: 'Test',
              grandfather_name: 'Test',
              family_name: testUser.last_name,
              university_email: testUser.email,
              phone_number: '0791234567',
              university_id: '2020123456',
              faculty_id: faculties[0].id,
              major_id: majors[0].id,
              academic_year: 'Third Year',
              emergency_contact_name: 'Emergency Contact',
              emergency_contact_phone: '0799876543',
              motivation: 'I want to contribute to the community',
              status: 'approved',
              reviewed_at: new Date().toISOString()
            })
            .select()
            .single();

          if (appError) {
            console.error('Error creating application:', appError);
          } else if (application) {
            // Create volunteer record
            const { error: volError } = await supabaseAdmin
              .from('volunteers')
              .insert({
                user_id: authData.user.id,
                application_id: application.id,
                is_active: true,
                total_hours: 0,
                opportunities_completed: 0
              });

            if (volError) {
              console.error('Error creating volunteer record:', volError);
            }
          }
        }
      }

      results.push({ email: testUser.email, status: 'created' });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test users created successfully',
        results,
        credentials: testUsers.map(u => ({ email: u.email, password: u.password }))
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('Error in seed-test-users function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
