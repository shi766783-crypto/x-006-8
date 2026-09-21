<script setup lang="ts">
import { computed } from 'vue'
import type { WeeklyReport } from '../../utils/weeklyReport'
import EmptyState from '../ui/EmptyState.vue'

const props = defineProps<{ report: WeeklyReport }>()

const summaryText = computed(() => props.report.summary.join(''))

const complianceText = computed(() =>
  props.report.complianceRate === null
    ? '—'
    : `${Math.round(props.report.complianceRate * 100)}%`,
)
</script>

<template>
  <section class="card weekly-report">
    <div class="section-head">
      <h3>家庭健康周报</h3>
      <span class="muted">最近七天 · {{ report.rangeLabel }}</span>
    </div>

    <EmptyState
      v-if="!report.hasActivity"
      icon="🗓️"
      text="本周还没有任何健康数据，记录指标、打卡用药或添加就医记录后，这里会生成每周小结"
    />

    <template v-else>
      <div class="report-grid">
        <div class="report-item">
          <div class="report-icon">📈</div>
          <div class="report-value">{{ report.metricCount }}</div>
          <div class="report-label">指标记录（条）</div>
        </div>
        <div class="report-item">
          <div class="report-icon">✅</div>
          <div class="report-value">{{ complianceText }}</div>
          <div class="report-label">用药依从率</div>
        </div>
        <div class="report-item">
          <div class="report-icon">🏥</div>
          <div class="report-value">{{ report.newRecordCount }}</div>
          <div class="report-label">新增就医记录</div>
        </div>
        <div class="report-item">
          <div class="report-icon">⚠️</div>
          <div class="report-value">{{ report.newlyExpiredCount }}</div>
          <div class="report-label">本周新过期药品</div>
        </div>
      </div>
      <p class="report-summary">{{ summaryText }}</p>
    </template>
  </section>
</template>

<style scoped>
.weekly-report {
  margin-bottom: 20px;
}
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
.report-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}
.report-item {
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 12px;
  text-align: center;
}
.report-icon {
  font-size: 20px;
}
.report-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
}
.report-label {
  font-size: 12px;
  color: var(--text-secondary);
}
.report-summary {
  margin: 0;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--accent-bg);
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.8;
}
</style>
