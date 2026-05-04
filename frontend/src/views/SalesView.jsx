import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, User } from 'lucide-react';
import SalesList from '../components/SalesList';
import SalesForm from '../components/SalesForm';

function SalesView() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  // Filter States
  const [filterText, setFilterText] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const fetchData = async () => {
    try {
      const [salesRes, custRes, prodRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/customers'),
        fetch('/api/products')
      ]);
      setOrders(await salesRes.json());
      setCustomers(await custRes.json());
      setProducts(await prodRes.json());
    } catch (err) {
      console.error('Failed to fetch data for sales', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOrder = async (orderData) => {
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (res.ok) {
        setIsCreating(false);
        fetchData();
      } else {
        alert('Erro ao criar pedido.');
      }
    } catch (err) {
      console.error('Failed to create order', err);
    }
  };

  const handleUpdateOrder = async (orderData) => {
    try {
      const res = await fetch(`/api/sales/${editingOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      if (res.ok) {
        setEditingOrder(null);
        fetchData();
      } else {
        alert('Erro ao atualizar pedido.');
      }
    } catch (err) {
      console.error('Failed to update order', err);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await fetch(`/api/sales/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  // 🔍 Filter Logic
  const filteredOrders = orders.filter(order => {
    // 1. Filter by ID or Customer Name
    const matchesText = 
      order.id.toLowerCase().includes(filterText.toLowerCase()) || 
      order.customer?.name.toLowerCase().includes(filterText.toLowerCase());

    // 2. Filter by Date
    const matchesDate = !filterDate || order.date.startsWith(filterDate);

    // 3. Filter by Status
    const matchesStatus = filterStatus === 'ALL' || order.status === filterStatus;

    return matchesText && matchesDate && matchesStatus;
  });

  const showForm = isCreating || editingOrder;

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h2>Vendas e Pedidos</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gerencie suas vendas e monitore o status de cada pedido.</p>
        </div>
        {!showForm && (
          <button onClick={() => setIsCreating(true)} className="btn btn-primary">
            + Novo Pedido
          </button>
        )}
      </div>

      {!showForm && (
        <div className="card" style={{ padding: '1.2rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr auto', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Buscar por ID ou Nome do Cliente..." 
                style={{ width: '100%', paddingLeft: '40px' }}
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="date" 
                style={{ width: '100%', paddingLeft: '40px' }}
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <Filter size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <select 
                style={{ width: '100%', paddingLeft: '40px' }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">Todos os Status</option>
                <option value="OPEN">Aberto</option>
                <option value="CLOSED">Faturado</option>
                <option value="EXPEDICAO">Expedição</option>
                <option value="FINALIZADO">Finalizado</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>

            <button 
              className="btn btn-secondary" 
              style={{ height: '42px', padding: '0 1rem' }}
              onClick={() => {
                setFilterText('');
                setFilterDate('');
                setFilterStatus('ALL');
              }}
            >
              🔄 Limpar
            </button>
          </div>
        </div>
      )}

      {showForm ? (
        <div className="card">
          <SalesForm
            customers={customers}
            products={products}
            order={editingOrder}
            onSubmit={editingOrder ? handleUpdateOrder : handleCreateOrder}
            onCancel={() => { setIsCreating(false); setEditingOrder(null); }}
          />
        </div>
      ) : (
        <div className="card">
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Lista de Pedidos ({filteredOrders.length})</h3>
          </div>
          <SalesList
            orders={filteredOrders}
            onStatusChange={handleStatusChange}
            onEdit={(order) => setEditingOrder(order)}
            onRefresh={fetchData}
          />
        </div>
      )}
    </div>
  );
}

export default SalesView;
