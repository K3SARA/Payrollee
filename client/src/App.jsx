import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import EmployeeDirectory from './components/EmployeeDirectory';
import AttendanceAndLeaves from './components/AttendanceAndLeaves';
import PayrollProcessingEngine from './components/PayrollProcessingEngine';
import PayslipsAndReports from './components/PayslipsAndReports';
import EmployeeProfileView from './components/EmployeeProfileView';
import UnauthorizedView from './components/UnauthorizedView';
import LoginView from './components/LoginView';

function MainApp() {
  const { user, role, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [targetPayslipId, setTargetPayslipId] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
          Initializing PayRolleey HRMS...
        </p>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <LoginView />;
  }

  // Handler to open payslip from dashboard or ledger
  const handleViewPayslip = (payslipId) => {
    setTargetPayslipId(payslipId);
    if (isAdmin) {
      setActiveTab('reports');
    } else {
      setActiveTab('my-payslips');
    }
  };

  // RBAC Router: Determines what view to render
  const renderContent = () => {
    // Admin only routes check
    const adminOnlyTabs = ['employees', 'payroll-run'];
    if (!isAdmin && adminOnlyTabs.includes(activeTab)) {
      return <UnauthorizedView onBack={() => setActiveTab('dashboard')} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return isAdmin ? (
          <AdminDashboard onNavigate={setActiveTab} />
        ) : (
          <EmployeeDashboard onNavigate={setActiveTab} onViewPayslip={handleViewPayslip} />
        );

      case 'employees':
        return <EmployeeDirectory onViewPayslip={handleViewPayslip} />;

      case 'attendance':
      case 'leaves':
        return <AttendanceAndLeaves />;

      case 'payroll-run':
        return <PayrollProcessingEngine onCompleteRun={setActiveTab} />;

      case 'reports':
      case 'my-payslips':
        return (
          <PayslipsAndReports
            initialPayslipId={targetPayslipId}
            onClearInitial={() => setTargetPayslipId(null)}
          />
        );

      case 'my-profile':
        return <EmployeeProfileView />;

      default:
        return <AdminDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Persistent Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar activeTab={activeTab} />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
