<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue';

const props = defineProps({
    message: {
        type: String,
        required: true
    },
    isSuccess: {
        type: Boolean,
        required: true
    },
    duration: {
        type: Number,
        default: 3000
    }
});

const emit = defineEmits(['close']);
const showNotify = ref(false);
const progress = ref(100);
let timer: number | null = null;
let progressTimer: number | null = null;
const TICK = 16; // ~60fps

onMounted(() => {
    showNotify.value = true;
    if (props.duration > 0) {
        // progress bar countdown
        const decrement = (TICK / props.duration) * 100;
        progressTimer = setInterval(() => {
            progress.value = Math.max(0, progress.value - decrement);
        }, TICK);

        timer = setTimeout(() => {
            closeNotify();
        }, props.duration);
    }
});

const closeNotify = () => {
    showNotify.value = false;
    if (progressTimer) clearInterval(progressTimer);
    setTimeout(() => emit('close'), 300);
};

onUnmounted(() => {
    if (timer) clearTimeout(timer);
    if (progressTimer) clearInterval(progressTimer);
});

const config = computed(() => props.isSuccess
    ? {
        icon: 'fas fa-check',
        iconBg: '#eef0fd',
        iconColor: '#4c5bd4',
        accentColor: '#4c5bd4',
        accentLight: '#eef0fd',
        label: 'Thành công',
        progressColor: '#4c5bd4',
      }
    : {
        icon: 'fas fa-exclamation',
        iconBg: '#fef2f2',
        iconColor: '#ef4444',
        accentColor: '#ef4444',
        accentLight: '#fef2f2',
        label: 'Lỗi',
        progressColor: '#ef4444',
      }
);
</script>

<template>
    <Transition
        enter-active-class="notify-enter-active"
        enter-from-class="notify-enter-from"
        enter-to-class="notify-enter-to"
        leave-active-class="notify-leave-active"
        leave-from-class="notify-leave-from"
        leave-to-class="notify-leave-to"
    >
        <div v-if="showNotify" class="notify-wrapper">
            <div class="notify-card" :style="`--accent: ${config.accentColor}; --accent-light: ${config.accentLight};`">

                <!-- Left accent bar -->
                <div class="accent-bar" />

                <!-- Icon -->
                <div class="icon-wrap" :style="`background: ${config.iconBg}`">
                    <i :class="config.icon" :style="`color: ${config.iconColor}`" class="text-sm" />
                </div>

                <!-- Text -->
                <div class="text-block">
                    <p class="notify-label">{{ config.label }}</p>
                    <p class="notify-message">{{ message }}</p>
                </div>

                <!-- Close -->
                <button @click="closeNotify" class="close-btn" aria-label="Đóng">
                    <i class="fas fa-times text-[11px]"></i>
                </button>

                <!-- Progress bar -->
                <div v-if="duration > 0" class="progress-track">
                    <div
                        class="progress-fill"
                        :style="`width: ${progress}%; background: ${config.progressColor}`"
                    />
                </div>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
/* ── Positioning ── */
.notify-wrapper {
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 9999;
}

/* ── Card ── */
.notify-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 300px;
    max-width: 380px;
    padding: 14px 14px 18px 14px; /* bottom extra for progress bar */
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid #f1f5f9;
    box-shadow:
        0 4px 6px rgba(0,0,0,0.04),
        0 10px 30px rgba(0,0,0,0.08),
        0 0 0 1px rgba(0,0,0,0.02);
    overflow: hidden;
    font-family: 'Inter', system-ui, sans-serif;
}

/* ── Accent bar (left) ── */
.accent-bar {
    position: absolute;
    left: 0; top: 12px; bottom: 12px;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: var(--accent);
}

/* ── Icon ── */
.icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-left: 8px;
}

/* ── Text ── */
.text-block {
    flex: 1;
    min-width: 0;
}
.notify-label {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--accent);
    margin-bottom: 2px;
    line-height: 1;
}
.notify-message {
    font-size: 13px;
    font-weight: 500;
    color: #334155;
    line-height: 1.45;
}

/* ── Close button ── */
.close-btn {
    flex-shrink: 0;
    align-self: flex-start;
    width: 24px;
    height: 24px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    transition: background 0.15s, color 0.15s;
}
.close-btn:hover {
    background: #f1f5f9;
    color: #475569;
}

/* ── Progress bar ── */
.progress-track {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: #f1f5f9;
}
.progress-fill {
    height: 100%;
    border-radius: 0 2px 2px 0;
    transition: width 16ms linear;
}

/* ── Transitions ── */
.notify-enter-active {
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
}
.notify-leave-active {
    transition: transform 0.25s cubic-bezier(0.4, 0, 1, 1), opacity 0.2s ease;
}
.notify-enter-from {
    transform: translateX(calc(100% + 24px));
    opacity: 0;
}
.notify-enter-to {
    transform: translateX(0);
    opacity: 1;
}
.notify-leave-from {
    transform: translateX(0);
    opacity: 1;
}
.notify-leave-to {
    transform: translateX(calc(100% + 24px));
    opacity: 0;
}
</style>
