import React from 'react';
import { Layers } from 'lucide-react';

const pieceTypeLabel = (v) => ({ PECA_REDONDA: 'Peça Redonda', GABARITO: 'Gabarito', PECA_RETA: 'Peça Reta' }[v] || '-');

function ProductList({ products, onEdit, onDelete }) {
  if (products.length === 0) {
    return <p className="empty-state">Nenhum produto cadastrado.</p>;
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Descrição</th>
            <th>Tipo</th>
            <th>Material</th>
            <th>Preço Padrão</th>
            <th>Medidas</th>
            <th>Cliente</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td><strong>{p.cod_item}</strong></td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>{p.description}</span>
                  {p.hasStructure && (
                    <span title={`Kit com ${p.components?.length || 0} componente(s)`} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      background: 'rgba(16,185,129,0.15)', color: '#10b981',
                      border: '1px solid rgba(16,185,129,0.4)',
                      borderRadius: '10px', padding: '1px 7px', fontSize: '0.72rem', fontWeight: 700
                    }}>
                      <Layers size={11} /> KIT ({p.components?.length || 0})
                    </span>
                  )}
                </div>
              </td>
              <td>{pieceTypeLabel(p.piece_type)}</td>
              <td>{p.material ? p.material.name : <span style={{color: '#888'}}>—</span>}</td>
              <td>{p.unit_price != null ? `R$ ${Number(p.unit_price).toFixed(2)}` : <span style={{color: '#888'}}>—</span>}</td>
              <td>{p.measurements || '-'}</td>
              <td>
                {p.customers && p.customers.length > 0
                  ? p.customers.map(c => (
                    <span key={c.id} style={{ display: 'inline-block', background: 'rgba(99,102,241,0.15)', color: '#818cf8', borderRadius: '12px', padding: '1px 8px', fontSize: '0.8rem', marginRight: '3px' }}>
                      {c.name}
                    </span>
                  ))
                  : <span style={{ color: '#888' }}>Todos</span>
                }
              </td>
              <td>
                <button onClick={() => onEdit(p)} className="btn btn-small btn-secondary" style={{marginRight:'4px'}}>✏️ Editar</button>
                <button onClick={() => onDelete(p.id)} className="btn btn-small btn-danger">🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProductList;
