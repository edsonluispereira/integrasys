import React, { useState, useEffect } from 'react';
import { FileText, ChevronDown, ChevronRight, Layers, Package, Edit2 } from 'lucide-react';
import { generateManufacturingOrderPDF } from '../utils/pdfGenerator';

function ManufacturingView() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  // Track expanded kit items per order row: { [ofId]: Set<itemId> }
  const [expandedKits, setExpandedKits] = useState({});

  const fetchData = async () => {
    try {
      const res = await fetch('/api/manufacturing');
      setOrders(await res.json());
    } catch (err) {
      console.error('Failed to fetch manufacturing data', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    if (newStatus === 'CANCELLED') {
      const confirm = window.confirm('Tem certeza que deseja CANCELAR esta Ordem de Fabricação? Isso também cancelará o pedido de venda vinculado e seus lançamentos financeiros pendentes.');
      if (!confirm) return;
    }

    try {
      await fetch(`/api/manufacturing/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleEditQuantity = async (itemId, currentQty) => {
    const newQtyStr = window.prompt('Informe a nova quantidade para este item:', currentQty);
    if (!newQtyStr) return;
    
    const newQty = parseInt(newQtyStr, 10);
    if (isNaN(newQty) || newQty <= 0) {
      alert('Quantidade inválida.');
      return;
    }

    try {
      const res = await fetch(`/api/sales/items/${itemId}/quantity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty })
      });
      if (!res.ok) throw new Error();
      fetchData(); // reload orders
    } catch (err) {
      alert('Erro ao atualizar quantidade do item.');
    }
  };

  const toggleKitExpand = (ofId, itemId) => {
    setExpandedKits(prev => {
      const ofSet = new Set(prev[ofId] || []);
      if (ofSet.has(itemId)) {
        ofSet.delete(itemId);
      } else {
        ofSet.add(itemId);
      }
      return { ...prev, [ofId]: ofSet };
    });
  };

  const isExpanded = (ofId, itemId) => {
    return expandedKits[ofId]?.has(itemId) || false;
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR');
  const pieceTypeLabel = (v) => ({ PECA_REDONDA: 'Peça Redonda', GABARITO: 'Gabarito', PECA_RETA: 'Peça Reta' }[v] || v);

  const filteredOrders = orders.filter(of => {
    const matchesSearch =
      of.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      of.salesOrder.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      of.salesOrder.customer.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || of.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Render a single order item (may be kit or simple)
  const renderItem = (item, ofId, ofStatus) => {
    const isKit = item.product?.hasStructure && item.product?.components?.length > 0;
    const expanded = isExpanded(ofId, item.id);

    return (
      <React.Fragment key={item.id}>
        {/* Item principal (pai) */}
        <li style={{
          marginBottom: isKit ? '4px' : '6px',
          padding: isKit ? '8px 10px' : '4px 0',
          borderRadius: isKit ? '8px' : '0',
          background: isKit ? 'rgba(99,102,241,0.08)' : 'transparent',
          border: isKit ? '1px solid rgba(99,102,241,0.2)' : 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            {/* Expand toggle para kits */}
            {isKit ? (
              <button
                onClick={() => toggleKitExpand(ofId, item.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#818cf8', padding: '0', marginTop: '1px', display: 'flex', alignItems: 'center' }}
                title={expanded ? 'Recolher componentes' : 'Expandir componentes'}
              >
                {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            ) : (
              <span style={{ width: '16px', display: 'inline-block' }} />
            )}

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{item.quantity}×</span>
                  {ofStatus !== 'CANCELLED' && ofStatus !== 'COMPLETED' && (
                    <button
                      onClick={() => handleEditQuantity(item.id, item.quantity)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0 2px' }}
                      title="Editar quantidade"
                    >
                      <Edit2 size={12} />
                    </button>
                  )}
                </div>
                {item.product ? (
                  <>
                    <span style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px', fontSize: '0.85rem' }}>
                      {item.product.cod_item}
                    </span>
                    <span style={{ fontWeight: isKit ? 700 : 400 }}>{item.product.description}</span>
                    {isKit && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        background: 'rgba(16,185,129,0.15)', color: '#10b981',
                        border: '1px solid rgba(16,185,129,0.4)',
                        borderRadius: '10px', padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700
                      }}>
                        <Layers size={10} /> KIT
                      </span>
                    )}
                    {item.product.image_url && (
                      <a href={item.product.image_url} target="_blank" rel="noreferrer" style={{ marginLeft: '4px', fontSize: '0.78rem', color: '#6366f1' }}>
                        [📸]
                      </a>
                    )}
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(234,179,8,0.2)', color: '#eab308', marginRight: '5px' }}>
                      AVULSO
                    </span>
                    <span>{item.custom_description || 'Sem descrição'}</span>
                  </>
                )}
              </div>
              {/* Specs do produto pai */}
              {item.product && !isKit && (
                <div style={{ fontSize: '0.76rem', color: '#888', marginTop: '2px', paddingLeft: '22px' }}>
                  {item.product.piece_type ? pieceTypeLabel(item.product.piece_type) : ''}
                  {item.product.material?.name ? ` · ${item.product.material.name}` : ''}
                  {item.product.measurements ? ` · ${item.product.measurements}` : ''}
                </div>
              )}
            </div>
          </div>

          {/* Componentes expandidos do kit */}
          {isKit && expanded && (
            <div style={{ marginTop: '8px', marginLeft: '24px', paddingLeft: '12px', borderLeft: '2px solid rgba(99,102,241,0.3)' }}>
              <div style={{ fontSize: '0.72rem', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', fontWeight: 700 }}>
                Componentes da estrutura:
              </div>
              {item.product.components.map(comp => {
                const totalQty = (item.quantity * Number(comp.quantity)).toFixed(3).replace(/\.?0+$/, '');
                return (
                  <div key={comp.componentId} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '8px',
                    padding: '5px 8px', marginBottom: '4px',
                    background: 'rgba(255,255,255,0.03)', borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    <Package size={13} color="#6366f1" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, color: '#a5b4fc' }}>{totalQty}×</span>
                        <span style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.08)', padding: '1px 4px', borderRadius: '4px', fontSize: '0.78rem', color: '#c4b5fd' }}>
                          {comp.component?.cod_item}
                        </span>
                        <span style={{ fontSize: '0.85rem' }}>{comp.component?.description}</span>
                        {item.quantity > 1 && (
                          <span style={{ fontSize: '0.72rem', color: '#666', fontStyle: 'italic' }}>
                            ({Number(comp.quantity)}× por unid. × {item.quantity} pedido)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.73rem', color: '#666', marginTop: '2px' }}>
                        {comp.component?.piece_type ? pieceTypeLabel(comp.component.piece_type) : ''}
                        {comp.component?.material?.name ? ` · ${comp.component.material.name}` : ''}
                        {comp.component?.measurements ? ` · ${comp.component.measurements}` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </li>
      </React.Fragment>
    );
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <h2>Ordem de Fabricação (Produção)</h2>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '200px' }}>
            <input
              type="text"
              placeholder="Buscar por ID ou Cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            >
              <option value="ALL">Todos os Status</option>
              <option value="PENDING">Pendente</option>
              <option value="IN_PROGRESS">Em Produção</option>
              <option value="COMPLETED">Concluído</option>
              <option value="CANCELLED">Cancelados</option>
            </select>
          </div>
          {(searchTerm || statusFilter !== 'ALL') && (
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
              className="btn btn-secondary"
              style={{ padding: '0 20px' }}
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {filteredOrders.length === 0 ? (
          <p className="empty-state">Nenhuma Ordem de Fabricação encontrada para os filtros aplicados.</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>OF ID</th>
                  <th>Pedido Vinculado</th>
                  <th>Cliente</th>
                  <th>Itens</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((of) => (
                  <tr key={of.id} style={{ opacity: of.status === 'CANCELLED' ? 0.6 : 1 }}>
                    <td><strong>{of.id.slice(0, 8).toUpperCase()}</strong></td>
                    <td>{of.salesOrder.id.slice(0, 8).toUpperCase()} ({formatDate(of.salesOrder.date)})</td>
                    <td>{of.salesOrder.customer.name}</td>
                    <td>
                      <ul style={{ margin: 0, padding: 0, textAlign: 'left', listStyleType: 'none' }}>
                        {of.salesOrder.items.map(item => renderItem(item, of.id, of.status))}
                      </ul>
                    </td>
                    <td>
                      <span className={`status-badge ${of.status.toLowerCase()}`}>
                        {of.status === 'PENDING' && 'Pendente'}
                        {of.status === 'IN_PROGRESS' && 'Em Produção'}
                        {of.status === 'COMPLETED' && 'Concluído'}
                        {of.status === 'CANCELLED' && 'Cancelado'}
                      </span>
                    </td>
                    <td>
                      <select
                        value={of.status}
                        onChange={(e) => handleStatusChange(of.id, e.target.value)}
                        className="btn btn-small"
                        disabled={of.status === 'CANCELLED' || of.status === 'COMPLETED'}
                      >
                        <option value="PENDING">Pendente</option>
                        <option value="IN_PROGRESS">Em Produção</option>
                        <option value="COMPLETED">Concluir</option>
                        <option value="CANCELLED">Cancelar</option>
                      </select>
                      <button
                        onClick={() => generateManufacturingOrderPDF(of)}
                        className="btn btn-small btn-primary"
                        style={{marginLeft: '5px', display: 'inline-flex', alignItems: 'center', gap: '4px'}}
                        title="Gerar PDF"
                        disabled={of.status === 'CANCELLED'}
                      >
                        <FileText size={16} /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManufacturingView;
