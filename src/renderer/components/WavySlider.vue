<template>
    <div class="wavy-slider-container"
        ref="container"
        :class="{ dragging: isDragging, hover: isHovering, paused: paused, disabled: disabled }"
        tabindex="0"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        @mousemove="handleMouseMove"
        @mousedown="handleMouseDown"
        @keydown="handleKeyDown">
        <canvas ref="canvas" class="wavy-canvas"></canvas>
        <div v-show="isHovering && !isDragging && hoverTimeText"
            class="hover-time-tooltip"
            :style="{ left: hoverTooltipLeft + 'px' }">
            {{ hoverTimeText }}
        </div>
    </div>
</template>

<script>
import { shortTime } from '@/util/formatter';

export default {
    name: 'WavySlider',
    props: {
        value: {
            type: Number,
            default: 0
        },
        duration: {
            type: Number,
            default: 0
        },
        currentTime: {
            type: Number,
            default: 0
        },
        paused: {
            type: Boolean,
            default: true
        },
        disabled: {
            type: Boolean,
            default: false
        },
        wavy: {
            type: Boolean,
            default: true
        }
    },
    data() {
        return {
            isDragging: false,
            isHovering: false,
            dragPercent: 0,
            hoverPercent: 0,
            hoverTooltipLeft: 0,
            currentAmplitude: 0,
            targetAmplitude: 4.5,
            phase: 0,
            width: 0,
            height: 28,
            dpr: window.devicePixelRatio || 1
        };
    },
    computed: {
        effectivePercent() {
            if (this.isDragging) return this.dragPercent;
            return Math.min(Math.max(this.value || 0, 0), 100);
        },
        hoverTimeText() {
            if (!this.duration) return '';
            const targetMs = (this.duration * this.hoverPercent) / 100;
            return shortTime(targetMs);
        }
    },
    watch: {
        paused() {
            this.updateTargetAmplitude();
        },
        wavy() {
            this.updateTargetAmplitude();
        },
        effectivePercent() {
            this.requestRender();
        }
    },
    methods: {
        shortTime,
        updateTargetAmplitude() {
            this.targetAmplitude = (this.wavy && !this.paused) ? 4.5 : 0;
            this.ensureAnimationLoop();
        },
        initCanvas() {
            if (!this.$refs.container || !this.$refs.canvas) return;
            const rect = this.$refs.container.getBoundingClientRect();
            this.width = rect.width || 300;
            this.height = rect.height || 28;
            this.dpr = window.devicePixelRatio || 1;

            const canvas = this.$refs.canvas;
            canvas.width = Math.round(this.width * this.dpr);
            canvas.height = Math.round(this.height * this.dpr);
            canvas.style.width = `${this.width}px`;
            canvas.style.height = `${this.height}px`;

            this.targetAmplitude = (this.wavy && !this.paused) ? 4.5 : 0;
            this.currentAmplitude = this.targetAmplitude;
            this.requestRender();
        },
        ensureAnimationLoop() {
            if (this.animFrameId) return;
            const loop = () => {
                let needsContinue = false;

                // Animate amplitude smoothly (lerp)
                const ampDiff = this.targetAmplitude - this.currentAmplitude;
                if (Math.abs(ampDiff) > 0.05) {
                    this.currentAmplitude += ampDiff * 0.12;
                    needsContinue = true;
                } else {
                    this.currentAmplitude = this.targetAmplitude;
                }

                // Advance wave phase if wave is visible or music is playing
                if ((this.wavy && !this.paused) || this.currentAmplitude > 0.05) {
                    this.phase += 0.045;
                    needsContinue = true;
                }

                this.render();

                if (needsContinue || this.isDragging || (this.wavy && !this.paused)) {
                    this.animFrameId = requestAnimationFrame(loop);
                } else {
                    this.animFrameId = null;
                }
            };
            this.animFrameId = requestAnimationFrame(loop);
        },
        requestRender() {
            if (!this.animFrameId) {
                this.ensureAnimationLoop();
            }
        },
        render() {
            const canvas = this.$refs.canvas;
            if (!canvas || !this.width || !this.height) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const w = this.width;
            const h = this.height;
            const centerY = h / 2;

            ctx.save();
            ctx.scale(this.dpr, this.dpr);
            ctx.clearRect(0, 0, w, h);

            const percent = this.effectivePercent;
            const thumbX = Math.max(0, Math.min(w, (percent / 100) * w));

            // Extract primary & outline colors from computed styles or fallback
            const style = getComputedStyle(this.$el || document.body);
            const primaryColor = style.getPropertyValue('--primary-color').trim() || '#e53935';
            const isDark = document.body.classList.contains('dark') || style.getPropertyValue('--background-color').includes('30, 30');

            const inactiveTrackColor = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.16)';

            // 1. Draw Unplayed Track (Right of Thumb)
            if (thumbX < w) {
                ctx.beginPath();
                ctx.moveTo(Math.max(thumbX, 4), centerY);
                ctx.lineTo(w - 2, centerY);
                ctx.strokeStyle = inactiveTrackColor;
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
                ctx.stroke();
            }

            // 2. Draw Played Track (Left of Thumb - Wavy Sine Wave)
            if (thumbX > 0) {
                ctx.beginPath();
                ctx.moveTo(2, centerY);

                const waveFrequency = 0.048; // wave cycles across width
                const amp = this.currentAmplitude;

                if (amp > 0.05 && thumbX > 10) {
                    for (let x = 2; x <= thumbX; x += 1.5) {
                        // Smooth start/end dampening
                        const dampStart = Math.min(1, x / 16);
                        const dampEnd = Math.min(1, (thumbX - x) / 16);
                        const waveY = centerY + Math.sin(x * waveFrequency - this.phase) * amp * dampStart * dampEnd;
                        ctx.lineTo(x, waveY);
                    }
                    ctx.lineTo(thumbX, centerY);
                } else {
                    ctx.lineTo(thumbX, centerY);
                }

                ctx.strokeStyle = primaryColor;
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();
            }

            // 3. Draw Thumb (Head)
            const isInteracting = this.isDragging || this.isHovering;
            const thumbRadius = isInteracting ? 7 : 5.5;

            // Halo glow on hover / drag
            if (isInteracting) {
                ctx.beginPath();
                ctx.arc(thumbX, centerY, 14, 0, Math.PI * 2);
                ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
                ctx.fill();

                ctx.beginPath();
                ctx.arc(thumbX, centerY, 10, 0, Math.PI * 2);
                ctx.fillStyle = primaryColor;
                ctx.globalAlpha = 0.25;
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }

            // Solid Thumb
            ctx.beginPath();
            ctx.arc(thumbX, centerY, thumbRadius, 0, Math.PI * 2);
            ctx.fillStyle = primaryColor;
            ctx.fill();

            // Inner white dot when interacting
            if (isInteracting) {
                ctx.beginPath();
                ctx.arc(thumbX, centerY, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
            }

            ctx.restore();
        },
        calculatePercentFromEvent(e) {
            const rect = this.$refs.container.getBoundingClientRect();
            const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
            const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
            return (x / rect.width) * 100;
        },
        handleMouseDown(e) {
            if (this.disabled) return;
            e.preventDefault();
            this.isDragging = true;
            this.dragPercent = this.calculatePercentFromEvent(e);
            this.$emit('input', this.dragPercent);
            this.requestRender();

            const onMouseMove = ev => {
                if (!this.isDragging) return;
                this.dragPercent = this.calculatePercentFromEvent(ev);
                this.$emit('input', this.dragPercent);
                this.requestRender();
            };

            const onMouseUp = ev => {
                if (!this.isDragging) return;
                this.isDragging = false;
                this.dragPercent = this.calculatePercentFromEvent(ev);
                this.$emit('change', this.dragPercent);
                this.requestRender();

                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        },
        handleMouseEnter() {
            this.isHovering = true;
            this.requestRender();
        },
        handleMouseLeave() {
            this.isHovering = false;
            this.requestRender();
        },
        handleMouseMove(e) {
            if (this.disabled) return;
            const rect = this.$refs.container.getBoundingClientRect();
            const clientX = e.clientX;
            const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
            this.hoverPercent = (x / rect.width) * 100;
            this.hoverTooltipLeft = Math.max(20, Math.min(rect.width - 20, x));
        },
        handleKeyDown(e) {
            if (this.disabled) return;
            let step = 0;
            if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                step = -2;
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                step = 2;
            }
            if (step !== 0) {
                e.preventDefault();
                const newPercent = Math.max(0, Math.min(100, this.effectivePercent + step));
                this.$emit('change', newPercent);
                this.requestRender();
            }
        }
    },
    mounted() {
        this.initCanvas();
        this.resizeObserver = new ResizeObserver(() => {
            this.initCanvas();
        });
        if (this.$refs.container) {
            this.resizeObserver.observe(this.$refs.container);
        }
        this.ensureAnimationLoop();
    },
    beforeDestroy() {
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
        if (this.resizeObserver && this.$refs.container) {
            this.resizeObserver.unobserve(this.$refs.container);
            this.resizeObserver.disconnect();
        }
    }
};
</script>

<style lang="less">
.wavy-slider-container {
    position: relative;
    width: 100%;
    height: 28px;
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
    outline: none;
    touch-action: none;

    .wavy-canvas {
        display: block;
        width: 100%;
        height: 100%;
        pointer-events: none;
    }

    .hover-time-tooltip {
        position: absolute;
        bottom: 28px;
        transform: translateX(-50%);
        background: var(--md-sys-color-inverse-surface, #313033);
        color: var(--md-sys-color-inverse-on-surface, #f4eff4);
        font-size: 11px;
        font-weight: 600;
        padding: 3px 8px;
        border-radius: 12px;
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.24);
        pointer-events: none;
        white-space: nowrap;
        animation: tooltip-fade-in 0.15s cubic-bezier(0.2, 0, 0, 1);
        z-index: 10;
    }

    &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
}

@keyframes tooltip-fade-in {
    from {
        opacity: 0;
        transform: translate(-50%, 4px) scale(0.92);
    }
    to {
        opacity: 1;
        transform: translate(-50%, 0) scale(1);
    }
}
</style>
