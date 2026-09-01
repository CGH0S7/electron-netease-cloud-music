<template>
    <div id="app" class="app-root">
        <AppNav></AppNav>
        <div class="router-view">
            <transition :name="transitionName">
                <keep-alive :include="KeepAlive">
                    <router-view></router-view>
                </keep-alive>
            </transition>
        </div>
        <PlayerBar></PlayerBar>
        <CollectPopup></CollectPopup>
    </div>
</template>

<script>
import AppNav from '@/components/AppNav/AppNav.vue';
import PlayerBar from '@/components/PlayerBar/PlayerBar.vue';
import CollectPopup from '@/components/CollectPopup.vue';
import { goBack, goForward } from '@/util/navigation';

export default {
    name: 'app',
    components: {
        AppNav,
        PlayerBar,
        CollectPopup
    },
    data() {
        return {
            transitionName: 'fade-up'
        };
    },
    computed: {
        KeepAlive() {
            return ['index', 'player', 'favorite'];
        }
    },
    methods: {
        handleGlobalKeyDown(ev) {
            // 1. Space key: Play / Pause toggle
            if (ev.code === 'Space' || ev.key === ' ' || ev.keyCode === 32) {
                const target = ev.target;
                const isEditable = target && (
                    target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.tagName === 'SELECT' ||
                    target.isContentEditable ||
                    target.getAttribute('contenteditable') === 'true' ||
                    (typeof target.closest === 'function' && target.closest('input, textarea, [contenteditable="true"], .searchbox-popover'))
                );

                if (isEditable) {
                    return; // Allow typing spaces in search, inputs, textareas, etc.
                }

                // Prevent space from scrolling page down or clicking focused button
                ev.preventDefault();
                ev.stopPropagation();

                const ui = this.$store.state.ui;
                const queue = this.$store.getters.queue;

                if (ui.audioSrc) {
                    if (ui.paused) {
                        this.$store.dispatch('playAudio');
                    } else {
                        this.$store.dispatch('pauseAudio');
                    }
                } else if (queue && queue.list && queue.list.length > 0) {
                    const index = queue.index >= 0 ? queue.index : 0;
                    this.$store.dispatch('playTrackIndex', index);
                }
            } else if (ev.altKey && (ev.key === 'ArrowLeft' || ev.key === 'Left')) {
                // Alt + Left = Browser / Spotify style Back
                ev.preventDefault();
                goBack();
            } else if (ev.altKey && (ev.key === 'ArrowRight' || ev.key === 'Right')) {
                // Alt + Right = Browser / Spotify style Forward
                ev.preventDefault();
                goForward();
            }
        },
        handleGlobalMouseDown(ev) {
            // Mouse button 3: Browser Back
            if (ev.button === 3) {
                ev.preventDefault();
                goBack();
            } else if (ev.button === 4) {
                // Mouse button 4: Browser Forward
                ev.preventDefault();
                goForward();
            }
        }
    },
    created() {
        const _removeGuard = this.$router.beforeEach((to, from, next) => {
            if (to.name === 'player') {
                this.transitionName = 'player-in';
            } else if (from.name === 'player') {
                this.transitionName = 'player-out';
            } else if (window.__NAV_BACK__ === true) {
                this.transitionName = 'fade-down';
            } else {
                this.transitionName = 'fade-up';
            }
            window.__NAV_BACK__ = false;
            next();
        });
        this._removeGuard = _removeGuard;

        this._onkeydown = this.handleGlobalKeyDown.bind(this);
        this._onmousedown = this.handleGlobalMouseDown.bind(this);

        window.addEventListener('keydown', this._onkeydown, { capture: true });
        document.addEventListener('mousedown', this._onmousedown);
    },
    beforeDestroy() {
        if (typeof this._removeGuard === 'function') {
            this._removeGuard();
            this._removeGuard = null;
        }
        if (typeof this._onkeydown === 'function') {
            window.removeEventListener('keydown', this._onkeydown, { capture: true });
            this._onkeydown = null;
        }
        if (typeof this._onmousedown === 'function') {
            document.removeEventListener('mousedown', this._onmousedown);
            this._onmousedown = null;
        }
    }
};
</script>

<style lang="less">
.app-root {
    min-height: 100vh;
    background-color: var(--background-color);
    color: var(--text-color);
}

.router-view {
    height: calc(100vh - 136px);
    position: relative;
    margin-top: 64px;
    overflow: hidden;
    .ncm-page {
        background-color: var(--background-color);
        width: 100%;
        height: 100%;
        overflow: auto;
        position: absolute;
        top: 0;
        left: 0;

        &.player {
            overflow: hidden !important;
        }
    }
}
</style>
