export const generateSalesOrderPDF = async (order) => {
  let settings = { name: 'INTEGRASYS ERP', address: '', cnpj: '' };
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      if (data.name) settings = data;
    }
  } catch (err) { }

  const printWindow = window.open('', '_blank');
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR');

  const deliveryText = order.delivery_type === 'RETIRADA'
    ? '🏪 Retirada'
    : order.delivery_type === 'ENTREGA'
    ? '🚚 Entrega'
    : '—';

  const deliveryColor = order.delivery_type === 'RETIRADA' ? '#d97706' : '#16a34a';

  const pieceTypeLabel = (v) => ({ PECA_REDONDA: 'Peça Redonda', GABARITO: 'Gabarito', PECA_RETA: 'Peça Reta' }[v] || v);

  const itemsHtml = order.items && order.items.length > 0
    ? order.items.map(item => `
      <tr>
        <td style="font-family: monospace;">${item.custom_description ? 'AVULSO' : (item.product?.cod_item || '-')}</td>
        <td>
          <strong>${item.custom_description || item.product?.description || 'Produto'}</strong>
          ${!item.custom_description && item.product ? `
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
              ${item.product.piece_type ? `<span>Tipo: ${pieceTypeLabel(item.product.piece_type)}</span>` : ''}
              ${item.product.material?.name ? `<span style="margin-left: 10px;">Material: ${item.product.material.name}</span>` : ''}
              ${item.product.measurements ? `<span style="margin-left: 10px;">Medidas: ${item.product.measurements}</span>` : ''}
            </div>
          ` : ''}
        </td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">R$ ${Number(item.unitPrice).toFixed(2)}</td>
        <td style="text-align: right;">R$ ${(item.quantity * item.unitPrice).toFixed(2)}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="5" style="text-align: center;">Nenhum item encontrado</td></tr>';

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Pedido de Venda - ${order.id}</title>
      <style>
        @page { size: A4 portrait; margin: 10mm 12mm; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.3; padding: 0; font-size: 11px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 6px; margin-bottom: 10px; }
        .company-details h1 { margin: 0 0 2px 0; color: #1e40af; font-size: 15px; }
        .document-title { text-align: right; }
        .document-title h2 { margin: 0; color: #2563eb; font-size: 14px; }
        .info-section { display: flex; justify-content: space-between; margin-bottom: 10px; gap: 12px; }
        .info-box { background: #f8fafc; padding: 7px 10px; border-radius: 6px; flex: 1; border: 1px solid #e2e8f0; }
        .info-box h3 { margin-top: 0; font-size: 10px; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th { background: #1e293b; color: white; text-align: left; padding: 5px 8px; font-size: 11px; }
        td { padding: 4px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
        .totals { width: 50%; float: right; }
        .total-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e2e8f0; }
        .total-row.grand { font-size: 14px; font-weight: bold; border-top: 2px solid #333; border-bottom: none; }
        .delivery-badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-weight: bold; font-size: 11px; }
        @media print {
          .header, .info-box, table { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          button { display: none; }
        }
      </style>
    </head>
    <body onload="setTimeout(function() { window.print(); window.onafterprint = function(){ window.close(); } }, 500);">
      <div class="header">
        <div class="company-details">
          ${settings.logo_data ? `<img src="${settings.logo_data}" style="max-height: 40px; max-width: 180px; display: block; margin-bottom: 4px;" />` : ''}
          <h1>${settings.name}</h1>
          <p style="margin: 2px 0 0 0; font-size: 10px;">${settings.address || ''}<br>${settings.cnpj ? 'CNPJ: ' + settings.cnpj : ''}</p>
        </div>
        <div class="document-title">
          <h2>PEDIDO DE VENDA</h2>
          <p style="margin: 2px 0 0 0; font-size: 11px;"><strong>No. Pedido:</strong> ${order.id.slice(0, 8).toUpperCase()}</p>
          <p style="margin: 0; font-size: 11px;"><strong>Data:</strong> ${formatDate(order.date || order.createdAt || new Date())}</p>
        </div>
      </div>

      <div class="info-section">
        <div class="info-box">
          <h3>Dados do Cliente</h3>
          <strong>${order.customer?.name || 'Cliente Não Informado'}</strong><br>
          ${order.customer?.document ? 'Doc: ' + order.customer.document + '<br>' : ''}
          ${order.customer?.email ? 'E-mail: ' + order.customer.email + '<br>' : ''}
          ${order.customer?.phone ? 'Telefone: ' + order.customer.phone : ''}
        </div>
        <div class="info-box">
          <h3>Informações do Pedido</h3>
          <strong>Status:</strong> ${order.status === 'OPEN' ? 'Aberto' : order.status === 'CLOSED' ? 'Fechado' : order.status === 'CANCELLED' ? 'Cancelado' : order.status}<br>
          <strong>Tipo de Entrega:</strong> <span class="delivery-badge" style="color: ${deliveryColor}; border: 1px solid ${deliveryColor};">${deliveryText}</span><br>
          <strong>Moeda:</strong> BRL (Reais)
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Produto / Descrição</th>
            <th style="text-align: center;">Qtd</th>
            <th style="text-align: right;">Val. Unit.</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row grand">
          <span>VALOR TOTAL:</span>
          <span>R$ ${Number(order.totalAmount).toFixed(2)}</span>
        </div>
      </div>
      
      <div style="clear: both;"></div>
      
      <div style="margin-top: 20px; text-align: center; font-size: 10px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
        Documento gerado pelo sistema INTEGRASYS ERP - ${new Date().toLocaleString('pt-BR')}
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

export const generateManufacturingOrderPDF = async (ofOrder) => {
  let settings = { name: 'INTEGRASYS', address: '', cnpj: '' };
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      if (data.name) settings = data;
    }
  } catch (err) { }

  const printWindow = window.open('', '_blank');
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR');

  const deliveryType = ofOrder.salesOrder?.delivery_type;
  const deliveryText = deliveryType === 'RETIRADA' ? '🏪 RETIRADA' : deliveryType === 'ENTREGA' ? '🚚 ENTREGA' : '—';

  const pieceTypeLabel = (v) => ({ PECA_REDONDA: 'Peça Redonda', GABARITO: 'Gabarito', PECA_RETA: 'Peça Reta' }[v] || v);

  const itemsHtml = ofOrder.salesOrder?.items && ofOrder.salesOrder.items.length > 0
    ? ofOrder.salesOrder.items.map(item => {
        const isKit = item.product?.hasStructure && item.product?.components?.length > 0;

        const parentRow = `
          <tr style="${isKit ? 'background: #f0f4ff;' : ''}">
            <td style="font-family: monospace; font-weight: bold; font-size: 14px;">${item.custom_description ? 'AVULSO' : (item.product?.cod_item || '-')}</td>
            <td>
              <div style="font-size: 13px; font-weight: bold; margin-bottom: 2px; display: flex; align-items: center; gap: 6px;">
                ${item.custom_description || item.product?.description || 'Produto'}
                ${isKit ? '<span style="font-size: 10px; background: #dbeafe; color: #1d4ed8; border: 1px solid #93c5fd; border-radius: 10px; padding: 1px 6px; font-weight: 700;">🔧 KIT</span>' : ''}
              </div>
              ${!item.custom_description && item.product ? `
                <div style="display: flex; gap: 10px; font-size: 11px; color: #333;">
                  ${item.product.piece_type ? `<span><strong>Tipo:</strong> ${pieceTypeLabel(item.product.piece_type)}</span>` : ''}
                  ${item.product.material?.name ? `<span><strong>Material:</strong> ${item.product.material.name}</span>` : ''}
                  ${item.product.measurements ? `<span><strong>Medidas:</strong> ${item.product.measurements}</span>` : ''}
                </div>
              ` : ''}
              ${isKit ? '<div style="font-size: 10px; color: #6366f1; margin-top: 2px; font-style: italic;">▼ Ver componentes abaixo</div>' : ''}
            </td>
            <td style="text-align: center; font-weight: bold; font-size: 14px;">${item.quantity}</td>
            <td>
              <div style="width: 25px; height: 25px; border: 2px solid #000; margin: 0 auto;"></div>
            </td>
          </tr>
        `;

        const componentRows = isKit
          ? item.product.components.map(comp => {
              const totalQty = (item.quantity * Number(comp.quantity));
              const totalQtyStr = Number.isInteger(totalQty) ? totalQty : totalQty.toFixed(3).replace(/\.?0+$/, '');
              return `
                <tr style="background: #f8f9fe;">
                  <td style="font-family: monospace; font-size: 10px; color: #6366f1; padding-left: 14px;">
                    ↳ ${comp.component?.cod_item || '—'}
                  </td>
                  <td style="padding-left: 16px;">
                    <div style="font-size: 11px; color: #1e293b;">${comp.component?.description || 'Componente'}</div>
                    <div style="font-size: 10px; color: #64748b; margin-top: 1px;">
                      ${comp.component?.piece_type ? `Tipo: ${pieceTypeLabel(comp.component.piece_type)}` : ''}
                      ${comp.component?.material?.name ? ` · Material: ${comp.component.material.name}` : ''}
                      ${comp.component?.measurements ? ` · Medidas: ${comp.component.measurements}` : ''}
                      ${item.quantity > 1 ? ` <span style="color: #94a3b8;">(${Number(comp.quantity)}× por unid. × ${item.quantity})</span>` : ''}
                    </div>
                  </td>
                  <td style="text-align: center; font-weight: bold; font-size: 12px; color: #4f46e5;">${totalQtyStr}</td>
                  <td>
                    <div style="width: 25px; height: 25px; border: 2px solid #000; margin: 0 auto;"></div>
                  </td>
                </tr>
              `;
            }).join('')
          : '';

        return parentRow + componentRows;
      }).join('')
    : '<tr><td colspan="4" style="text-align: center;">Nenhum item encontrado</td></tr>';

  let statusText = ofOrder.status;
  if (statusText === 'PENDING') statusText = 'Pendente';
  else if (statusText === 'IN_PROGRESS') statusText = 'Em Produção';
  else if (statusText === 'COMPLETED') statusText = 'Concluído';

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Ordem de Fabricação - ${ofOrder.id}</title>
      <style>
        @page { size: A4 portrait; margin: 10mm 12mm; }
        body { font-family: 'Inter', 'Segoe UI', sans-serif; color: #111; line-height: 1.3; padding: 0; font-size: 11px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 8px; }
        .company-details h1 { margin: 0; font-size: 17px; text-transform: uppercase; letter-spacing: 0.5px; }
        .document-title { text-align: right; }
        .document-title h2 { margin: 0; font-size: 14px; background: #000; color: #fff; padding: 2px 8px; display: inline-block; border-radius: 4px; }
        .info-section { display: flex; align-items: stretch; margin-bottom: 8px; gap: 10px; }
        .info-box { flex: 1; border: 1px solid #000; padding: 5px 8px; border-radius: 4px; }
        .info-box h3 { margin: 0 0 3px 0; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 2px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 8px; border: 1px solid #000; }
        th { background: #f1f5f9; color: #000; text-align: left; padding: 4px 8px; font-size: 11px; border: 1px solid #000; }
        td { padding: 3px 8px; border: 1px solid #000; font-size: 11px; }
        .notes-section { border: 1px solid #000; height: 55px; padding: 6px 8px; border-radius: 4px; margin-bottom: 8px; }
        .notes-section h3 { margin-top: 0; font-size: 10px; text-transform: uppercase; }
        .signatures { display: flex; justify-content: space-between; margin-top: 12px; }
        .sig-box { width: 45%; border-top: 1px solid #000; text-align: center; padding-top: 4px; font-size: 11px; font-weight: bold; }
        @media print {
          .header, .info-box, table, th, td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body onload="setTimeout(function() { window.print(); window.onafterprint = function(){ window.close(); } }, 500);">
      <div class="header">
        <div class="company-details">
          ${settings.logo_data ? `<img src="${settings.logo_data}" style="max-height: 45px; max-width: 200px; display: block; margin-bottom: 4px;" />` : ''}
          <h1>${settings.name}</h1>
          <p style="margin: 0; font-size: 11px;">Relatório de Produção Interno</p>
        </div>
        <div class="document-title">
          <h2>ORDEM DE FABRICAÇÃO (OF)</h2>
          <p style="margin: 3px 0 0 0; font-size: 12px;"><strong>No:</strong> ${ofOrder.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      <div class="info-section">
        <div class="info-box" style="flex: 0.6;">
          <h3>Identificação</h3>
          <strong>OF:</strong> ${ofOrder.id.slice(0, 8).toUpperCase()}<br>
          <strong>Pedido:</strong> ${ofOrder.salesOrder?.id?.slice(0, 8).toUpperCase() || '—'}<br>
          <strong>Emissão:</strong> ${formatDate(new Date())}<br>
          <strong>Data Ped:</strong> ${formatDate(ofOrder.salesOrder?.date || ofOrder.createdAt || new Date())}
        </div>
        <div class="info-box" style="flex: 1;">
          <h3>Dados de Venda e Cliente</h3>
          <strong>Cliente:</strong> ${ofOrder.salesOrder?.customer?.name || 'Não Informado'}<br>
          <strong>Entrega:</strong> ${deliveryText}<br>
          <strong>Status:</strong> ${statusText}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 15%;">Código</th>
            <th style="width: 55%;">Produto / Especificação</th>
            <th style="width: 15%; text-align: center;">Quantidade</th>
            <th style="width: 15%; text-align: center;">Conf.</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="notes-section">
        <h3>Observações de Produção / Qualidade</h3>
      </div>

      <div class="signatures">
        <div class="sig-box">Supervisor de Produção</div>
        <div class="sig-box">Controle de Qualidade</div>
      </div>
      
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
