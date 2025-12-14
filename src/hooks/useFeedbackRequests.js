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
      try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
        // console.debug('[useFeedbackRequests] getUser result', user);
      } catch (err) {
        console.error('[useFeedbackRequests] getUser error', err);
        setCurrentUserId(null);
      }
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
  const createRequest = useCallback(
    async (requestData) => {
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
    },
    [loadRequests],
  );

  // Update request (super admin can update status, priority, version; users can update own title/description)
  const updateRequest = useCallback(
    async (requestId, updates) => {
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
    },
    [loadRequests],
  );

  // Delete request (super admin only)
  const deleteRequest = useCallback(
    async (requestId) => {
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
    },
    [loadRequests],
  );

  // Add vote to request
  const addVote = useCallback(
    async (requestId) => {
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
    },
    [setUserVotes],
  );

  // Remove vote from request
  const removeVote = useCallback(
    async (requestId) => {
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
    },
    [setUserVotes],
  );

  // Load comments for a request
  const loadComments = useCallback(async (requestId) => {
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
  }, []);

  // Add comment to request
  const addComment = useCallback(async (requestId, commentText) => {
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
  }, []);

  // Delete comment (own comments or super admin)
  const deleteComment = useCallback(async (commentId, requestId) => {
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
  }, []);

  // Set up real-time subscription for requests (only when online)
  useEffect(() => {
    let requestsChannel = null;
    let votesChannel = null;
    let commentsChannel = null;

    if (typeof navigator !== 'undefined' ? navigator.onLine : true) {
      requestsChannel = supabase
        .channel('feedback_requests_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'feedback_requests' },
          (payload) => {
            // Apply targeted changes to local requests array instead of triggering a full reload.
            if (!payload) return;
            setRequests((prev) => {
              const next = [...prev];
              const newRow = payload.new;
              const oldRow = payload.old;
              const id = newRow?.id || oldRow?.id;
              const idx = next.findIndex((r) => r.id === id);

              if (newRow && !oldRow) {
                // INSERT
                return [newRow, ...next];
              }

              if (newRow && oldRow) {
                // UPDATE
                if (idx !== -1) next[idx] = { ...next[idx], ...newRow };
                return next;
              }

              if (oldRow && !newRow) {
                // DELETE
                return next.filter((r) => r.id !== oldRow.id);
              }

              return next;
            });
          },
        )
        .subscribe();

      votesChannel = supabase
        .channel('feedback_votes_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'feedback_votes' },
          (payload) => {
            if (!payload) return;
            const newRow = payload.new;
            const oldRow = payload.old;
            const id = newRow?.request_id || oldRow?.request_id;
            if (!id) return;

            setRequests((prev) =>
              prev.map((r) => {
                if (r.id !== id) return r;
                if (newRow && !oldRow) {
                  // INSERT -> increment
                  return { ...r, votes: (r.votes || 0) + 1 };
                }
                if (!newRow && oldRow) {
                  // DELETE -> decrement
                  return { ...r, votes: Math.max(0, (r.votes || 0) - 1) };
                }
                // UPDATE or unknown -> return as-is
                return r;
              }),
            );
          },
        )
        .subscribe();

      commentsChannel = supabase
        .channel('feedback_comments_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'feedback_comments' },
          (payload) => {
            if (!payload) return;
            const newRow = payload.new;
            const oldRow = payload.old;
            const id = newRow?.request_id || oldRow?.request_id;
            if (!id) return;

            setRequests((prev) =>
              prev.map((r) => {
                if (r.id !== id) return r;
                if (newRow && !oldRow) {
                  // INSERT comment -> increment comments_count
                  return { ...r, comments_count: (r.comments_count || 0) + 1 };
                }
                if (!newRow && oldRow) {
                  // DELETE comment -> decrement
                  return { ...r, comments_count: Math.max(0, (r.comments_count || 0) - 1) };
                }
                return r;
              }),
            );
          },
        )
        .subscribe();
    }

    return () => {
      if (requestsChannel) supabase.removeChannel(requestsChannel);
      if (votesChannel) supabase.removeChannel(votesChannel);
      if (commentsChannel) supabase.removeChannel(commentsChannel);
    };
  }, [loadRequests]);

  // Initial load on mount
  useEffect(() => {
    console.debug('[useFeedbackRequests] initial load effect running');
    loadRequests();
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
