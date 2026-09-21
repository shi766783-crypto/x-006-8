import type { FamilyMember, MedicalRecord, MedicationLog, Medicine } from '../types'
import { lastNDates, parseDate, todayStr } from './date'

export interface WeeklyReportInput {
  members: FamilyMember[]
  medicines: Medicine[]
  logs: MedicationLog[]
  records: MedicalRecord[]
}

export interface WeeklyReport {
  /** Inclusive window bounds, 'YYYY-MM-DD'. */
  startDate: string
  endDate: string
  /** e.g. "9月15日 – 9月21日" */
  rangeLabel: string
  metricCount: number
  doseTaken: number
  doseSkipped: number
  doseTotal: number
  /** null when no dose was logged this week. */
  complianceRate: number | null
  newRecordCount: number
  newlyExpiredCount: number
  newlyExpiredNames: string[]
  /** False when nothing happened this week — show an empty state instead of zeros. */
  hasActivity: boolean
  /** Readable summary sentences; empty when hasActivity is false. */
  summary: string[]
}

function shortDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number)
  return `${m}月${d}日`
}

export function computeWeeklyReport(input: WeeklyReportInput): WeeklyReport {
  const days = lastNDates(7)
  const daySet = new Set(days)
  const startDate = days[0]
  const endDate = days[days.length - 1]
  const weekStartTs = parseDate(startDate).getTime()
  const today = todayStr()

  // Health metrics recorded this week
  const metricCount = input.members.reduce(
    (sum, m) => sum + m.metrics.filter((mt) => mt.timestamp >= weekStartTs).length,
    0,
  )

  // Medication compliance this week
  let doseTaken = 0
  let doseSkipped = 0
  for (const log of input.logs) {
    if (!daySet.has(log.date)) continue
    if (log.status === 'taken') doseTaken++
    else doseSkipped++
  }
  const doseTotal = doseTaken + doseSkipped
  const complianceRate = doseTotal ? doseTaken / doseTotal : null

  // New medical records this week
  const newRecordCount = input.records.filter((r) => daySet.has(r.date)).length

  // Medicines whose expiry date fell inside this week (newly expired)
  const newlyExpiredNames = input.medicines
    .filter((m) => m.expiryDate >= startDate && m.expiryDate < today)
    .map((m) => m.name)
  const newlyExpiredCount = newlyExpiredNames.length

  const hasActivity =
    metricCount > 0 || doseTotal > 0 || newRecordCount > 0 || newlyExpiredCount > 0

  const summary: string[] = []
  if (metricCount > 0) {
    summary.push(`本周全家共记录 ${metricCount} 条健康指标。`)
  }
  if (doseTotal > 0 && complianceRate !== null) {
    const rate = Math.round(complianceRate * 100)
    const comment =
      rate >= 90
        ? '，表现很棒，继续保持'
        : rate >= 70
          ? '，整体不错，仍有提升空间'
          : '，依从率偏低，记得提醒家人按时服药'
    summary.push(
      `完成用药打卡 ${doseTotal} 次（已服 ${doseTaken} 次、跳过 ${doseSkipped} 次），依从率 ${rate}%${comment}。`,
    )
  }
  if (newRecordCount > 0) {
    summary.push(`新增 ${newRecordCount} 条就医记录，记得跟进复诊与恢复情况。`)
  }
  if (newlyExpiredCount > 0) {
    const names =
      newlyExpiredNames.slice(0, 3).join('、') + (newlyExpiredCount > 3 ? ' 等' : '')
    summary.push(`有 ${newlyExpiredCount} 种药品在本周过期（${names}），建议及时清理药箱。`)
  }

  return {
    startDate,
    endDate,
    rangeLabel: `${shortDate(startDate)} – ${shortDate(endDate)}`,
    metricCount,
    doseTaken,
    doseSkipped,
    doseTotal,
    complianceRate,
    newRecordCount,
    newlyExpiredCount,
    newlyExpiredNames,
    hasActivity,
    summary,
  }
}
