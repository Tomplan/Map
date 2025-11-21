import { useState } from 'react';

/**
 * Hook for managing company CRUD operations and form state
 *
 * @param {Object} params
 * @param {Function} params.createCompany - Function to create a company
 * @param {Function} params.updateCompany - Function to update a company
 * @param {Function} params.deleteCompany - Function to delete a company
 * @param {Function} params.updateProfile - Function to update organization profile
 * @param {string} params.organizationLogo - Default logo URL for new companies
 * @param {Function} params.confirm - Confirm dialog function from useDialog
 * @param {Function} params.toastError - Error toast function from useDialog
 * @returns {Object} Mutation handlers and form state
 */
export function useCompanyMutations({
  createCompany,
  updateCompany,
  deleteCompany,
  updateProfile,
  organizationLogo,
  confirm,
  toastError
}) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [newCompanyForm, setNewCompanyForm] = useState({
    name: '',
    logo: organizationLogo || '',
    website: '',
    info: ''
  });

  // Start editing
  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  // Save edited item (organization or company)
  const handleSave = async () => {
    const id = editingId;
    if (id === 'organization') {
      const { name, logo, website, info } = editForm;
      await updateProfile({ name, logo, website, info });
    } else {
      await updateCompany(id, editForm);
    }
    setEditingId(null);
    setEditForm({});
  };

  // Cancel edit
  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Delete company
  const handleDelete = async (id, name) => {
    const confirmed = await confirm({
      title: 'Delete Company',
      message: `Are you sure you want to delete "${name}"? This will also delete all assignments for this company.`,
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) {
      return;
    }
    const { error } = await deleteCompany(id);
    if (error) {
      toastError(`Error deleting company: ${error}`);
    }
  };

  // Create new company
  const handleCreate = async () => {
    if (!newCompanyForm.name.trim()) {
      toastError('Company name is required');
      return;
    }

    const { error } = await createCompany(newCompanyForm);
    if (!error) {
      setIsCreating(false);
      setNewCompanyForm({
        name: '',
        logo: organizationLogo,
        website: '',
        info: ''
      });
    } else {
      toastError(`Error creating company: ${error}`);
    }
  };

  // Start creating
  const handleStartCreate = () => {
    setIsCreating(true);
    setNewCompanyForm({
      name: '',
      logo: organizationLogo,
      website: '',
      info: ''
    });
  };

  // Cancel creating
  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewCompanyForm({
      name: '',
      logo: organizationLogo,
      website: '',
      info: ''
    });
  };

  return {
    // State
    editingId,
    editForm,
    setEditForm,
    isCreating,
    newCompanyForm,
    setNewCompanyForm,

    // Handlers
    handleEdit,
    handleSave,
    handleCancel,
    handleDelete,
    handleCreate,
    handleStartCreate,
    handleCancelCreate,
  };
}
