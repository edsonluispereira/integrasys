import React from 'react';

function SupplierList({ suppliers, onEdit, onDelete }) {
  if (suppliers.length === 0) {
    return <p className="empty-state">Nenhum fornecedor cadastrado.</p>;
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Documento (CNPJ/CPF)</th>
            <th>Email</th>
            <th>Telefone</th>
            <th>Cidade/UF</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>{s.cnpj || '—'}</td>
              <td>{s.email || '—'}</td>
              <td>{s.phone || '—'}</td>
              <td>{s.city ? `${s.city} - ${s.state}` : '—'}</td>
              <td>
                <button onClick={() => onEdit(s)} className="btn btn-small btn-secondary" style={{marginRight:'4px'}}>✏️ Editar</button>
                <button onClick={() => onDelete(s.id)} className="btn btn-small btn-danger" title="Excluir">🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SupplierList;
