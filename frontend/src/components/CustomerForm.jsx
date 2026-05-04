import React, { useState } from 'react';

function CustomerForm({ onSubmit, initialData = null, onCancel }) {
  const [formData, setFormData] = useState(initialData || {
    name: '', type: 'PJ', document: '', ie: '', email: '', phone: '',
    street: '', number: '', neighborhood: '', city: '', state: '', zip_code: '',
    delivery_type: 'ENTREGA',
    ibge_city_code: '',
    ind_iedest: '9'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="customer-form">
      <h3 style={{marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem'}}>
        {initialData ? '✏️ Editar Cliente' : '✨ Novo Cliente'}
      </h3>
      
      <div className="form-section">
        <h4 style={{color: 'var(--primary)', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Dados Principais</h4>
        <div className="form-grid" style={{marginBottom: '2rem'}}>
          <label>
            Tipo de Pessoa
            <select name="type" value={formData.type} onChange={handleChange}>
              <option value="PF">Pessoa Física (PF)</option>
              <option value="PJ">Pessoa Jurídica (PJ)</option>
            </select>
          </label>
          
          <label>
            Tipo de Entrega
            <select name="delivery_type" value={formData.delivery_type || 'ENTREGA'} onChange={handleChange}>
              <option value="ENTREGA">🚚 Entrega</option>
              <option value="RETIRADA">🏪 Retirada</option>
            </select>
          </label>
          
          <label>
            Nome/Razão Social
            <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="Digite o nome completo" />
          </label>
          
          <label>
            CPF/CNPJ
            <input type="text" name="document" required value={formData.document} onChange={handleChange} placeholder="000.000.000-00" />
          </label>
          
          <label>
            Inscrição Estadual (IE)
            <input type="text" name="ie" value={formData.ie || ''} onChange={handleChange} placeholder="Opcional para PF" />
          </label>

          <label>
            Indicador IE Destinatário *
            <select name="ind_iedest" value={formData.ind_iedest || '9'} onChange={handleChange}>
              <option value="1">1 - Contribuinte ICMS</option>
              <option value="2">2 - Contribuinte Isento</option>
              <option value="9">9 - Não Contribuinte</option>
            </select>
          </label>
        </div>
      </div>


      <div className="form-section">
        <h4 style={{color: 'var(--primary)', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Contato e Endereço</h4>
        <div className="form-grid" style={{marginBottom: '2rem'}}>
          <label>Email <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@exemplo.com" /></label>
          <label>Telefone <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="(00) 00000-0000" /></label>
          
          <label>Rua/Logradouro <input type="text" name="street" value={formData.street} onChange={handleChange} placeholder="Nome da rua" /></label>
          <label>Número <input type="text" name="number" value={formData.number} onChange={handleChange} placeholder="123" /></label>
          <label>Bairro <input type="text" name="neighborhood" value={formData.neighborhood} onChange={handleChange} placeholder="Centro" /></label>
          <label>Cidade <input type="text" name="city" value={formData.city || ''} onChange={handleChange} placeholder="Sua Cidade" /></label>
          <label>Cód. IBGE Cidade <input type="text" name="ibge_city_code" value={formData.ibge_city_code || ''} onChange={handleChange} placeholder="7 dígitos" maxLength={7} /></label>
          <label>Estado (UF) <input type="text" name="state" value={formData.state || ''} maxLength={2} onChange={handleChange} placeholder="SP" /></label>
          <label>CEP <input type="text" name="zip_code" value={formData.zip_code || ''} onChange={handleChange} placeholder="00000-000" /></label>
        </div>
      </div>

      <div className="form-actions" style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
        <button type="submit" className="btn btn-primary">Salvar</button>
        {onCancel && <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>}
      </div>
    </form>
  );
}

export default CustomerForm;
