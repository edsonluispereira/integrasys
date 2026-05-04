import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Factory, Users, Package, TrendingUp, Clock, 
  CheckCircle2, AlertCircle, Truck, PackageCheck, 
  DollarSign, ArrowUpRight, ArrowDownRight, Wallet 
} from 'lucide-react';

function DashboardView() {
  const now = new Date();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());

  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  const years = [];
  for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) {
    years.push(y);
  }

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/stats?month=${filterMonth}&year=${filterYear}`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching dashboard stats:', err);
        setLoading(false);
      });
  }, [filterMonth, filterYear]);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (!stats && loading) return <div className="loading">Carregando Dashboard...</div>;
  if (!stats) return <div className="error">Erro ao carregar dados do dashboard.</div>;

  // Financial Calculations
  const currentBalance = stats.finance.income_paid - stats.finance.expense_paid;
  const projectedBalance = (stats.finance.income_paid + stats.finance.income_pending) - (stats.finance.expense_paid + stats.finance.expense_pending);

  return (
    <div className="view-container">
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Dashboard Visão Geral</h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>Métricas em tempo real do sistema</p>
        </div>

        {/* Filtro de Período */}
        <div style={{ 
          display: 'flex', 
          gap: '1.5rem', 
          background: 'rgba(0,0,0,0.03)', 
          padding: '0.75rem 1.25rem', 
          borderRadius: '16px', 
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.65rem', color: '#3b82f6', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mês</span>
            <select 
              value={filterMonth} 
              onChange={(e) => setFilterMonth(parseInt(e.target.value))}
              style={{ background: 'transparent', color: '#1a1d21', border: 'none', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', outline: 'none', padding: '0' }}
            >
              {months.map(m => <option key={m.value} value={m.value} style={{ background: '#fff', color: '#1a1d21' }}>{m.label}</option>)}
            </select>
          </div>
          
          <div style={{ width: '1px', background: 'rgba(0,0,0,0.1)', margin: '4px 0' }}></div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.65rem', color: '#3b82f6', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ano</span>
            <select 
              value={filterYear} 
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
              style={{ background: 'transparent', color: '#1a1d21', border: 'none', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', outline: 'none', padding: '0' }}
            >
              {years.map(y => <option key={y} value={y} style={{ background: '#fff', color: '#1a1d21' }}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main summary cards (KPIs) */}
      <div className="summary-cards-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="summary-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>Saldo em Caixa (Pago)</h3>
              <p style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0.5rem 0', color: currentBalance >= 0 ? '#10b981' : '#ef4444' }}>
                {formatCurrency(currentBalance)}
              </p>
            </div>
            <Wallet size={40} opacity={0.2} color="#10b981" />
          </div>
        </div>
        
        <div className="summary-card" style={{ borderLeft: '4px solid #818cf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>A Receber (Pendente)</h3>
              <p style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0.5rem 0', color: '#818cf8' }}>
                {formatCurrency(stats.finance.income_pending)}
              </p>
            </div>
            <ArrowUpRight size={40} opacity={0.2} color="#818cf8" />
          </div>
        </div>

        <div className="summary-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>A Pagar (Pendente)</h3>
              <p style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0.5rem 0', color: '#ef4444' }}>
                {formatCurrency(stats.finance.expense_pending)}
              </p>
            </div>
            <ArrowDownRight size={40} opacity={0.2} color="#ef4444" />
          </div>
        </div>

        <div className="summary-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>Saldo Projetado</h3>
              <p style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0.5rem 0', color: projectedBalance >= 0 ? '#f59e0b' : '#ef4444' }}>
                {formatCurrency(projectedBalance)}
              </p>
            </div>
            <TrendingUp size={40} opacity={0.2} color="#f59e0b" />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        {/* Sales Status Section */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
            <ShoppingCart size={24} color="#3b82f6" />
            <h3 style={{ margin: 0 }}>📊 Fluxo de Pedidos</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '12px', border: '1px solid #bae6fd' }}>
              <span style={{ color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}><Clock size={14} /> Em Aberto</span>
              <p style={{ margin: '8px 0 2px', fontSize: '1.1rem', fontWeight: '700', color: '#000' }}>{stats.sales.OPEN.count} pedidos</p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>{formatCurrency(stats.sales.OPEN.total)}</p>
            </div>

            <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
              <span style={{ color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}><CheckCircle2 size={14} /> Faturado</span>
              <p style={{ margin: '8px 0 2px', fontSize: '1.1rem', fontWeight: '700', color: '#000' }}>{stats.sales.CLOSED.count} pedidos</p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>{formatCurrency(stats.sales.CLOSED.total)}</p>
            </div>

            <div style={{ background: '#fff7ed', padding: '1rem', borderRadius: '12px', border: '1px solid #ffedd5' }}>
              <span style={{ color: '#c2410c', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}><Truck size={14} /> Expedição</span>
              <p style={{ margin: '8px 0 2px', fontSize: '1.1rem', fontWeight: '700', color: '#000' }}>{stats.sales.EXPEDICAO.count} pedidos</p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>{formatCurrency(stats.sales.EXPEDICAO.total)}</p>
            </div>

            <div style={{ background: '#eef2ff', padding: '1rem', borderRadius: '12px', border: '1px solid #e0e7ff' }}>
              <span style={{ color: '#4338ca', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}><PackageCheck size={14} /> Finalizado</span>
              <p style={{ margin: '8px 0 2px', fontSize: '1.1rem', fontWeight: '700', color: '#000' }}>{stats.sales.FINALIZADO.count} pedidos</p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>{formatCurrency(stats.sales.FINALIZADO.total)}</p>
            </div>
          </div>
        </div>

        {/* Manufacturing Status Section */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
            <Factory size={24} color="#818cf8" />
            <h3 style={{ margin: 0 }}>⚙️ Ordem de Fabricação (Produção)</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1.2rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: '700', color: '#b45309' }}>PENDENTES</p>
              <p style={{ margin: '8px 0 0', fontSize: '2.2rem', fontWeight: '800', color: '#000' }}>{stats.manufacturing.PENDING}</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1.2rem', background: '#eef2ff', border: '1px solid #e0e7ff', borderRadius: '12px' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: '700', color: '#4338ca' }}>PRODUZINDO</p>
              <p style={{ margin: '8px 0 0', fontSize: '2.2rem', fontWeight: '800', color: '#000' }}>{stats.manufacturing.IN_PROGRESS}</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1.2rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
              <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: '700', color: '#15803d' }}>PRONTAS</p>
              <p style={{ margin: '8px 0 0', fontSize: '2.2rem', fontWeight: '800', color: '#000' }}>{stats.manufacturing.COMPLETED}</p>
            </div>
          </div>
          
          <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#888', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>📦 Total de OFs Ativas:</span>
            <strong>{stats.manufacturing.PENDING + stats.manufacturing.IN_PROGRESS + stats.manufacturing.COMPLETED}</strong>
          </div>
        </div>
      </div>

      {/* System Summary (Lower grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '12px', borderRadius: '10px' }}><Users size={24} /></div>
          <div>
            <h4 style={{ margin: 0, color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Clientes Ativos</h4>
            <p style={{ margin: '4px 0 0', fontSize: '1.4rem', fontWeight: '700' }}>{stats.totals.customers}</p>
          </div>
        </div>
        <div className="card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(129,140,248,0.1)', color: '#818cf8', padding: '12px', borderRadius: '10px' }}><Package size={24} /></div>
          <div>
            <h4 style={{ margin: 0, color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Produtos no Catálogo</h4>
            <p style={{ margin: '4px 0 0', fontSize: '1.4rem', fontWeight: '700' }}>{stats.totals.products}</p>
          </div>
        </div>
        <div className="card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '12px', borderRadius: '10px' }}><DollarSign size={24} /></div>
          <div>
            <h4 style={{ margin: 0, color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' }}>Total Recebido</h4>
            <p style={{ margin: '4px 0 0', fontSize: '1.4rem', fontWeight: '700' }}>{formatCurrency(stats.finance.income_paid)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardView;
