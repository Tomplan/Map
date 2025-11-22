import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import Icon from '@mdi/react';
import {
  mdiClose,
  mdiMagnify,
  mdiLightbulbOnOutline,
  mdiNewBox,
  mdiBookOpenPageVariant,
  mdiChevronRight
} from '@mdi/js';
import { getHelpContentByRoute } from '../config/helpContentBilingual';
import { getRecentChanges } from '../config/whatsNewBilingual';
import useUserRole from '../hooks/useUserRole';

/**
 * HelpPanel Component
 * 
 * Collapsible help panel with tabs for:
 * - Current page help
 * - What's New
 * - Quick Start
 * - Search
 * 
 * @param {boolean} isOpen - Panel visibility
 * @param {function} onClose - Close callback
 */
export default function HelpPanel({ isOpen, onClose }) {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { role } = useUserRole();
  const [activeTab, setActiveTab] = useState('current');
  const [searchQuery, setSearchQuery] = useState('');

  // Get help content for current page in current language
  const currentPageHelp = getHelpContentByRoute(location.pathname, i18n.language);
  const recentChanges = getRecentChanges(5, i18n.language);

  // Change type styling
  const getChangeTypeBadge = (type) => {
    const styles = {
      feature: 'bg-green-100 text-green-800',
      fix: 'bg-red-100 text-red-800',
      improvement: 'bg-blue-100 text-blue-800'
    };
    return styles[type] || styles.improvement;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div 
        className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-[9999] flex flex-col"
        role="dialog"
        aria-label="Help Panel"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center gap-2">
            <Icon path={mdiBookOpenPageVariant} size={1.2} className="text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">{t('helpPanel.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            aria-label={t('helpPanel.closeHelp')}
          >
            <Icon path={mdiClose} size={1} className="text-gray-600" />
          </button>
        </div>

        {/* Role Badge */}
        {role && (
          <div className="px-6 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-sm text-gray-600">
              {t('helpPanel.yourRole')} <span className="font-semibold text-blue-600">{t(`helpPanel.roles.${role}`, role)}</span>
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 bg-white">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-4 py-3 font-medium text-sm transition-colors relative ${
              activeTab === 'current'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {t('helpPanel.tabs.currentPage')}
          </button>
          <button
            onClick={() => setActiveTab('whats-new')}
            className={`px-4 py-3 font-medium text-sm transition-colors relative ${
              activeTab === 'whats-new'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {t('helpPanel.tabs.whatsNew')}
          </button>
          <button
            onClick={() => setActiveTab('quick-start')}
            className={`px-4 py-3 font-medium text-sm transition-colors relative ${
              activeTab === 'quick-start'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {t('helpPanel.tabs.quickStart')}
          </button>
        </div>

        {/* Search Bar */}
        {activeTab === 'current' && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="relative">
              <Icon 
                path={mdiMagnify} 
                size={0.8} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder={t('helpPanel.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Current Page Tab */}
          {activeTab === 'current' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {currentPageHelp.title}
                </h3>
                <p className="text-xs text-gray-500">
                  {t('helpPanel.lastUpdated')} {currentPageHelp.updated}
                </p>
              </div>

              <div className="prose prose-sm max-w-none text-gray-700 text-left">
                <ReactMarkdown
                  components={{
                    // Style headings
                    h1: ({node, ...props}) => <h1 className="text-xl font-bold text-gray-900 mt-4 mb-2 text-left" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-lg font-bold text-gray-900 mt-4 mb-2 text-left" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-base font-bold text-gray-900 mt-3 mb-2 text-left" {...props} />,
                    h4: ({node, ...props}) => <h4 className="text-sm font-semibold text-gray-900 mt-3 mb-2 text-left" {...props} />,
                    // Style paragraphs
                    p: ({node, ...props}) => <p className="text-gray-700 leading-relaxed mb-4 text-left" {...props} />,
                    // Style lists
                    ul: ({node, ...props}) => <ul className="list-disc list-outside mb-4 space-y-2 text-left ml-5" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-outside mb-4 space-y-2 text-left ml-5" {...props} />,
                    li: ({node, ...props}) => <li className="text-gray-700 text-left pl-2" {...props} />,
                    // Style code
                    code: ({node, ...props}) => <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800" {...props} />,
                    // Style links
                    a: ({node, ...props}) => <a className="text-blue-600 hover:text-blue-800 underline" {...props} />,
                  }}
                >
                  {currentPageHelp.content}
                </ReactMarkdown>
              </div>

              {/* Tips Section */}
              {currentPageHelp.tips && currentPageHelp.tips.length > 0 && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                  <div className="flex items-start gap-2">
                    <Icon path={mdiLightbulbOnOutline} size={0.9} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-900 mb-2">{t('helpPanel.quickTips')}</h4>
                      <ul className="space-y-1">
                        {currentPageHelp.tips.map((tip, idx) => (
                          <li key={idx} className="text-sm text-amber-800 flex items-start gap-2">
                            <Icon path={mdiChevronRight} size={0.6} className="flex-shrink-0 mt-0.5" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* What's New Tab */}
          {activeTab === 'whats-new' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('helpPanel.whatsNewTitle')}</h3>
                <p className="text-sm text-gray-600">{t('helpPanel.whatsNewSubtitle')}</p>
              </div>

              <div className="space-y-4">
                {recentChanges.map((item, idx) => (
                  <div key={idx} className="border-l-4 border-blue-400 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon path={mdiNewBox} size={0.7} className="text-blue-600" />
                      <span className="text-sm font-semibold text-gray-700">
                        {new Date(item.date).toLocaleDateString(i18n.language === 'nl' ? 'nl-NL' : 'en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {item.changes.map((change, changeIdx) => (
                        <li key={changeIdx} className="flex items-start gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getChangeTypeBadge(change.type)}`}>
                            {t(`helpPanel.changeTypes.${change.type}`, change.type)}
                          </span>
                          <span className="text-sm text-gray-700 flex-1">{change.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Start Tab */}
          {activeTab === 'quick-start' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('helpPanel.quickStartTitle')}</h3>
                <p className="text-sm text-gray-600">{t('helpPanel.quickStartSubtitle')}</p>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">{t('helpPanel.steps.step1Title')}</h4>
                  <p className="text-sm text-blue-800">
                    {t('helpPanel.steps.step1Text', { role: t(`helpPanel.roles.${role}`, t('helpPanel.roles.unknown')) })}
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">{t('helpPanel.steps.step2Title')}</h4>
                  <p className="text-sm text-green-800">
                    {t('helpPanel.steps.step2Text')}
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">{t('helpPanel.steps.step3Title')}</h4>
                  <p className="text-sm text-purple-800">
                    {t('helpPanel.steps.step3Text')}
                  </p>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-2">{t('helpPanel.steps.step4Title')}</h4>
                  <ul className="text-sm text-orange-800 space-y-1 ml-4 list-disc">
                    <li>{t('helpPanel.steps.step4Item1')}</li>
                    <li>{t('helpPanel.steps.step4Item2')}</li>
                    <li>{t('helpPanel.steps.step4Item3')}</li>
                    <li>{t('helpPanel.steps.step4Item4')}</li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{t('helpPanel.steps.step5Title')}</h4>
                  <p className="text-sm text-gray-700">
                    {t('helpPanel.steps.step5Text')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            {t('helpPanel.footer')}
          </p>
        </div>
      </div>
    </>
  );
}

HelpPanel.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
