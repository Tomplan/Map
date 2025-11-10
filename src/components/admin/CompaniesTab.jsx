import { useState } from 'react';
import useCompanies from '../../hooks/useCompanies';
import Icon from '@mdi/react';
import { mdiPlus, mdiPencil, mdiDelete, mdiCheck, mdiClose, mdiMagnify } from '@mdi/js';
import { getLogoPath } from '../../utils/getLogoPath';

/**
 * CompaniesTab - Manage permanent company list
 * Companies are reusable across years
 */
export default function CompaniesTab() {
  const { companies, loading, error, createCompany, updateCompany, deleteCompany, searchCompanies } = useCompanies();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [newCompanyForm, setNewCompanyForm] = useState({ name: '', logo: '', website: '', info: '' });

  // Filter companies based on search
  const filteredCompanies = searchTerm ? searchCompanies(searchTerm) : companies;

  // Start editing a company
  const handleEdit = (company) => {
    setEditingId(company.id);
    setEditForm({ ...company });
  };

  // Save edited company
  const handleSave = async (id) => {
    const { error } = await updateCompany(id, editForm);
    if (!error) {
      setEditingId(null);
      setEditForm({});
    } else {
      alert(`Error updating company: ${error}`);
    }
  };

  // Cancel edit
  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Delete company
  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all assignments for this company.`)) {
      return;
    }
    const { error } = await deleteCompany(id);
    if (error) {
      alert(`Error deleting company: ${error}`);
    }
  };

  // Create new company
  const handleCreate = async () => {
    if (!newCompanyForm.name.trim()) {
      alert('Company name is required');
      return;
    }

    const { error } = await createCompany(newCompanyForm);
    if (!error) {
      setIsCreating(false);
      setNewCompanyForm({ name: '', logo: '', website: '', info: '' });
    } else {
      alert(`Error creating company: ${error}`);
    }
  };

  if (loading) {
    return <div className="p-4">Loading companies...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      {/* Header with search and add button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon path={mdiMagnify} size={1} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
          <span className="text-sm text-gray-600">
            {filteredCompanies.length} of {companies.length} companies
          </span>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Icon path={mdiPlus} size={0.8} />
          Add Company
        </button>
      </div>

      {/* Create new company form */}
      {isCreating && (
        <div className="mb-4 p-4 border rounded-lg bg-blue-50">
          <h3 className="font-bold mb-3">New Company</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Company Name *"
              value={newCompanyForm.name}
              onChange={(e) => setNewCompanyForm({ ...newCompanyForm, name: e.target.value })}
              className="px-3 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="Logo URL"
              value={newCompanyForm.logo}
              onChange={(e) => setNewCompanyForm({ ...newCompanyForm, logo: e.target.value })}
              className="px-3 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="Website URL"
              value={newCompanyForm.website}
              onChange={(e) => setNewCompanyForm({ ...newCompanyForm, website: e.target.value })}
              className="px-3 py-2 border rounded"
            />
            <textarea
              placeholder="Info"
              value={newCompanyForm.info}
              onChange={(e) => setNewCompanyForm({ ...newCompanyForm, info: e.target.value })}
              className="px-3 py-2 border rounded"
              rows={2}
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCreate}
              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Icon path={mdiCheck} size={0.7} />
              Create
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewCompanyForm({ name: '', logo: '', website: '', info: '' });
              }}
              className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              <Icon path={mdiClose} size={0.7} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Companies table */}
      <div className="overflow-x-auto">
        <table className="w-full rounded" style={{ tableLayout: 'fixed', fontSize: '12px' }}>
          <thead>
            <tr className="bg-gray-100 text-gray-900">
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Logo</th>
              <th className="p-2 text-left">Website</th>
              <th className="p-2 text-left">Info</th>
              <th className="p-2 text-left" style={{ minWidth: '90px', width: '90px', maxWidth: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.map((company) => {
              const isEditing = editingId === company.id;

              return (
                <tr key={company.id} className="bg-white text-gray-900">
                  {/* Name */}
                  <td className="py-1 px-3 border-b text-left">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full bg-white border rounded px-2 py-1"
                      />
                    ) : (
                      <span className="font-semibold">{company.name}</span>
                    )}
                  </td>

                  {/* Logo */}
                  <td className="py-1 px-3 border-b text-left">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.logo || ''}
                        onChange={(e) => setEditForm({ ...editForm, logo: e.target.value })}
                        className="w-full bg-white border rounded px-2 py-1"
                        placeholder="Logo URL"
                      />
                    ) : company.logo && company.logo.trim() !== '' ? (
                      <img src={getLogoPath(company.logo)} alt={company.name} className="h-8 object-contain" />
                    ) : (
                      <span className="text-gray-400 text-sm">No logo</span>
                    )}
                  </td>

                  {/* Website */}
                  <td className="py-1 px-3 border-b text-left">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.website || ''}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                        className="w-full bg-white border rounded px-2 py-1"
                        placeholder="Website URL"
                      />
                    ) : company.website ? (
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {company.website.substring(0, 30)}...
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">No website</span>
                    )}
                  </td>

                  {/* Info */}
                  <td className="py-1 px-3 border-b text-left max-w-xs">
                    {isEditing ? (
                      <textarea
                        value={editForm.info || ''}
                        onChange={(e) => setEditForm({ ...editForm, info: e.target.value })}
                        className="w-full bg-white border rounded px-2 py-1"
                        rows={2}
                      />
                    ) : (
                      <span className="line-clamp-2">{company.info || <span className="text-gray-400 text-sm italic">No info</span>}</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-1 px-3 border-b text-left">
                    {isEditing ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleSave(company.id)}
                          className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                          title="Save"
                        >
                          <Icon path={mdiCheck} size={0.7} />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                          title="Cancel"
                        >
                          <Icon path={mdiClose} size={0.7} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(company)}
                          className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          title="Edit"
                        >
                          <Icon path={mdiPencil} size={0.7} />
                        </button>
                        <button
                          onClick={() => handleDelete(company.id, company.name)}
                          className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                          title="Delete"
                        >
                          <Icon path={mdiDelete} size={0.7} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredCompanies.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No companies found matching your search' : 'No companies yet. Click "Add Company" to create one.'}
          </div>
        )}
      </div>
    </div>
  );
}
