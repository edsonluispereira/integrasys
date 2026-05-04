import React from 'react';

function CustomerList({ customers, onEdit, onDelete }) {
  if (customers.length === 0) {
    return <p className="empty-state">Nenhum cliente cadastrado.</p>;
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Tipo</th>
            <th>Documento</th>
            <th>Entrega</th>
            <th>Cidade/UF</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.type}</td>
              <td>{c.document}</td>
              <td>
                {c.delivery_type === 'RETIRADA'
                  ? <span style={{ color: '#eab308', fontWeight: 600 }}>🏪 Retirada</span>
                  : <span style={{ color: '#22c55e', fontWeight: 600 }}>🚚 Entrega</span>}
              </td>
              <td>{c.city} - {c.state}</td>
              <td>
                <button onClick={() => onEdit(c)} className="btn btn-small btn-secondary" style={{marginRight:'4px'}}>✏️ Editar</button>
                <button onClick={() => onDelete(c.id)} className="btn btn-small btn-danger">🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CustomerList;
