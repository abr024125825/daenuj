import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useFacultyReports() {
  return useQuery({
    queryKey: ['faculty-reports'],
    queryFn: async () => {
      const { data } = await supabase
        .from('volunteer_applications')
        .select(`
          faculty:faculties(id, name),
          status
        `)
        .eq('status', 'approved');

      const facultyStats: { [key: string]: { name: string; count: number; id: string } } = {};
      data?.forEach(app => {
        const faculty = (app.faculty as any);
        if (faculty) {
          if (!facultyStats[faculty.id]) {
            facultyStats[faculty.id] = { name: faculty.name, count: 0, id: faculty.id };
          }
          facultyStats[faculty.id].count++;
        }
      });

      // Get hours per faculty
      const { data: volunteers } = await supabase
        .from('volunteers')
        .select(`
          total_hours,
          application:volunteer_applications(faculty:faculties(id, name))
        `);

      const facultyHours: { [key: string]: number } = {};
      volunteers?.forEach(v => {
        const faculty = (v.application as any)?.faculty;
        if (faculty) {
          facultyHours[faculty.id] = (facultyHours[faculty.id] || 0) + (v.total_hours || 0);
        }
      });

      return Object.values(facultyStats).map(f => ({
        ...f,
        hours: facultyHours[f.id] || 0,
      }));
    },
  });
}

export function useTopHoursReport(limit = 20) {
  return useQuery({
    queryKey: ['top-hours-report', limit],
    queryFn: async () => {
      const { data } = await supabase
        .from('volunteers')
        .select(`
          id,
          total_hours,
          opportunities_completed,
          rating,
          is_active,
          application:volunteer_applications(
            first_name, 
            father_name, 
            family_name, 
            university_id,
            faculty:faculties(name)
          )
        `)
        .order('total_hours', { ascending: false })
        .limit(limit);

      return data?.map(v => ({
        id: v.id,
        name: `${(v.application as any)?.first_name || ''} ${(v.application as any)?.father_name || ''} ${(v.application as any)?.family_name || ''}`,
        university_id: (v.application as any)?.university_id || '',
        faculty: (v.application as any)?.faculty?.name || 'N/A',
        total_hours: v.total_hours || 0,
        opportunities_completed: v.opportunities_completed || 0,
        rating: v.rating,
        is_active: v.is_active,
      })) || [];
    },
  });
}

export function useAttendanceReport(opportunityId?: string) {
  return useQuery({
    queryKey: ['attendance-report', opportunityId],
    queryFn: async () => {
      if (!opportunityId) return null;

       const { data: opportunity, error: opportunityError } = await supabase
         .from('opportunities')
         .select('*')
         .eq('id', opportunityId)
         .maybeSingle();

       if (opportunityError) throw opportunityError;
       if (!opportunity) return null;

      const { data: registrations } = await supabase
        .from('opportunity_registrations')
        .select('id, status')
        .eq('opportunity_id', opportunityId);

      const { data: attendance } = await supabase
        .from('attendance')
        .select(`
          *,
          volunteer:volunteers(
            id,
            application:volunteer_applications(first_name, father_name, family_name, university_id)
          )
        `)
        .eq('opportunity_id', opportunityId);

      const registered = registrations?.filter(r => r.status === 'approved').length || 0;
      const attended = attendance?.length || 0;
      const absent = registered - attended;

      return {
        opportunity,
        registered,
        attended,
        absent,
        attendanceRate: registered > 0 ? Math.round((attended / registered) * 100) : 0,
        attendees: attendance?.map(a => ({
          name: `${(a.volunteer as any)?.application?.first_name || ''} ${(a.volunteer as any)?.application?.family_name || ''}`,
          university_id: (a.volunteer as any)?.application?.university_id || '',
          check_in_time: a.check_in_time,
          check_in_method: a.check_in_method,
        })) || [],
      };
    },
    enabled: !!opportunityId,
  });
}

export function useCertificatesReport() {
  return useQuery({
    queryKey: ['certificates-report'],
    queryFn: async () => {
      // Get all issued certificates
      const { data: certificates } = await supabase
        .from('certificates')
        .select(`
          *,
          volunteer:volunteers(
            id,
            application:volunteer_applications(first_name, family_name, university_id)
          ),
          opportunity:opportunities(title, date)
        `)
        .order('issued_at', { ascending: false });

      // Get volunteers who attended but don't have certificates
      const { data: attendance } = await supabase
        .from('attendance')
        .select(`
          volunteer_id,
          opportunity_id,
          volunteer:volunteers(
            id,
            application:volunteer_applications(first_name, family_name, university_id)
          ),
          opportunity:opportunities(title, date, status)
        `);

      const { data: allCerts } = await supabase
        .from('certificates')
        .select('volunteer_id, opportunity_id');

      const certSet = new Set(allCerts?.map(c => `${c.volunteer_id}-${c.opportunity_id}`));

      const pendingCertificates = attendance?.filter(a => {
        const key = `${a.volunteer_id}-${a.opportunity_id}`;
        return !certSet.has(key) && (a.opportunity as any)?.status === 'completed';
      }).map(a => ({
        volunteer_name: `${(a.volunteer as any)?.application?.first_name || ''} ${(a.volunteer as any)?.application?.family_name || ''}`,
        volunteer_id: a.volunteer_id,
        university_id: (a.volunteer as any)?.application?.university_id || '',
        opportunity_id: a.opportunity_id,
        opportunity_title: (a.opportunity as any)?.title || '',
        opportunity_date: (a.opportunity as any)?.date || '',
      })) || [];

      return {
        issued: certificates?.map(c => ({
          id: c.id,
          certificate_number: c.certificate_number,
          volunteer_name: `${(c.volunteer as any)?.application?.first_name || ''} ${(c.volunteer as any)?.application?.family_name || ''}`,
          university_id: (c.volunteer as any)?.application?.university_id || '',
          opportunity_title: (c.opportunity as any)?.title || '',
          hours: c.hours,
          issued_at: c.issued_at,
        })) || [],
        pending: pendingCertificates,
        totalIssued: certificates?.length || 0,
        totalPending: pendingCertificates.length,
        totalHoursIssued: certificates?.reduce((sum, c) => sum + (c.hours || 0), 0) || 0,
      };
    },
  });
}

export function useTotalHoursReport() {
  return useQuery({
    queryKey: ['total-hours-report'],
    queryFn: async () => {
      const { data: volunteers } = await supabase
        .from('volunteers')
        .select('total_hours, is_active');

      const totalHours = volunteers?.reduce((sum, v) => sum + (v.total_hours || 0), 0) || 0;
      const activeHours = volunteers?.filter(v => v.is_active).reduce((sum, v) => sum + (v.total_hours || 0), 0) || 0;
      const avgHours = volunteers?.length ? totalHours / volunteers.length : 0;

      return {
        totalHours,
        activeHours,
        avgHours: Math.round(avgHours * 10) / 10,
        totalVolunteers: volunteers?.length || 0,
        activeVolunteers: volunteers?.filter(v => v.is_active).length || 0,
      };
    },
  });
}

export function useAllVolunteersExport() {
  return useQuery({
    queryKey: ['all-volunteers-export'],
    queryFn: async () => {
      const { data } = await supabase
        .from('volunteers')
        .select(`
          id,
          total_hours,
          opportunities_completed,
          rating,
          is_active,
          created_at,
          application:volunteer_applications(
            first_name,
            father_name,
            grandfather_name,
            family_name,
            university_email,
            phone_number,
            university_id,
            academic_year,
            skills,
            interests,
            motivation,
            previous_experience,
            emergency_contact_name,
            emergency_contact_phone,
            faculty:faculties(name),
            major:majors(name)
          )
        `)
        .order('created_at', { ascending: false });

      return data?.map(v => ({
        id: v.id,
        first_name: (v.application as any)?.first_name || '',
        father_name: (v.application as any)?.father_name || '',
        grandfather_name: (v.application as any)?.grandfather_name || '',
        family_name: (v.application as any)?.family_name || '',
        full_name: `${(v.application as any)?.first_name || ''} ${(v.application as any)?.father_name || ''} ${(v.application as any)?.family_name || ''}`,
        university_email: (v.application as any)?.university_email || '',
        phone_number: (v.application as any)?.phone_number || '',
        university_id: (v.application as any)?.university_id || '',
        academic_year: (v.application as any)?.academic_year || '',
        faculty: (v.application as any)?.faculty?.name || '',
        major: (v.application as any)?.major?.name || '',
        skills: (v.application as any)?.skills || [],
        interests: (v.application as any)?.interests || [],
        motivation: (v.application as any)?.motivation || '',
        previous_experience: (v.application as any)?.previous_experience || '',
        emergency_contact_name: (v.application as any)?.emergency_contact_name || '',
        emergency_contact_phone: (v.application as any)?.emergency_contact_phone || '',
        total_hours: v.total_hours || 0,
        opportunities_completed: v.opportunities_completed || 0,
        rating: v.rating,
        is_active: v.is_active,
        created_at: v.created_at,
      })) || [];
    },
  });
}

export function useVolunteerDetails(volunteerId?: string) {
  return useQuery({
    queryKey: ['volunteer-full-details', volunteerId],
    queryFn: async () => {
      if (!volunteerId) return null;

       const { data: volunteer, error: volunteerError } = await supabase
         .from('volunteers')
         .select(`
           *,
           application:volunteer_applications(
             *,
             faculty:faculties(name),
             major:majors(name)
           )
         `)
         .eq('id', volunteerId)
         .maybeSingle();

       if (volunteerError) throw volunteerError;
       if (!volunteer) return null;

      const { data: attendance } = await supabase
        .from('attendance')
        .select(`
          *,
          opportunity:opportunities(title, date, location)
        `)
        .eq('volunteer_id', volunteerId)
        .order('check_in_time', { ascending: false });

      const { data: certificates } = await supabase
        .from('certificates')
        .select(`
          *,
          opportunity:opportunities(title, date)
        `)
        .eq('volunteer_id', volunteerId)
        .order('issued_at', { ascending: false });

      const app = volunteer?.application as any;

      return {
        volunteer: {
          id: volunteer?.id || '',
          first_name: app?.first_name || '',
          father_name: app?.father_name || '',
          grandfather_name: app?.grandfather_name || '',
          family_name: app?.family_name || '',
          university_email: app?.university_email || '',
          phone_number: app?.phone_number || '',
          university_id: app?.university_id || '',
          academic_year: app?.academic_year || '',
          faculty_name: app?.faculty?.name || '',
          major_name: app?.major?.name || '',
          skills: app?.skills || [],
          interests: app?.interests || [],
          motivation: app?.motivation || '',
          previous_experience: app?.previous_experience || '',
          emergency_contact_name: app?.emergency_contact_name || '',
          emergency_contact_phone: app?.emergency_contact_phone || '',
          total_hours: volunteer?.total_hours || 0,
          opportunities_completed: volunteer?.opportunities_completed || 0,
          rating: volunteer?.rating,
          is_active: volunteer?.is_active ?? false,
          created_at: volunteer?.created_at || '',
        },
        attendance: attendance?.map(a => ({
          opportunity_title: (a.opportunity as any)?.title || '',
          date: (a.opportunity as any)?.date || '',
          check_in_time: a.check_in_time,
        })) || [],
        certificates: certificates?.map(c => ({
          certificate_number: c.certificate_number,
          opportunity_title: (c.opportunity as any)?.title || '',
          hours: c.hours,
          issued_at: c.issued_at,
        })) || [],
      };
    },
    enabled: !!volunteerId,
  });
}
