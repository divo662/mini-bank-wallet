import type { Account } from '../../types';
import { formatCurrency } from '../../utils/validation';

interface AccountCardProps {
  account: Account;
  type: 'balance' | 'accountType';
}

const AccountCard = ({ account, type }: AccountCardProps) => {
  if (type === 'balance') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">Current Balance</h3>
          <span className="text-2xl" aria-hidden="true">
            🏦
          </span>
        </div>
        <div className="mb-4">
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(account.balance)}
          </p>
          <div className="mt-2">
            <select
              className="text-sm text-gray-600 border-none bg-transparent focus:outline-none cursor-pointer"
              aria-label="Currency selector"
              defaultValue="USD"
            >
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        <button
          className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          aria-label="View account details"
        >
          View Details
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">Account Type</h3>
        <span className="text-2xl" aria-hidden="true">
          🐢
        </span>
      </div>
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <p className="text-2xl font-semibold text-gray-900 capitalize">
            {account.type === 'savings' ? 'Savings' : 'Checking'}
          </p>
          <span className="text-gray-400" aria-hidden="true">
            ▼
          </span>
        </div>
      </div>
    </div>
  );
};

export default AccountCard;

