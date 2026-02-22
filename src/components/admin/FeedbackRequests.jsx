import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import useFeedbackRequests from '../../hooks/useFeedbackRequests';
import useUserRole from '../../hooks/useUserRole';
import useUserPreferences from '../../hooks/useUserPreferences';
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
  mdiArchive,
} from '@mdi/js';
import Icon from '@mdi/react';

export default function FeedbackRequests() {
  const { t } = useTranslation();
  const { role } = useUserRole();
  const isSuperAdmin = role === 'super_admin';

  // TEMPORARILY DISABLED - debugging infinite loop
  // const { preferences, loading: preferencesLoading, updatePreference } = useUserPreferences();
  const preferences = null;
  const preferencesLoading = false;
  const updatePreference = useCallback(() => {}, []);

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

  // Initialize state with defaults, then update from preferences when loaded
  const [activeTab, setActiveTab] = useState('all');
  const [filterTypes, setFilterTypes] = useState([]);
  const [filterStatuses, setFilterStatuses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const typeDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

  const [hasInitializedFromPreferences, setHasInitializedFromPreferences] = useState(false);

  // TEMPORARILY DISABLED - debugging infinite loop
  // Always sync local state with preferences after real-time updates
  // useEffect(() => {
  //   if (preferences && !preferencesLoading) {
  //     setActiveTab(preferences.feedback_active_tab || 'all');
  //     setFilterTypes(preferences.feedback_filter_types || []);
  //     setFilterStatuses(preferences.feedback_filter_statuses || []);
  //     setHasInitializedFromPreferences(true);
  //     console.log('FeedbackRequests: Preferences loaded and applied (sync)');
  //   }
  // }, [preferences, preferencesLoading]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
        setShowTypeDropdown(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Form state for new request
  const [newRequestType, setNewRequestType] = useState('feature');
  const [newRequestTitle, setNewRequestTitle] = useState('');
  const [newRequestDescription, setNewRequestDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load requests on mount and when filters change
  useEffect(() => {
    const filters = {};
    // Remove type and status filters from server-side filtering - we'll filter client-side for multiple selections
    if (activeTab === 'my' && currentUserId) filters.userId = currentUserId;

    // Explicitly request the current data set whenever the relevant inputs change
    loadRequests(filters);
  }, [activeTab, currentUserId, loadRequests]);

  // Save preferences when they change (only after preferences are loaded)
  useEffect(() => {
    if (
      preferences &&
      !preferencesLoading &&
      hasInitializedFromPreferences &&
      activeTab !== preferences.feedback_active_tab
    ) {
      console.log('FeedbackRequests: Saving activeTab', activeTab);
      const timer = setTimeout(() => {
        updatePreference('feedback_active_tab', activeTab);
        console.log('FeedbackRequests: activeTab saved');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeTab, preferences, preferencesLoading, hasInitializedFromPreferences, updatePreference]);

  useEffect(() => {
    if (
      preferences &&
      !preferencesLoading &&
      hasInitializedFromPreferences &&
      JSON.stringify(filterTypes) !== JSON.stringify(preferences.feedback_filter_types)
    ) {
      console.log('FeedbackRequests: Saving filterTypes', filterTypes);
      const timer = setTimeout(() => {
        updatePreference('feedback_filter_types', filterTypes);
        console.log('FeedbackRequests: filterTypes saved');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [
    filterTypes,
    preferences,
    preferencesLoading,
    hasInitializedFromPreferences,
    updatePreference,
  ]);

  useEffect(() => {
    if (
      preferences &&
      !preferencesLoading &&
      hasInitializedFromPreferences &&
      JSON.stringify(filterStatuses) !== JSON.stringify(preferences.feedback_filter_statuses)
    ) {
      console.log('FeedbackRequests: Saving filterStatuses', filterStatuses);
      const timer = setTimeout(() => {
        updatePreference('feedback_filter_statuses', filterStatuses);
        console.log('FeedbackRequests: filterStatuses saved');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [
    filterStatuses,
    preferences,
    preferencesLoading,
    hasInitializedFromPreferences,
    updatePreference,
  ]);

  // Filter requests by search query, type, and status
  const filteredRequests = requests.filter((req) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        req.title.toLowerCase().includes(query) ||
        req.description?.toLowerCase().includes(query) ||
        req.user_email.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Type filter - if types are selected, only show requests with those types
    if (filterTypes.length > 0) {
      if (!filterTypes.includes(req.type)) return false;
    }

    // Status filter - if statuses are selected, only show requests with those statuses
    if (filterStatuses.length > 0) {
      const requestStatus = req.status || 'open';
      if (!filterStatuses.includes(requestStatus)) return false;
    }

    return true;
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
      case 'completed':
        return mdiCheckCircle;
      case 'in_progress':
        return mdiProgressClock;
      case 'archived':
        return mdiArchive;
      default:
        return mdiCircleOutline;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      case 'archived':
        return 'text-gray-400';
      default:
        return 'text-yellow-600';
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
    <div className="space-y-6" data-testid="feedback-requests-container">
      {/* Header */}
      <div data-testid="feedback-header">
        <h2 className="text-2xl font-bold text-gray-900">{t('settings.feedbackRequests.title')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('settings.feedbackRequests.description')}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200" data-testid="feedback-tabs">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            data-testid="feedback-tab-all"
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
            data-testid="feedback-tab-my"
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
            data-testid="feedback-tab-submit"
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
        <div className="bg-gray-50 p-4 rounded-lg space-y-4" data-testid="feedback-filters">
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
              data-testid="feedback-search"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Type filter - Multi-select with checkboxes */}
            <div className="relative" ref={typeDropdownRef} data-testid="feedback-type-filter">
              <button
                type="button"
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left flex items-center justify-between"
              >
                <span className="text-sm text-gray-900">
                  {filterTypes.length === 0
                    ? t('settings.feedbackRequests.filters.allTypes')
                    : filterTypes.length === 1
                      ? t(`settings.feedbackRequests.types.${filterTypes[0]}`)
                      : `${filterTypes.length} ${t('settings.feedbackRequests.filters.selectedTypes') || 'selected types'}`}
                </span>
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showTypeDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                  <div className="p-2 space-y-1">
                    {/* All types option */}
                    <label className="flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterTypes.length === 0}
                        onChange={() => setFilterTypes([])}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-900">
                        {t('settings.feedbackRequests.filters.allTypes')}
                      </span>
                    </label>

                    {/* Individual type options */}
                    {['issue', 'feature'].map((type) => (
                      <label
                        key={type}
                        className="flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filterTypes.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilterTypes([...filterTypes, type]);
                            } else {
                              setFilterTypes(filterTypes.filter((t) => t !== type));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-900">
                          {t(`settings.feedbackRequests.types.${type}`)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status filter - Multi-select with checkboxes */}
            <div className="relative" ref={statusDropdownRef} data-testid="feedback-status-filter">
              <button
                type="button"
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left flex items-center justify-between"
              >
                <span className="text-sm text-gray-900">
                  {filterStatuses.length === 0
                    ? t('settings.feedbackRequests.filters.allStatuses')
                    : filterStatuses.length === 1
                      ? t(
                          `settings.feedbackRequests.statuses.${statusTranslationKey(filterStatuses[0])}`,
                        )
                      : `${filterStatuses.length} ${t('settings.feedbackRequests.filters.selectedStatuses')}`}
                </span>
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showStatusDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                  <div className="p-2 space-y-1">
                    {/* All statuses option */}
                    <label className="flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterStatuses.length === 0}
                        onChange={() => setFilterStatuses([])}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-900">
                        {t('settings.feedbackRequests.filters.allStatuses')}
                      </span>
                    </label>

                    {/* Individual status options */}
                    {['open', 'in_progress', 'completed', 'archived'].map((status) => (
                      <label
                        key={status}
                        className="flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filterStatuses.includes(status)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilterStatuses([...filterStatuses, status]);
                            } else {
                              setFilterStatuses(filterStatuses.filter((s) => s !== status));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-900">
                          {t(`settings.feedbackRequests.statuses.${statusTranslationKey(status)}`)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'submit' ? (
        /* Submit Form */
        <div
          className="bg-white border border-gray-200 rounded-lg p-6"
          data-testid="feedback-submit-form"
        >
          <h3 className="text-lg font-semibold mb-4">
            {t('settings.feedbackRequests.submit.title')}
          </h3>

          <form onSubmit={handleSubmitRequest} className="space-y-4">
            {/* Type selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('settings.feedbackRequests.submit.type')}
              </label>
              <div className="flex gap-4" data-testid="feedback-submit-type">
                <label className="flex items-center" data-testid="feedback-type-feature">
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
                <label className="flex items-center" data-testid="feedback-type-issue">
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
                data-testid="feedback-submit-title"
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
                data-testid="feedback-submit-description"
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
              data-testid="feedback-submit-button"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t('common.saving') : t('settings.feedbackRequests.submit.button')}
            </button>
          </form>
        </div>
      ) : (
        /* Request List */
        <div className="space-y-3" data-testid="feedback-requests-list">
          {error && <div className="bg-red-50 text-red-800 p-4 rounded-lg">{error}</div>}

          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {t('settings.feedbackRequests.noRequests')}
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div
                key={request.id}
                data-testid={`feedback-request-${request.id}`}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={(e) => {
                  // Avoid immediate backdrop click on modal which can close it in the
                  // same event loop when the modal is mounted synchronously.
                  // Delay opening to next tick so the original click doesn't
                  // inadvertently target the new overlay/backdrop.
                  e.preventDefault();
                  e.stopPropagation();
                  // (click handling) schedule modal opening on next tick
                  setTimeout(() => {
                    setSelectedRequest(request);
                  }, 0);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Type badge and status */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTypeBadgeColor(request.type)}`}
                      >
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
                        {t(
                          `settings.feedbackRequests.statuses.${statusTranslationKey(request.status)}`,
                        )}
                      </span>
                      {request.priority && isSuperAdmin && (
                        <span className="text-xs text-gray-500">
                          {t(`settings.feedbackRequests.priorities.${request.priority}`)}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{request.title}</h3>

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
                      data-testid="feedback-vote-button"
                      className={`flex items-center gap-1 px-3 py-1 rounded-full border ${
                        userVotes.has(request.id)
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon path={mdiThumbUp} size={0.6} />
                      <span className="font-medium">{request.votes}</span>
                    </button>

                    <div
                      className="flex items-center gap-1 text-gray-600"
                      data-testid="feedback-comments-count"
                    >
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
            // Close modal and refresh requests from server
            // Note: We don't optimistically update to avoid mutation issues
            setSelectedRequest(null);
            // Background refresh to get latest data
            loadRequests();
          }}
        />
      )}
    </div>
  );
}
