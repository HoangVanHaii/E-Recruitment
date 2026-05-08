<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import SidebarAdmin from '../../components/admin/SidebarAdmin.vue';
import { useJobStore } from '../../stores/job';
import { useEmployerStore } from '../../stores/employer';
import type { ChartItem } from '../../types/chart';
import type { ITopEmployer } from '../../types/employer';
import type { IJob } from '../../types/job';
import { formatDate } from '../../utils/format';

const job = useJobStore();
const employer = useEmployerStore();

const stats = ref([
    { id: 'users',     label: 'Tổng ứng viên',   value: 12847, change: +8.4,  icon: 'fas fa-user-tie',      color: '#4c5bd4', bg: '#eef0fd' },
    { id: 'employers', label: 'Nhà tuyển dụng',   value: 1340,  change: +3.2,  icon: 'fas fa-building',      color: '#0ea5e9', bg: '#e0f2fe' },
    { id: 'jobs',      label: 'Tin tuyển dụng',   value: 4512,  change: +12.1, icon: 'fas fa-briefcase',     color: '#10b981', bg: '#d1fae5' },
    { id: 'pending',   label: 'Chờ duyệt',        value: 87,    change: -5.3,  icon: 'fas fa-hourglass-half',color: '#f59e0b', bg: '#fef3c7' },
]);

const recentJobs = ref<IJob[]>([]);
const topEmployers = ref<ITopEmployer[]>([]);
const activityFeed = ref([
    { icon: 'fas fa-user-plus',    color: '#4c5bd4', text: 'Ứng viên mới <b>Nguyễn Văn A</b> vừa đăng ký',              time: '2 phút trước' },
    { icon: 'fas fa-briefcase',    color: '#10b981', text: 'Tin tuyển dụng <b>Senior React Dev</b> vừa được duyệt',      time: '15 phút trước' },
    { icon: 'fas fa-flag',         color: '#ef4444', text: 'Tin tuyển dụng <b>Nhân viên kinh doanh</b> bị báo cáo',      time: '1 giờ trước' },
    { icon: 'fas fa-building',     color: '#0ea5e9', text: 'Công ty <b>TMA Solutions</b> vừa đăng ký tài khoản',        time: '2 giờ trước' },
    { icon: 'fas fa-check-circle', color: '#10b981', text: '23 tin tuyển dụng được duyệt hôm nay',                      time: '3 giờ trước' },
]);

const chartData = ref<ChartItem[]>([]);
const chartMax = computed(() => {
    if (!chartData.value.length) return 10;
    return Math.max(...chartData.value.map(d => Math.max(d.jobs, d.users))) + 10;
});
const barHeight = (val: number) => `${(val / chartMax.value) * 100}%`;

const displayedValues = ref(stats.value.map(() => 0));
const statsForAdmin = ref<any>(null);
const isMobileMenuOpen = ref(false);
const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
});

onMounted(async () => {
    statsForAdmin.value = await job.fetchJobStatsForAdminStore();
    if (statsForAdmin.value) {
        const { candidateStats, jobStats, employerStats, jobStatsPending } = statsForAdmin.value;
        stats.value.forEach(stat => {
            if (stat.id === 'users')     { stat.value = candidateStats.currentMonth; stat.change = candidateStats.percentChange; }
            if (stat.id === 'employers') { stat.value = employerStats.currentMonth;  stat.change = employerStats.percentChange; }
            if (stat.id === 'jobs')      { stat.value = jobStats.currentMonth;       stat.change = jobStats.percentChange; }
            if (stat.id === 'pending')   { stat.value = jobStatsPending.currentMonth; stat.change = jobStatsPending.percentChange; }
        });
    }

    stats.value.forEach((stat, i) => {
        const target = stat.value;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) { displayedValues.value[i] = target; clearInterval(timer); }
            else { displayedValues.value[i] = Math.floor(current); }
        }, 1200 / steps);
    });

    const weekStats = await job.fetch7DayStatsForAdminStore();
    if (weekStats) {
        chartData.value = weekStats.candidateStats.map((c: any, i: number) => ({
            day: c.date.slice(5),
            users: c.count,
            jobs: weekStats.jobStats[i]?.count || 0,
        }));
    }

    topEmployers.value = await employer.fetchTopEmployers();
    recentJobs.value = await job.fetchTopJobsForAdminStore();
});

const formatNumber = (n: number) => n.toLocaleString('vi-VN');

const statusConfig: Record<string, { label: string; class: string }> = {
    Approved: { label: 'Hoạt động', class: 'status-approved' },
    Pending:  { label: 'Chờ duyệt', class: 'status-pending' },
    Rejected: { label: 'Từ chối',   class: 'status-rejected' },
};
</script>

<template>
    <div class="app-shell">
        <SidebarAdmin
            :is-open-mobile="isMobileMenuOpen"
            @close-mobile-menu="isMobileMenuOpen = false"
        />

        <!-- Main content -->
        <div class="main-area">

            <!-- ── Header ── -->
            <header class="topbar">
                <div class="topbar-left">
                    <button
                        class="hamburger lg:hidden"
                        @click="isMobileMenuOpen = true"
                        aria-label="Mở menu"
                    >
                        <i class="fas fa-bars"></i>
                    </button>
                    <div>
                        <h1 class="page-title">Dashboard</h1>
                        <p class="page-date">{{ today }}</p>
                    </div>
                </div>
                <div class="topbar-right">
                    <button class="notif-btn hidden sm:flex" aria-label="Thông báo">
                        <i class="fas fa-bell text-sm"></i>
                        <span class="notif-dot"></span>
                    </button>
                    <div class="user-chip">
                        <div class="user-avatar">
                            <i class="fas fa-user-shield text-white text-xs"></i>
                        </div>
                        <div class="user-info hidden sm:block">
                            <p class="user-name">Super Admin</p>
                            <p class="user-email">admin@365timviec.vn</p>
                        </div>
                        <i class="fas fa-chevron-down text-[9px] text-slate-400 ml-1 hidden sm:block"></i>
                    </div>
                </div>
            </header>

            <!-- ── Content ── -->
            <div class="content-body">

                <!-- ── Stat cards ── -->
                <section class="stats-grid">
                    <div
                        v-for="(stat, i) in stats"
                        :key="stat.id"
                        class="stat-card"
                        :style="`animation-delay: ${i * 80}ms`"
                    >
                        <div class="stat-card__top">
                            <div class="stat-icon" :style="`background: ${stat.bg}`">
                                <i :class="[stat.icon]" :style="`color: ${stat.color}`"></i>
                            </div>
                            <span class="stat-badge" :class="stat.change >= 0 ? 'badge-up' : 'badge-down'">
                                <i :class="stat.change >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'" class="text-[8px]"></i>
                                {{ Math.abs(stat.change) }}%
                            </span>
                        </div>
                        <p class="stat-value">{{ formatNumber(displayedValues[i]) }}</p>
                        <p class="stat-label">{{ stat.label }}</p>
                    </div>
                </section>

                <!-- ── Chart + Activity ── -->
                <section class="two-col-grid">

                    <!-- Bar chart -->
                    <div class="card chart-card">
                        <div class="card__header">
                            <div>
                                <h2 class="card__title">Hoạt động 7 ngày qua</h2>
                                <p class="card__subtitle">Tin đăng & ứng viên mới theo ngày</p>
                            </div>
                            <div class="chart-legend">
                                <span class="legend-item">
                                    <span class="legend-dot" style="background:#4c5bd4"></span>Tin đăng
                                </span>
                                <span class="legend-item">
                                    <span class="legend-dot" style="background:#f1f864; border:1px solid #d97706"></span>Ứng viên
                                </span>
                            </div>
                        </div>
                        <div class="chart-wrap">
                            <div class="chart-bars">
                                <div v-for="d in chartData" :key="d.day" class="chart-col">
                                    <div class="bars-pair">
                                        <!-- jobs bar -->
                                        <div class="bar bar--blue group/bar" :style="`height: ${barHeight(d.jobs)}`">
                                            <div class="bar-tooltip">{{ d.jobs }} tin</div>
                                        </div>
                                        <!-- users bar -->
                                        <div class="bar bar--yellow group/bar2" :style="`height: ${barHeight(d.users)}`">
                                            <div class="bar-tooltip">{{ d.users }} UV</div>
                                        </div>
                                    </div>
                                    <span class="bar-label">{{ d.day }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Activity feed -->
                    <div class="card">
                        <div class="card__header">
                            <h2 class="card__title">Hoạt động gần đây</h2>
                            <button class="link-btn">Xem tất cả</button>
                        </div>
                        <div class="activity-list">
                            <div v-for="(act, i) in activityFeed" :key="i" class="activity-item">
                                <div class="activity-icon" :style="`background: ${act.color}18`">
                                    <i :class="[act.icon]" :style="`color: ${act.color}`" class="text-[11px]"></i>
                                </div>
                                <div class="activity-body">
                                    <p class="activity-text" v-html="act.text"></p>
                                    <p class="activity-time">{{ act.time }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- ── Recent jobs + Top employers ── -->
                <section class="three-col-grid">

                    <!-- Jobs table -->
                    <div class="card jobs-card">
                        <div class="card__header">
                            <h2 class="card__title">Tin tuyển dụng gần đây</h2>
                            <button class="link-btn">Xem tất cả</button>
                        </div>
                        <div class="table-wrap custom-scrollbar">
                            <table class="jobs-table">
                                <thead>
                                    <tr>
                                        <th class="th-left">Vị trí</th>
                                        <th class="th-left">Ngày</th>
                                        <th class="th-center">Ứng viên</th>
                                        <th class="th-center">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="j in recentJobs" :key="j.JobID" class="job-row group">
                                        <td class="td-job">
                                            <p class="job-title">{{ j.Title }}</p>
                                            <p class="job-meta">
                                                <i class="fas fa-building text-[9px]"></i> {{ j.CompanyName }}
                                                <span class="dot-sep">·</span>
                                                <i class="fas fa-map-marker-alt text-[9px]"></i> {{ j.Location }}
                                            </p>
                                        </td>
                                        <td class="td-date">{{ formatDate(j.CreatedAt) }}</td>
                                        <td class="td-center font-bold text-slate-700">{{ j.ApplicationCount }}</td>
                                        <td class="td-center">
                                            <span :class="['status-badge', statusConfig[j.Status]?.class || 'status-default']">
                                                {{ statusConfig[j.Status]?.label || j.Status }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Top employers -->
                    <div class="card">
                        <div class="card__header">
                            <h2 class="card__title">Top nhà tuyển dụng</h2>
                            <button class="link-btn">Xem tất cả</button>
                        </div>
                        <div class="employers-list">
                            <div
                                v-for="(emp, i) in topEmployers"
                                :key="emp.CompanyName"
                                class="employer-item group"
                            >
                                <div class="emp-rank" :class="i === 0 ? 'rank-gold' : i === 1 ? 'rank-silver' : 'rank-default'">
                                    {{ i + 1 }}
                                </div>
                                <div class="emp-logo">
                                    <i class="fas fa-building text-[#4c5bd4] text-xs"></i>
                                </div>
                                <div class="emp-info">
                                    <p class="emp-name">{{ emp.CompanyName }}</p>
                                    <p class="emp-location">
                                        <i class="fas fa-map-marker-alt text-[8px]"></i> {{ emp.Location }}
                                    </p>
                                </div>
                                <div class="emp-count">
                                    <p class="emp-jobs">{{ emp.JobCount }}</p>
                                    <p class="emp-label">tin đăng</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div class="pb-6"></div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* ─── Layout shell ─── */
.app-shell {
    display: flex;
    height: 100vh;
    width: 100%;
    background: #f1f3fb;
    overflow: hidden;
    font-family: 'Inter', system-ui, sans-serif;
}

/* ─── Main area ─── */
.main-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    /* Mobile: sidebar là fixed (out of flex flow) → main-area lấp đầy 100% width */
    width: 100%;
    min-width: 0;
    height: 100%;
    overflow: hidden;
}

/* ─── Topbar ─── */
.topbar {
    position: sticky;
    top: 0;
    z-index: 20;
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid #f1f5f9;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    flex-shrink: 0;
}
@media (min-width: 768px) { .topbar { padding: 14px 32px; } }

.topbar-left  { display: flex; align-items: center; gap: 12px; }
.topbar-right { display: flex; align-items: center; gap: 8px; }
@media (min-width: 768px) { .topbar-right { gap: 12px; } }

.hamburger {
    padding: 8px;
    margin-left: -8px;
    border-radius: 10px;
    color: #64748b;
    transition: background 0.15s;
}
.hamburger:hover { background: #f1f5f9; }

.page-title { font-size: 16px; font-weight: 800; color: #1e293b; line-height: 1.2; }
@media (min-width: 768px) { .page-title { font-size: 18px; } }
.page-date  { font-size: 10px; color: #94a3b8; font-weight: 500; margin-top: 1px; }
@media (min-width: 768px) { .page-date { font-size: 11px; } }

.notif-btn {
    position: relative;
    padding: 8px;
    border-radius: 10px;
    color: #64748b;
    background: transparent;
    transition: background 0.15s;
    align-items: center;
    justify-content: center;
}
.notif-btn:hover { background: #f1f5f9; }
.notif-dot {
    position: absolute;
    top: 8px; right: 8px;
    width: 7px; height: 7px;
    background: #ef4444;
    border-radius: 50%;
    border: 2px solid white;
}

.user-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 6px 12px;
    cursor: pointer;
    transition: background 0.15s;
}
.user-chip:hover { background: #f1f5f9; }
.user-avatar {
    width: 28px; height: 28px;
    border-radius: 50%;
    background: #4c5bd4;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
}
.user-name  { font-size: 12px; font-weight: 700; color: #334155; line-height: 1.2; }
.user-email { font-size: 10px; color: #94a3b8; }

/* ─── Scrollable content ─── */
.content-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}
@media (min-width: 768px) {
    .content-body { padding: 24px 32px; gap: 24px; }
}

/* ─── Stat cards grid ─── */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}
@media (min-width: 1024px) {
    .stats-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; }
}
@media (max-width: 480px) {
    .stats-grid { grid-template-columns: 1fr; }
}

.stat-card {
    background: white;
    border-radius: 16px;
    padding: 16px;
    border: 1px solid #f1f5f9;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    transition: box-shadow 0.25s, transform 0.25s;
    animation: fadeUp 0.4s ease both;
}
.stat-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    transform: translateY(-2px);
}
@media (min-width: 768px) { .stat-card { padding: 20px; border-radius: 20px; } }

.stat-card__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 12px;
}
.stat-icon {
    width: 40px; height: 40px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.06);
    transition: transform 0.2s;
    flex-shrink: 0;
}
.stat-card:hover .stat-icon { transform: scale(1.1); }
@media (min-width: 768px) { .stat-icon { width: 44px; height: 44px; font-size: 16px; border-radius: 14px; } }

.stat-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 99px;
}
.badge-up   { color: #059669; background: #ecfdf5; }
.badge-down { color: #dc2626; background: #fef2f2; }

.stat-value {
    font-size: 22px;
    font-weight: 800;
    color: #1e293b;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
}
@media (min-width: 768px) { .stat-value { font-size: 26px; } }
.stat-label {
    font-size: 11px;
    color: #94a3b8;
    font-weight: 500;
    margin-top: 4px;
}

/* ─── Two-col grid (chart + feed) ─── */
.two-col-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
}
@media (min-width: 1024px) {
    .two-col-grid { grid-template-columns: 2fr 1fr; gap: 24px; }
}

/* ─── Three-col grid (table + employers) ─── */
.three-col-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
}
@media (min-width: 1024px) {
    .three-col-grid { grid-template-columns: 2fr 1fr; gap: 24px; }
}

/* ─── Card ─── */
.card {
    background: white;
    border-radius: 16px;
    border: 1px solid #f1f5f9;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    padding: 16px;
    display: flex;
    flex-direction: column;
    animation: fadeUp 0.4s ease both;
}
@media (min-width: 768px) { .card { padding: 20px; border-radius: 20px; } }

.chart-card { overflow: hidden; }

.card__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16px;
    gap: 12px;
    flex-wrap: wrap;
}
.card__title   { font-size: 14px; font-weight: 800; color: #1e293b; }
@media (min-width: 768px) { .card__title { font-size: 15px; } }
.card__subtitle { font-size: 11px; color: #94a3b8; margin-top: 2px; }

.link-btn {
    font-size: 11px;
    color: #4c5bd4;
    font-weight: 600;
    white-space: nowrap;
    flex-shrink: 0;
    transition: opacity 0.15s;
}
.link-btn:hover { opacity: 0.7; }

/* ─── Chart ─── */
.chart-legend {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
}
.legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    font-weight: 600;
    color: #64748b;
}
.legend-dot {
    width: 12px; height: 12px;
    border-radius: 3px;
    display: inline-block;
}

.chart-wrap {
    overflow-x: auto;
    overflow-y: visible;
    padding-bottom: 4px;
}
.chart-wrap::-webkit-scrollbar { height: 3px; }
.chart-wrap::-webkit-scrollbar-track { background: transparent; }
.chart-wrap::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }

.chart-bars {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    height: 160px;
    min-width: 300px;
    width: 100%;
}
@media (min-width: 768px) { .chart-bars { height: 176px; gap: 12px; } }

.chart-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    height: 100%;
}
.bars-pair {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    flex: 1;
    width: 100%;
    justify-content: center;
    max-height: calc(100% - 20px);
}
@media (min-width: 768px) { .bars-pair { gap: 4px; } }

.bar {
    flex: 1;
    max-width: 18px;
    border-radius: 4px 4px 0 0;
    transition: height 0.7s cubic-bezier(0.4,0,0.2,1), opacity 0.2s;
    position: relative;
    cursor: pointer;
}
@media (min-width: 768px) { .bar { max-width: none; border-radius: 6px 6px 0 0; } }
.bar:hover { opacity: 0.8; }

.bar--blue   { background: #4c5bd4; }
.bar--yellow { background: #f1f864; border: 1px solid #d97706; }

.bar-tooltip {
    position: absolute;
    top: -28px;
    left: 50%;
    transform: translateX(-50%);
    background: #1e293b;
    color: white;
    font-size: 9px;
    padding: 3px 6px;
    border-radius: 5px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
    z-index: 10;
}
.bar:hover .bar-tooltip { opacity: 1; }

.bar-label {
    font-size: 10px;
    color: #94a3b8;
    font-weight: 500;
    text-align: center;
}

/* ─── Activity feed ─── */
.activity-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
}
.activity-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
}
.activity-icon {
    width: 30px; height: 30px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
}
.activity-body { flex: 1; min-width: 0; }
.activity-text {
    font-size: 12px;
    color: #475569;
    line-height: 1.45;
}
.activity-time { font-size: 10px; color: #94a3b8; margin-top: 2px; }

/* ─── Jobs table ─── */
.jobs-card { padding: 0; overflow: hidden; }
.jobs-card .card__header { padding: 16px 16px 0; }
@media (min-width: 768px) { .jobs-card .card__header { padding: 20px 24px 0; } }

.table-wrap {
    overflow-x: auto;
    width: 100%;
}
.custom-scrollbar::-webkit-scrollbar { height: 3px; width: 3px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }

.jobs-table {
    width: 100%;
    font-size: 12px;
    min-width: 520px;
    border-collapse: collapse;
}
.jobs-table th {
    text-align: left;
    padding: 10px 16px;
    color: #94a3b8;
    font-weight: 700;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border-bottom: 1px solid #f1f5f9;
}
@media (min-width: 768px) { .jobs-table th { padding: 12px 24px; } }
.th-center { text-align: center !important; }
.th-left   { text-align: left; }

.job-row {
    border-bottom: 1px solid #f8fafc;
    transition: background 0.15s;
}
.job-row:hover { background: #f8fafc; }
.job-row:last-child { border-bottom: none; }

.jobs-table td { padding: 12px 16px; vertical-align: middle; }
@media (min-width: 768px) { .jobs-table td { padding: 14px 24px; } }
.td-center { text-align: center; font-size: 12.5px; }
.td-date { color: #94a3b8; white-space: nowrap; font-size: 11px; }
.td-job  { }

.job-title {
    font-weight: 700;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
    transition: color 0.15s;
}
.job-row:hover .job-title { color: #4c5bd4; }
@media (min-width: 768px) { .job-title { max-width: 220px; } }

.job-meta {
    font-size: 10px;
    color: #94a3b8;
    margin-top: 2px;
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.dot-sep { color: #e2e8f0; margin: 0 2px; }

.status-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 99px;
    font-size: 10px;
    font-weight: 700;
    border: 1px solid transparent;
    white-space: nowrap;
}
.status-approved { background: #ecfdf5; color: #059669; border-color: #a7f3d0; }
.status-pending  { background: #fffbeb; color: #d97706; border-color: #fde68a; }
.status-rejected { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
.status-default  { background: #f8fafc; color: #475569; border-color: #e2e8f0; }

/* ─── Employers list ─── */
.employers-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
@media (min-width: 768px) { .employers-list { gap: 8px; } }

.employer-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.15s;
}
.employer-item:hover { background: #f8fafc; }

.emp-rank {
    width: 24px; height: 24px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px;
    font-weight: 900;
    flex-shrink: 0;
}
.rank-gold    { background: #f1f864; color: #3a49c2; }
.rank-silver  { background: #f1f5f9; color: #64748b; }
.rank-default { background: #f8fafc; color: #94a3b8; }

.emp-logo {
    width: 32px; height: 32px;
    border-radius: 10px;
    background: #eef0fd;
    border: 1px solid #d8dcf9;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
}
@media (min-width: 768px) { .emp-logo { width: 36px; height: 36px; } }

.emp-info { flex: 1; min-width: 0; }
.emp-name {
    font-size: 12px;
    font-weight: 700;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.15s;
}
.employer-item:hover .emp-name { color: #4c5bd4; }
@media (min-width: 768px) { .emp-name { font-size: 13px; } }
.emp-location {
    font-size: 9px;
    color: #94a3b8;
    display: flex;
    align-items: center;
    gap: 3px;
    margin-top: 1px;
}

.emp-count { text-align: right; flex-shrink: 0; }
.emp-jobs  { font-size: 13px; font-weight: 800; color: #4c5bd4; }
.emp-label { font-size: 9px; color: #94a3b8; }

/* ─── Animation ─── */
@keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
}
</style>