import React, { useState, useEffect } from 'react';
import { X, FileText, Send, Building2, User, Package } from 'lucide-react';

function NFePreviewModal({ orderId, isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && orderId) {
      setLoading(true);
      fetch(`/api/nfe/preview/${orderId}`)
        .then(res => res.json())
        .then(data => {
          setData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1100, backdropFilter: 'blur(8px)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
          <X size={24} />
        </button>

        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText color="var(--primary)" /> Pré-visualização da NF-e
          </h2>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>Verifique os itens e dados fiscais antes da transmissão para a SEFAZ.</p>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Carregando dados fiscais...</div>
        ) : data ? (
          <div>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '0.5rem' }}><Building2 size={16} /> EMITENTE</h4>
                    <div style={{ fontSize: '0.9rem' }}>
                        <strong>{data.issuer?.name || 'Empresa não configurada'}</strong><br/>
                        CNPJ: {data.issuer?.cnpj || '—'}<br/>
                        IE: {data.issuer?.ie || '—'}
                    </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '0.5rem' }}><User size={16} /> DESTINATÁRIO</h4>
                    <div style={{ fontSize: '0.9rem' }}>
                        <strong>{data.customer?.name}</strong><br/>
                        DOC: {data.customer?.document}<br/>
                        Cidade: {data.customer?.city} ({data.customer?.state})
                    </div>
                </div>
             </div>

             <h4 style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Package size={16} /> ITENS DO DOCUMENTO</h4>
             <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                        <tr>
                            <th>Descrição</th>
                            <th>NCM</th>
                            <th>CFOP</th>
                            <th style={{ textAlign: 'center' }}>Qtd</th>
                            <th style={{ textAlign: 'right' }}>V. Unit</th>
                            <th style={{ textAlign: 'right' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.items.map((item, idx) => (
                            <tr key={idx}>
                                <td>{item.description}</td>
                                <td><span style={{ fontFamily: 'monospace' }}>{item.ncm}</span></td>
                                <td>{item.cfop}</td>
                                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                <td style={{ textAlign: 'right' }}>R$ {item.unitPrice.toFixed(2)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold' }}>R$ {(item.quantity * item.unitPrice).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan="5" style={{ textAlign: 'right', fontWeight: 'bold', paddingTop: '1rem' }}>VALOR TOTAL DA NOTA:</td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)', paddingTop: '1rem' }}>R$ {data.total.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
             </div>

             <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button onClick={onClose} className="btn btn-secondary">Fechar</button>
                <button 
                  onClick={() => alert('Integração com SEFAZ em desenvolvimento...')} 
                  className="btn btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.8rem 2rem' }}
                >
                    <Send size={18} /> Transmitir para SEFAZ
                </button>
             </div>
          </div>
        ) : (
          <div style={{ color: '#ef4444' }}>Erro ao carregar dados. Verifique as configurações fiscais do pedido.</div>
        )}
      </div>
    </div>
  );
}

export default NFePreviewModal;
