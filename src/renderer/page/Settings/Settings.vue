<template>
    <div class="ncm-page">
        <div class="settings">
            <mu-list>
                <template v-for="group of Entries">
                    <mu-sub-header :key="group.name">{{ group.name }}</mu-sub-header>
                    <template v-for="item of group.items">
                        <component v-if="shouldShowOption(item)"
                            :key="item.title"
                            :is="Option[item.type]"
                            v-bind="item"></component>
                    </template>
                </template>
            </mu-list>
        </div>
    </div>
</template>

<script>
import { mapActions } from 'vuex';

import Api from '@/api/ipc';
import { encm } from '@/util/globals';
import { applyThemeFromSettings } from '@/util/theme';
import { humanSize } from '@/util/formatter';
import { UPDATE_SETTINGS } from '@/store/mutation-types';
import { isLinux, isDarwin, browserWindow, webContents } from '@/util/globals';

import OptionColor from './OptionColor.vue';
import OptionPlain from './OptionPlain.vue';
import OptionSelect from './OptionSelect.vue';
import OptionToggle from './OptionToggle.vue';
import { openColorPicker } from './open-color-picker';

import { Entries } from './entries';
import { Versions, RepoURL, IpcTag } from './constants';

const Option = {
    color: OptionColor,
    plain: OptionPlain,
    select: OptionSelect,
    toggle: OptionToggle
};

export default {
    data() {
        return {
            cacheSize: '',
            musicSize: '',
            dataSize: '',
            versionName: ''
        };
    },
    inject: [
        'darkMediaQuery'
    ],
    computed: {
        /** @returns {import('@/store/modules/settings').State} */
        settings() { return this.$store.state.settings; },
        /** @returns {{ [key: string]: Vue }} */
        Option() { return Option; },
        Entries() { return Entries; },
        drawerBkgStatus() {
            return this.settings.customDrawerBkg ? '已自定义' : '默认';
        }
    },
    methods: {
        ...mapActions([
            'updateSettings',
            'resetSettings',
            'updateMainWindowTitle'
        ]),
        uploadDrawerBkg() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                try {
                    const objectUrl = URL.createObjectURL(file);
                    const img = new Image();
                    await new Promise((resolve, reject) => {
                        img.onload = () => resolve();
                        img.onerror = () => reject(new Error('Image decode error'));
                        img.src = objectUrl;
                    });
                    const canvas = document.createElement('canvas');
                    const maxWidth = 800;
                    const maxHeight = 600;
                    let w = img.width || 600;
                    let h = img.height || 400;
                    if (w > maxWidth || h > maxHeight) {
                        const ratio = Math.min(maxWidth / w, maxHeight / h);
                        w = Math.round(w * ratio);
                        h = Math.round(h * ratio);
                    }
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    URL.revokeObjectURL(objectUrl);
                    const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
                    await this.setByName('customDrawerBkg', optimizedDataUrl);
                    this.$toast.message('抽屉背景图片已更新');
                } catch {
                    try {
                        const reader = new FileReader();
                        reader.onload = async (ev) => {
                            await this.setByName('customDrawerBkg', ev.target.result);
                            this.$toast.message('抽屉背景图片已更新');
                        };
                        reader.readAsDataURL(file);
                    } catch {
                        this.$toast.message('图片加载失败，请重试');
                    }
                }
            };
            input.click();
        },
        promptResetDrawerBkg() {
            this.$confirm('确定要恢复抽屉默认背景图片吗？', '提示').then(({ result }) => {
                if (result) {
                    this.setByName('customDrawerBkg', '');
                    this.$toast.message('已恢复默认背景图片');
                }
            }).catch(() => { /* noop */ });
        },
        shouldShowOption(item) {
            if (!item.depends && !item.exclude) return true;
            if (Array.isArray(item.depends)) {
                for (const d of item.depends) {
                    if (!this.settings[d]) return false;
                }
            }
            if (Array.isArray(item.exclude)) {
                for (const e of item.exclude) {
                    if (this.Platforms[e]) return false;
                }
            }
            return true;
        },
        refreshSize() {
            webContents.sessionGetCacheSize().then(s => this.cacheSize = humanSize(s));
            Api.getDataSize('all').then(s => this.dataSize = humanSize(s.size));
            Api.getDataSize('music').then(s => this.musicSize = humanSize(s.size));
        },
        initData() {
            this.refreshSize();
            Api.getVersionName().then(v => this.versionName = v);
        },
        setByName(name, val) {
            if (this.settings[name] === val) return;
            return this.updateSettings({ [name]: val });
        },
        setColorByName(name) {
            openColorPicker().then(color => {
                this.setByName(name, color);
            }).catch(() => { /* noop */ });
        },
        clearCache(type) {
            switch (type) {
                case 'chrome':
                    return webContents.sessionClearCache();
                case 'music':
                    return Api.clearCache('music');
            }
        },
        promptClearCache(type) {
            let name;
            switch (type) {
                case 'chrome': name = '浏览器'; break;
                case 'music': name = '歌曲'; break;
            }
            this.$confirm(`${name}缓存将被清除，确定吗？`, {
                title: '清除缓存',
            }).then(({ result }) => {
                if (!result) throw 0;
                return this.clearCache(type);
            }).then(() => {
                this.$toast.message(`${name}缓存清除完成`);
                this.refreshSize();
            }).catch(() => { /* noop */ });
        },
        promptClearBrowserCache() {
            this.promptClearCache('chrome');
        },
        promptClearMusicCache() {
            this.promptClearCache('music');
        },
        promptWipeAppData() {
            this.$confirm(
                '所有应用数据都将被清除，包括缓存以及账号登录状态，之后窗口将重新加载。确定吗？',
                '清除所有应用数据'
            ).then(msgReturn => {
                if (msgReturn.result === true) {
                    window.onbeforeunload = null;
                    Promise.all([
                        Api.updateCookie(),
                        webContents.sessionClearStorage(),
                        this.resetSettings(),
                        this.clearCache('music'),
                        this.clearCache('chrome'),
                    ]).then(() => this.recreateWindow());
                }
            });
        },
        launchDevTools() {
            webContents.openDevTools();
        },
        reloadPage() {
            browserWindow.reload();
        },
        recreateWindow() {
            encm.send(IpcTag, 'recreateWindow');
        },
        showVersions() {
            this.$alert(h => h('pre', { class: 'mono-font' }, Versions), '版本号');
        },
        openBrowser(url) {
            encm.invoke('openExternal', url).catch(() => {
                this.$alert(`无法打开您的浏览器，请直接访问 ${url}`, '提示');
            });
        },
        openRepoInBrowser() {
            this.openBrowser(RepoURL);
        },
        subscribeMutation() {
            return this.$store.subscribe(({ type, payload }, state) => {
                if (type !== UPDATE_SETTINGS) return;
                for (const [key, val] of Object.entries(payload)) {
                    switch (key) {
                        case 'themeFollowCover':
                        case 'themePrimaryColor':
                        case 'themeSecondaryColor':
                        case 'themeVariety': {
                            applyThemeFromSettings(state.settings, state.ui, this.darkMediaQuery);
                            break;
                        }
                        case 'windowBorder':
                            this.$nextTick(() => this.recreateWindow());
                            break;
                        case 'titleBarShowsTrackName':
                            this.updateMainWindowTitle(val);
                            break;
                        case 'windowZoom':
                            webContents.setZoomFactor(val || 1);
                            break;
                        case 'showTrayIcon':
                            if (val === false && state.settings.exitOnWindowClose === false) {
                                this.setByName('exitOnWindowClose', true);
                            }
                        // eslint-disable-nextline no-fallthrough
                        case 'exitOnWindowClose':
                            encm.send(IpcTag, key, val);
                            break;
                        case 'bitRate':
                            if (val === 'ex') {
                                this.$toast.message('实际播放码率取决于歌曲最高码率和帐号最高可播放码率');
                            }
                            break;
                        case 'bitRateDownload':
                            if (val === 'ex') {
                                this.$toast.message('实际下载码率取决于歌曲最高码率和帐号最高可播放码率');
                            }
                            break;
                    }
                }
            });
        }
    },
    created() {
        this.initData();
        this.Platforms = { isLinux, isDarwin };
        this.unsub = this.subscribeMutation();
    },
    beforeDestroy() {
        if (typeof this.unsub === 'function') {
            this.unsub();
        }
    }
};
</script>

<style lang="less">
.settings {
    max-width: 600px;
    margin: 0 auto 100px;
    user-select: none;
    .nowrap {
        white-space: nowrap;
    }
    .mu-item-action {
        .mu-input {
            margin: 0;
            padding: 0;
            min-height: unset;
        }
    }
}
</style>
