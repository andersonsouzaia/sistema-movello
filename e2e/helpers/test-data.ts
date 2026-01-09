/**
 * Dados de teste reutilizáveis
 */

export const testCampanha = {
  titulo: 'Campanha Teste E2E',
  descricao: 'Descrição da campanha de teste para E2E',
  orcamento: 5000,
  data_inicio: new Date().toISOString().split('T')[0],
  data_fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
}

export const testTicket = {
  assunto: 'Ticket de Teste E2E',
  descricao: 'Descrição do ticket de teste para E2E',
  prioridade: 'media' as const,
}

export const testTablet = {
  id: 'TABLET-TEST-001',
  modelo: 'Tablet Teste',
  serial_number: 'SN-TEST-001',
}
