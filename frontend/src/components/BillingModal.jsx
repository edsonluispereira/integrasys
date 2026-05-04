import React, { useState, useEffect } from 'react';
import { X, Calendar, CreditCard, Layers } from 'lucide-react';

function BillingModal({ order, isOpen, onClose, onInvoiced }) {
  const [methods, setMethods] = useState([]);
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [firstDueDate, setFirstDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [installments, setInstallments] = useState(1);
  const [markAsPaid, setMarkAsPaid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [explodeKit, setExplodeKit] = useState(false); // false = Faturar Item Pai, true = Faturar Componentes

  useEffect(() => {
    if (isOpen) {
      fetch('/api/payment-methods')
        .then(res => res.json())
        .then(data => {
          setMethods(data);
          if (data.length > 0) setPaymentMethodId(data[0].id);
        })
        .catch(err => console.error('Error fetching payment methods', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const total = Number(order.totalAmount);
  const perInstallment = (total / installments).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/${order.id}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paymentMethodId, 
          firstDueDate, 
          installments: Number(installments),
          markAsPaid,
          explodeKit
        })
      });
      
      if (res.ok) {
        onInvoiced();
        onClose();
      } else {
        alert('Erro ao gerar faturamento.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(4px)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
          <X size={24} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Faturar Pedido</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gerar títulos de contas a receber para o pedido <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--primary)' }}>{order.id.slice(0, 8).toUpperCase()}</span></p>
        </div>

        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#64748b' }}>
            <span>Total do Pedido:</span>
            <span style={{ fontWeight: '800', color: '#0f172a' }}>R$ {total.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CreditCard size={14} /> FORMA DE PAGAMENTO</label>
            <select 
              value={paymentMethodId} 
              onChange={e => setPaymentMethodId(e.target.value)}
              required
              style={{ width: '100%' }}
            >
              {methods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={14} /> PRIMEIRO VENCIMENTO</label>
            <input 
              type="date" 
              value={firstDueDate} 
              onChange={e => setFirstDueDate(e.target.value)} 
              required
              style={{ width: '100%' }}
            />
          </div>

          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Layers size={14} /> NÚMERO DE PARCELAS</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="number" 
                min="1" 
                max="24" 
                value={installments} 
                onChange={e => setInstallments(e.target.value)} 
                required
                style={{ flex: 1 }}
              />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '120px' }}>
                {installments > 1 ? `${installments}x de R$ ${perInstallment}` : 'À vista'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '0.5rem', cursor: 'pointer' }} onClick={() => setMarkAsPaid(!markAsPaid)}>
            <input 
              type="checkbox" 
              checked={markAsPaid} 
              onChange={(e) => setMarkAsPaid(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Recebimento já efetuado? (Baixar no financeiro)</span>
          </div>

          <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', padding: '1rem', borderRadius: '12px', marginTop: '0.5rem' }}>
            <label style={{ fontWeight: '700', fontSize: '0.8rem', color: 'var(--primary)', display: 'block', marginBottom: '0.8rem', textTransform: 'uppercase' }}>Configuração de Nota Fiscal</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input type="radio" name="billingMode" checked={!explodeKit} onChange={() => setExplodeKit(false)} style={{ width: '18px', height: '18px' }} />
                <span style={{ fontSize: '0.9rem' }}>Faturar **Item Principal** (KIT/Conjunto)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input type="radio" name="billingMode" checked={explodeKit} onChange={() => setExplodeKit(true)} style={{ width: '18px', height: '18px' }} />
                <span style={{ fontSize: '0.9rem' }}>Explodir KIT (Faturar por **Componentes**)</span>
              </label>
            </div>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
              {loading ? 'Faturando...' : 'Confirmar Faturamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BillingModal;
