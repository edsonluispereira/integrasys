import React, { useState } from 'react';
import CustomersView from './views/CustomersView';
import ProductsView from './views/ProductsView';
import SalesView from './views/SalesView';
import ManufacturingView from './views/ManufacturingView';
import FinancialView from './views/FinancialView';
import AuthView from './views/AuthView';
import SettingsView from './views/SettingsView';
import DashboardView from './views/DashboardView';
import SuppliersView from './views/SuppliersView';
import { LayoutDashboard, Users, UserPlus, Package, ShoppingCart, Factory, CircleDollarSign, LogOut, Settings } from 'lucide-react';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');

  if (!currentUser) {
    return <AuthView onLogin={(user) => setCurrentUser(user)} />;
  }

  const hasPermission = (perm) => {
    if (!currentUser.permissions) return false;
    return currentUser.permissions.includes('ADMIN') || currentUser.permissions.includes(perm);
  };

  return (
    <div className="app-container">
      <header className="topbar">
        <div className="topbar-logo" style={{ cursor: 'pointer' }} onClick={() => setCurrentView('dashboard')}>
          <img src="/logo.png" alt="Integrasys" style={{ width: '120px', height: 'auto', borderRadius: '4px' }} />
        </div>
        
        <nav className="top-nav">
          <button onClick={() => setCurrentView('dashboard')} className={`top-nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}>
            <LayoutDashboard size={18} /> <span>Dashboard</span>
          </button>
          
          {hasPermission('SALES_READ') && (
            <>
              <button onClick={() => setCurrentView('customers')} className={`top-nav-btn ${currentView === 'customers' ? 'active' : ''}`}>
                <Users size={18} /> <span>Clientes</span>
              </button>
              <button onClick={() => setCurrentView('suppliers')} className={`top-nav-btn ${currentView === 'suppliers' ? 'active' : ''}`}>
                <UserPlus size={18} /> <span>Fornecedores</span>
              </button>
              <button onClick={() => setCurrentView('products')} className={`top-nav-btn ${currentView === 'products' ? 'active' : ''}`}>
                <Package size={18} /> <span>Produtos</span>
              </button>
              <button onClick={() => setCurrentView('sales')} className={`top-nav-btn ${currentView === 'sales' ? 'active' : ''}`}>
                <ShoppingCart size={18} /> <span>Pedidos</span>
              </button>
            </>
          )}

          {hasPermission('PROD_READ') && (
            <button onClick={() => setCurrentView('manufacturing')} className={`top-nav-btn ${currentView === 'manufacturing' ? 'active' : ''}`}>
              <Factory size={18} /> <span>Produção (OF)</span>
            </button>
          )}

          {hasPermission('FINANCE_READ') && (
            <button onClick={() => setCurrentView('financial')} className={`top-nav-btn ${currentView === 'financial' ? 'active' : ''}`}>
              <CircleDollarSign size={18} /> <span>Financeiro</span>
            </button>
          )}

          {hasPermission('ADMIN') && (
            <button onClick={() => setCurrentView('settings')} className={`top-nav-btn ${currentView === 'settings' ? 'active' : ''}`}>
              <Settings size={18} /> <span>Configurações</span>
            </button>
          )}
        </nav>

        <div className="topbar-actions">
          <div className="user-profile-info" style={{ marginRight: '15px', textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>{currentUser.username}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{currentUser.groups?.join(', ')}</span>
          </div>
          <button onClick={() => setCurrentUser(null)} className="logout-btn">
            <LogOut size={18} /> <span>Sair</span>
          </button>
        </div>
      </header>
      
      <main className="main-content">
        {currentView === 'dashboard' && <DashboardView user={currentUser} />}
        {currentView === 'customers' && <CustomersView user={currentUser} />}
        {currentView === 'suppliers' && <SuppliersView user={currentUser} />}
        {currentView === 'products' && <ProductsView user={currentUser} />}
        {currentView === 'sales' && <SalesView user={currentUser} />}
        {currentView === 'manufacturing' && <ManufacturingView user={currentUser} />}
        {currentView === 'financial' && <FinancialView user={currentUser} />}
        {currentView === 'settings' && <SettingsView user={currentUser} />}
      </main>
    </div>
  );
}

export default App;
