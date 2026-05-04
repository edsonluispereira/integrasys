import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Printer, CheckCircle2, Clock, Calendar, Briefcase } from 'lucide-react';

function FinancialView({ user }) {
  const canWrite = user?.permissions?.includes('ADMIN') || user?.permissions?.includes('FINANCE_WRITE');
  const [transactions, setTransactions] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [activeTab, setActiveTab] = useState('RECEIVABLE'); // RECEIVABLE or PAYABLE
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  
  // Manual Entry Form State
  const [type, setType] = useState('INCOME');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [supplierId, setSupplierId] = useState('');
  
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [finRes, supRes] = await Promise.all([
        fetch('/api/financial'),
        fetch('/api/suppliers')
      ]);
      const finData = await finRes.json();
      const supData = await supRes.json();
      setTransactions(finData);
      setSuppliers(supData);
    } catch (err) {
      console.error('Failed to fetch financial data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync type with activeTab when tab changes
  useEffect(() => {
    setType(activeTab === 'RECEIVABLE' ? 'INCOME' : 'EXPENSE');
    setSupplierId('');
  }, [activeTab]);

  const filteredTransactions = transactions.filter(tx => {
    // Tab Filter
    if (activeTab === 'RECEIVABLE' && tx.type !== 'INCOME') return false;
    if (activeTab === 'PAYABLE' && tx.type !== 'EXPENSE') return false;

    const matchesSearch = 
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.salesOrder?.id && tx.salesOrder.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tx.supplier?.name && tx.supplier.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'ALL' || tx.status === statusFilter;
    const matchesDate = !dateFilter || tx.dueDate.startsWith(dateFilter);

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/financial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type, 
          description, 
          amount, 
          dueDate, 
          status: 'PENDING',
          supplierId: type === 'EXPENSE' ? supplierId : null
        })
      });
      setDescription('');
      setAmount('');
      setDueDate('');
      setSupplierId('');
      fetchData();
    } catch (err) {
      console.error('Failed to create transaction', err);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    let paymentDate = null;
    if (newStatus === 'PAID') {
      const today = new Date().toISOString().split('T')[0];
      const dateInput = window.prompt("Confirme a Data de Pagamento/Recebimento (AAAA-MM-DD):", today);
      if (dateInput === null) return; // User cancelled
      paymentDate = dateInput;
    }

    try {
      await fetch(`/api/financial/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, paymentDate })
      });
      fetchData();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const generateReceipt = (tx) => {
    const paymentDateStr = tx.paymentDate ? new Date(tx.paymentDate).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
    const receiptHtml = `
      <html>
        <head>
          <title>Recibo - ${tx.id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .receipt-container { border: 2px solid #333; padding: 40px; border-radius: 4px; max-width: 800px; margin: auto; position: relative; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            h1 { margin: 0; letter-spacing: 2px; }
            .amount-box { position: absolute; top: 40px; right: 40px; border: 2px solid #333; padding: 10px 20px; font-weight: bold; font-size: 1.2rem; }
            .content { margin-bottom: 50px; font-size: 1.1rem; }
            .field { margin: 15px 0; border-bottom: 1px dotted #ccc; padding-bottom: 5px; }
            .field span { font-weight: bold; min-width: 150px; display: inline-block; }
            .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }
            .signature-box { border-top: 1px solid #333; width: 300px; text-align: center; padding-top: 10px; margin-top: 40px; }
            .meta { font-size: 0.8rem; color: #666; margin-top: 20px; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="receipt-container">
            <div class="amount-box">R$ ${Number(tx.amount).toFixed(2)}</div>
            <div class="header">
              <h1>RECIBO</h1>
            </div>
            <div class="content">
              <div class="field"><span>Recebemos de:</span> ${tx.salesOrder?.customer?.name || '________________________________'}</div>
              <div class="field"><span>A importância de:</span> <b>(R$ ${Number(tx.amount).toFixed(2)})</b></div>
              <div class="field"><span>Referente a:</span> ${tx.description} ${tx.salesOrder ? `(Pedido ${tx.salesOrder.id.slice(0, 8).toUpperCase()})` : ''}</div>
            </div>
            <div class="footer">
              <div>
                <p>Data do Recebimento: <b>${paymentDateStr}</b></p>
                <p class="meta">Integrasys ERP - Sistema de Gestão</p>
              </div>
              <div class="signature-box">
                Assinatura do Recebedor
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    win.document.write(receiptHtml);
    win.document.close();
  };

  const totals = transactions.reduce((acc, tx) => {
    if (tx.status === 'PAID') {
      if (tx.type === 'INCOME') acc.incomePaid += Number(tx.amount);
      if (tx.type === 'EXPENSE') acc.expensePaid += Number(tx.amount);
    } else {
      if (tx.type === 'INCOME') acc.incomePending += Number(tx.amount);
      if (tx.type === 'EXPENSE') acc.expensePending += Number(tx.amount);
    }
    return acc;
  }, { incomePaid: 0, expensePaid: 0, incomePending: 0, expensePending: 0 });

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h2>Módulo Financeiro</h2>
          <p style={{color: 'var(--text-muted)'}}>Controle de fluxo de caixa e integração com vendas.</p>
        </div>
      </div>

      <div className="summary-cards-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="summary-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <h3>Saldo em Conta</h3>
              <p style={{ fontSize: '1.8rem', fontWeight: '800', color: '#10b981' }}>R$ {(totals.incomePaid - totals.expensePaid).toFixed(2)}</p>
              <span style={{fontSize: '0.8rem', color: '#888'}}>Total já recebido menos despesas pagas</span>
            </div>
            <DollarSign size={32} opacity={0.2} color="#10b981" />
          </div>
        </div>
        
        <div className="summary-card" style={{ borderLeft: '4px solid #818cf8', cursor: 'pointer', background: activeTab === 'RECEIVABLE' ? 'var(--card-bg-hover)' : '' }} onClick={() => setActiveTab('RECEIVABLE')}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <h3>Contas a Receber</h3>
              <p style={{ fontSize: '1.8rem', fontWeight: '800', color: '#818cf8' }}>R$ {totals.incomePending.toFixed(2)}</p>
              <span style={{fontSize: '0.8rem', color: '#888'}}>Entradas pendentes (Pedidos em aberto)</span>
            </div>
            <ArrowUpRight size={32} opacity={0.2} color="#818cf8" />
          </div>
        </div>

        <div className="summary-card" style={{ borderLeft: '4px solid #ef4444', cursor: 'pointer', background: activeTab === 'PAYABLE' ? 'var(--card-bg-hover)' : '' }} onClick={() => setActiveTab('PAYABLE')}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <h3>Contas a Pagar</h3>
              <p style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ef4444' }}>R$ {totals.expensePending.toFixed(2)}</p>
              <span style={{fontSize: '0.8rem', color: '#888'}}>Despesas e faturas pendentes</span>
            </div>
            <ArrowDownRight size={32} opacity={0.2} color="#ef4444" />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('RECEIVABLE')}
          className={`tab-btn ${activeTab === 'RECEIVABLE' ? 'active' : ''}`}
          style={{ 
            background: 'none', border: 'none', color: activeTab === 'RECEIVABLE' ? 'var(--primary)' : '#888',
            fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', padding: '0.5rem 1rem',
            borderBottom: activeTab === 'RECEIVABLE' ? '3px solid var(--primary)' : '3px solid transparent',
            transition: 'all 0.3s'
          }}
        >
          📈 Contas a Receber
        </button>
        <button 
          onClick={() => setActiveTab('PAYABLE')}
          className={`tab-btn ${activeTab === 'PAYABLE' ? 'active' : ''}`}
          style={{ 
            background: 'none', border: 'none', color: activeTab === 'PAYABLE' ? '#ef4444' : '#888',
            fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', padding: '0.5rem 1rem',
            borderBottom: activeTab === 'PAYABLE' ? '3px solid #ef4444' : '3px solid transparent',
            transition: 'all 0.3s'
          }}
        >
          📉 Contas a Pagar
        </button>
      </div>

      <div className="card" style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={20} /> {activeTab === 'RECEIVABLE' ? 'Novo Recebimento' : 'Novo Pagamento'}
        </h3>
        <form onSubmit={handleCreate} className="form-grid" style={{ gridTemplateColumns: activeTab === 'PAYABLE' ? '2fr 1fr 1fr 1.5fr auto' : '2fr 1fr 1fr auto' }}>
          <input type="text" placeholder="Ex: Aluguel, Compra de Material..." required value={description} onChange={e => setDescription(e.target.value)} />
          <div style={{position: 'relative'}}>
            <span style={{position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666'}}>R$</span>
            <input type="number" step="0.01" min="0" placeholder="0.00" required value={amount} onChange={e => setAmount(e.target.value)} style={{paddingLeft: '35px'}} />
          </div>
          <input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} />
          
          {activeTab === 'PAYABLE' && (
             <select value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                <option value="">Selecione o Fornecedor</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
             </select>
          )}

          <button type="submit" className={`btn ${activeTab === 'RECEIVABLE' ? 'btn-primary' : 'btn-danger'}`} style={{ background: activeTab === 'PAYABLE' ? '#ef4444' : '' }}>Lançar</button>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '15px' }}>
          <h3>Extrato: {activeTab === 'RECEIVABLE' ? 'Contas a Receber' : 'Contas a Pagar'}</h3>
          <div style={{ display: 'flex', gap: '10px', flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="🔍 Buscar descrição, pedido ou fornecedor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', minWidth: '220px' }}
            />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            >
              <option value="ALL">Todos Status</option>
              <option value="PENDING">Pendentes</option>
              <option value="PAID">Pagos</option>
            </select>
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
            {(searchTerm || statusFilter !== 'ALL' || dateFilter) && (
              <button 
                onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setDateFilter(''); }}
                className="btn btn-secondary btn-small"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vencimento</th>
                <th>Pagamento</th>
                <th>Descrição / Origem</th>
                <th>Destino/Fornecedor</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(tx => (
                <tr key={tx.id}>
                  <td>{formatDate(tx.dueDate)}</td>
                  <td style={{ color: tx.paymentDate ? '#818cf8' : '#888' }}>
                    {tx.paymentDate ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> {formatDate(tx.paymentDate)}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{tx.description}</div>
                    {tx.salesOrder && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                        🔗 PEDIDO: {tx.salesOrder.id.slice(0, 8).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td>
                    {tx.supplier ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontWeight: 600 }}>
                        <Briefcase size={14} /> {tx.supplier.name}
                      </div>
                    ) : (
                      tx.salesOrder?.customer?.name || '—'
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700', color: tx.type === 'EXPENSE' ? '#ef4444' : '#10b981' }}>
                    {tx.type === 'EXPENSE' ? '-' : '+'} R$ {Number(tx.amount).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`status-badge ${tx.status.toLowerCase()}`}>
                      {tx.status === 'PENDING' ? 'Pendente' : 'Pago'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                      <select 
                        value={tx.status} 
                        onChange={(e) => handleStatusChange(tx.id, e.target.value)}
                        className="btn btn-small"
                        style={{ width: '120px', cursor: !canWrite ? 'not-allowed' : 'pointer' }}
                        disabled={!canWrite}
                        title={!canWrite ? 'Você não tem permissão para alterar o status' : ''}
                      >
                        <option value="PENDING">Pendente</option>
                        <option value="PAID">Marcar Pago</option>
                      </select>
                      {tx.type === 'INCOME' && (
                        <button onClick={() => generateReceipt(tx)} className="btn btn-small btn-secondary" title="Imprimir Recibo">
                          <Printer size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>Nenhuma transação encontrada para os filtros aplicados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default FinancialView;
