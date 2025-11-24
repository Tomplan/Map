import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '@mdi/react';
import {
  mdiThumbUp,
  mdiComment,
  mdiSend,
  mdiBug,
  mdiLightbulbOn,
  mdiCheckCircle,
  mdiProgressClock,
  mdiCircleOutline,
  mdiArchive,
  mdiDelete
} from '@mdi/js';
import useFeedbackRequests from '../../hooks/useFeedbackRequests';
import useUserRole from '../../hooks/useUserRole';
import Modal from '../common/Modal';
import { useDialog } from '../../contexts/DialogContext';

export default function FeedbackRequestDetail({ request, onClose, onUpdate }) {
  const { t } = useTranslation();
  const { role } = useUserRole();
  const { confirm } = useDialog();
  const isSuperAdmin = role === 'super_admin';

  const {
    userVotes,
    currentUserId,
    addVote,
    removeVote,
    loadComments,
    addComment,
    deleteComment,
    updateRequest,
  } = useFeedbackRequests();

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [posting, setPosting] = useState(false);

  // Admin edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState(request.status);
  const [editPriority, setEditPriority] = useState(request.priority || '');
  const [editVersion, setEditVersion] = useState(request.version_completed || '');
  const [saving, setSaving] = useState(false);
  // Local live counts to reflect immediate interactions
  const [localVotes, setLocalVotes] = useState(request.votes);
  const [localCommentsCount, setLocalCommentsCount] = useState(request.comments_count || 0);

  // Sync local counts if parent passes a different request (e.g., after reload)
  useEffect(() => {
    setLocalVotes(request.votes);
    setLocalCommentsCount(request.comments_count || 0);
  }, [request.id, request.votes, request.comments_count]);

  // Load comments on mount
  useEffect(() => {
    const fetchComments = async () => {
      setLoadingComments(true);
      const { data } = await loadComments(request.id);
      setComments(data || []);
      setLoadingComments(false);
    };
    fetchComments();
  }, [request.id]);

  // Handle vote toggle
  const handleVoteToggle = async () => {
    if (userVotes.has(request.id)) {
      const { error } = await removeVote(request.id);
      if (!error) setLocalVotes(v => Math.max(0, v - 1));
    } else {
      const { error } = await addVote(request.id);
      if (!error) setLocalVotes(v => v + 1);
    }
  };

  // Handle post comment
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setPosting(true);
    const { data, error } = await addComment(request.id, newComment.trim());
    
    if (!error && data) {
      setComments([...comments, data]);
      setNewComment('');
      setLocalCommentsCount(c => c + 1);
    }
    setPosting(false);
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId) => {
    const confirmed = await confirm({
      title: t('settings.feedbackRequests.detail.deleteComment'),
      message: t('common.confirmDelete'),
      confirmText: t('common.delete'),
      variant: 'danger'
    });
    if (!confirmed) return;

    const { error } = await deleteComment(commentId, request.id);
    if (!error) {
      setComments(comments.filter(c => c.id !== commentId));
      setLocalCommentsCount(c => Math.max(0, c - 1));
    }
  };

  // Handle save edits (super admin only)
  const handleSaveEdits = async () => {
    setSaving(true);
    const updates = {
      status: editStatus,
      priority: editPriority || null,
      version_completed: editVersion || null,
    };

    // Set completed_at if status is completed
    if (editStatus === 'completed' && request.status !== 'completed') {
      updates.completed_at = new Date().toISOString();
      updates.completed_by = currentUserId;
    }

    const { error, data: updated } = await updateRequest(request.id, updates);
    
    if (!error) {
      setIsEditing(false);
      if (onUpdate) onUpdate(updated);
    }
    setSaving(false);
  };

  const normalizeStatusKey = (status) => {
    if (!status) return 'open';
    const s = status.toLowerCase();
    switch (s) {
      case 'in_progress':
      case 'inprogress':
      case 'in progress':
        return 'in_progress';
      case 'completed':
        return 'completed';
      case 'archived':
        return 'archived';
      case 'open':
      default:
        return 'open';
    }
  };

  const getStatusIcon = (status) => {
    const s = normalizeStatusKey(status);
    switch (status) {
      case 'completed': return mdiCheckCircle;
      case 'in_progress': return mdiProgressClock;
      case 'archived': return mdiArchive;
      default: return mdiCircleOutline;
    }
  };

  const getStatusColor = (status) => {
    const s = normalizeStatusKey(status);
    switch (s) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'archived': return 'text-gray-400';
      default: return 'text-yellow-600';
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="lg"
      showCloseButton={false}
    >
      {/* Custom Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
              request.type === 'issue' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
            }`}>
              <Icon
                path={request.type === 'issue' ? mdiBug : mdiLightbulbOn}
                size={0.5}
                className="mr-1"
              />
              {t(`settings.feedbackRequests.types.${request.type}`)}
            </span>
          </div>

          <h2 className="text-xl font-bold text-gray-900">{request.title}</h2>

          <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
            <span>{request.user_email}</span>
            <span>{new Date(request.created_at).toLocaleDateString()}</span>
            {request.version_completed && !isEditing && (
              <span className="text-green-600 font-medium">
                v{request.version_completed}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
          {/* Description */}
          {request.description && (
            <div className="mb-6">
              <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
            </div>
          )}

          {/* Admin controls */}
          {isSuperAdmin && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-blue-900">
                  {t('settings.feedbackRequests.detail.status')}
                </h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {t('common.edit')}
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-sm text-gray-600 hover:text-gray-700"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={handleSaveEdits}
                      disabled={saving}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {saving ? t('common.saving') : t('common.save')}
                    </button>
                  </div>
                )}
              </div>

              {/* Unified Status & Priority Block */}
              {(() => { 
                const uiStatusKeyMap = { open:'open', in_progress:'inProgress', completed:'completed', archived:'archived' };
                const normalized = normalizeStatusKey(request.status);
                const translationKey = uiStatusKeyMap[normalized] || 'open';
                return (
                <div className="mt-2 space-y-4">
                  {/* Status */}
                  <div className="flex flex-col">
                    <label htmlFor="feedback-status-select" className="text-sm font-medium text-gray-700 mb-1">
                      {t('settings.feedbackRequests.detail.statusCurrent') || t('settings.feedbackRequests.detail.status') || 'Status'}
                    </label>
                    {isEditing ? (
                      <select
                        id="feedback-status-select"
                        aria-label={t('settings.feedbackRequests.detail.statusAriaEdit') || 'Edit status'}
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="open">{t('settings.feedbackRequests.statuses.open')}</option>
                        <option value="in_progress">{t('settings.feedbackRequests.statuses.inProgress')}</option>
                        <option value="completed">{t('settings.feedbackRequests.statuses.completed')}</option>
                        <option value="archived">{t('settings.feedbackRequests.statuses.archived')}</option>
                      </select>
                    ) : (
                      <span
                        role="status"
                        data-testid="feedback-status-badge"
                        aria-label={`Current status: ${t(`settings.feedbackRequests.statuses.${translationKey}`)}`}
                        className={`inline-flex items-center gap-2 px-2 py-1 rounded-md border text-sm font-medium ${getStatusColor(normalized)}`}
                      >
                        <Icon path={getStatusIcon(normalized)} size={0.8} />
                        {t(`settings.feedbackRequests.statuses.${translationKey}`)}
                      </span>
                    )}
                  </div>
                  {/* Priority */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-1">
                      {t('settings.feedbackRequests.detail.priority')}
                    </label>
                    {isEditing ? (
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        aria-label={t('settings.feedbackRequests.detail.priorityAriaEdit') || 'Edit priority'}
                      >
                        <option value="">{t('settings.feedbackRequests.priorities.none') || 'No priority'}</option>
                        <option value="low">{t('settings.feedbackRequests.priorities.low')}</option>
                        <option value="medium">{t('settings.feedbackRequests.priorities.medium')}</option>
                        <option value="high">{t('settings.feedbackRequests.priorities.high')}</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-2 px-2 py-1 rounded-md border text-sm font-medium ${
                          request.priority === 'high' ? 'border-red-300 bg-red-50 text-red-700' :
                          request.priority === 'medium' ? 'border-yellow-300 bg-yellow-50 text-yellow-700' :
                          request.priority === 'low' ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-300 bg-white text-gray-600'
                        }`}
                        data-testid="feedback-priority-badge"
                        role="status"
                        aria-label={`Current priority: ${request.priority ? t(`settings.feedbackRequests.priorities.${request.priority}`) : (t('settings.feedbackRequests.priorities.none') || 'No priority')}`}
                      >
                        {request.priority
                          ? t(`settings.feedbackRequests.priorities.${request.priority}`)
                          : (t('settings.feedbackRequests.priorities.none') || 'No priority')}
                      </span>
                    )}
                  </div>
                  {/* Version (edit only) */}
                  {isEditing && (
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-1">
                        {t('settings.feedbackRequests.detail.version')}
                      </label>
                      <input
                        type="text"
                        value={editVersion}
                        onChange={(e) => setEditVersion(e.target.value)}
                        placeholder="e.g., 1.2.0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  )}
                </div>
              ); })()}
            </div>
          )}

          {/* Vote & counts */}
          <div className="mb-6">
            <button
              onClick={handleVoteToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                userVotes.has(request.id)
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon path={mdiThumbUp} size={0.8} />
              <span className="font-medium">
                {userVotes.has(request.id) ? t('common.voted') : t('common.vote')}
              </span>
              <span className="text-sm" aria-label={`Total votes: ${localVotes}`}>({localVotes})</span>
            </button>
          </div>

          {/* Comments */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Icon path={mdiComment} size={0.8} />
              {t('settings.feedbackRequests.detail.comments')} ({localCommentsCount})
            </h3>

            {loadingComments ? (
              <div className="text-center py-4 text-gray-500">
                {t('common.loading')}
              </div>
            ) : comments.length === 0 ? (
              <p className="text-gray-500 text-sm mb-4">
                {t('settings.feedbackRequests.detail.noComments')}
              </p>
            ) : (
              <div className="space-y-3 mb-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{comment.user_email}</span>
                        <span className="text-gray-500 ml-2">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {(comment.user_id === currentUserId || isSuperAdmin) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Icon path={mdiDelete} size={0.6} />
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add comment form */}
            <form onSubmit={handlePostComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('settings.feedbackRequests.detail.addComment')}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={posting || !newComment.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Icon path={mdiSend} size={0.7} />
                {t('settings.feedbackRequests.detail.postComment')}
              </button>
            </form>
          </div>
        </div>
      </Modal>
  );
}
