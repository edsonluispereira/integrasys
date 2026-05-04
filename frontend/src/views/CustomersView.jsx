import React, { useState, useEffect } from 'react';
import CustomerList from '../components/CustomerList';
import CustomerForm from '../components/CustomerForm';

function CustomersView() {
  const [customers, setCustomers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSave = async (customer) => {
    try {
      if (currentCustomer) {
        // Update
        await fetch(`/api/customers/${currentCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customer)
        });
      } else {
        // Create
        await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customer)
        });
      }
      setIsEditing(false);
      setCurrentCustomer(null);
      fetchCustomers();
    } catch (err) {
      console.error('Failed to save customer', err);
    }
  };

  const handleEdit = (customer) => {
    setCurrentCustomer(customer);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await fetch(`/api/customers/${id}`, { method: 'DELETE' });
        fetchCustomers();
      } catch (err) {
        console.error('Failed to delete customer', err);
      }
    }
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <h2>Módulo de Clientes</h2>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="btn btn-primary">
            + Novo Cliente
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="card">
          <CustomerForm 
            initialData={currentCustomer} 
            onSubmit={handleSave} 
            onCancel={() => { setIsEditing(false); setCurrentCustomer(null); }} 
          />
        </div>
      ) : (
        <div className="card">
          <CustomerList 
            customers={customers} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
          />
        </div>
      )}
    </div>
  );
}

export default CustomersView;
