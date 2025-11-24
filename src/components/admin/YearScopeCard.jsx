import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import YearScopeBadge from './YearScopeBadge';

export default function YearScopeCard({ selectedYear, setSelectedYear, counts = {}, onPreview }) {
  const { t } = useTranslation();
  const [localYear, setLocalYear] = useState(selectedYear || new Date().getFullYear());

  useEffect(() => setLocalYear(selectedYear), [selectedYear]);

  const yearOptions = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i));

  return (
    <section className="bg-white rounded-lg shadow p-4 mb-6" aria-labelledby="year-scope-title">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 id="year-scope-title" className="text-lg font-semibold text-gray-900">{t('admin.yearScope.title')}</h3>
          <div><YearScopeBadge scope="year" /></div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="year-scope-select" className="text-sm text-gray-600 mr-2">{t('admin.yearScope.viewingYear')}</label>
          <select
            value={localYear}
            id="year-scope-select"
            onChange={(e) => {
              const y = parseInt(e.target.value, 10);
              setLocalYear(y);
              // Call out if upstream handler is present
              if (typeof setSelectedYear === 'function') setSelectedYear(y);
            }}
            className="px-3 py-2 border rounded-lg text-sm"
            aria-label={t('admin.yearScope.viewingYear')}
          >
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href="/admin/subscriptions" className="p-3 border rounded-lg hover:bg-blue-50 transition-colors" aria-label={`${t('admin.yearScope.subscriptions')} ${counts.subscriptions ?? '-'}`}>
          <div className="text-sm text-gray-500">{t('admin.yearScope.subscriptions')}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{counts.subscriptions ?? '-'}</div>
        </a>

        <a href="/admin/assignments" className="p-3 border rounded-lg hover:bg-blue-50 transition-colors" aria-label={`${t('admin.yearScope.assignments')} ${counts.assignments ?? '-'}`}>
          <div className="text-sm text-gray-500">{t('admin.yearScope.assignments')}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{counts.assignments ?? '-'}</div>
        </a>

        <a href="/admin/program" className="p-3 border rounded-lg hover:bg-blue-50 transition-colors" aria-label={`${t('admin.yearScope.program')} ${counts.program ?? '-'}`}>
          <div className="text-sm text-gray-500">{t('admin.yearScope.program')}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{counts.program ?? '-'}</div>
        </a>
      </div>

      {onPreview && (
        <div className="mt-4 text-sm text-gray-600 flex items-center justify-end">
          <button id="year-scope-preview" onClick={onPreview} className="px-3 py-1.5 bg-white border rounded hover:bg-gray-50" aria-controls="year-change-preview">{t('admin.yearScope.preview')}</button>
        </div>
      )}
    </section>
  );
}
