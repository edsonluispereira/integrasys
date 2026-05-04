import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Package, Layers } from 'lucide-react';

function ProductForm({ onSubmit, initialData = null, onCancel, customers }) {
  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    cod_item: initialData?.cod_item || '',
    description: initialData?.description || '',
    measurements: initialData?.measurements || '',
    image_url: initialData?.image_url || '',
    piece_type: initialData?.piece_type || '',
    unit_price: initialData?.unit_price ?? '',
    materialId: initialData?.materialId || '',
    hasStructure: initialData?.hasStructure || false,
    ncm: initialData?.ncm || '',
    cest: initialData?.cest || '',
    cfop_default: initialData?.cfop_default || '',
    tax_origin: initialData?.tax_origin ?? 0,
  });

  // Componentes da estrutura: [{ componentId, quantity, _product }]
  const [structureItems, setStructureItems] = useState(
    initialData?.components?.map(c => ({
      componentId: c.componentId || c.component?.id,
      quantity: Number(c.quantity),
      _product: c.component
    })) || []
  );

  // Busca de componente para adicionar à estrutura
  const [compSearch, setCompSearch] = useState('');
  const [compQty, setCompQty] = useState('1');
  const [compQtyUnit, setCompQtyUnit] = useState('');
  const [compMeasurements, setCompMeasurements] = useState('');
  const [compPieceType, setCompPieceType] = useState('');
  const [compUnitPrice, setCompUnitPrice] = useState('');
  const [compMaterialId, setCompMaterialId] = useState('');
  const [compImageUrl, setCompImageUrl] = useState('');
  const [addMode, setAddMode] = useState('existing'); // 'existing' | 'new'

  // Multi-select customers
  const [selectedCustomerIds, setSelectedCustomerIds] = useState(
    initialData?.customers?.map(c => c.id) || []
  );

  const [materials, setMaterials] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [nextCode, setNextCode] = useState('Gerando...');
  const [nextCompCode, setNextCompCode] = useState('AUTO');
  const [customerSearch, setCustomerSearch] = useState('');

  useEffect(() => {
    fetch('/api/materials')
      .then(r => r.json())
      .then(setMaterials)
      .catch(() => {});

    fetch('/api/products')
      .then(r => r.json())
      .then(setAllProducts)
      .catch(() => {});

    if (!initialData) {
      fetch('/api/products/next-code')
        .then(r => r.json())
        .then(d => setNextCode(d.cod_item || 'AUTO'))
        .catch(() => setNextCode('AUTO'));
    }
  }, []);

  // Atualiza próximo código quando abrimos modo novo componente
  useEffect(() => {
    if (addMode === 'new') {
      fetch('/api/products/next-code')
        .then(r => r.json())
        .then(d => setNextCompCode(d.cod_item || 'AUTO'))
        .catch(() => setNextCompCode('AUTO'));
    }
  }, [addMode]);

  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.name === 'cod_item') {
      value = value.replace(/\D/g, '').slice(0, 5);
    }
    if (e.target.name === 'hasStructure') {
      setFormData(prev => ({ ...prev, hasStructure: e.target.checked }));
      return;
    }
    setFormData({ ...formData, [e.target.name]: value });
  };

  const toggleCustomer = (id) => {
    setSelectedCustomerIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Adicionar componente existente
  const handleAddExistingComponent = () => {
    if (!compSearch.trim() || !compQty || parseFloat(compQty) <= 0) return;

    // Produto selecionado pelo search
    const found = filteredCompProducts[0];
    if (!found) return;

    if (structureItems.some(s => s.componentId === found.id)) {
      alert('Este componente já foi adicionado.');
      return;
    }
    if (found.id === (initialData?.id)) {
      alert('Um produto não pode ser componente de si mesmo.');
      return;
    }

    setStructureItems(prev => [...prev, {
      componentId: found.id,
      quantity: parseFloat(compQty),
      _product: found
    }]);
    setCompSearch('');
    setCompQty('1');
  };

  // Adicionar novo componente (criar produto filho junto)
  const handleAddNewComponent = async () => {
    if (!compQty || parseFloat(compQty) <= 0) {
      alert('Informe a quantidade do componente.');
      return;
    }

    const newProdPayload = {
      description: compSearch.trim() || 'Componente',
      measurements: compMeasurements || undefined,
      piece_type: compPieceType || null,
      unit_price: compUnitPrice ? Number(compUnitPrice) : 0,
      materialId: compMaterialId || null,
      image_url: compImageUrl || undefined,
      hasStructure: false,
      customerIds: [],
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProdPayload)
      });
      if (!res.ok) throw new Error('Erro ao criar produto.');
      const created = await res.json();

      setStructureItems(prev => [...prev, {
        componentId: created.id,
        quantity: parseFloat(compQty),
        _product: created
      }]);

      // Refresh product list
      const allRes = await fetch('/api/products');
      setAllProducts(await allRes.json());

      // Reset new comp form
      setCompSearch('');
      setCompQty('1');
      setCompMeasurements('');
      setCompPieceType('');
      setCompUnitPrice('');
      setCompMaterialId('');
      setCompImageUrl('');
      setAddMode('existing');
    } catch (err) {
      alert(err.message || 'Erro ao criar componente.');
    }
  };

  const handleRemoveComponent = (componentId) => {
    setStructureItems(prev => prev.filter(s => s.componentId !== componentId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const computedPrice = structureItems.reduce((acc, item) => acc + (Number(item._product?.unit_price || 0) * item.quantity), 0);
    const hasComponentPrices = formData.hasStructure && computedPrice > 0;

    const dataToSubmit = {
      ...formData,
      unit_price: hasComponentPrices ? computedPrice : formData.unit_price,
      customerIds: selectedCustomerIds,
      materialId: formData.materialId || null,
      piece_type: formData.piece_type || null,
      hasStructure: formData.hasStructure,
      ncm: formData.ncm || null,
      cest: formData.cest || null,
      cfop_default: formData.cfop_default || null,
      tax_origin: parseInt(formData.tax_origin, 10) || 0,
      components: formData.hasStructure
        ? structureItems.map(s => ({ componentId: s.componentId, quantity: s.quantity }))
        : []
    };
    onSubmit(dataToSubmit);
  };

  const pieceTypeLabel = (v) => ({ PECA_REDONDA: 'Peça Redonda', GABARITO: 'Gabarito', PECA_RETA: 'Peça Reta' }[v] || v);

  // Filtra produtos disponíveis como componente (excluindo já adicionados e o próprio produto)
  const usedIds = new Set(structureItems.map(s => s.componentId));
  if (initialData?.id) usedIds.add(initialData.id);

  const filteredCompProducts = allProducts.filter(p =>
    !usedIds.has(p.id) &&
    (p.description.toLowerCase().includes(compSearch.toLowerCase()) ||
     p.cod_item.includes(compSearch))
  );

  const computedPrice = structureItems.reduce((acc, item) => acc + (Number(item._product?.unit_price || 0) * item.quantity), 0);
  const hasComponentPrices = formData.hasStructure && computedPrice > 0;

  return (
    <form onSubmit={handleSubmit} className="customer-form">
      <h3>{isEditing ? '✏️ Editar Produto' : '✨ Novo Produto'}</h3>

      {/* ── IDENTIFICAÇÃO ── */}
      <div className="form-section">
        <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Identificação</h4>
        <div className="form-grid" style={{ marginBottom: '1.5rem' }}>

          <label>
            Código do Item (5 dígitos):
            {isEditing ? (
              <input
                type="text"
                name="cod_item"
                required
                value={formData.cod_item}
                onChange={handleChange}
                maxLength={5}
                placeholder="00001"
                pattern="\d{5}"
                title="Apenas 5 dígitos numéricos"
              />
            ) : (
              <div style={{
                padding: '0.6rem 1rem',
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.4)',
                borderRadius: '8px',
                color: '#818cf8',
                fontWeight: 700,
                fontFamily: 'monospace',
                fontSize: '1rem',
                letterSpacing: '2px',
                marginTop: '0.25rem'
              }}>
                🔢 {nextCode}
              </div>
            )}
          </label>

          <label>
            Descrição:
            <input type="text" name="description" required value={formData.description} onChange={handleChange} />
          </label>
        </div>
      </div>

      {/* ── ESTRUTURA DO PRODUTO (BOM) ── */}
      <div className="form-section">
        <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={16} /> Estrutura do Produto (Kit/Conjunto)
        </h4>

        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', cursor: 'pointer', width: 'fit-content' }}>
          <div
            onClick={() => setFormData(prev => ({ ...prev, hasStructure: !prev.hasStructure }))}
            style={{
              width: '44px', height: '24px', borderRadius: '12px', position: 'relative', cursor: 'pointer',
              background: formData.hasStructure ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
              transition: 'background 0.2s',
              flexShrink: 0
            }}
          >
            <div style={{
              position: 'absolute', top: '3px',
              left: formData.hasStructure ? '23px' : '3px',
              width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
            }} />
          </div>
          <span style={{ fontWeight: formData.hasStructure ? 600 : 400, color: formData.hasStructure ? '#818cf8' : '#aaa', fontSize: '0.95rem' }}>
            {formData.hasStructure ? '🔧 Este produto possui estrutura (Kit/Conjunto)' : 'Produto simples (sem estrutura)'}
          </span>
        </label>

        {formData.hasStructure && (
          <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '1.5rem' }}>

            {/* Lista de componentes adicionados */}
            {structureItems.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>Componentes cadastrados</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {structureItems.map((item) => (
                    <div key={item.componentId} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px', padding: '0.75rem 1rem'
                    }}>
                      <Package size={16} color="#6366f1" style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          <span style={{ fontFamily: 'monospace', background: 'rgba(99,102,241,0.2)', color: '#818cf8', padding: '1px 6px', borderRadius: '4px', fontSize: '0.8rem', marginRight: '6px' }}>
                            {item._product?.cod_item || '?????'}
                          </span>
                          {item._product?.description || 'Produto'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '2px' }}>
                          {item._product?.piece_type ? pieceTypeLabel(item._product.piece_type) : ''}
                          {item._product?.material?.name ? ` · ${item._product.material.name}` : ''}
                          {item._product?.measurements ? ` · ${item._product.measurements}` : ''}
                          {item._product?.unit_price > 0 ? ` · R$ ${Number(item._product.unit_price).toFixed(2)} un` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1rem', minWidth: '60px', textAlign: 'right' }}>
                          × {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveComponent(item.componentId)}
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}
                          title="Remover componente"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {structureItems.length === 0 && (
              <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center', fontStyle: 'italic' }}>
                Nenhum componente adicionado. Use o campo abaixo para montar a estrutura.
              </p>
            )}

            {/* Toggle: adicionar existente ou criar novo */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button type="button" onClick={() => setAddMode('existing')}
                style={{ padding: '0.4rem 1rem', borderRadius: '6px', border: '1px solid', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                  borderColor: addMode === 'existing' ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
                  background: addMode === 'existing' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                  color: addMode === 'existing' ? '#818cf8' : '#aaa'
                }}>
                📦 Usar produto existente
              </button>
              <button type="button" onClick={() => setAddMode('new')}
                style={{ padding: '0.4rem 1rem', borderRadius: '6px', border: '1px solid', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
                  borderColor: addMode === 'new' ? '#10b981' : 'rgba(255,255,255,0.15)',
                  background: addMode === 'new' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                  color: addMode === 'new' ? '#10b981' : '#aaa'
                }}>
                ✨ Criar novo componente
              </button>
            </div>

            {addMode === 'existing' && (
              <div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ flex: 2, minWidth: '200px' }}>
                    <input
                      type="text"
                      placeholder="🔍 Buscar produto por código ou descrição..."
                      value={compSearch}
                      onChange={e => setCompSearch(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.9rem' }}
                    />
                    {compSearch && filteredCompProducts.length > 0 && (
                      <div style={{ background: '#1e1e2e', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', marginTop: '4px', maxHeight: '180px', overflowY: 'auto' }}>
                        {filteredCompProducts.slice(0, 8).map(p => (
                          <div key={p.id}
                            onClick={() => setCompSearch(`${p.cod_item} - ${p.description}`)}
                            style={{ padding: '0.6rem 1rem', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = ''}
                          >
                            <span style={{ fontFamily: 'monospace', color: '#818cf8', fontSize: '0.8rem' }}>{p.cod_item}</span>
                            <span style={{ fontSize: '0.85rem' }}>{p.description}</span>
                            {p.piece_type && <span style={{ fontSize: '0.75rem', color: '#888' }}>({pieceTypeLabel(p.piece_type)})</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {compSearch && filteredCompProducts.length === 0 && (
                      <div style={{ padding: '0.5rem 1rem', color: '#888', fontSize: '0.8rem', marginTop: '4px' }}>Nenhum produto encontrado.</div>
                    )}
                  </div>
                  <div style={{ width: '120px' }}>
                    <input
                      type="number" min="0.001" step="0.001"
                      placeholder="Qtd."
                      value={compQty}
                      onChange={e => setCompQty(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', textAlign: 'center' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddExistingComponent}
                    style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', background: 'rgba(99,102,241,0.2)', border: '1px solid var(--primary)', color: '#818cf8', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                  >
                    <Plus size={16} /> Adicionar
                  </button>
                </div>
              </div>
            )}

            {addMode === 'new' && (
              <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', fontWeight: 700 }}>
                  ✨ Novo Componente — será cadastrado automaticamente
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <label style={{ gridColumn: '1 / -1' }}>
                    <span style={{ fontSize: '0.8rem', color: '#888', marginBottom: '4px', display: 'block' }}>Descrição *</span>
                    <input type="text" value={compSearch} onChange={e => setCompSearch(e.target.value)} placeholder="Ex.: Peça A, Mola de Retorno..." required
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px' }} />
                  </label>

                  <label>
                    <span style={{ fontSize: '0.8rem', color: '#888', marginBottom: '4px', display: 'block' }}>Código (auto: {nextCompCode})</span>
                    <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#10b981', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                      🔢 {nextCompCode}
                    </div>
                  </label>

                  <label>
                    <span style={{ fontSize: '0.8rem', color: '#888', marginBottom: '4px', display: 'block' }}>Tipo de Peça</span>
                    <select value={compPieceType} onChange={e => setCompPieceType(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px' }}>
                      <option value="">— Selecione —</option>
                      <option value="PECA_REDONDA">Peça Redonda</option>
                      <option value="GABARITO">Gabarito</option>
                      <option value="PECA_RETA">Peça Reta</option>
                    </select>
                  </label>

                  <label>
                    <span style={{ fontSize: '0.8rem', color: '#888', marginBottom: '4px', display: 'block' }}>Medidas</span>
                    <input type="text" value={compMeasurements} onChange={e => setCompMeasurements(e.target.value)} placeholder="ex.: 150x200mm"
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px' }} />
                  </label>

                  <label>
                    <span style={{ fontSize: '0.8rem', color: '#888', marginBottom: '4px', display: 'block' }}>Material</span>
                    <select value={compMaterialId} onChange={e => setCompMaterialId(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px' }}>
                      <option value="">— Nenhum —</option>
                      {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </label>

                  <label>
                    <span style={{ fontSize: '0.8rem', color: '#888', marginBottom: '4px', display: 'block' }}>URL da Imagem</span>
                    <input type="url" value={compImageUrl} onChange={e => setCompImageUrl(e.target.value)} placeholder="https://..."
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px' }} />
                  </label>

                  <label>
                    <span style={{ fontSize: '0.8rem', color: '#888', marginBottom: '4px', display: 'block' }}>Preço Unitário (R$)</span>
                    <input type="number" min="0" step="0.01" value={compUnitPrice} onChange={e => setCompUnitPrice(e.target.value)} placeholder="0.00"
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px' }} />
                  </label>

                  <label>
                    <span style={{ fontSize: '0.8rem', color: '#888', marginBottom: '4px', display: 'block' }}>Quantidade *</span>
                    <input type="number" min="0.001" step="0.001" value={compQty} onChange={e => setCompQty(e.target.value)} placeholder="1"
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', textAlign: 'center' }} />
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setAddMode('existing')}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#aaa', cursor: 'pointer', fontSize: '0.85rem' }}>
                    Cancelar
                  </button>
                  <button type="button" onClick={handleAddNewComponent}
                    style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', background: 'rgba(16,185,129,0.2)', border: '1px solid #10b981', color: '#10b981', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={15} /> Criar e Adicionar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── ESPECIFICAÇÕES ── */}
      <div className="form-section">
        <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Especificações e Precificação</h4>
        <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
          {!formData.hasStructure && (
          <label>
            Tipo de Peça:
            <select name="piece_type" value={formData.piece_type || ''} onChange={handleChange}>
              <option value="">— Selecione —</option>
              <option value="PECA_REDONDA">Peça Redonda</option>
              <option value="GABARITO">Gabarito</option>
              <option value="PECA_RETA">Peça Reta</option>
            </select>
          </label>
          )}

          <label style={{ display: 'flex', flexDirection: 'column' }}>
            Preço Unitário Padrão (R$):
            <input 
              type="number" 
              name="unit_price" 
              min="0" step="0.01" 
              value={hasComponentPrices ? computedPrice : formData.unit_price} 
              onChange={handleChange} 
              disabled={hasComponentPrices}
              placeholder="0.00" 
              style={{ opacity: hasComponentPrices ? 0.7 : 1 }}
            />
            {hasComponentPrices && (
              <span style={{ fontSize: '0.75rem', color: '#818cf8', marginTop: '4px' }}>
                * Calculado a partir dos componentes.
              </span>
            )}
          </label>

          <label>
            Medidas / Especificações Técnicas:
            <input type="text" name="measurements" value={formData.measurements} onChange={handleChange} placeholder="ex.: 150x200mm" />
          </label>

          {!formData.hasStructure && (
          <label>
            Material Utilizado:
            <select name="materialId" value={formData.materialId || ''} onChange={handleChange}>
              <option value="">— Nenhum —</option>
              {materials.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
          )}

          <label>
            URL da Imagem (Anexo):
            <input type="url" name="image_url" value={formData.image_url || ''} onChange={handleChange} placeholder="https://exemplo.com/imagem.png" />
          </label>
        </div>
      </div>
      
      {/* ── INFORMAÇÕES FISCAIS ── */}
      <div className="form-section">
        <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Informações Fiscais</h4>
        <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
          <label>
            NCM (8 dígitos):
            <input type="text" name="ncm" value={formData.ncm || ''} onChange={handleChange} placeholder="Ex: 94036000" maxLength={8} />
          </label>
          <label>
            CEST:
            <input type="text" name="cest" value={formData.cest || ''} onChange={handleChange} placeholder="Opcional" />
          </label>
          <label>
            CFOP Padrão:
            <input type="text" name="cfop_default" value={formData.cfop_default || ''} onChange={handleChange} placeholder="Ex: 5101" />
          </label>
          <label>
            Origem da Mercadoria:
            <select name="tax_origin" value={formData.tax_origin} onChange={handleChange}>
              <option value="0">0 - Nacional</option>
              <option value="1">1 - Estrangeira - Importação direta</option>
              <option value="2">2 - Estrangeira - Adquirida no mercado interno</option>
              <option value="3">3 - Nacional - Conteúdo de Importação > 40%</option>
              <option value="4">4 - Nacional - Produção em conformidade com processos básicos</option>
              <option value="5">5 - Nacional - Conteúdo de Importação &lt;= 40%</option>
              <option value="6">6 - Estrangeira - Importação direta, sem similar nacional</option>
              <option value="7">7 - Estrangeira - Mercado interno, sem similar nacional</option>
            </select>
          </label>
        </div>
      </div>

      {/* ── CLIENTES VINCULADOS ── */}
      <div className="form-section">
        <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Clientes Vinculados
          <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#888', textTransform: 'none', marginLeft: '0.5rem' }}>
            (vazio = disponível para todos)
          </span>
        </h4>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="🔍 Buscar cliente por nome ou documento..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 1rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: '0.9rem'
            }}
          />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem', maxHeight: '200px', overflowY: 'auto', padding: '5px' }}>
          {customers
            .filter(c =>
              c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
              c.document?.toLowerCase().includes(customerSearch.toLowerCase())
            )
            .map(c => {
            const selected = selectedCustomerIds.includes(c.id);
            return (
              <div
                key={c.id}
                onClick={() => toggleCustomer(c.id)}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: selected ? 600 : 400,
                  border: `1px solid ${selected ? 'var(--primary)' : 'rgba(255,255,255,0.15)'}`,
                  background: selected ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                  color: selected ? '#818cf8' : '#aaa',
                  transition: 'all 0.15s',
                  userSelect: 'none'
                }}
              >
                {selected ? '✓ ' : ''}{c.name}
              </div>
            );
          })}
          {customers.length === 0 && <p style={{ color: '#888', fontSize: '0.85rem' }}>Nenhum cliente cadastrado.</p>}
        </div>
      </div>

      {formData.image_url && (
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <p>Pré-visualização:</p>
          <img src={formData.image_url} alt="Preview" style={{ maxWidth: '200px', borderRadius: '8px' }} onError={(e) => e.target.style.display = 'none'} />
        </div>
      )}

      <div className="form-actions" style={{ marginTop: '2rem' }}>
        <button type="submit" className="btn btn-primary">Salvar Produto</button>
        {onCancel && <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>}
      </div>
    </form>
  );
}

export default ProductForm;
