<template>
    <div class="player ncm-page"
        :class="{ dark: dark }">
        <div class="bkg">
            <canvas ref="cvs"
                width="1000"
                height="600"></canvas>
        </div>
        <div class="phonograph"
            :class="{ play: !ui.paused }">
            <img :src="needleImg"
                class="stylus">
            <div class="vinyl">
                <img :src="albumImgSrc"
                    class="cover">
                <img :src="discImg"
                    class="border">
            </div>
            <div v-if="playing.id"
                class="action">
                <mu-button v-if="isDjRadioProgram"
                    flat
                    small
                    :color="threadLiked ? 'primary' : 'black'"
                    :disabled="threadLiked === null"
                    @click="handleProgramLike">
                    <mu-icon left
                        :size="18"
                        value="thumb_up"></mu-icon>
                    <span>{{ threadLiked ? '已赞' : '赞' }}</span>
                </mu-button>
                <mu-button v-else
                    flat
                    small
                    color="black"
                    @click="handleCollect">
                    <mu-icon left
                        :size="18"
                        value="bookmark_border"></mu-icon>
                    <span>收藏</span>
                </mu-button>
                <router-link :to="commentRoute"
                    replace
                    v-slot="{ navigate }"
                    custom>
                    <mu-button flat
                        small
                        color="black"
                        @click="navigate">
                        <mu-icon left
                            :size="18"
                            value="comment"></mu-icon>
                        <span>评论 ({{ commentCount }})</span>
                    </mu-button>
                </router-link>
                <mu-button flat
                    small
                    color="black"
                    @click="handleDownload">
                    <mu-icon left
                        :size="18"
                        :value="ui.downloaded ? 'done' : 'get_app'"></mu-icon>
                    <span>{{ ui.downloading ? '下载中' : ui.downloaded ? '已下载' : '下载' }}</span>
                </mu-button>
                <mu-menu cover
                    placement="top-end"
                    :open.sync="moreMenuOpen">
                    <mu-button flat
                        small
                        color="black">
                        <mu-icon left
                            :size="18"
                            value="more_horiz"></mu-icon>
                        <span>更多</span>
                    </mu-button>
                    <template #content>
                        <mu-list dense>
                            <mu-list-item button
                                @click="saveCoverImage">
                                <mu-list-item-action>
                                    <mu-icon value="image"></mu-icon>
                                </mu-list-item-action>
                                <mu-list-item-title>保存封面</mu-list-item-title>
                            </mu-list-item>
                            <mu-list-item button
                                @click="toggleShare">
                                <mu-list-item-action>
                                    <mu-icon value="share"></mu-icon>
                                </mu-list-item-action>
                                <mu-list-item-title>分享</mu-list-item-title>
                            </mu-list-item>
                        </mu-list>
                    </template>
                </mu-menu>
            </div>
        </div>
        <div class="info">
            <div class="title">
                <span class="name">{{ playing.name }}</span>
                <router-link v-if="playing.mv"
                    :to="{ name: 'video', params: { id: playing.mv } }"
                    v-slot="{ navigate }"
                    replace
                    custom>
                    <mu-button icon
                        small
                        color="primary"
                        class="btn-mv"
                        title="查看 MV"
                        @click="navigate">
                        <mu-icon value="music_video"></mu-icon>
                    </mu-button></router-link>
            </div>
            <p class="source">
                <template v-if="isDjRadioProgram">
                    <span>电台：</span>
                    <router-link class="source-link"
                        :to="{ name: 'djradio', params: { id: playing.source.id } }"
                        replace>{{ playing.source.djradio.radio.name }}</router-link>
                </template>
                <template v-else>
                    <span v-if="playing.artists"
                        class="source-artist">
                        <span>歌手：</span>
                        <template v-for="(ar, index) in playing.artists">
                            <span v-if="index !== 0"
                                :key="'sep' + index"
                                class="sep">/</span>
                            <router-link v-if="ar.id"
                                :key="ar.id"
                                class="source-link"
                                :to="{ name: 'artist', params: { id: ar.id } }"
                                replace>{{ ar.name }}</router-link>
                            <span v-else
                                :key="'ar' + index">{{ ar.name }}</span>
                        </template>
                    </span>
                    <span v-if="playing.album"
                        class="source-album">
                        <span>专辑：</span>
                        <router-link v-if="playing.album.id"
                            class="source-link"
                            :to="{ name: 'album', params: { id: playing.album.id } }"
                            replace>{{ playing.album.name }}</router-link>
                        <span v-else>{{ playing.album.name }}</span>
                    </span>
                </template>
            </p>
            <div v-if="isDjRadioProgram"
                class="description">
                <div class="scroller">
                    <div>{{ playing.source.djradio.description }}</div>
                </div>
            </div>
            <div v-else
                class="lyric">
                <div v-if="playing.id"
                    class="control">
                    <mu-button flat
                        small
                        color="black"
                        @click="handleLyricRefresh">
                        <mu-icon left
                            value="refresh"></mu-icon>
                        <span>刷新歌词</span>
                    </mu-button>
                </div>
                <div v-if="ui.lyricLoading"
                    class="mask">
                    <p>歌词加载中 ...</p>
                </div>
                <div v-show="!ui.lyricLoading"
                    ref="scrollerWrapper"
                    class="scroller-wrapper"
                    @mousewheel="handleMouseScroll"
                    @mouseenter="lyricMouseIn = true"
                    @mouseleave="lyricMouseIn = false">
                    <div class="scroller"
                        :style="lyricScrollerStyle">
                        <template v-if="lyricToShow">
                            <div v-for="(line, index) of lyricToShow.lyrics"
                                ref="lyric"
                                class="line"
                                :key="index"
                                :class="{ active: index == currentLyricIndex }"
                                :data-time="line.timestamp"
                                @click="handleLyricClick(line.timestamp)"
                                v-text="line.content + '\n' + (line.trans || '')"></div>
                        </template>
                        <template v-else-if="ui.lyric.txtLyric">
                            <div class="txt"
                                v-text="ui.lyric.txtLyric"></div>
                        </template>
                        <template v-else>
                            <p>暂无歌词</p>
                        </template>
                        <template v-if="ui.lyric.lyricUser">
                            <div class="contributors">
                                <div>
                                    <span>歌词贡献者：</span>
                                    <router-link class="contributor"
                                        replace
                                        :to="{ name: 'user', params: { id: ui.lyric.lyricUser.userid } }">
                                        {{ ui.lyric.lyricUser.nickname }}
                                    </router-link>
                                </div>
                                <div v-if="ui.lyric.transUser">
                                    <span>翻译贡献者：</span>
                                    <router-link class="contributor"
                                        replace
                                        :to="{ name: 'user', params: { id: ui.lyric.transUser.userid } }">
                                        {{ ui.lyric.transUser.nickname }}
                                    </router-link>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>
            </div>
        </div>
        <mu-dialog width="500"
            title="分享"
            dialog-class="share-dlg"
            :open.sync="dlgShareOpen">
            <div class="share-content">
                <div ref="shareText">{{ shareText }}</div>
            </div>
            <template #actions>
                <mu-button flat
                    color="primary"
                    @click="toggleShare">关闭</mu-button>
            </template>
        </mu-dialog>
    </div>
</template>

<script>
import { mapActions } from 'vuex';

import Api from '@/api/ipc';
import { workerExecute } from '@/worker/message';
import { sizeImg, HiDpiPx } from '@/util/image';

import discImg from 'assets/img/disc.webp';
import needleImg from 'assets/img/needle.webp';
import discDefault from 'assets/img/disc_default.webp';
import defaultCoverImg from 'assets/img/cover_default.webp';

export default {
    name: 'player',
    data() {
        return {
            dark: false,
            isActive: false,
            canvasImageId: -1,
            threadInfoId: -1,
            threadLiked: false,
            commentCount: '...',
            currentLyricIndex: -1,
            moreMenuOpen: false,
            dlgShareOpen: false,
            lyricScrollOffset: 0,
            lyricMouseIn: false,
        };
    },
    computed: {
        discImg() { return discImg; },
        needleImg() { return needleImg; },
        /** @returns {import('@/store/modules/ui').State} */
        ui() { return this.$store.state.ui; },
        /** @returns {import('@/store/modules/user').State} */
        user() { return this.$store.state.user; },
        /** @returns {import('@/store/modules/settings').State} */
        settings() { return this.$store.state.settings; },
        /** @returns {Models.Track} */
        playing() { return this.$store.getters.playing; },
        themeCompensation() {
            return this.settings.themeVariety === 'light' ? 25 : 4.8;
        },
        /** @returns {Boolean} */
        isDjRadioProgram() {
            return this.playing?.source?.djradio !== undefined;
        },
        /** @returns {string} */
        albumImgSrc() {
            if (this.ui.coverImgSrc) {
                return sizeImg(this.ui.coverImgSrc, HiDpiPx(400));
            }
            return discDefault;
        },
        /** @returns {Types.LyricObjectItem} */
        lyricToShow() {
            switch (this.settings.lyricTranslation) {
                case 'translation':
                    return this.ui.lyric.mlrc || this.ui.lyric.lrc;
                case 'romaji':
                    return this.ui.lyric.romalrc || this.ui.lyric.lrc;
                case 'off':
                default:
                    return this.ui.lyric.lrc;
            }
        },
        commentRoute() {
            const { id, source = {} } = this.playing;
            return {
                name: 'comment',
                params: this.isDjRadioProgram
                    ? { type: 'dj', id: source.djradio.id }
                    : { type: 'song', id }
            };
        },
        shareText() {
            if (!this.playing.id) return '';
            if (this.isDjRadioProgram) {
                const { id, radio } = this.playing.source.djradio;
                return `分享 ${radio.name} 的节目 《${this.playing.name}》：https://music.163.com/program/${id}`;
            }
            const { id, name, artistName } = this.playing;
            return `分享 ${artistName} 的单曲 《${name}》：https://music.163.com/song/${id}`;
        },
        lyricScrollerStyle() {
            if (typeof this.ui.lyric.txtLyric === 'string') {
                // non-scrollable lyric
                return 'height: 100%; overflow: auto;';
            }
            const wrapper = this.$refs.scrollerWrapper;
            const containerHeight = wrapper ? wrapper.clientHeight : 380;
            const targetCenter = containerHeight * 0.38;

            if (this.currentLyricIndex === -1 || !this.$refs.lyric || this.$refs.lyric.length === 0) {
                // initial state
                return `transform: translateY(${targetCenter + this.lyricScrollOffset}px)`;
            }
            const currentLyricElem = this.$refs.lyric[this.currentLyricIndex];
            if (!currentLyricElem) {
                return `transform: translateY(${targetCenter + this.lyricScrollOffset}px)`;
            }
            const offset = targetCenter - currentLyricElem.offsetTop - (currentLyricElem.clientHeight / 2) + this.lyricScrollOffset;
            return `transform: translateY(${offset}px);`;
        }
    },
    methods: {
        ...mapActions([
            'updateUiLyric',
            'toggleCollectPopup',
            'downloadTrack',
        ]),
        handleLyricClick(timestamp) {
            if (timestamp === undefined || timestamp === null) return;
            const audio = document.getElementById('playerbar-audio');
            if (audio) {
                audio.currentTime = timestamp;
            }
        },
        listenAudioUpdate() {
            /** @type {HTMLAudioElement} */
            const audio = document.getElementById('playerbar-audio');
            audio.addEventListener('timeupdate', ev => {
                // do nothing if element map is empty or compo not acitve
                // it's empty in case:
                // 1. no lyric for this track
                // 2. the component is mounted but not active yet e.g. it's in <keep-alive/> background
                if (!this.isActive || !this.$refs.lyric || !this.$refs.lyric.length) return;
                // do not loop from 0 every time
                // loop form current index. if current index equals -1, loop from 0
                let loopStart = this.currentLyricIndex === -1 ? 0 : this.currentLyricIndex;
                // the process was darged backword, loop from 0
                if (ev.target.currentTime < +this.$refs.lyric[loopStart].dataset.time) {
                    loopStart = 0;
                }
                // loop and find the smallest whose time larger than currentTime
                for (let i = loopStart; i < this.$refs.lyric.length; i++) {
                    if (ev.target.currentTime < +this.$refs.lyric[i].dataset.time) {
                        this.currentLyricIndex = i - 1;
                        return;
                    }
                }
                // not found any, point to the last element
                this.currentLyricIndex = this.$refs.lyric.length - 1;
            });
        },
        paintBkgCanvas() {
            this.canvasImageId = this.playing.id;
            let src;
            const size = HiDpiPx(64);
            if (this.ui.coverImgSrc) {
                src = sizeImg(this.ui.coverImgSrc, size);
            } else {
                src = defaultCoverImg;
            }
            const w = 1000;
            const h = 600;
            /** @type {CanvasRenderingContext2D} */
            const ctx = this.$refs.cvs.getContext('2d');
            ctx.globalAlpha = 0.9;
            ctx.filter = 'blur(60px) brightness(0.75)';
            fetch(src).then(r => r.blob()).then(b => {
                this.determineBrightness(b);
                return createImageBitmap(b);
            }).then(bm => {
                ctx.clearRect(0, 0, w, h);
                ctx.drawImage(bm, 0, 0, size, size, -120, -120, w + 240, h + 240);
            });
        },
        /** 
         * @param {ImageBitmapSource} bms
         */
        async determineBrightness(bms) {
            const b = await workerExecute('determineBrightness', bms);
            // globalAlpha = 0.9;  brightness(0.75)
            const brightness = (b * 0.9 * 0.75 + this.themeCompensation);
            this.dark = brightness < 102;
        },
        async refreshThreadInfo() {
            const { id, source = {} } = this.playing;
            if (!id) return;
            this.threadInfoId = id;
            this.threadLiked = null;
            this.commentCount = '...';
            const thread = source.djradio ? `A_DJ_1_${source.djradio.id}` : `R_SO_4_${id}`;
            const resp = await Api.getCommentThreadInfoE(thread);
            if (resp.code === 200) {
                if (id !== this.threadInfoId) return;
                this.threadLiked = resp.liked;
                this.commentCount = resp.commentCount;
            }
        },
        handleLyricRefresh() {
            this.updateUiLyric({ ignoreCache: true });
        },
        async handleProgramLike() {
            if (!this.user.loginValid) {
                this.$toast.message('汝还没有登录呀      (눈‸눈)');
                return;
            }
            const thread = `A_DJ_1_${this.playing.source.djradio.id}`;
            const shouldLike = !this.threadLiked;
            this.threadLiked = null;
            let resp;
            if (this.threadLiked) {
                resp = await Api.unlikeResourceE(thread);
            } else {
                resp = await Api.likeResourceE(thread);
            }
            if (resp.code === 200) {
                this.threadLiked = shouldLike;
            }
        },
        handleCollect() {
            if (!this.user.loginValid) {
                this.$toast.message('汝还没有登录呀      (눈‸눈)');
                return;
            }
            if (!this.playing.id) {
                this.$toast.message('究竟想收藏什么呢    (｡ŏ_ŏ)');
                return;
            }
            this.toggleCollectPopup(this.playing.id);
        },
        toggleShare() {
            this.moreMenuOpen = false;
            if (!this.shareText) return;
            this.dlgShareOpen = !this.dlgShareOpen;
            if (this.dlgShareOpen) this.$nextTick(() => {
                /** @type {HTMLDivElement} */
                const node = this.$refs.shareText;
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(node);
                selection.removeAllRanges();
                selection.addRange(range);
                document.execCommand('copy');
                selection.removeAllRanges();
                this.$toast.message('已复制分享内容到粘贴版');
            });
        },
        handleMouseScroll(e) {
            if (typeof this.ui.lyric.txtLyric === 'string' || !this.$refs.lyric || this.$refs.lyric.length === 0) {
                return;
            }
            const currentLyricElem = this.$refs.lyric[Math.max(this.currentLyricIndex, 0)];
            const lastElem = this.$refs.lyric[this.$refs.lyric.length - 1];
            const currentToTopOffset = currentLyricElem.offsetTop;
            const currentToBottomOffset = currentLyricElem.offsetTop - lastElem.offsetTop;
            const willingOffset = this.lyricScrollOffset - 0.3 * e.deltaY;
            if (willingOffset > currentToTopOffset) {
                this.lyricScrollOffset = currentToTopOffset;
            }
            else if (willingOffset < currentToBottomOffset) {
                this.lyricScrollOffset = currentToBottomOffset;
            } else {
                this.lyricScrollOffset = willingOffset;
            }
        },
        async handleDownload() {
            if (this.ui.downloaded) {
                return;
            }
            if (this.ui.downloading) {
                this.$toast.message('已经在下载了呢  (*/ω＼*)');
                return;
            }
            if (!this.playing.id) {
                this.$toast.message('想下载什么呢  ヾ(´･ω･｀)ﾉ');
                return;
            }
            const result = await this.downloadTrack({ metadata: this.playing, quality: this.settings.bitRateDownload });
            if (!result.success) {
                this.$toast.error(result.error);
            }
        },
        async saveCoverImage() {
            this.moreMenuOpen = false;
            const src = this.ui.coverImgSrc;
            if (!src) return;
            const image = await fetch(src);
            const blob = await image.blob();
            const href = URL.createObjectURL(blob);
            let a = document.createElement('a');
            a.setAttribute('download', `${this.playing.album.name}.${blob.type.replace('image/', '')}`);
            a.setAttribute('href', href);
            a.click();
            URL.revokeObjectURL(href);
            a.remove();
            a = null;
        }
    },
    watch: {
        ['playing.id']() {
            if (!this.isActive) return;
            this.refreshThreadInfo();
        },
        ['ui.coverImgSrc']() {
            if (!this.isActive) return;
            this.paintBkgCanvas();
        },
        ['settings.themeVariety']() {
            this.paintBkgCanvas();
        },
        ['ui.lyric']() {
            // reset lyric position
            this.currentLyricIndex = -1;
        },
        ['currentLyricIndex'](val, oldVal) {
            if (this.lyricMouseIn && this.lyricScrollOffset !== 0) {
                const lyrics = this.$refs.lyric;
                const diff = lyrics[oldVal].offsetTop - lyrics[val].offsetTop;
                this.lyricScrollOffset -= diff;
            } else {
                this.lyricScrollOffset = 0;
            }
        },
    },
    mounted() {
        this.paintBkgCanvas();
        this.refreshThreadInfo();
        this.listenAudioUpdate();
    },
    activated() {
        this.isActive = true;
        if (this.canvasImageId !== this.playing.id) {
            this.paintBkgCanvas();
        }
        if (this.threadInfoId !== this.playing.id) {
            this.refreshThreadInfo();
        }
    },
    deactivated() {
        this.lyricMouseIn = false;
        this.isActive = false;
    }
};
</script>

<style lang="less">
.ellipsis-text(@width: 175px) {
    display: inline-block;
    max-width: @width;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: bottom;
}

.player {
    --vinyl-size: clamp(280px, min(36vw, 46vh), 460px);
    color: black;
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 100%;
    width: 100%;
    box-sizing: border-box;
    overflow: hidden !important;
    padding: 0 clamp(16px, 2.5vw, 40px);

    .bkg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        pointer-events: none;
        canvas {
            width: 100%;
            height: 100%;
            display: block;
        }
    }
    .phonograph,
    .info {
        z-index: 1;
        position: relative;
    }
    .phonograph {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        flex: 1 1 45%;
        min-width: 0;

        .stylus,
        .vinyl {
            pointer-events: none;
            user-select: none;
        }
        .stylus {
            z-index: 2;
            width: calc(var(--vinyl-size) * 0.285);
            height: calc(var(--vinyl-size) * 0.407);
            margin: calc(var(--vinyl-size) * -0.02) 0 calc(var(--vinyl-size) * -0.21) calc(var(--vinyl-size) * 0.21);
            transition: transform 0.5s cubic-bezier(0.2, 0, 0, 1);
            transform-origin: 15% 0;
            transform: rotate(-25deg);
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.35));
        }
        .vinyl {
            position: relative;
            width: var(--vinyl-size);
            height: var(--vinyl-size);
            animation: disk-playing 25s linear infinite;
            animation-play-state: paused;
            border-radius: 50%;
            box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);

            .cover {
                position: absolute;
                display: block;
                width: 63%;
                height: 63%;
                top: 18.5%;
                left: 18.5%;
                border-radius: 50%;
                object-fit: cover;
            }
            .border {
                position: absolute;
                display: block;
                width: 100%;
                height: 100%;
                top: 0;
                left: 0;
            }
        }
        .action {
            margin-top: clamp(16px, 2.5vh, 28px);
            display: flex;
            gap: clamp(6px, 1vw, 12px);
            flex-wrap: wrap;
            justify-content: center;
            .mu-button {
                border-radius: var(--md-shape-full, 9999px);
                backdrop-filter: blur(12px);
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.25);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
                &:hover {
                    background: rgba(255, 255, 255, 0.35);
                    transform: translateY(-2px);
                }
            }
        }
        &.play {
            .stylus {
                transform: rotate(0deg);
            }
            .vinyl {
                animation-play-state: running;
            }
        }
    }
    .info {
        display: flex;
        flex-direction: column;
        height: 100%;
        flex: 1 1 55%;
        min-width: 0;
        padding-left: clamp(16px, 3vw, 40px);
        padding-right: clamp(16px, 3vw, 48px);
        padding-top: clamp(16px, 2.5vh, 32px);
        padding-bottom: clamp(16px, 2.5vh, 32px);
        box-sizing: border-box;

        .title,
        .source,
        .scroller-wrapper {
            padding-left: 6px;
        }
        .title {
            margin-top: 0;
            display: flex;
            align-items: center;
            flex-shrink: 0;
            .name {
                .ellipsis-text(calc(~'50vw - 48px'));
                font-size: clamp(24px, 2.4vw, 34px);
                font-weight: 700;
                line-height: 1.25;
                letter-spacing: -0.01em;
            }
            .btn-mv {
                margin-left: 8px;
            }
        }
        .source {
            margin: clamp(10px, 1.5vh, 18px) 0 clamp(14px, 2vh, 24px);
            flex-shrink: 0;
            font-size: clamp(13px, 1.1vw, 15px);
            opacity: 0.88;
            .source-artist {
                margin-inline-end: 16px;
            }
            .source-album {
                white-space: nowrap;
            }
            .sep {
                margin: 0 4px;
            }
            .source-link {
                .ellipsis-text();
                color: unset;
                user-select: text;
                &:hover {
                    text-decoration: underline;
                }
            }
        }
        .description {
            flex-grow: 1;
            position: relative;
            margin: 0 40px 0 6px;
            overflow: hidden;
            .scroller {
                height: 100%;
                overflow-y: auto;
                white-space: pre-wrap;
                font-size: clamp(14px, 1.2vw, 17px);
                line-height: 1.8;
            }
        }
        .lyric {
            flex: 1 1 auto;
            position: relative;
            overflow: hidden;
            min-height: 0;
            height: 0;

            .control {
                position: absolute;
                bottom: 8px;
                right: 16px;
                z-index: 0;
                opacity: 0;
                transition: 0.4s opacity;
            }
            .mask {
                height: 100%;
                display: flex;
                align-items: center;
                font-size: clamp(16px, 1.4vw, 20px);
            }
            .scroller-wrapper {
                height: 100%;
                overflow: hidden;
                mask-image: linear-gradient(to bottom, transparent 0%, #000 12%, #000 88%, transparent 100%);
                -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 12%, #000 88%, transparent 100%);

                .scroller {
                    transition: transform 0.45s cubic-bezier(0.2, 0, 0, 1);
                    .line {
                        margin: clamp(16px, 2.2vh, 28px) 0;
                        font-size: clamp(16px, 1.4vw, 21px);
                        line-height: 1.6;
                        white-space: pre-wrap;
                        color: inherit;
                        opacity: 0.52;
                        transform: scale(0.96);
                        transform-origin: left center;
                        transition: all 0.35s cubic-bezier(0.2, 0, 0, 1);
                        cursor: pointer;

                        &:hover {
                            opacity: 0.88;
                            transform: scale(0.99);
                        }
                    }
                    .line.active {
                        font-size: clamp(22px, 2.1vw, 30px);
                        font-weight: 700;
                        opacity: 1;
                        transform: scale(1.05);
                        color: #ffffff;
                        text-shadow: 0 0 16px rgba(0, 0, 0, 0.45), 0 2px 10px rgba(0, 0, 0, 0.7);
                    }
                    .txt {
                        margin-bottom: 84px;
                        white-space: pre-wrap;
                        font-size: clamp(15px, 1.3vw, 18px);
                        line-height: 1.8;
                    }
                    .contributors {
                        margin-top: 56px;
                        font-size: clamp(12px, 1vw, 14px);
                        opacity: 0.75;
                    }
                    .contributor {
                        color: inherit;
                        &:hover {
                            text-decoration: underline;
                        }
                    }
                }
            }
            &:hover {
                .scroller-wrapper {
                    mask-image: linear-gradient(to bottom, transparent 0%, #000 12%, #000 88%, transparent 100%),
                        linear-gradient(to left, #000 10px, transparent 10px, transparent);
                    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 12%, #000 88%, transparent 100%),
                        linear-gradient(to left, #000 10px, transparent 10px, transparent);
                }
                .control {
                    z-index: 1;
                    opacity: 1;
                }
            }
        }
    }
}

.player.dark {
    .phonograph .mu-button-wrapper {
        color: #eee;
    }
    .info {
        .title,
        .source,
        .control .mu-button-wrapper {
            color: #eee;
        }
        .lyric,
        .description {
            color: rgba(255, 255, 255, 0.75);
        }
    }
}

@keyframes disk-playing {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>
