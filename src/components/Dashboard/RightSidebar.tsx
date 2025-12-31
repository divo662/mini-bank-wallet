import { Link } from 'react-router-dom';
import { useWalletStore } from '../../store/useWalletStore';
import { formatCurrency } from '../../utils/validation';
import { useMemo } from 'react';
import { format, startOfMonth } from 'date-fns';

const RightSidebar = () => {
  const transactions = useWalletStore((state) => state.transactions);
  const accounts = useWalletStore((state) => state.accounts);

  // Calculate wallet statistics
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    
    // Filter transactions for this month
    const thisMonthTransactions = transactions.filter((t) => {
      const transactionDate = t.timestamp ? new Date(t.timestamp) : new Date(t.date);
      return transactionDate >= monthStart;
    });

    // Calculate income and expenses
    const income = thisMonthTransactions
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = thisMonthTransactions
      .filter((t) => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate percentage change (mock for now, could be based on previous month)
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const percentageChange = totalBalance > 0 ? ((income - expenses) / totalBalance) * 100 : 0;

    return {
      totalTransactions: transactions.length,
      thisMonthTransactions: thisMonthTransactions.length,
      income,
      expenses,
      netChange: income - expenses,
      percentageChange: percentageChange.toFixed(2),
    };
  }, [transactions, accounts]);

  return (
    <div className="space-y-4 md:space-y-6 mt-4 md:mt-0">
      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <div className="space-y-3">
          <Link
            to="/fund-wallet"
            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#172030]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium text-gray-700 group-hover:text-[#172030]">
                Fund Wallet
              </span>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-[#172030] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            to="/transfer"
            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#172030]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="text-sm font-medium text-gray-700 group-hover:text-[#172030]">
                Fund Transfers
              </span>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-[#172030] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            to="/transactions"
            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#172030]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span className="text-sm font-medium text-gray-700 group-hover:text-[#172030]">
                Transactions
              </span>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-[#172030] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Wallet Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Wallet Summary</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">This Month</span>
              <span className={`text-sm font-semibold ${stats.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.netChange >= 0 ? '+' : ''}{formatCurrency(stats.netChange)}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  stats.netChange >= 0 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                    : 'bg-gradient-to-r from-red-500 to-orange-500'
                }`}
                style={{ 
                  width: `${Math.min(Math.abs(stats.percentageChange), 100)}%` 
                }}
              ></div>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Income: {formatCurrency(stats.income)}</span>
              <span>Expenses: {formatCurrency(stats.expenses)}</span>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-gray-600">Total Transactions</span>
              <span className="font-semibold text-gray-900">{stats.totalTransactions}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">This Month</span>
              <span className="font-semibold text-gray-900">{stats.thisMonthTransactions}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Card */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-sm border border-yellow-200 p-4 md:p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          ></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notify"
                className="w-4 h-4 text-[#172030] rounded focus:ring-[#172030]"
              />
              <label htmlFor="notify" className="text-sm font-medium text-gray-700">
                Notify me
              </label>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 mb-4">
            <p className="text-xs text-gray-500 mb-1">{format(new Date(), 'dd.MM.yyyy')}</p>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Financial tips webinar
            </h4>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full bg-[#172030] border-2 border-white"
                  ></div>
                ))}
              </div>
              <span className="text-xs text-gray-600">+10 participants</span>
            </div>
          </div>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('show-feature-not-available', { detail: { message: 'Webinar details feature does not exist yet' } }));
            }}
            className="w-full bg-[#172030] hover:opacity-90 text-white py-2 px-4 rounded-lg font-medium text-sm transition-opacity flex items-center justify-center gap-2"
          >
            <span>View Details</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
