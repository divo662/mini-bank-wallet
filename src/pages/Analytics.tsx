import { useMemo, useEffect, useState } from 'react';
import { useWalletStore } from '../store/useWalletStore';
import Layout from '../components/Layout/Layout';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { formatCurrency } from '../utils/validation';
import { format, startOfMonth, subMonths, eachDayOfInterval, getDay } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const Analytics = () => {
  const transactions = useWalletStore((state) => state.transactions);
  const isLoading = useWalletStore((state) => state.isLoading);
  const error = useWalletStore((state) => state.error);
  const setLoading = useWalletStore((state) => state.setLoading);
  const setError = useWalletStore((state) => state.setError);
  const setAccounts = useWalletStore((state) => state.setAccounts);
  const setTransactions = useWalletStore((state) => state.setTransactions);

  const [retryCount, setRetryCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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

        let transactionsData: any[] = [];
        try {
          const stored = localStorage.getItem('wallet_transactions');
          if (stored) {
            transactionsData = JSON.parse(stored);
          } else {
            const transactionsResponse = await fetch('/transactions.json');
            if (transactionsResponse.ok) {
              transactionsData = await transactionsResponse.json();
            }
          }
        } catch (e) {
          console.warn('Failed to load transactions', e);
        }
        setTransactions(transactionsData);

        setIsInitialLoad(false);
      } catch (error) {
        const errorMessage = 'Failed to load analytics data. Please try again.';
        setError(errorMessage);
        console.error('Analytics load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setAccounts, setTransactions, setLoading, setError, retryCount]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    setError(null);
  };

  // Calculate spending statistics
  const stats = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return null;
    }

    const now = new Date();
    const monthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));

    // Filter transactions
    const allTransactions = transactions.map((t) => ({
      ...t,
      date: t.timestamp ? new Date(t.timestamp) : new Date(t.date),
    }));

    const thisMonthTransactions = allTransactions.filter(
      (t) => t.date >= monthStart
    );
    const lastMonthTransactions = allTransactions.filter(
      (t) => t.date >= lastMonthStart && t.date < monthStart
    );

    // Calculate averages
    const totalAmount = allTransactions.reduce((sum, t) => sum + t.amount, 0);
    const averageTransaction = totalAmount / allTransactions.length;

    // Most active day of week
    const dayCounts: Record<number, number> = {};
    allTransactions.forEach((t) => {
      const day = getDay(t.date);
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    const mostActiveDay = Object.entries(dayCounts).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Category trends
    const categoryTotals: Record<string, number> = {};
    allTransactions.forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    // Top merchants
    const merchantTotals: Record<string, number> = {};
    allTransactions.forEach((t) => {
      merchantTotals[t.merchant] = (merchantTotals[t.merchant] || 0) + Math.abs(t.amount);
    });
    const topMerchants = Object.entries(merchantTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }));

    // Spending patterns (morning vs evening)
    const morningCount = allTransactions.filter(
      (t) => t.date.getHours() >= 6 && t.date.getHours() < 12
    ).length;
    const afternoonCount = allTransactions.filter(
      (t) => t.date.getHours() >= 12 && t.date.getHours() < 18
    ).length;
    const eveningCount = allTransactions.filter(
      (t) => t.date.getHours() >= 18 || t.date.getHours() < 6
    ).length;

    // Projected monthly spending
    const thisMonthExpenses = thisMonthTransactions
      .filter((t) => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();
    const projectedMonthly = (thisMonthExpenses / currentDay) * daysInMonth;

    // Monthly comparison data
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStartDate = startOfMonth(monthDate);
      const nextMonthStart = startOfMonth(
        new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)
      );

      const monthTransactions = allTransactions.filter(
        (t) => t.date >= monthStartDate && t.date < nextMonthStart
      );

      const income = monthTransactions
        .filter((t) => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = monthTransactions
        .filter((t) => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);

      monthlyData.push({
        month: format(monthDate, 'MMM yyyy'),
        income,
        expenses,
        net: income - expenses,
      });
    }

    // Spending trends (last 30 days)
    const last30Days = eachDayOfInterval({
      start: subMonths(now, 1),
      end: now,
    });

    const dailySpending = last30Days.map((day) => {
      const dayTransactions = allTransactions.filter(
        (t) =>
          format(t.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') &&
          t.type === 'debit'
      );
      const total = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
      return {
        date: format(day, 'MMM dd'),
        amount: total,
      };
    });

    // Category breakdown
    const categoryData = Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name,
        value: Math.abs(value),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return {
      averageTransaction,
      mostActiveDay: dayNames[parseInt(mostActiveDay)],
      thisMonthExpenses,
      lastMonthExpenses: lastMonthTransactions
        .filter((t) => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0),
      projectedMonthly,
      topMerchants,
      categoryData,
      monthlyData,
      dailySpending,
      spendingPatterns: {
        morning: morningCount,
        afternoon: afternoonCount,
        evening: eveningCount,
      },
      totalTransactions: allTransactions.length,
      thisMonthTransactions: thisMonthTransactions.length,
    };
  }, [transactions]);

  const COLORS = [
    '#172030',
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
    '#06B6D4',
  ];

  if (isLoading && isInitialLoad) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading analytics..." />
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

  if (!stats) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">No transaction data available</p>
            <p className="text-sm text-gray-500">
              Start making transactions to see analytics
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            Analytics & Insights
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Comprehensive spending analysis and trends
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-600 mb-1">Average Transaction</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(stats.averageTransaction)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-600 mb-1">Most Active Day</p>
            <p className="text-xl font-bold text-gray-900">{stats.mostActiveDay}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-600 mb-1">This Month Expenses</p>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(stats.thisMonthExpenses)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-600 mb-1">Projected Monthly</p>
            <p className="text-xl font-bold text-orange-600">
              {formatCurrency(stats.projectedMonthly)}
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
          {/* Spending Trends Line Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Spending Trends (Last 30 Days)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.dailySpending}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  fontSize={12}
                  tick={{ fill: '#6b7280' }}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tick={{ fill: '#6b7280' }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#172030"
                  strokeWidth={2}
                  dot={{ fill: '#172030', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Category Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${percent !== undefined ? (percent * 100).toFixed(0) : '0'}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.categoryData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Comparison Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Monthly Comparison (Last 6 Months)
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={stats.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                stroke="#6b7280"
                fontSize={12}
                tick={{ fill: '#6b7280' }}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tick={{ fill: '#6b7280' }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number | undefined) =>
                  value !== undefined ? formatCurrency(value) : ''
                }
              />
              <Legend />
              <Bar dataKey="income" fill="#10B981" name="Income" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expenses" fill="#EF4444" name="Expenses" radius={[8, 8, 0, 0]} />
              <Bar dataKey="net" fill="#172030" name="Net" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Additional Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Top Merchants */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Merchants</h3>
            <div className="space-y-3">
              {stats.topMerchants.map((merchant, index) => (
                <div
                  key={merchant.name}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#172030] text-white flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {merchant.name}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(merchant.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Spending Patterns & Trends */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Spending Patterns
            </h3>
            <div className="space-y-4">
              {/* Time of Day */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Time of Day</p>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Morning (6 AM - 12 PM)</span>
                      <span>{stats.spendingPatterns.morning} transactions</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${
                            (stats.spendingPatterns.morning / stats.totalTransactions) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Afternoon (12 PM - 6 PM)</span>
                      <span>{stats.spendingPatterns.afternoon} transactions</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{
                          width: `${
                            (stats.spendingPatterns.afternoon / stats.totalTransactions) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Evening (6 PM - 6 AM)</span>
                      <span>{stats.spendingPatterns.evening} transactions</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{
                          width: `${
                            (stats.spendingPatterns.evening / stats.totalTransactions) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Month Comparison */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Month Comparison</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="text-sm font-semibold text-red-600">
                      {formatCurrency(stats.thisMonthExpenses)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Month</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(stats.lastMonthExpenses)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-900">Difference</span>
                    <span
                      className={`text-sm font-semibold ${
                        stats.thisMonthExpenses > stats.lastMonthExpenses
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {stats.thisMonthExpenses > stats.lastMonthExpenses ? '+' : ''}
                      {formatCurrency(
                        Math.abs(stats.thisMonthExpenses - stats.lastMonthExpenses)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner (non-blocking) */}
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

export default Analytics;

