import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function useCompaniesAssignments(year) {
  const [companies, setCompanies] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      const { data: companiesData } = await supabase.from('Companies').select('*');
      const { data: assignmentsData } = await supabase
        .from('Assignments')
        .select('*')
        .eq('year', year);
      if (!cancelled) {
        setCompanies(companiesData || []);
        setAssignments(assignmentsData || []);
        setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [year]);

  return { companies, assignments, loading };
}
