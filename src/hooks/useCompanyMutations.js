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
  toastError,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [newCompanyForm, setNewCompanyForm] = useState({
    name: '',
    logo: organizationLogo || '',
    website: '',
    info: '',
    contact: '',
    phone: '',
    email: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    contact_name_2: '',
    contact_email_2: '',
    contact_phone_2: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '',
    country: '',
    vat_number: '',
    kvk_number: '',
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
      const {
        name,
        logo,
        website,
        info,
        contact,
        phone,
        email,
        address_line1,
        address_line2,
        city,
        postal_code,
        country,
        vat_number,
      } = editForm;
      await updateProfile({
        name,
        logo,
        website,
        info,
        contact,
        phone,
        email,
        address_line1,
        address_line2,
        city,
        postal_code,
        country,
        vat_number,
      });
    } else {
      // Deduplicate: clear secondary contact fields if they match the primary.
      // Also promote Contact 2 fields into Contact 1 when Contact 1 is missing a value
      // and Contact 2 shares a phone/name with Contact 1 (i.e. same person).
      const norm = (v) => (v || '').toLowerCase().trim();
      const normPhone = (v) => (v || '').replace(/[\s\-().+]/g, '').replace(/^00/, '');
      const data = { ...editForm };

      // Promote Contact 2 → Contact 1: if phone matches, merge missing fields up
      const c2PhoneMatchesC1 = normPhone(data.contact_phone) && normPhone(data.contact_phone) === normPhone(data.phone);
      const c2NameMatchesC1 = norm(data.contact_name) && norm(data.contact_name) === norm(data.contact);
      if (c2PhoneMatchesC1 || c2NameMatchesC1) {
        if (!norm(data.email) && norm(data.contact_email)) { data.email = data.contact_email; data.contact_email = null; }
        if (!normPhone(data.phone) && normPhone(data.contact_phone)) { data.phone = data.contact_phone; data.contact_phone = null; }
        if (!norm(data.contact) && norm(data.contact_name)) { data.contact = data.contact_name; data.contact_name = null; }
      }

      // Promote Contact 3 → Contact 2: if phone matches, merge missing fields up
      const c3PhoneMatchesC2 = normPhone(data.contact_phone_2) && normPhone(data.contact_phone_2) === normPhone(data.contact_phone || data.phone);
      const c3NameMatchesC2 = norm(data.contact_name_2) && norm(data.contact_name_2) === norm(data.contact_name || data.contact);
      if (c3PhoneMatchesC2 || c3NameMatchesC2) {
        if (!norm(data.contact_email) && norm(data.contact_email_2)) { data.contact_email = data.contact_email_2; data.contact_email_2 = null; }
        if (!normPhone(data.contact_phone) && normPhone(data.contact_phone_2)) { data.contact_phone = data.contact_phone_2; data.contact_phone_2 = null; }
        if (!norm(data.contact_name) && norm(data.contact_name_2)) { data.contact_name = data.contact_name_2; data.contact_name_2 = null; }
      }

      // Clear remaining exact duplicates between Contact 3 and Contact 2/1
      if (norm(data.contact_email_2) && norm(data.contact_email_2) === norm(data.contact_email || data.email)) data.contact_email_2 = null;
      if (normPhone(data.contact_phone_2) && normPhone(data.contact_phone_2) === normPhone(data.contact_phone || data.phone)) data.contact_phone_2 = null;
      if (norm(data.contact_name_2) && norm(data.contact_name_2) === norm(data.contact_name || data.contact)) data.contact_name_2 = null;

      // Clear remaining exact duplicates between Contact 2 and Contact 1
      if (norm(data.contact_email) && norm(data.contact_email) === norm(data.email)) data.contact_email = null;
      if (normPhone(data.contact_phone) && normPhone(data.contact_phone) === normPhone(data.phone)) data.contact_phone = null;
      if (norm(data.contact_name) && norm(data.contact_name) === norm(data.contact)) data.contact_name = null;

      await updateCompany(id, data);
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
        info: '',
        contact: '',
        phone: '',
        email: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        contact_name_2: '',
        contact_email_2: '',
        contact_phone_2: '',
        address_line1: '',
        address_line2: '',
        city: '',
        postal_code: '',
        country: '',
        vat_number: '',
        kvk_number: '',
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
      logo: organizationLogo || '',
      website: '',
      info: '',
      contact: '',
      phone: '',
      email: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      contact_name_2: '',
      contact_email_2: '',
      contact_phone_2: '',
      address_line1: '',
      address_line2: '',
      city: '',
      postal_code: '',
      country: '',
      vat_number: '',
      kvk_number: '',
    });
  };

  // Cancel creating
  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewCompanyForm({
      name: '',
      logo: organizationLogo,
      website: '',
      info: '',
      contact: '',
      phone: '',
      email: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      contact_name_2: '',
      contact_email_2: '',
      contact_phone_2: '',
      address_line1: '',
      address_line2: '',
      city: '',
      postal_code: '',
      country: '',
      vat_number: '',
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
