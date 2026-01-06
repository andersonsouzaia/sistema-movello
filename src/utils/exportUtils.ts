/**
 * Utilitários para exportação de dados
 */

/**
 * Exporta dados para CSV
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: Record<keyof T, string>
): void {
  if (data.length === 0) {
    console.warn('Nenhum dado para exportar')
    return
  }

  const keys = Object.keys(data[0]) as Array<keyof T>
  const headerLabels = headers || ({} as Record<keyof T, string>)
  
  // Criar cabeçalho
  const csvHeaders = keys.map((key) => headerLabels[key] || String(key))
  
  // Criar linhas
  const csvRows = data.map((row) =>
    keys.map((key) => {
      const value = row[key]
      // Escapar valores que contêm vírgulas ou aspas
      if (value === null || value === undefined) return ''
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    })
  )

  // Combinar tudo
  const csvContent = [csvHeaders.join(','), ...csvRows.map((row) => row.join(','))].join('\n')

  // Criar blob e fazer download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Exporta dados para Excel (XLSX)
 * Requer a biblioteca xlsx
 */
export async function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  sheetName: string = 'Sheet1',
  headers?: Record<keyof T, string>
): Promise<void> {
  try {
    // Dynamic import para evitar erro se a biblioteca não estiver instalada
    const XLSX = await import('xlsx')
    
    if (data.length === 0) {
      console.warn('Nenhum dado para exportar')
      return
    }

    const keys = Object.keys(data[0]) as Array<keyof T>
    const headerLabels = headers || ({} as Record<keyof T, string>)
    
    // Preparar dados com cabeçalhos
    const worksheetData = [
      keys.map((key) => headerLabels[key] || String(key)),
      ...data.map((row) => keys.map((key) => row[key] ?? '')),
    ]

    // Criar workbook e worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    // Fazer download
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`)
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error)
    // Fallback para CSV se xlsx não estiver disponível
    exportToCSV(data, filename, headers)
  }
}

/**
 * Exporta dados para PDF
 * Requer jsPDF e jspdf-autotable
 */
export async function exportToPDF<T extends Record<string, any>>(
  data: T[],
  filename: string,
  title: string,
  headers?: Record<keyof T, string>
): Promise<void> {
  try {
    // Dynamic import para evitar erro se a biblioteca não estiver instalada
    const { default: jsPDF } = await import('jspdf')
    await import('jspdf-autotable')
    
    if (data.length === 0) {
      console.warn('Nenhum dado para exportar')
      return
    }

    const keys = Object.keys(data[0]) as Array<keyof T>
    const headerLabels = headers || ({} as Record<keyof T, string>)
    
    const doc = new jsPDF()
    
    // Adicionar título
    doc.setFontSize(16)
    doc.text(title, 14, 15)
    
    // Preparar dados da tabela
    const tableHeaders = keys.map((key) => headerLabels[key] || String(key))
    const tableRows = data.map((row) => keys.map((key) => String(row[key] ?? '')))

    // Adicionar tabela usando autoTable do jsPDF (adicionado pelo plugin)
    // @ts-ignore - autoTable é adicionado dinamicamente pelo plugin jspdf-autotable
    doc.autoTable({
      head: [tableHeaders],
      body: tableRows,
      startY: 25,
    })

    // Fazer download
    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`)
  } catch (error) {
    console.error('Erro ao exportar para PDF:', error)
    // Fallback para CSV se PDF não estiver disponível
    exportToCSV(data, filename, headers)
  }
}

/**
 * Formata dados para exportação
 */
export function formatDataForExport<T extends Record<string, any>>(
  data: T[],
  formatters?: Partial<Record<keyof T, (value: any) => string>>
): T[] {
  if (!formatters) return data

  return data.map((row) => {
    const formattedRow = { ...row }
    Object.keys(formatters).forEach((key) => {
      const formatter = formatters[key as keyof T]
      if (formatter && formattedRow[key as keyof T] !== undefined) {
        formattedRow[key as keyof T] = formatter(formattedRow[key as keyof T]) as any
      }
    })
    return formattedRow
  })
}

