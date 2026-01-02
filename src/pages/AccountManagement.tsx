import { useState, useEffect, useMemo } from 'react';
import { useWalletStore } from '../store/useWalletStore';
import Layout from '../components/Layout/Layout';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { formatCurrency } from '../utils/validation';
import { format } from 'date-fns';
import type { Account } from '../types';

// Account Icons
const ACCOUNT_ICONS = [
  { name: 'wallet', label: 'Wallet', svg: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )},
  { name: 'bank', label: 'Bank', svg: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )},
  { name: 'credit-card', label: 'Credit Card', svg: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )},
  { name: 'piggy-bank', label: 'Savings', svg: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )},
  { name: 'chart', label: 'Investment', svg: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )},
  { name: 'cash', label: 'Cash', svg: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )},
];

// Color Presets
const COLOR_PRESETS = [
  '#172030', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316',
];

const AccountManagement = () => {
  const accounts = useWalletStore((state) => state.accounts);
  const getActiveAccounts = useWalletStore((state) => state.getActiveAccounts);
  const getArchivedAccounts = useWalletStore((state) => state.getArchivedAccounts);
  const isLoading = useWalletStore((state) => state.isLoading);
  const error = useWalletStore((state) => state.error);
  const setLoading = useWalletStore((state) => state.setLoading);
  const setError = useWalletStore((state) => state.setError);
  const setAccounts = useWalletStore((state) => state.setAccounts);
  const addAccount = useWalletStore((state) => state.addAccount);
  const updateAccount = useWalletStore((state) => state.updateAccount);
  const archiveAccount = useWalletStore((state) => state.archiveAccount);
  const unarchiveAccount = useWalletStore((state) => state.unarchiveAccount);
  const deleteAccount = useWalletStore((state) => state.deleteAccount);

  const [retryCount, setRetryCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking' as Account['type'],
    color: '#172030',
    icon: 'wallet',
    accountNumber: '',
    description: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const activeAccounts = useMemo(() => getActiveAccounts(), [accounts, getActiveAccounts]);
  const archivedAccounts = useMemo(() => getArchivedAccounts(), [accounts, getArchivedAccounts]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        await new Promise((resolve) => setTimeout(resolve, 300));

        let accountsData: any[] = [];
        try {
          const stored = localStorage.getItem('wallet_accounts');
          if (stored) {
            accountsData = JSON.parse(stored);
          } else {
            const accountsResponse = await fetch('/accounts.json');
            if (accountsResponse.ok) {
              accountsData = await accountsResponse.json();
              // Migrate old accounts to new format
              accountsData = accountsData.map((acc: any) => ({
                ...acc,
                color: acc.color || '#172030',
                icon: acc.icon || 'wallet',
                isArchived: acc.isArchived || false,
                createdAt: acc.createdAt || new Date().toISOString(),
              }));
              localStorage.setItem('wallet_accounts', JSON.stringify(accountsData));
            }
          }
        } catch (e) {
          console.warn('Failed to load accounts', e);
          const accountsResponse = await fetch('/accounts.json');
          if (accountsResponse.ok) {
            accountsData = await accountsResponse.json();
          }
        }
        setAccounts(accountsData);

        setIsInitialLoad(false);
      } catch (error) {
        const errorMessage = 'Failed to load accounts. Please try again.';
        setError(errorMessage);
        console.error('AccountManagement load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setLoading, setError, setAccounts, retryCount]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    setError(null);
  };

  const getIconSVG = (iconName: string) => {
    const icon = ACCOUNT_ICONS.find((i) => i.name === iconName);
    return icon ? icon.svg : ACCOUNT_ICONS[0].svg;
  };

  const handleCreateAccount = () => {
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Account name is required');
      return;
    }

    // Check for duplicate names
    const duplicate = accounts.find(
      (acc) => acc.name.toLowerCase().trim() === formData.name.toLowerCase().trim() && !acc.isArchived
    );
    if (duplicate) {
      setFormError('An account with this name already exists');
      return;
    }

    addAccount({
      name: formData.name.trim(),
      type: formData.type,
      color: formData.color,
      icon: formData.icon,
      accountNumber: formData.accountNumber.trim() || undefined,
      description: formData.description.trim() || undefined,
    });

    setFormData({
      name: '',
      type: 'checking',
      color: '#172030',
      icon: 'wallet',
      accountNumber: '',
      description: '',
    });
    setShowCreateModal(false);
    setFormError(null);
  };

  const handleEditAccount = (accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId);
    if (!account) return;

    setFormData({
      name: account.name,
      type: account.type,
      color: account.color || '#172030',
      icon: account.icon || 'wallet',
      accountNumber: account.accountNumber || '',
      description: account.description || '',
    });
    setShowEditModal(accountId);
    setFormError(null);
  };

  const handleUpdateAccount = () => {
    if (!showEditModal) return;

    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Account name is required');
      return;
    }

    // Check for duplicate names (excluding current account)
    const duplicate = accounts.find(
      (acc) =>
        acc.id !== showEditModal &&
        acc.name.toLowerCase().trim() === formData.name.toLowerCase().trim() &&
        !acc.isArchived
    );
    if (duplicate) {
      setFormError('An account with this name already exists');
      return;
    }

    updateAccount(showEditModal, {
      name: formData.name.trim(),
      type: formData.type,
      color: formData.color,
      icon: formData.icon,
      accountNumber: formData.accountNumber.trim() || undefined,
      description: formData.description.trim() || undefined,
    });

    setShowEditModal(null);
    setFormData({
      name: '',
      type: 'checking',
      color: '#172030',
      icon: 'wallet',
      accountNumber: '',
      description: '',
    });
    setFormError(null);
  };

  const handleArchive = (accountId: string) => {
    archiveAccount(accountId);
    setShowArchiveModal(null);
  };

  const handleUnarchive = (accountId: string) => {
    unarchiveAccount(accountId);
  };

  const handleDelete = (accountId: string) => {
    const result = deleteAccount(accountId);
    if (result.success) {
      setShowDeleteModal(null);
    } else {
      setFormError(result.error || 'Failed to delete account');
    }
  };

  if (isLoading && isInitialLoad) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading accounts..." />
        </div>
      </Layout>
    );
  }

  if (error && isInitialLoad) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-red-200 p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-[#172030] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              Account Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Manage your accounts, customize colors and icons
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-[#172030] text-white rounded-lg font-medium hover:opacity-90 active:opacity-80 transition-opacity text-sm sm:text-base"
          >
            + Add Account
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'active'
                  ? 'border-[#172030] text-[#172030]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Active ({activeAccounts.length})
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'archived'
                  ? 'border-[#172030] text-[#172030]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Archived ({archivedAccounts.length})
            </button>
          </div>
        </div>

        {/* Accounts Grid */}
        {activeTab === 'active' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAccounts.map((account) => (
              <div
                key={account.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: account.color || '#172030' }}
                    >
                      {getIconSVG(account.icon || 'wallet')}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{account.name}</h3>
                      <p className="text-xs text-gray-500 capitalize">{account.type}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditAccount(account.id)}
                      className="p-1.5 text-gray-400 hover:text-[#172030] transition-colors"
                      aria-label="Edit account"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setShowArchiveModal(account.id)}
                      className="p-1.5 text-gray-400 hover:text-orange-600 transition-colors"
                      aria-label="Archive account"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-600 mb-1">Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(account.balance)}
                  </p>
                </div>

                {account.accountNumber && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-600 mb-1">Account Number</p>
                    <p className="text-sm font-medium text-gray-900">{account.accountNumber}</p>
                  </div>
                )}

                {account.description && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-600 mb-1">Description</p>
                    <p className="text-sm text-gray-700">{account.description}</p>
                  </div>
                )}

                {account.createdAt && (
                  <p className="text-xs text-gray-500">
                    Created {format(new Date(account.createdAt), 'MMM dd, yyyy')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'archived' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivedAccounts.map((account) => (
              <div
                key={account.id}
                className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 opacity-75"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: account.color || '#172030' }}
                    >
                      {getIconSVG(account.icon || 'wallet')}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{account.name}</h3>
                      <p className="text-xs text-gray-500 capitalize">{account.type}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                        Archived
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleUnarchive(account.id)}
                      className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                      aria-label="Unarchive account"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(account.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                      aria-label="Delete account"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-600 mb-1">Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(account.balance)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty States */}
        {activeTab === 'active' && activeAccounts.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12 text-center">
            <div className="w-16 h-16 bg-[#172030]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#172030]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Accounts</h3>
            <p className="text-gray-600 mb-6">Create your first account to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-[#172030] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Create Account
            </button>
          </div>
        )}

        {activeTab === 'archived' && archivedAccounts.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12 text-center">
            <p className="text-gray-600">No archived accounts</p>
          </div>
        )}

        {/* Create Account Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Create New Account</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Account Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., My Checking Account"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    Account Type *
                  </label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Account['type'] })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] focus:border-transparent"
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit Card</option>
                    <option value="investment">Investment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {ACCOUNT_ICONS.map((icon) => (
                      <button
                        key={icon.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: icon.name })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.icon === icon.name
                            ? 'border-[#172030] bg-[#172030]/10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`${formData.icon === icon.name ? 'text-[#172030]' : 'text-gray-600'}`}>
                          {icon.svg}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          formData.color === color
                            ? 'border-gray-900 scale-110'
                            : 'border-gray-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                    <div className="relative">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number (Optional)
                  </label>
                  <input
                    type="text"
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="e.g., ****1234"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add a description..."
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] focus:border-transparent resize-none"
                  />
                </div>

                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {formError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormError(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAccount}
                    className="flex-1 px-4 py-2.5 bg-[#172030] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Account Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Edit Account</h2>
                <button
                  onClick={() => {
                    setShowEditModal(null);
                    setFormError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Account Name *
                  </label>
                  <input
                    type="text"
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="edit-type" className="block text-sm font-medium text-gray-700 mb-2">
                    Account Type *
                  </label>
                  <select
                    id="edit-type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Account['type'] })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] focus:border-transparent"
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit Card</option>
                    <option value="investment">Investment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {ACCOUNT_ICONS.map((icon) => (
                      <button
                        key={icon.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: icon.name })}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.icon === icon.name
                            ? 'border-[#172030] bg-[#172030]/10'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`${formData.icon === icon.name ? 'text-[#172030]' : 'text-gray-600'}`}>
                          {icon.svg}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          formData.color === color
                            ? 'border-gray-900 scale-110'
                            : 'border-gray-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                    <div className="relative">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="edit-accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number (Optional)
                  </label>
                  <input
                    type="text"
                    id="edit-accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#172030] focus:border-transparent resize-none"
                  />
                </div>

                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {formError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowEditModal(null);
                      setFormError(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateAccount}
                    className="flex-1 px-4 py-2.5 bg-[#172030] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Archive Confirmation Modal */}
        {showArchiveModal && (() => {
          const account = accounts.find((acc) => acc.id === showArchiveModal);
          if (!account) return null;

          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Archive Account</h2>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to archive <strong>{account.name}</strong>? Archived accounts will be hidden from the main view but can be restored later.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowArchiveModal(null)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleArchive(account.id)}
                    className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (() => {
          const account = accounts.find((acc) => acc.id === showDeleteModal);
          if (!account) return null;

          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Account</h2>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to permanently delete <strong>{account.name}</strong>? This action cannot be undone.
                </p>
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                    {formError}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(null);
                      setFormError(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Error Banner */}
        {error && !isInitialLoad && (
          <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 shadow-lg">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-800">{error}</p>
                <button
                  onClick={handleRetry}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium underline"
                >
                  Retry
                </button>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 flex-shrink-0"
                aria-label="Dismiss"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AccountManagement;

