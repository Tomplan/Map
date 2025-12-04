import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook for managing feedback requests, votes, and comments
 * @returns {object} Requests data and CRUD operations
 */
export default function useFeedbackRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userVotes, setUserVotes] = useState(new Set());

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Load all requests with optional filters
  const loadRequests = useCallback(
    async (filters = {}) => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('feedback_requests')
          .select('*')
          .order('created_at', { ascending: false });

        // Apply filters
        if (filters.type) query = query.eq('type', filters.type);
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.userId) query = query.eq('user_id', filters.userId);

        const { data, error: fetchError } = await query;
        if (fetchError) throw fetchError;

        setRequests(data || []);

        // Load user's votes
        if (currentUserId) {
          const { data: votesData } = await supabase
            .from('feedback_votes')
            .select('request_id')
            .eq('user_id', currentUserId);

          setUserVotes(new Set(votesData?.map((v) => v.request_id) || []));
        }
      } catch (err) {
        console.error('Error loading feedback requests:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [currentUserId],
  );

  // Create new request
  const createRequest = async (requestData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error: insertError } = await supabase
        .from('feedback_requests')
        .insert({
          user_id: user.id,
          user_email: user.email,
          type: requestData.type,
          title: requestData.title,
          description: requestData.description || '',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await loadRequests();
      return { data, error: null };
    } catch (err) {
      console.error('Error creating request:', err);
      return { data: null, error: err.message };
    }
  };

  // Update request (super admin can update status, priority, version; users can update own title/description)
  const updateRequest = async (requestId, updates) => {
    try {
      const { data, error: updateError } = await supabase
        .from('feedback_requests')
        .update(updates)
        .eq('id', requestId)
        .select()
        .single();

      if (updateError) throw updateError;

      await loadRequests();
      return { data, error: null };
    } catch (err) {
      console.error('Error updating request:', err);
      return { data: null, error: err.message };
    }
  };

  // Delete request (super admin only)
  const deleteRequest = async (requestId) => {
    try {
      const { error: deleteError } = await supabase
        .from('feedback_requests')
        .delete()
        .eq('id', requestId);

      if (deleteError) throw deleteError;

      await loadRequests();
      return { error: null };
    } catch (err) {
      console.error('Error deleting request:', err);
      return { error: err.message };
    }
  };

  // Add vote to request
  const addVote = async (requestId) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error: insertError } = await supabase.from('feedback_votes').insert({
        request_id: requestId,
        user_id: user.id,
      });

      if (insertError) throw insertError;

      // Update local state
      setUserVotes((prev) => new Set([...prev, requestId]));
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, votes: r.votes + 1 } : r)),
      );

      return { error: null };
    } catch (err) {
      console.error('Error adding vote:', err);
      return { error: err.message };
    }
  };

  // Remove vote from request
  const removeVote = async (requestId) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error: deleteError } = await supabase
        .from('feedback_votes')
        .delete()
        .eq('request_id', requestId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Update local state
      setUserVotes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, votes: Math.max(0, r.votes - 1) } : r)),
      );

      return { error: null };
    } catch (err) {
      console.error('Error removing vote:', err);
      return { error: err.message };
    }
  };

  // Load comments for a request
  const loadComments = async (requestId) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('feedback_comments')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Error loading comments:', err);
      return { data: [], error: err.message };
    }
  };

  // Add comment to request
  const addComment = async (requestId, commentText) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error: insertError } = await supabase
        .from('feedback_comments')
        .insert({
          request_id: requestId,
          user_id: user.id,
          user_email: user.email,
          comment: commentText,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Update comments count in local state
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, comments_count: r.comments_count + 1 } : r)),
      );

      return { data, error: null };
    } catch (err) {
      console.error('Error adding comment:', err);
      return { data: null, error: err.message };
    }
  };

  // Delete comment (own comments or super admin)
  const deleteComment = async (commentId, requestId) => {
    try {
      const { error: deleteError } = await supabase
        .from('feedback_comments')
        .delete()
        .eq('id', commentId);

      if (deleteError) throw deleteError;

      // Update comments count in local state
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, comments_count: Math.max(0, r.comments_count - 1) } : r,
        ),
      );

      return { error: null };
    } catch (err) {
      console.error('Error deleting comment:', err);
      return { error: err.message };
    }
  };

  // Set up real-time subscription for requests
  useEffect(() => {
    const requestsChannel = supabase
      .channel('feedback_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback_requests' }, () => {
        loadRequests();
      })
      .subscribe();

    const votesChannel = supabase
      .channel('feedback_votes_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feedback_votes' },
        (payload) => {
          // Optimistically adjust vote counts without full reload
          if (payload?.new || payload?.old) {
            setRequests((prev) => {
              const next = [...prev];
              const id = payload.new?.request_id || payload.old?.request_id;
              const idx = next.findIndex((r) => r.id === id);
              if (idx !== -1) {
                // Recompute by counting votes for that request? Simpler: trigger full reload.
                // For now just trigger reload to ensure integrity.
                loadRequests();
              }
              return next;
            });
          }
        },
      )
      .subscribe();

    const commentsChannel = supabase
      .channel('feedback_comments_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feedback_comments' },
        (payload) => {
          if (payload?.new || payload?.old) {
            const id = payload.new?.request_id || payload.old?.request_id;
            setRequests((prev) => prev.map((r) => (r.id === id ? { ...r } : r)));
            loadRequests();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(votesChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [loadRequests]);

  return {
    requests,
    loading,
    error,
    userVotes,
    currentUserId,
    loadRequests,
    createRequest,
    updateRequest,
    deleteRequest,
    addVote,
    removeVote,
    loadComments,
    addComment,
    deleteComment,
  };
}
