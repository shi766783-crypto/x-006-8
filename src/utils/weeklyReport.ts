import type { FamilyMember, MedicalRecord, MedicationLog, Medicine } from '../types'
import { daysUntil, lastNDates, parseDate, todayStr } from './date'

export interface WeeklyReportInput {
  members: FamilyMember[]
  medicines: Medicine[]
  logs: MedicationLog[]
  records: MedicalRecord[]
}

export interface WeeklyReport {
  /** 统计窗口起始日（含），格式 YYYY-MM-DD */
  startDate: string
  /** 统计窗口结束日（今天），格式 YYYY-MM-DD */
  endDate: string
  /** 最近七天新增的健康指标记录条数 */
  metricCount: number
  /** 最近七天服药打卡：已服 / 跳过 / 总数 */
  doseTaken: number
  doseSkipped: number
  doseTotal: number
  /** 用药依从率（0-1），无打卡记录时为 0，需结合 doseTotal 判断 */
  complianceRate: number
  /** 最近七天新增就医记录条数 */
  newRecordCount: number
  /** 本周内新过期的药品种数 */
  newlyExpiredCount: number
  /** 当前累计过期药品种数 */
  expiredTotal: number
  /** 本周是否有任何数据（无数据时前端应展示空态） */
  hasData: boolean
  /** 一段可读的周报小结 */
  summary: string
}

export function computeWeeklyReport(input: WeeklyReportInput): WeeklyReport {
  const days = lastNDates(7)
  const daySet = new Set(days)
  const startDate = days[0]
  const endDate = todayStr()
  const cutoff = parseDate(startDate).getTime()

  // 1) 指标记录条数
  const metricCount = input.members.reduce(
    (sum, m) => sum + m.metrics.filter((mt) => mt.timestamp >= cutoff).length,
    0,
  )

  // 2) 用药依从率
  let doseTaken = 0
  let doseSkipped = 0
  for (const log of input.logs) {
    if (!daySet.has(log.date)) continue
    if (log.status === 'taken') doseTaken++
    else doseSkipped++
  }
  const doseTotal = doseTaken + doseSkipped
  const complianceRate = doseTotal ? doseTaken / doseTotal : 0

  // 3) 新增就医记录
  const newRecordCount = input.records.filter((r) => daySet.has(r.date)).length

  // 4) 过期药品变化
  let newlyExpiredCount = 0
  let expiredTotal = 0
  for (const med of input.medicines) {
    const d = daysUntil(med.expiryDate)
    if (d < 0) {
      expiredTotal++
      if (d >= -7) newlyExpiredCount++
    }
  }

  const hasData =
    metricCount > 0 || doseTotal > 0 || newRecordCount > 0 || newlyExpiredCount > 0

  // 可读小结
  const parts: string[] = []
  parts.push(
    metricCount > 0
      ? `本周全家共记录 ${metricCount} 条健康指标`
      : '本周没有新增健康指标记录',
  )
  if (doseTotal > 0) {
    const pct = Math.round(complianceRate * 100)
    const comment = pct >= 90 ? '，依从性很好' : pct < 60 ? '，需留意按时服药' : ''
    parts.push(`服药打卡 ${doseTotal} 次，依从率 ${pct}%${comment}`)
  } else {
    parts.push('暂无服药打卡记录')
  }
  parts.push(
    newRecordCount > 0 ? `新增 ${newRecordCount} 条就医记录` : '无新增就医记录',
  )
  if (newlyExpiredCount > 0) {
    parts.push(
      `本周新过期药品 ${newlyExpiredCount} 种，当前共 ${expiredTotal} 种过期药品，建议及时清理`,
    )
  } else if (expiredTotal > 0) {
    parts.push(`药箱中仍有 ${expiredTotal} 种过期药品待清理`)
  } else {
    parts.push('药箱无过期药品，管理良好')
  }

  return {
    startDate,
    endDate,
    metricCount,
    doseTaken,
    doseSkipped,
    doseTotal,
    complianceRate,
    newRecordCount,
    newlyExpiredCount,
    expiredTotal,
    hasData,
    summary: parts.join('；') + '。',
  }
}
