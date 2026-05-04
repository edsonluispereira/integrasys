import React, { useState, useEffect } from 'react';
import ProductList from '../components/ProductList';
import ProductForm from '../components/ProductForm';

function ProductsView() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  // Materials state
  const [materials, setMaterials] = useState([]);
  const [showMaterials, setShowMaterials] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [editingMaterial, setEditingMaterial] = useState(null);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      setProducts(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      setCustomers(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchMaterials = async () => {
    try {
      const res = await fetch('/api/materials');
      setMaterials(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchMaterials();
  }, []);

  const handleSave = async (product) => {
    try {
      if (currentProduct) {
        await fetch(`/api/products/${currentProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product)
        });
      } else {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product)
        });
      }
      setIsEditing(false);
      setCurrentProduct(null);
      fetchProducts();
    } catch (err) { console.error(err); }
  };

  const handleEdit = (product) => { setCurrentProduct(product); setIsEditing(true); };
  const handleDelete = async (id) => {
    if (window.confirm('Excluir este produto?')) {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    }
  };

  // Material CRUD
  const handleSaveMaterial = async () => {
    const name = editingMaterial ? editingMaterial.name : newMaterialName;
    if (!name.trim()) return;
    try {
      if (editingMaterial?.id) {
        await fetch(`/api/materials/${editingMaterial.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
      } else {
        await fetch('/api/materials', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
      }
      setNewMaterialName('');
      setEditingMaterial(null);
      fetchMaterials();
    } catch (err) { console.error(err); }
  };

  const handleDeleteMaterial = async (id) => {
    if (window.confirm('Excluir este material?')) {
      await fetch(`/api/materials/${id}`, { method: 'DELETE' });
      fetchMaterials();
    }
  };

  const pieceTypeLabel = (v) => ({ PECA_REDONDA: 'Peça Redonda', GABARITO: 'Gabarito', PECA_RETA: 'Peça Reta' }[v] || '-');

  return (
    <div className="view-container">
      <div className="view-header">
        <h2>Módulo de Produtos</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!isEditing && (
            <>
              <button onClick={() => setShowMaterials(!showMaterials)} className="btn btn-secondary">
                🧱 {showMaterials ? 'Fechar Materiais' : 'Gerenciar Materiais'}
              </button>
              <button onClick={() => setIsEditing(true)} className="btn btn-primary">
                + Novo Produto
              </button>
            </>
          )}
        </div>
      </div>

      {/* Materials Panel */}
      {showMaterials && !isEditing && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>🧱 Cadastro de Materiais</h3>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Nome do material (ex.: Chapa de 15)"
              value={editingMaterial ? editingMaterial.name : newMaterialName}
              onChange={e => editingMaterial
                ? setEditingMaterial({ ...editingMaterial, name: e.target.value })
                : setNewMaterialName(e.target.value)}
              style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #444', background: '#2a2a3d', color: '#fff' }}
            />
            <button className="btn btn-primary" onClick={handleSaveMaterial}>
              {editingMaterial ? 'Salvar' : '+ Adicionar'}
            </button>
            {editingMaterial && (
              <button className="btn btn-secondary" onClick={() => setEditingMaterial(null)}>Cancelar</button>
            )}
          </div>
          {materials.length === 0 ? (
            <p style={{ color: '#888' }}>Nenhum material cadastrado.</p>
          ) : (
            <table className="data-table">
              <thead><tr><th>Nome do Material</th><th>Ações</th></tr></thead>
              <tbody>
                {materials.map(m => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>
                      <button className="btn btn-small btn-secondary" style={{ marginRight: '5px' }} onClick={() => setEditingMaterial(m)}>✏️ Editar</button>
                      <button className="btn btn-small btn-danger" onClick={() => handleDeleteMaterial(m.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {isEditing ? (
        <div className="card">
          <ProductForm
            initialData={currentProduct}
            onSubmit={handleSave}
            onCancel={() => { setIsEditing(false); setCurrentProduct(null); }}
            customers={customers}
          />
        </div>
      ) : (
        <div className="card">
          <ProductList
            products={products}
            onEdit={handleEdit}
            onDelete={handleDelete}
            pieceTypeLabel={pieceTypeLabel}
          />
        </div>
      )}
    </div>
  );
}

export default ProductsView;
