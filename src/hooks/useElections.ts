import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Election {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  election_date: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface VotingBox {
  id: string;
  election_id: string;
  name: string;
  name_ar: string | null;
  location: string | null;
  location_ar: string | null;
  supervisor_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ElectionVoter {
  id: string;
  election_id: string;
  box_id: string | null;
  student_name: string;
  student_name_ar: string | null;
  university_id: string;
  faculty_name: string | null;
  faculty_name_ar: string | null;
  national_id: string | null;
  has_voted: boolean;
  voted_at: string | null;
  checked_in_by: string | null;
  created_at: string;
}

// Elections
export function useElections() {
  return useQuery({
    queryKey: ['elections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .order('election_date', { ascending: false });
      if (error) throw error;
      return data as Election[];
    },
  });
}

export function useElection(id: string | undefined) {
  return useQuery({
    queryKey: ['election', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('elections')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Election;
    },
    enabled: !!id,
  });
}

export function useCreateElection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (election: { name: string; name_ar?: string; description?: string; election_date: string; created_by: string }) => {
      const { data, error } = await supabase.from('elections').insert(election).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['elections'] });
      toast({ title: 'Election created successfully' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateElection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Election> & { id: string }) => {
      const { error } = await supabase.from('elections').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['elections'] });
      toast({ title: 'Election updated' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

// Voting Boxes
export function useVotingBoxes(electionId: string | undefined) {
  return useQuery({
    queryKey: ['voting-boxes', electionId],
    queryFn: async () => {
      if (!electionId) return [];
      const { data, error } = await supabase
        .from('voting_boxes')
        .select('*')
        .eq('election_id', electionId)
        .order('name');
      if (error) throw error;
      return data as VotingBox[];
    },
    enabled: !!electionId,
  });
}

export function useCreateVotingBox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (box: { election_id: string; name: string; name_ar?: string; location?: string; location_ar?: string; supervisor_id?: string }) => {
      const { data, error } = await supabase.from('voting_boxes').insert(box).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['voting-boxes', vars.election_id] });
      toast({ title: 'Voting box created' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useUpdateVotingBox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VotingBox> & { id: string }) => {
      const { error } = await supabase.from('voting_boxes').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voting-boxes'] });
      toast({ title: 'Voting box updated' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteVotingBox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('voting_boxes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voting-boxes'] });
      toast({ title: 'Voting box deleted' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

// Voters
export function useElectionVoters(electionId: string | undefined, boxId?: string) {
  return useQuery({
    queryKey: ['election-voters', electionId, boxId],
    queryFn: async () => {
      if (!electionId) return [];
      let query = supabase
        .from('election_voters')
        .select('*')
        .eq('election_id', electionId);
      if (boxId) query = query.eq('box_id', boxId);
      const { data, error } = await query.order('student_name');
      if (error) throw error;
      return data as ElectionVoter[];
    },
    enabled: !!electionId,
  });
}

export function useUploadVoters() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ electionId, voters }: { electionId: string; voters: Omit<ElectionVoter, 'id' | 'has_voted' | 'voted_at' | 'checked_in_by' | 'created_at'>[] }) => {
      // Insert in batches of 500
      const batchSize = 500;
      let inserted = 0;
      for (let i = 0; i < voters.length; i += batchSize) {
        const batch = voters.slice(i, i + batchSize).map(v => ({
          ...v,
          election_id: electionId,
        }));
        const { error } = await supabase.from('election_voters').upsert(batch, { 
          onConflict: 'election_id,university_id',
          ignoreDuplicates: true 
        });
        if (error) throw error;
        inserted += batch.length;
      }
      return inserted;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ['election-voters'] });
      toast({ title: `${count} voters uploaded successfully` });
    },
    onError: (e: any) => toast({ title: 'Error uploading voters', description: e.message, variant: 'destructive' }),
  });
}

export function useCheckInVoter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ voterId, checkedInBy }: { voterId: string; checkedInBy: string }) => {
      const { error } = await supabase
        .from('election_voters')
        .update({ has_voted: true, voted_at: new Date().toISOString(), checked_in_by: checkedInBy })
        .eq('id', voterId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['election-voters'] });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

export function useUndoCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (voterId: string) => {
      const { error } = await supabase
        .from('election_voters')
        .update({ has_voted: false, voted_at: null, checked_in_by: null })
        .eq('id', voterId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['election-voters'] });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
}

// Stats
export function useElectionStats(electionId: string | undefined) {
  return useQuery({
    queryKey: ['election-stats', electionId],
    queryFn: async () => {
      if (!electionId) return null;
      const { data: voters, error } = await supabase
        .from('election_voters')
        .select('box_id, has_voted')
        .eq('election_id', electionId);
      if (error) throw error;

      const { data: boxes, error: boxError } = await supabase
        .from('voting_boxes')
        .select('id, name, name_ar, location')
        .eq('election_id', electionId);
      if (boxError) throw boxError;

      const totalVoters = voters?.length || 0;
      const totalVoted = voters?.filter(v => v.has_voted).length || 0;

      const boxStats = (boxes || []).map(box => {
        const boxVoters = voters?.filter(v => v.box_id === box.id) || [];
        return {
          ...box,
          total: boxVoters.length,
          voted: boxVoters.filter(v => v.has_voted).length,
          percentage: boxVoters.length > 0 
            ? Math.round((boxVoters.filter(v => v.has_voted).length / boxVoters.length) * 100) 
            : 0,
        };
      });

      return { totalVoters, totalVoted, percentage: totalVoters > 0 ? Math.round((totalVoted / totalVoters) * 100) : 0, boxStats };
    },
    enabled: !!electionId,
    refetchInterval: 5000, // Auto-refresh every 5s for live results
  });
}
