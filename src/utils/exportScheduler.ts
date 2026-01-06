/**
 * Sistema de agendamento de exportações
 */

export interface ExportSchedule {
  id: string
  name: string
  type: 'csv' | 'excel' | 'pdf'
  dataSource: string // Identificador da fonte de dados
  filters?: Record<string, any>
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly'
    time: string // HH:mm format
    dayOfWeek?: number // 0-6 para weekly
    dayOfMonth?: number // 1-31 para monthly
  }
  recipients: string[] // Emails
  enabled: boolean
  lastRun?: string
  nextRun?: string
}

const STORAGE_KEY = 'export_schedules'

/**
 * Salva agendamentos no localStorage
 */
export function saveSchedules(schedules: ExportSchedule[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules))
  } catch (error) {
    console.error('Erro ao salvar agendamentos:', error)
  }
}

/**
 * Carrega agendamentos do localStorage
 */
export function loadSchedules(): ExportSchedule[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Erro ao carregar agendamentos:', error)
    return []
  }
}

/**
 * Calcula próxima execução baseada no schedule
 */
export function calculateNextRun(schedule: ExportSchedule['schedule']): Date {
  const now = new Date()
  const [hours, minutes] = schedule.time.split(':').map(Number)
  
  let nextRun = new Date()
  nextRun.setHours(hours, minutes, 0, 0)
  
  switch (schedule.frequency) {
    case 'daily':
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1)
      }
      break
      
    case 'weekly':
      if (schedule.dayOfWeek !== undefined) {
        const daysUntilTarget = (schedule.dayOfWeek - nextRun.getDay() + 7) % 7
        nextRun.setDate(nextRun.getDate() + (daysUntilTarget || 7))
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7)
        }
      }
      break
      
    case 'monthly':
      if (schedule.dayOfMonth !== undefined) {
        nextRun.setDate(schedule.dayOfMonth)
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1)
        }
      }
      break
  }
  
  return nextRun
}

/**
 * Verifica se um agendamento deve ser executado agora
 */
export function shouldRunNow(schedule: ExportSchedule): boolean {
  if (!schedule.enabled) return false
  
  const now = new Date()
  const nextRun = schedule.nextRun ? new Date(schedule.nextRun) : calculateNextRun(schedule.schedule)
  
  return now >= nextRun
}

/**
 * Cria um novo agendamento
 */
export function createSchedule(schedule: Omit<ExportSchedule, 'id' | 'lastRun' | 'nextRun'>): ExportSchedule {
  const schedules = loadSchedules()
  const newSchedule: ExportSchedule = {
    ...schedule,
    id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    nextRun: calculateNextRun(schedule.schedule).toISOString(),
  }
  
  schedules.push(newSchedule)
  saveSchedules(schedules)
  
  return newSchedule
}

/**
 * Atualiza um agendamento existente
 */
export function updateSchedule(id: string, updates: Partial<ExportSchedule>): ExportSchedule | null {
  const schedules = loadSchedules()
  const index = schedules.findIndex((s) => s.id === id)
  
  if (index === -1) return null
  
  const updated = {
    ...schedules[index],
    ...updates,
    id, // Garantir que o ID não mude
  }
  
  // Recalcular nextRun se o schedule mudou
  if (updates.schedule || updates.enabled !== undefined) {
    updated.nextRun = updated.enabled ? calculateNextRun(updated.schedule).toISOString() : undefined
  }
  
  schedules[index] = updated
  saveSchedules(schedules)
  
  return updated
}

/**
 * Remove um agendamento
 */
export function deleteSchedule(id: string): boolean {
  const schedules = loadSchedules()
  const filtered = schedules.filter((s) => s.id !== id)
  
  if (filtered.length === schedules.length) return false
  
  saveSchedules(filtered)
  return true
}

/**
 * Marca um agendamento como executado
 */
export function markScheduleAsRun(id: string): void {
  const schedules = loadSchedules()
  const schedule = schedules.find((s) => s.id === id)
  
  if (schedule) {
    schedule.lastRun = new Date().toISOString()
    schedule.nextRun = calculateNextRun(schedule.schedule).toISOString()
    saveSchedules(schedules)
  }
}

