import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Prepara os itens para a emissão da NF-e com base no modo de faturamento escolhido.
 * @param {string} salesOrderId - ID do Pedido de Venda
 */
export async function prepareNFeItems(salesOrderId) {
  const order = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: {
      invoice: true,
      items: {
        include: {
          product: {
            include: {
              components: {
                include: {
                  component: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!order || !order.invoice) {
    throw new Error('Pedido ou Invoice não encontrados.');
  }

  const { billingMode } = order.invoice;
  let finalItems = [];

  if (billingMode === 'COMPONENTES') {
    // Explosão de KIT
    for (const item of order.items) {
      if (item.product && item.product.hasStructure && item.product.components.length > 0) {
        // Se o produto tem estrutura, adicionamos os componentes multiplicados pela quantidade vendida
        for (const pc of item.product.components) {
          finalItems.push({
            productId: pc.componentId,
            description: pc.component.description,
            quantity: Number(pc.quantity) * Number(item.quantity),
            unitPrice: Number(pc.component.unit_price) || 0,
            ncm: pc.component.ncm,
            cfop: pc.component.cfop_default || '5102', // Fallback comum para venda
            tax_origin: pc.component.tax_origin
          });
        }
      } else {
        // Se for um item avulso ou sem estrutura, adiciona normalmente
        finalItems.push({
          productId: item.productId,
          description: item.product?.description || item.custom_description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          ncm: item.product?.ncm,
          cfop: item.product?.cfop_default || '5102',
          tax_origin: item.product?.tax_origin
        });
      }
    }
  } else {
    // Faturamento por Item Pai
    finalItems = order.items.map(item => ({
      productId: item.productId,
      description: item.product?.description || item.custom_description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      ncm: item.product?.ncm,
      cfop: item.product?.cfop_default || '5102',
      tax_origin: item.product?.tax_origin
    }));
  }

  return finalItems;
}
