import { useWalletStore } from '../../store/useWalletStore';

const AccountCards = () => {
  const accounts = useWalletStore((state) => state.accounts);

  const getCardNumber = (accountId: string) => {
    // Generate a card number based on account ID
    const hash = accountId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `4623 **** **** ${String(1000 + (hash % 9000)).padStart(4, '0')}`;
  };

  const getExpiryDate = (index: number) => {
    const month = String(12 - (index % 12)).padStart(2, '0');
    const year = String(23 + Math.floor(index / 12));
    return `${month}/${year}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-[#172030] text-white rounded-lg font-medium text-sm">
            My Accounts
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('show-feature-not-available', { detail: { message: 'Wallet feature does not exist yet' } }));
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium text-sm"
          >
            Wallet
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('show-feature-not-available', { detail: { message: 'Payments feature does not exist yet' } }));
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium text-sm"
          >
            Payments
          </button>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('show-feature-not-available', { detail: { message: 'Manage accounts feature does not exist yet' } }));
          }}
            className="text-sm text-[#172030] hover:opacity-80 font-medium"
        >
          Manage accounts
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.map((account, index) => (
          <div
            key={account.id}
            className={`relative rounded-2xl p-6 text-white overflow-hidden ${
              index === 0
                ? 'bg-gradient-to-br from-gray-900 to-gray-700'
                : 'bg-gradient-to-br from-blue-600 to-blue-500'
            }`}
            style={{
              backgroundImage: index === 0
                ? 'radial-gradient(circle at 20% 50%, rgba(255, 215, 0, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 215, 0, 0.2) 0%, transparent 50%)'
                : 'radial-gradient(circle at 20% 50%, rgba(34, 197, 94, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(34, 197, 94, 0.2) 0%, transparent 50%)',
            }}
          >
            {/* Card Pattern Overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}></div>
            </div>

            <div className="relative z-10">
              {index === 1 && (
                <div className="mb-4 flex justify-end">
                  <div className="w-12 h-8 bg-white/20 rounded flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <p className="text-sm text-white/80 mb-1">Card Number</p>
                <p className="text-xl font-mono tracking-wider">{getCardNumber(account.id)}</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/80 mb-1">Card Holder</p>
                  <p className="text-sm font-semibold">Saikat</p>
                </div>
                <div>
                  <p className="text-xs text-white/80 mb-1">Expires</p>
                  <p className="text-sm font-semibold">{getExpiryDate(index)}</p>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                {index === 0 ? (
                  <span className="text-white font-bold text-lg">VISA</span>
                ) : (
                  <div className="flex items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-red-500"></div>
                    <div className="w-8 h-8 rounded-full bg-orange-500 -ml-2"></div>
                    <span className="text-white font-bold text-xs ml-2">Mastercard</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountCards;

