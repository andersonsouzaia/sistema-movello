/**
 * Utilitários para cálculo de orçamento e ROI de campanhas
 */

export interface BudgetSuggestion {
  orcamentoMinimo: number
  orcamentoRecomendado: number
  orcamentoOtimizado: number
  razao: string
}

export interface ROISimulation {
  investimento: number
  alcanceEstimado: number
  impressoesEstimadas: number
  conversoesEstimadas: number
  receitaEstimada: number
  roi: number
  roiPercentual: number
}

/**
 * Calcular sugestões de orçamento baseado em área e objetivo
 */
export function calcularSugestoesOrcamento(
  areaKm2: number,
  objetivo: string,
  duracaoDias: number
): BudgetSuggestion {
  // Custo médio por km² por dia (R$)
  const custoPorKm2PorDia: Record<string, number> = {
    awareness: 50,
    traffic: 75,
    conversions: 100,
    engagement: 60,
    consideracao: 65,
    conversao: 100,
    retencao: 70,
    engajamento: 60,
  }

  const custoBase = areaKm2 * (custoPorKm2PorDia[objetivo] || 75) * duracaoDias

  return {
    orcamentoMinimo: Math.max(100, custoBase * 0.5),
    orcamentoRecomendado: custoBase,
    orcamentoOtimizado: custoBase * 1.5,
    razao: `Baseado em ${areaKm2.toFixed(2)} km² de cobertura por ${duracaoDias} dias para objetivo de ${objetivo}`,
  }
}

/**
 * Simular ROI de uma campanha
 */
export function simularROI(
  investimento: number,
  alcanceEstimado: number,
  objetivo: string,
  taxaConversaoMedia: number = 0.02, // 2% padrão
  valorConversaoMedio: number = 50 // R$ 50 por conversão padrão
): ROISimulation {
  // Taxas de conversão por objetivo
  const taxasConversao: Record<string, number> = {
    awareness: 0.01, // 1% - apenas awareness
    traffic: 0.02, // 2% - tráfego para site
    conversions: 0.05, // 5% - conversões diretas
    engagement: 0.03, // 3% - engajamento
    consideracao: 0.02,
    conversao: 0.05,
    retencao: 0.04,
    engajamento: 0.03,
  }

  const taxaConversao = taxasConversao[objetivo] || taxaConversaoMedia

  // Estimar impressões (3 por pessoa)
  const impressoesEstimadas = alcanceEstimado * 3

  // Estimar conversões
  const conversoesEstimadas = Math.round(alcanceEstimado * taxaConversao)

  // Calcular receita estimada
  const receitaEstimada = conversoesEstimadas * valorConversaoMedio

  // Calcular ROI
  const roi = receitaEstimada - investimento
  const roiPercentual = investimento > 0 ? (roi / investimento) * 100 : 0

  return {
    investimento,
    alcanceEstimado,
    impressoesEstimadas,
    conversoesEstimadas,
    receitaEstimada,
    roi,
    roiPercentual: parseFloat(roiPercentual.toFixed(2)),
  }
}

/**
 * Verificar se orçamento é suficiente para área de cobertura
 */
export function verificarOrcamentoSuficiente(
  orcamento: number,
  areaKm2: number,
  duracaoDias: number,
  objetivo: string
): {
  suficiente: boolean
  orcamentoMinimo: number
  diferenca: number
  mensagem: string
} {
  const sugestoes = calcularSugestoesOrcamento(areaKm2, objetivo, duracaoDias)
  const suficiente = orcamento >= sugestoes.orcamentoMinimo
  const diferenca = sugestoes.orcamentoMinimo - orcamento

  let mensagem = ''
  if (suficiente) {
    if (orcamento >= sugestoes.orcamentoOtimizado) {
      mensagem = 'Orçamento excelente! Permite otimização máxima.'
    } else if (orcamento >= sugestoes.orcamentoRecomendado) {
      mensagem = 'Orçamento adequado para bons resultados.'
    } else {
      mensagem = 'Orçamento mínimo atendido. Considere aumentar para melhores resultados.'
    }
  } else {
    mensagem = `Orçamento insuficiente. Recomendado: ${sugestoes.orcamentoMinimo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
  }

  return {
    suficiente,
    orcamentoMinimo: sugestoes.orcamentoMinimo,
    diferenca: Math.max(0, diferenca),
    mensagem,
  }
}

/**
 * Otimizar orçamento baseado em ROI esperado
 */
export function otimizarOrcamento(
  orcamentoAtual: number,
  areaKm2: number,
  duracaoDias: number,
  objetivo: string,
  metaROI: number = 100 // ROI mínimo desejado em %
): {
  orcamentoOtimizado: number
  razao: string
  simulacao: ROISimulation
} {
  const sugestoes = calcularSugestoesOrcamento(areaKm2, objetivo, duracaoDias)
  
  // Tentar encontrar orçamento que atinja ROI mínimo
  let orcamentoOtimizado = sugestoes.orcamentoRecomendado
  let simulacao = simularROI(orcamentoOtimizado, areaKm2 * 5000, objetivo) // Assumir 5000 pessoas/km²
  
  // Ajustar até atingir ROI mínimo ou máximo de tentativas
  let tentativas = 0
  while (simulacao.roiPercentual < metaROI && tentativas < 10) {
    orcamentoOtimizado *= 0.9 // Reduzir 10%
    simulacao = simularROI(orcamentoOtimizado, areaKm2 * 5000, objetivo)
    tentativas++
  }

  const razao = simulacao.roiPercentual >= metaROI
    ? `Orçamento otimizado para atingir ROI de ${metaROI}%`
    : `Orçamento ajustado para melhor ROI possível (${simulacao.roiPercentual.toFixed(1)}%)`

  return {
    orcamentoOtimizado: parseFloat(orcamentoOtimizado.toFixed(2)),
    razao,
    simulacao,
  }
}

