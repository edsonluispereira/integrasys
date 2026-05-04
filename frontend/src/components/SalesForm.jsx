import React, { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';

function SalesForm({ onSubmit, onCancel, customers, products, order }) {
  const isEditing = !!order;

  const [customerId, setCustomerId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [items, setItems] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');
  const [search, setSearch] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);

  // Avulso item
  const [isAvulso, setIsAvulso] = useState(false);
  const [avulsoDesc, setAvulsoDesc] = useState('');
  const [avulsoQty, setAvulsoQty] = useState(1);
  const [avulsoPrice, setAvulsoPrice] = useState('');

  // Initial data fetch
  useEffect(() => {
    fetch('/api/payment-methods')
      .then(res => res.json())
      .then(setPaymentMethods)
      .catch(err => console.error('Error fetching payment methods:', err));
  }, []);

  // Pre-fill form when editing an existing order
  useEffect(() => {
    if (order) {
      setCustomerId(order.customerId || '');
      setPaymentMethodId(order.paymentMethodId || '');
      if (order.items && order.items.length > 0) {
        setItems(order.items.map(item => ({
          productId: item.productId || null,
          productName: item.custom_description
            ? item.custom_description
            : (item.product?.description || item.product?.name || ''),
          codItem: item.custom_description ? 'AVULSO' : (item.product?.cod_item || ''),
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          custom_description: item.custom_description || null
        })));
      }
    }
  }, [order]);

  // Filter products for the selected customer:
  // Show products with no customers (available to all) OR products linked to this customer
  const filteredByCustomer = products.filter(p => {
    if (!customerId) return true;
    if (!p.customers || p.customers.length === 0) return true; // available to all
    return p.customers.some(c => c.id === customerId);
  });

  // Apply search filter (by cod_item or description)
  const filteredProducts = filteredByCustomer.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.cod_item.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
  });

  // Auto-fill price from product's unit_price
  const handleProductChange = (e) => {
    const pid = e.target.value;
    setSelectedProductId(pid);
    if (pid) {
      const prod = products.find(p => p.id === pid);
      if (prod && prod.unit_price != null) {
        setUnitPrice(Number(prod.unit_price).toFixed(2));
      } else {
        setUnitPrice('');
      }
    } else {
      setUnitPrice('');
    }
  };

  const selectedCustomer = customers.find(c => c.id === customerId);
  const deliveryLabel = selectedCustomer?.delivery_type === 'RETIRADA'
    ? '🏪 Retirada'
    : selectedCustomer?.delivery_type === 'ENTREGA'
    ? '🚚 Entrega'
    : '—';
  const deliveryColor = selectedCustomer?.delivery_type === 'RETIRADA' ? '#eab308' : '#22c55e';

  const handleAddItem = () => {
    if (!selectedProductId || quantity <= 0 || !unitPrice) return;
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const existingIdx = items.findIndex(i => i.productId === selectedProductId);
    if (existingIdx >= 0) {
      const newItems = [...items];
      newItems[existingIdx].quantity += Number(quantity);
      setItems(newItems);
    } else {
      setItems([...items, {
        productId: selectedProductId,
        productName: product.description,
        codItem: product.cod_item,
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
        custom_description: null
      }]);
    }
    setSelectedProductId('');
    setQuantity(1);
    setUnitPrice('');
    setSearch('');
  };

  const handleAddAvulso = () => {
    if (!avulsoDesc.trim() || avulsoQty <= 0 || !avulsoPrice) return;
    setItems([...items, {
      productId: null,
      productName: avulsoDesc,
      codItem: 'AVULSO',
      quantity: Number(avulsoQty),
      unitPrice: Number(avulsoPrice),
      custom_description: avulsoDesc
    }]);
    setAvulsoDesc('');
    setAvulsoQty(1);
    setAvulsoPrice('');
    setIsAvulso(false);
  };

  const removeItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const updateItemQty = (index, val) => {
    const newItems = [...items];
    newItems[index].quantity = Number(val);
    setItems(newItems);
  };

  const updateItemPrice = (index, val) => {
    const newItems = [...items];
    newItems[index].unitPrice = Number(val);
    setItems(newItems);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerId) return alert('Selecione um cliente!');
    if (items.length === 0) return alert('Adicione pelo menos um item ao pedido!');
    if (!paymentMethodId) return alert('Selecione uma forma de pagamento!');
    onSubmit({ customerId, items, paymentMethodId });
  };

  const totalOrderAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  return (
    <form onSubmit={handleSubmit} className="customer-form">
      <h3>{isEditing ? '✏️ Editar Pedido de Venda' : '✨ Novo Pedido de Venda'}</h3>

      <div className="form-grid" style={{ marginBottom: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <label>
          Cliente:
          <select value={customerId} onChange={(e) => { setCustomerId(e.target.value); setSelectedProductId(''); setSearch(''); }} required>
            <option value="">Selecione um Cliente</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.document})</option>
            ))}
          </select>
        </label>

        <label>
          Forma de Pagamento:
          <select value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)} required>
            <option value="">— Selecione —</option>
            {paymentMethods.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </label>

        {customerId && (
          <label>
            Tipo de Entrega:
            <div style={{
              padding: '0.6rem 1rem',
              background: selectedCustomer?.delivery_type === 'RETIRADA' ? 'rgba(234,179,8,0.12)' : 'rgba(34,197,94,0.12)',
              borderRadius: '8px',
              color: deliveryColor,
              fontWeight: 600,
              marginTop: '0.25rem',
              border: `1px solid ${deliveryColor}44`
            }}>
              {deliveryLabel}
            </div>
          </label>
        )}
      </div>

      <div className="card" style={{ marginTop: '1rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Toggle between product and avulso */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button type="button"
            className={`btn btn-small ${!isAvulso ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setIsAvulso(false)}>
            📦 Produto Cadastrado
          </button>
          <button type="button"
            className={`btn btn-small ${isAvulso ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setIsAvulso(true)}>
            ✏️ Item Avulso
          </button>
        </div>

        {!isAvulso ? (
          <>
            <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#aaa', textTransform: 'uppercase' }}>Adicionar Produto ao Carrinho</h4>

            {/* Search field */}
            <div style={{ marginBottom: '1rem', position: 'relative' }}>
              <input
                type="text"
                placeholder="🔍 Buscar por código ou descrição do produto..."
                value={search}
                onChange={e => { setSearch(e.target.value); setSelectedProductId(''); setUnitPrice(''); }}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', boxSizing: 'border-box' }}
              />
            </div>

            {/* Product select */}
            <div className="form-grid" style={{ gridTemplateColumns: 'minmax(200px, 2fr) 0.8fr 0.8fr auto', marginBottom: '0.5rem' }}>
              <select value={selectedProductId} onChange={handleProductChange}>
                <option value="">— {filteredProducts.length} produto(s) encontrado(s) —</option>
                {filteredProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.cod_item} — {p.description}</option>
                ))}
              </select>
              <input type="number" min="1" placeholder="Qtd" value={quantity} onChange={e => setQuantity(e.target.value)} />
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: '0.8rem' }}>R$</span>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} style={{ paddingLeft: '35px' }} />
              </div>
              <button type="button" onClick={handleAddItem} className="btn btn-secondary">Incluir</button>
            </div>

            {!customerId && (
              <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                ⚠️ Selecione um cliente primeiro para filtrar os produtos permitidos.
              </p>
            )}
          </>
        ) : (
          <>
            <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#aaa', textTransform: 'uppercase' }}>Adicionar Item Avulso</h4>
            <div className="form-grid" style={{ gridTemplateColumns: '2fr 0.8fr 0.8fr auto', marginBottom: '0.5rem' }}>
              <input
                type="text"
                placeholder="Ex.: Peça de reposição / Serviço especial"
                value={avulsoDesc}
                onChange={e => setAvulsoDesc(e.target.value)}
              />
              <input type="number" min="1" placeholder="Qtd" value={avulsoQty} onChange={e => setAvulsoQty(e.target.value)} />
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: '0.8rem' }}>R$</span>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={avulsoPrice} onChange={e => setAvulsoPrice(e.target.value)} style={{ paddingLeft: '35px' }} />
              </div>
              <button type="button" onClick={handleAddAvulso} className="btn btn-secondary">Incluir</button>
            </div>
          </>
        )}

        {items.length > 0 && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem' }}>📋 Resumo dos Itens</h4>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Código</th>
                  <th>Produto / Descrição</th>
                  <th style={{ textAlign: 'center' }}>Qtd</th>
                  <th style={{ textAlign: 'right' }}>V. Unit.</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <span style={{
                        fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
                        background: item.custom_description ? 'rgba(234,179,8,0.15)' : 'rgba(99,102,241,0.15)',
                        color: item.custom_description ? '#eab308' : '#818cf8',
                        fontWeight: '700', textTransform: 'uppercase'
                      }}>
                        {item.custom_description ? 'Avulso' : 'Produto'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.9rem' }}>{item.codItem}</td>
                    <td style={{ fontWeight: 500 }}>{item.productName}</td>
                    <td style={{ textAlign: 'center' }}>
                      <input type="number" min="1" value={item.quantity}
                        onChange={e => updateItemQty(idx, e.target.value)}
                        style={{ width: '60px', textAlign: 'center' }} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <input type="number" min="0" step="0.01" value={item.unitPrice}
                        onChange={e => updateItemPrice(idx, e.target.value)}
                        style={{ width: '100px', textAlign: 'right' }} />
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>R$ {(Number(item.unitPrice) * item.quantity).toFixed(2)}</td>
                    <td style={{ textAlign: 'center' }}><button type="button" onClick={() => removeItem(idx)} className="btn btn-icon btn-danger" title="Remover">🗑️</button></td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <td colSpan="5" style={{ textAlign: 'right', fontSize: '1.1rem' }}><strong>Valor Total do Pedido:</strong></td>
                  <td colSpan="2" style={{ textAlign: 'right', fontSize: '1.2rem', color: 'var(--primary)' }}><strong>R$ {totalOrderAmount.toFixed(2)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="form-actions" style={{ marginTop: '2.5rem', justifyContent: 'flex-end', gap: '1rem' }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={items.length === 0 || !customerId || !paymentMethodId} style={{ minWidth: '200px' }}>
          {isEditing ? '💾 Salvar Alterações' : '✅ Finalizar e Gravar Pedido'}
        </button>
      </div>
    </form>
  );
}

export default SalesForm;
