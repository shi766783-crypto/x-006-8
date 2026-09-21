<script setup lang="ts">
import { computed } from 'vue'
import { useFamilyStore } from '../../stores/useFamilyStore'
import { formatPercent } from '../../utils/format'
import EmptyState from '../ui/EmptyState.vue'

const store = useFamilyStore()
const report = computed(() => store.weeklyReport)

const rangeLabel = computed(() => {
  const fmt = (s: string) => {
    const [, m, d] = s.split('-').map(Number)
    return `${m}月${d}日`
  }
  return `${fmt(report.value.startDate)} - ${fmt(report.value.endDate)}`
})

const complianceText = computed(() =>
  report.value.doseTotal ? formatPercent(report.value.complianceRate) : '—',
)
</script>

<template>
  <section class="card">
    <div class="section-head">
      <h3>家庭健康周报</h3>
      <span class="muted">{{ rangeLabel }}</span>
    </div>

    <template v-if="report.hasData">
      <div class="week-grid">
        <div class="week-item">
          <div class="week-value">{{ report.metricCount }} 条</div>
          <div class="week-label">指标记录</div>
        </div>
        <div class="week-item">
          <div class="week-value">{{ complianceText }}</div>
          <div class="week-label">
            用药依从率<template v-if="report.doseTotal">
              （{{ report.doseTaken }}/{{ report.doseTotal }} 次）
            </template>
          </div>
        </div>
        <div class="week-item">
          <div class="week-value">{{ report.newRecordCount }} 条</div>
          <div class="week-label">新增就医记录</div>
        </div>
        <div class="week-item">
          <div class="week-value" :class="{ 'week-danger': report.newlyExpiredCount > 0 }">
            +{{ report.newlyExpiredCount }} 种
          </div>
          <div class="week-label">本周新过期药品</div>
        </div>
      </div>
      <p class="week-summary">{{ report.summary }}</p>
    </template>

    <EmptyState
      v-else
      icon="🗓️"
      text="本周还没有任何健康数据，从记录一条指标或安排一次服药开始吧"
    />
  </section>
</template>

<style scoped>
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.section-head h3 {
  margin: 0;
}
.muted {
  color: var(--text-secondary);
  font-size: 13px;
}
.week-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}
.week-item {
  background: var(--bg-color);
  border-radius: 10px;
  padding: 12px 14px;
}
.week-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
}
.week-danger {
  color: var(--danger-color);
}
.week-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}
.week-summary {
  background: var(--accent-bg);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.7;
}
</style>
