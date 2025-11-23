import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useFeedbackRequests from '../../hooks/useFeedbackRequests';
import useUserRole from '../../hooks/useUserRole';
import FeedbackRequestDetail from './FeedbackRequestDetail';
import { 
  mdiBug, 
  mdiLightbulbOn, 
  mdiThumbUp, 
  mdiComment,
  mdiFilterVariant,
  mdiPlus,
  mdiCheckCircle,
  mdiProgressClock,
  mdiCircleOutline,
  mdiArchive
} from '@mdi/js';
import Icon from '@mdi/react';

export default function FeedbackRequests() {
  const { t } = useTranslation();
  const { role } = useUserRole();
  const isSuperAdmin = role === 'super_admin';

  const {
    requests,
    loading,
    error,
    userVotes,
    currentUserId,
    loadRequests,
    createRequest,
    updateRequest,
    addVote,
    removeVote,
  } = useFeedbackRequests();

  const [activeTab, setActiveTab] = useState('all'); // all, my, submit
  const [filterType, setFilterType] = useState(''); // '', 'issue', 'feature'
  const [filterStatus, setFilterStatus] = useState(''); // '', 'open', 'in_progress', 'completed', 'archived'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Form state for new request
  const [newRequestType, setNewRequestType] = useState('feature');
  const [newRequestTitle, setNewRequestTitle] = useState('');
  const [newRequestDescription, setNewRequestDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load requests on mount and when filters change
  useEffect(() => {
    const filters = {};
    if (filterType) filters.type = filterType;
    if (filterStatus) filters.status = filterStatus;
    if (activeTab === 'my' && currentUserId) filters.userId = currentUserId;
    
    loadRequests(filters);
  }, [filterType, filterStatus, activeTab, currentUserId, loadRequests]);

  // Filter requests by search query
  const filteredRequests = requests.filter(req => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      req.title.toLowerCase().includes(query) ||
      req.description?.toLowerCase().includes(query) ||
      req.user_email.toLowerCase().includes(query)
    );
  });

  // Handle vote toggle
  const handleVoteToggle = async (requestId) => {
    if (userVotes.has(requestId)) {
      await removeVote(requestId);
    } else {
      await addVote(requestId);
    }
  };

  // Handle submit new request
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!newRequestTitle.trim()) return;

    setSubmitting(true);
    const { error: submitError } = await createRequest({
      type: newRequestType,
      title: newRequestTitle.trim(),
      description: newRequestDescription.trim(),
    });

    if (!submitError) {
      setNewRequestTitle('');
      setNewRequestDescription('');
      setActiveTab('all');
    }
    setSubmitting(false);
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return mdiCheckCircle;
      case 'in_progress': return mdiProgressClock;
      case 'archived': return mdiArchive;
      default: return mdiCircleOutline;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'archived': return 'text-gray-400';
      default: return 'text-yellow-600';
    }
  };

  // Normalize status -> translation key segment
  const statusTranslationKey = (status) => {
    if (!status) return 'open';
    const s = status.toLowerCase();
    if (s === 'in_progress' || s === 'inprogress' || s === 'in progress') return 'inProgress';
    if (s === 'completed') return 'completed';
    if (s === 'archived') return 'archived';
    return 'open';
  };

  // Get type badge color
  const getTypeBadgeColor = (type) => {
    return type === 'issue' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {t('settings.feedbackRequests.title')}
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          {t('settings.feedbackRequests.description')}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('settings.feedbackRequests.tabs.all')}
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('settings.feedbackRequests.tabs.myRequests')}
          </button>
          <button
            onClick={() => setActiveTab('submit')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'submit'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Icon path={mdiPlus} size={0.7} className="inline mr-1" />
            {t('settings.feedbackRequests.tabs.submit')}
          </button>
        </nav>
      </div>

      {/* Filters (only show on list tabs) */}
      {(activeTab === 'all' || activeTab === 'my') && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Icon path={mdiFilterVariant} size={0.8} />
            <span className="font-medium">{t('settings.feedbackRequests.filters.title')}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <input
              type="text"
              placeholder={t('settings.feedbackRequests.filters.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Type filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('settings.feedbackRequests.filters.allTypes')}</option>
              <option value="issue">{t('settings.feedbackRequests.types.issue')}</option>
              <option value="feature">{t('settings.feedbackRequests.types.feature')}</option>
            </select>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('settings.feedbackRequests.filters.allStatuses')}</option>
              <option value="open">{t('settings.feedbackRequests.statuses.open')}</option>
              <option value="in_progress">{t('settings.feedbackRequests.statuses.inProgress')}</option>
              <option value="completed">{t('settings.feedbackRequests.statuses.completed')}</option>
              <option value="archived">{t('settings.feedbackRequests.statuses.archived')}</option>
            </select>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'submit' ? (
        /* Submit Form */
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            {t('settings.feedbackRequests.submit.title')}
          </h3>
          
          <form onSubmit={handleSubmitRequest} className="space-y-4">
            {/* Type selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.feedbackRequests.submit.type')}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="feature"
                    checked={newRequestType === 'feature'}
                    onChange={(e) => setNewRequestType(e.target.value)}
                    className="mr-2"
                  />
                  <Icon path={mdiLightbulbOn} size={0.8} className="mr-1 text-blue-600" />
                  {t('settings.feedbackRequests.types.feature')}
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="issue"
                    checked={newRequestType === 'issue'}
                    onChange={(e) => setNewRequestType(e.target.value)}
                    className="mr-2"
                  />
                  <Icon path={mdiBug} size={0.8} className="mr-1 text-red-600" />
                  {t('settings.feedbackRequests.types.issue')}
                </label>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.feedbackRequests.submit.title')} *
              </label>
              <input
                type="text"
                value={newRequestTitle}
                onChange={(e) => setNewRequestTitle(e.target.value)}
                placeholder={t('settings.feedbackRequests.submit.titlePlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.feedbackRequests.submit.description')}
              </label>
              <textarea
                value={newRequestDescription}
                onChange={(e) => setNewRequestDescription(e.target.value)}
                placeholder={t('settings.feedbackRequests.submit.descriptionPlaceholder')}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Duplicate check hint */}
            {newRequestTitle && (
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                💡 {t('settings.feedbackRequests.submit.duplicateHint')}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting || !newRequestTitle.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t('common.saving') : t('settings.feedbackRequests.submit.button')}
            </button>
          </form>
        </div>
      ) : (
        /* Request List */
        <div className="space-y-3">
          {error && (
            <div className="bg-red-50 text-red-800 p-4 rounded-lg">
              {error}
            </div>
          )}

          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {t('settings.feedbackRequests.noRequests')}
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedRequest(request)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Type badge and status */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTypeBadgeColor(request.type)}`}>
                        <Icon 
                          path={request.type === 'issue' ? mdiBug : mdiLightbulbOn} 
                          size={0.5} 
                          className="mr-1"
                        />
                        {t(`settings.feedbackRequests.types.${request.type}`)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-sm ${getStatusColor(request.status)}`}
                        role="status"
                        data-testid="feedback-status-list-badge"
                        aria-label={`Status: ${t(`settings.feedbackRequests.statuses.${statusTranslationKey(request.status)}`)}`}
                      >
                        <Icon path={getStatusIcon(request.status)} size={0.6} />
                        {t(`settings.feedbackRequests.statuses.${statusTranslationKey(request.status)}`)}
                      </span>
                      {request.priority && isSuperAdmin && (
                        <span className="text-xs text-gray-500">
                          {t(`settings.feedbackRequests.priorities.${request.priority}`)}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {request.title}
                    </h3>

                    {/* Description preview */}
                    {request.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {request.description}
                      </p>
                    )}

                    {/* Meta info */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{request.user_email}</span>
                      <span>{new Date(request.created_at).toLocaleDateString()}</span>
                      {request.version_completed && (
                        <span className="text-green-600 font-medium">
                          v{request.version_completed}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Votes and comments */}
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVoteToggle(request.id);
                      }}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full border ${
                        userVotes.has(request.id)
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon path={mdiThumbUp} size={0.6} />
                      <span className="font-medium">{request.votes}</span>
                    </button>
                    
                    <div className="flex items-center gap-1 text-gray-600">
                      <Icon path={mdiComment} size={0.6} />
                      <span className="text-sm">{request.comments_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Request detail modal */}
      {selectedRequest && (
        <FeedbackRequestDetail
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdate={(updated) => {
            // Optimistically merge updated record into local list
            if (updated) {
              // Create shallow copy with merged values
              const idx = requests.findIndex(r => r.id === updated.id);
              if (idx !== -1) {
                requests[idx] = { ...requests[idx], ...updated };
              }
            }
            setSelectedRequest(null);
            // Background refresh to ensure consistency
            loadRequests();
          }}
        />
      )}
    </div>
  );
}
