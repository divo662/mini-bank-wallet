import { Link } from 'react-router-dom';
import { useWalletStore } from '../../store/useWalletStore';
import { formatCurrency } from '../../utils/validation';
import { useMemo } from 'react';
import { startOfMonth } from 'date-fns';

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
          <Link
            to="/analytics"
            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#172030]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-sm font-medium text-gray-700 group-hover:text-[#172030]">
                Analytics
              </span>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-[#172030] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            to="/goals"
            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#172030]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <span className="text-sm font-medium text-gray-700 group-hover:text-[#172030]">
                Goals
              </span>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-[#172030] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            to="/accounts"
            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#172030]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="text-sm font-medium text-gray-700 group-hover:text-[#172030]">
                Accounts
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
                  width: `${Math.min(Math.abs(parseFloat(stats.percentageChange)), 100)}%` 
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
    </div>
  );
};

export default RightSidebar;
