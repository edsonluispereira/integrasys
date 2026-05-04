import React, { useState } from 'react';
import { FileText, CheckCircle, DollarSign, Receipt } from 'lucide-react';
import { generateSalesOrderPDF } from '../utils/pdfGenerator';
import BillingModal from './BillingModal';
import NFePreviewModal from './NFePreviewModal';

function SalesList({ orders, onStatusChange, onEdit, onRefresh }) {
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isNFeModalOpen, setIsNFeModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  if (orders.length === 0) {
    return <p className="empty-state">Nenhum pedido de venda encontrado.</p>;
  }

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR');

  const deliveryBadge = (type) => {
    if (type === 'RETIRADA') return <span style={{ color: '#eab308', fontWeight: 600 }}>🏪 Retirada</span>;
    if (type === 'ENTREGA') return <span style={{ color: '#22c55e', fontWeight: 600 }}>🚚 Entrega</span>;
    return <span style={{ color: '#888' }}>—</span>;
  };

  const statusBadge = (s) => {
    const style = {
      OPEN: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', label: 'Aberto' },
      CLOSED: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Faturado' },
      EXPEDICAO: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'Expedição' },
      FINALIZADO: { bg: 'rgba(99,102,241,0.1)', color: '#818cf8', label: 'Finalizado' },
      CANCELLED: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'Cancelado' }
    }[s] || { bg: '#333', color: '#fff', label: s };

    return (
      <span style={{ 
        padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700',
        backgroundColor: style.bg, color: style.color, border: `1px solid ${style.color}33`,
        textTransform: 'uppercase'
      }}>
        {style.label}
      </span>
    );
  };

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID Pedido</th>
            <th>Data</th>
            <th>Cliente</th>
            <th>Pagamento</th>
            <th>Entrega</th>
            <th style={{ textAlign: 'right' }}>Total</th>
            <th style={{ textAlign: 'center' }}>Status</th>
            <th style={{ textAlign: 'right' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td><span style={{ fontFamily: 'monospace', opacity: 0.7 }}>{order.id.slice(0, 8).toUpperCase()}</span></td>
              <td>{formatDate(order.date)}</td>
              <td><strong>{order.customer?.name}</strong></td>
              <td>
                <span style={{ fontSize: '0.85rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {order.paymentMethod ? order.paymentMethod.name : <span style={{opacity: 0.5}}>Não definido</span>}
                </span>
              </td>
              <td>{deliveryBadge(order.delivery_type)}</td>
              <td style={{ textAlign: 'right', fontWeight: '700' }}>R$ {Number(order.totalAmount).toFixed(2)}</td>
              <td style={{ textAlign: 'center' }}>{statusBadge(order.status)}</td>
              <td style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                  {order.status === 'EXPEDICAO' && (
                    <button 
                      onClick={() => onStatusChange(order.id, 'FINALIZADO')}
                      className="btn btn-small"
                      style={{ background: '#818cf8', color: '#fff' }}
                      title="Marcar como Entregue/Finalizado"
                    >
                      <CheckCircle size={14} style={{marginRight: '4px'}} /> Entregar
                    </button>
                  )}
                  
                  <select
                    value={order.status}
                    onChange={(e) => onStatusChange(order.id, e.target.value)}
                    className="btn btn-small"
                    style={{ width: '110px' }}
                  >
                    <option value="OPEN">Aberto</option>
                    <option value="EXPEDICAO">Expedição</option>
                    <option value="FINALIZADO">Finalizado</option>
                    <option value="CANCELLED">Cancelar</option>
                  </select>

                  {order.status !== 'CLOSED' && order.status !== 'FINALIZADO' && order.status !== 'CANCELLED' && (
                    <button 
                      onClick={() => { setSelectedOrder(order); setIsBillingModalOpen(true); }}
                      className="btn btn-small"
                      style={{ background: '#10b981', color: '#fff' }}
                      title="Faturar Pedido (Gerar Financeiro)"
                    >
                      <DollarSign size={14} style={{marginRight: '4px'}} /> Faturar
                    </button>
                  )}

                  {(order.status === 'CLOSED' || order.status === 'FINALIZADO') && (
                    <button 
                      onClick={() => { setSelectedOrder(order); setIsNFeModalOpen(true); }}
                      className="btn btn-small"
                      style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: '1px solid #818cf8' }}
                      title="Gerenciar NF-e"
                    >
                      <Receipt size={14} style={{marginRight: '4px'}} /> NF-e
                    </button>
                  )}

                  <button
                    onClick={() => onEdit(order)}
                    className="btn btn-small btn-secondary"
                    title="Editar"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => generateSalesOrderPDF(order)}
                    className="btn btn-small"
                    title="PDF"
                  >
                    <FileText size={16} />
                  </button>

                  {order.status !== 'CANCELLED' && order.status !== 'FINALIZADO' && (
                    order.manufacturing ? (
                      <span className="status-badge in_progress" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        ⚙️ OF Criada
                      </span>
                    ) : (
                      <button
                        onClick={async () => {
                          if (window.confirm('Gerar Ordem de Fabricação para este pedido?')) {
                            try {
                              const res = await fetch(`/api/manufacturing/from-sales/${order.id}`, { method: 'POST' });
                              if (res.ok) {
                                alert('OF Gerada com sucesso!');
                                onRefresh(); // Refresh the list
                              } else {
                                alert('Erro ou OF já existente.');
                              }
                            } catch (e) {
                              alert('Erro conexão');
                            }
                          }
                        }}
                        className="btn btn-small btn-primary"
                      >
                        Criar OF
                      </button>
                    )
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedOrder && (
        <BillingModal 
          isOpen={isBillingModalOpen} 
          order={selectedOrder} 
          onClose={() => { setIsBillingModalOpen(false); setSelectedOrder(null); }}
          onInvoiced={onRefresh}
        />
      )}

      {selectedOrder && (
        <NFePreviewModal
          isOpen={isNFeModalOpen}
          orderId={selectedOrder.id}
          onClose={() => { setIsNFeModalOpen(false); setSelectedOrder(null); }}
        />
      )}
    </div>
  );
}

export default SalesList;
