import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';
import { AuthPage } from '@/pages/AuthPage';
import { AppLayout, type TabId } from '@/components/AppLayout';
import { Dashboard } from '@/pages/Dashboard';
import { Transactions } from '@/pages/Transactions';
import { MonthlyReport } from '@/pages/MonthlyReport';
import { Categories } from '@/pages/Categories';

function AppContent() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<TabId>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <DataProvider>
      <AppLayout activeTab={tab} onTabChange={setTab}>
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'transactions' && <Transactions />}
        {tab === 'report' && <MonthlyReport />}
        {tab === 'categories' && <Categories />}
      </AppLayout>
    </DataProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
