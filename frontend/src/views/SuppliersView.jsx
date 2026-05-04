import React, { useState, useEffect } from 'react';
import SupplierList from '../components/SupplierList';
import SupplierForm from '../components/SupplierForm';

function SuppliersView() {
  const [suppliers, setSuppliers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/suppliers');
      const data = await res.json();
      setSuppliers(data);
    } catch (err) {
      console.error('Failed to fetch suppliers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSave = async (supplier) => {
    try {
      if (currentSupplier) {
        // Update
        await fetch(`/api/suppliers/${currentSupplier.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(supplier)
        });
      } else {
        // Create
        await fetch('/api/suppliers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(supplier)
        });
      }
      setIsEditing(false);
      setCurrentSupplier(null);
      fetchSuppliers();
    } catch (err) {
      console.error('Failed to save supplier', err);
    }
  };

  const handleEdit = (supplier) => {
    setCurrentSupplier(supplier);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
      try {
        await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
        fetchSuppliers();
      } catch (err) {
        console.error('Failed to delete supplier', err);
      }
    }
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h2>Cadastro de Fornecedores</h2>
          <p style={{color: 'var(--text-muted)'}}>Gerencie seus parceiros e fornecedores para vinculação em despesas.</p>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="btn btn-primary">
            + Novo Fornecedor
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="card">
          <SupplierForm 
            initialData={currentSupplier} 
            onSubmit={handleSave} 
            onCancel={() => { setIsEditing(false); setCurrentSupplier(null); }} 
          />
        </div>
      ) : (
        <div className="card">
          {loading ? (
            <p>Carregando fornecedores...</p>
          ) : (
            <SupplierList 
              suppliers={suppliers} 
              onEdit={handleEdit} 
              onDelete={handleDelete} 
            />
          )}
        </div>
      )}
    </div>
  );
}

export default SuppliersView;
