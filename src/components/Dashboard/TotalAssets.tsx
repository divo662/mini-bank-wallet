import { useState, useEffect } from 'react';
import { useWalletStore } from '../../store/useWalletStore';

const TotalAssets = () => {
  const accounts = useWalletStore((state) => state.accounts);
  const getActiveAccounts = useWalletStore((state) => state.getActiveAccounts);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('total');
  
  // Filter out archived accounts
  const activeAccounts = getActiveAccounts();
  
  // Get selected account or calculate total
  const selectedAccount = activeAccounts.find((acc) => acc.id === selectedAccountId);
  const totalBalance = activeAccounts.length > 0 
    ? activeAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    : 0;
  
  const displayBalance = selectedAccountId === 'total' 
    ? totalBalance 
    : (selectedAccount?.balance || 0);

  // Set default to Main account when accounts load
  useEffect(() => {
    if (activeAccounts.length > 0 && selectedAccountId === 'total') {
      const mainAccount = activeAccounts.find((acc) => acc.id === 'main');
      if (mainAccount) {
        setSelectedAccountId('main');
      }
    }
  }, [activeAccounts, selectedAccountId]);

  return (
    <div className="space-y-4 md:space-y-6 mb-4 md:mb-6">
      {/* Header with My Balance title and Account Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">My Balance</h2>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            onClick={() => setSelectedAccountId('total')}
            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${
              selectedAccountId === 'total'
                ? 'bg-[#172030] text-white shadow-md scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
            }`}
          >
            Total
          </button>
          {activeAccounts.map((account) => (
            <button
              key={account.id}
              onClick={() => setSelectedAccountId(account.id)}
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${
                selectedAccountId === account.id
                  ? 'bg-[#172030] text-white shadow-md scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
              }`}
            >
              {account.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Balance Card - Dark Theme */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}></div>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          {/* Balance Info */}
          <div>
            <p className="text-gray-400 text-sm mb-1">
              {selectedAccountId === 'total' 
                ? 'Total Balance' 
                : `${selectedAccount?.name || 'Account'} Balance`}
            </p>
            <p className="text-white text-3xl sm:text-4xl md:text-5xl font-bold">
              {isBalanceVisible ? (
                (() => {
                  const formatted = new Intl.NumberFormat('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(displayBalance);
                  return `$${formatted}`;
                })()
              ) : (
                '••••••••'
              )}
            </p>
            {selectedAccountId !== 'total' && accounts.length > 1 && (
              <button
                onClick={() => {
                  const otherAccount = accounts.find(acc => acc.id !== selectedAccountId);
                  if (otherAccount) {
                    setSelectedAccountId(otherAccount.id);
                  }
                }}
                className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-gray-300 hover:text-white transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Switch to {accounts.find(acc => acc.id !== selectedAccountId)?.name}</span>
              </button>
            )}
          </div>

          {/* Right Side - Eye Icon */}
          <button
            onClick={() => setIsBalanceVisible(!isBalanceVisible)}
            className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label={isBalanceVisible ? 'Hide balance' : 'Show balance'}
          >
            {isBalanceVisible ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};

export default TotalAssets;
