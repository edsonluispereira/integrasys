import React, { useState, useEffect, useRef } from 'react';
import { Save, Image as ImageIcon, CreditCard, Building2, Trash2, Plus, Shield, User, UserPlus, Key, FileText, Download, Database } from 'lucide-react';

function SettingsView({ user }) {
  const canAdmin = user?.permissions?.includes('ADMIN');

  const [activeTab, setActiveTab] = useState('company');
  const [settings, setSettings] = useState({
    name: '', cnpj: '', address: '', phone: '', email: '', logo_data: '',
    ie: '', im: '', crt: '', ibge_city_code: '', certificate_pfx: '', certificate_pass: ''
  });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [newMethodName, setNewMethodName] = useState('');

  // RBAC states
  const [users, setUsers] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState('');
  const fileInputRef = useRef(null);
  const restoreInputRef = useRef(null);

  const handleDownloadBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await fetch('/api/backup');
      if (!res.ok) throw new Error('Erro ao gerar backup.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = `integrasys_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Erro ao baixar backup.');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreBackup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    if (!window.confirm('ATENÇÃO: Esta operação vai substituir TODOS os dados atuais pelo conteúdo do backup.\n\nDeseja continuar?')) return;

    setRestoreLoading(true);
    setRestoreMessage('');
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro ao restaurar.');
      setRestoreMessage('Backup restaurado com sucesso! Recarregue a página.');
    } catch (err) {
      setRestoreMessage('Erro: ' + (err.message || 'Falha na restauração.'));
    } finally {
      setRestoreLoading(false);
    }
  };

  const resetPassword = async (userId) => {
    const newPass = prompt('Digite a nova senha para este usuário:');
    if (!newPass) return;
    try {
      const res = await fetch(`/api/users/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPass })
      });
      if (res.ok) alert('Senha alterada com sucesso!');
      else alert('Erro ao alterar senha.');
    } catch (err) { console.error(err); }
  };

  const createUser = async (e) => {
    if (!newUsername || !newPassword) return;
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword })
      });
      if (res.ok) {
        setNewUsername('');
        setNewPassword('');
        fetchUsers();
      } else {
        const error = await res.json();
        alert(error.error || 'Erro ao criar usuário');
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchSettings();
    fetchPaymentMethods();
    if (activeTab === 'users') {
      fetchUsers();
      fetchGroups();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      setUsers(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/users/groups');
      setAvailableGroups(await res.json());
    } catch (err) { console.error(err); }
  };

  const toggleUserGroup = async (userId, groupName) => {
    const u = users.find(u => u.id === userId);
    const hasGroup = u.groups.some(g => g.name === groupName);
    
    let newGroups;
    if (hasGroup) {
      newGroups = u.groups.filter(g => g.name !== groupName).map(g => g.name);
    } else {
      newGroups = [...u.groups.map(g => g.name), groupName];
    }

    try {
      await fetch(`/api/users/${userId}/groups`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupNames: newGroups })
      });
      fetchUsers();
    } catch (err) { console.error(err); }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.name) setSettings(data);
      }
    } catch (err) { console.error('Failed to fetch settings', err); }
  };

  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch('/api/payment-methods');
      if (res.ok) {
        const data = await res.json();
        setPaymentMethods(data);
      }
    } catch (err) { console.error('Failed to fetch payment methods', err); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("A imagem da logo deve ter no máximo 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setSettings(prev => ({ ...prev, logo_data: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setMessage('Configurações salvas com sucesso!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      alert("Erro ao conectar com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const addPaymentMethod = async (e) => {
    e.preventDefault();
    if (!newMethodName.trim()) return;
    try {
      const res = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newMethodName })
      });
      if (res.ok) {
        setNewMethodName('');
        fetchPaymentMethods();
      }
    } catch (err) { console.error(err); }
  };

  const deletePaymentMethod = async (id) => {
    if (!window.confirm('Deseja desativar esta forma de pagamento?')) return;
    try {
      await fetch(`/api/payment-methods/${id}`, { method: 'DELETE' });
      fetchPaymentMethods();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <h2>Painel de Configurações</h2>
        <p style={{color: 'var(--text-muted)'}}>Gerencie os dados da sua empresa e permissões de usuários.</p>
      </div>

      <div className="tab-navigation" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button onClick={() => setActiveTab('company')} className={`tab-btn ${activeTab === 'company' ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', color: activeTab === 'company' ? 'var(--primary)' : '#888',
            fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem',
            borderBottom: activeTab === 'company' ? '2px solid var(--primary)' : 'none' }}>
          <Building2 size={18} /> Dados da Empresa
        </button>
        <button onClick={() => setActiveTab('payments')} className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', color: activeTab === 'payments' ? 'var(--primary)' : '#888',
            fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem',
            borderBottom: activeTab === 'payments' ? '2px solid var(--primary)' : 'none' }}>
          <CreditCard size={18} /> Formas de Pagamento
        </button>
        <button onClick={() => setActiveTab('users')} className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', color: activeTab === 'users' ? 'var(--primary)' : '#888',
            fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem',
            borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : 'none' }}>
          <Shield size={18} /> Usuários e Permissões
        </button>
        <button onClick={() => setActiveTab('fiscal')} className={`tab-btn ${activeTab === 'fiscal' ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', color: activeTab === 'fiscal' ? 'var(--primary)' : '#888',
            fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem',
            borderBottom: activeTab === 'fiscal' ? '2px solid var(--primary)' : 'none' }}>
          <FileText size={18} /> Configurações Fiscais
        </button>
        <button onClick={() => setActiveTab('backup')} className={`tab-btn ${activeTab === 'backup' ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', color: activeTab === 'backup' ? 'var(--primary)' : '#888',
            fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem',
            borderBottom: activeTab === 'backup' ? '2px solid var(--primary)' : 'none' }}>
          <Database size={18} /> Backup
        </button>
      </div>

      {activeTab === 'company' && (
        <div className="card" style={{ maxWidth: '850px', margin: '0 auto' }}>
          <form onSubmit={handleSettingsSubmit}>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <div className="form-group"><label>Nome Fantasia / Razão Social *</label><input type="text" name="name" value={settings.name} onChange={handleChange} required className="form-control" /></div>
                <div className="form-group" style={{ display: 'flex', gap: '1rem' }}><div style={{ flex: 1 }}><label>CNPJ</label><input type="text" name="cnpj" value={settings.cnpj || ''} onChange={handleChange} className="form-control" /></div><div style={{ flex: 1 }}><label>Telefone</label><input type="text" name="phone" value={settings.phone || ''} onChange={handleChange} className="form-control" /></div></div>
                <div className="form-group"><label>E-mail de Contato</label><input type="email" name="email" value={settings.email || ''} onChange={handleChange} className="form-control" /></div>
                <div className="form-group"><label>Endereço Completo</label><textarea name="address" value={settings.address || ''} onChange={handleChange} className="form-control" rows="3" /></div>
              </div>
              <div style={{ width: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <label style={{alignSelf: 'flex-start'}}>Logo da Empresa</label>
                <div style={{ width: '200px', height: '200px', border: '2px dashed var(--border-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', marginTop: '0.5rem', backgroundColor: 'var(--surface-color)', position: 'relative' }} onClick={() => fileInputRef.current.click()}>
                  {settings.logo_data ? <img src={settings.logo_data} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <ImageIcon size={48} opacity={0.3} />}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
              </div>
            </div>
            {message && <div style={{ color: '#10b981', marginBottom: '1rem', textAlign: 'center' }}>{message}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Save size={18} /> {isLoading ? 'Salvando...' : 'Salvar Configurações'}</button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'payments' && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="card" style={{ marginBottom: '2rem' }}><h3>Nova Forma de Pagamento</h3><form onSubmit={addPaymentMethod} style={{ display: 'flex', gap: '1rem' }}><input type="text" className="form-control" placeholder="Ex: Cartão de Crédito 12x" value={newMethodName} onChange={(e) => setNewMethodName(e.target.value)} required /><button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={18} /> Adicionar</button></form></div>
          <div className="card"><h3>Formas Ativas</h3><div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>{paymentMethods.map(m => (<div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}><div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ padding: '8px', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', borderRadius: '6px' }}><CreditCard size={18} /></div><span style={{ fontWeight: 500 }}>{m.name}</span></div><button onClick={() => deletePaymentMethod(m.id)} className="btn btn-icon btn-danger" title="Desativar"><Trash2 size={16} /></button></div>))}{paymentMethods.length === 0 && <p style={{ textAlign: 'center', color: '#888' }}>Nenhuma forma de pagamento cadastrada.</p>}</div></div>
        </div>
      )}

      {activeTab === 'users' && (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {(user?.permissions?.includes('ADMIN')) && (
            <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserPlus size={20} color="var(--primary)" /> Criar Novo Usuário
              </h3>
              <form onSubmit={createUser} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Nome de Usuário (Login)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={newUsername} 
                    onChange={e => setNewUsername(e.target.value)} 
                    required 
                    placeholder="Ex: joao.vendas"
                  />
                </div>
                <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem' }}>Senha Temporária</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    required 
                    placeholder="********"
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', height: '42px' }}>
                  <Plus size={18} /> Adicionar Usuário
                </button>
              </form>
            </div>
          )}

          <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}><Shield size={20} color="var(--primary)" /> Gestão de Perfis de Usuário</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Atribua usuários a grupos para definir quais módulos e ações eles podem acessar.</p>
            
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>Grupos Atribuídos</th>
                    <th style={{ textAlign: 'center' }}>Ações de Grupo</th>
                    <th style={{ textAlign: 'center' }}>Segurança</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: '700' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <User size={16} color="#888" /> {u.username}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          {u.groups.map(g => (
                            <span key={g.id} style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                              {g.name}
                            </span>
                          ))}
                          {u.groups.length === 0 && <span style={{ color: '#888', fontStyle: 'italic', fontSize: '0.8rem' }}>Sem grupo</span>}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          {availableGroups.map(group => (
                            <label key={group.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.8rem' }}>
                              <input 
                                type="checkbox" 
                                checked={u.groups.some(g => g.name === group.name)}
                                onChange={() => toggleUserGroup(u.id, group.name)}
                              />
                              {group.name}
                            </label>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {canAdmin && (
                          <button 
                            onClick={() => resetPassword(u.id)}
                            className="btn btn-small"
                            style={{ display: 'flex', alignItems: 'center', gap: '5px', margin: '0 auto', fontSize: '0.75rem', padding: '4px 10px' }}
                            title="Alterar Senha do Usuário"
                          >
                            <Key size={14} /> Redefinir Senha
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <h4 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>📌 Informação sobre Permissões</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
              <div><strong>Master:</strong> Tudo (Vendas, Produção, Financeiro, Config).</div>
              <div><strong>Vendas:</strong> Clientes, Produtos e Pedidos.</div>
              <div><strong>Produção:</strong> Ver e Imprimir OFs.</div>
              <div><strong>Financeiro:</strong> Fluxo de Caixa e Baixa de Títulos.</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'backup' && (
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Exportar */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Download size={20} color="var(--primary)" /> Exportar Backup
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Gera um arquivo <strong>.json</strong> com todos os dados do sistema.
            </p>
            <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.83rem', color: '#aaa' }}>
              <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.4rem' }}>Inclui:</div>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: '1.7' }}>
                <li>Clientes e Fornecedores</li>
                <li>Produtos, Materiais e Estruturas (BOM)</li>
                <li>Pedidos de Venda e Itens</li>
                <li>Ordens de Fabricação</li>
                <li>Transações Financeiras e Faturas</li>
                <li>Formas de Pagamento e Configurações</li>
                <li>Usuários e Grupos (senhas não incluídas)</li>
              </ul>
            </div>
            <button
              onClick={handleDownloadBackup}
              disabled={backupLoading}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.8rem 2rem', width: '100%', justifyContent: 'center' }}
            >
              <Download size={18} />
              {backupLoading ? 'Gerando...' : 'Baixar Backup Agora'}
            </button>
          </div>

          {/* Importar */}
          <div className="card" style={{ padding: '2rem', border: '1px solid rgba(239,68,68,0.25)' }}>
            <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={20} color="#ef4444" /> Restaurar Backup
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Selecione um arquivo <strong>.json</strong> gerado por esta ferramenta para restaurar os dados.
            </p>
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '0.9rem 1rem', marginBottom: '1.5rem', fontSize: '0.83rem', color: '#f87171' }}>
              <strong>Atenção:</strong> esta operação apaga e substitui <strong>todos</strong> os dados atuais pelo conteúdo do arquivo. Esta ação não pode ser desfeita.
            </div>

            <input
              type="file"
              accept=".json"
              ref={restoreInputRef}
              onChange={handleRestoreBackup}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => restoreInputRef.current.click()}
              disabled={restoreLoading}
              className="btn"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.8rem 2rem', width: '100%', justifyContent: 'center', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.5)', color: '#ef4444', fontWeight: 600 }}
            >
              <Database size={18} />
              {restoreLoading ? 'Restaurando...' : 'Selecionar Arquivo e Restaurar'}
            </button>

            {restoreMessage && (
              <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 500,
                background: restoreMessage.startsWith('Erro') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                color: restoreMessage.startsWith('Erro') ? '#ef4444' : '#10b981',
                border: `1px solid ${restoreMessage.startsWith('Erro') ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
              }}>
                {restoreMessage}
              </div>
            )}
          </div>

        </div>
      )}

      {activeTab === 'fiscal' && (
        <div className="card" style={{ maxWidth: '850px', margin: '0 auto' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} color="var(--primary)" /> Dados Fiscais para Emissão de Nota
          </h3>
          <form onSubmit={handleSettingsSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label>Inscrição Estadual (IE)</label>
                <input type="text" name="ie" value={settings.ie || ''} onChange={handleChange} className="form-control" placeholder="Apenas números ou ISENTO" />
              </div>
              <div className="form-group">
                <label>Inscrição Municipal (IM)</label>
                <input type="text" name="im" value={settings.im || ''} onChange={handleChange} className="form-control" />
              </div>
              <div className="form-group">
                <label>Código Regime Tributário (CRT) *</label>
                <select name="crt" value={settings.crt || ''} onChange={handleChange} required className="form-control">
                  <option value="">Selecione...</option>
                  <option value="1">1 - Simples Nacional</option>
                  <option value="2">2 - Simples Nacional - excesso de sublimite de receita bruta</option>
                  <option value="3">3 - Regime Normal</option>
                </select>
              </div>
              <div className="form-group">
                <label>Código IBGE da Cidade</label>
                <input type="text" name="ibge_city_code" value={settings.ibge_city_code || ''} onChange={handleChange} className="form-control" placeholder="Ex: 3550308" />
              </div>
            </div>

            <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={16} color="var(--primary)" /> Certificado Digital (A1)
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                O certificado A1 (.pfx ou .p12) é necessário para assinar as notas fiscais digitalmente.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Senha do Certificado</label>
                  <input type="password" name="certificate_pass" value={settings.certificate_pass || ''} onChange={handleChange} className="form-control" placeholder="********" />
                </div>
                <div className="form-group">
                  <label>Caminho/Base64 do Certificado</label>
                  <input type="text" name="certificate_pfx" value={settings.certificate_pfx || ''} onChange={handleChange} className="form-control" placeholder="Base64 ou Path (Configuração Técnica)" />
                </div>
              </div>
            </div>

            {message && <div style={{ color: '#10b981', marginBottom: '1rem', textAlign: 'center' }}>{message}</div>}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={18} /> {isLoading ? 'Salvando...' : 'Salvar Configurações Fiscais'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default SettingsView;
