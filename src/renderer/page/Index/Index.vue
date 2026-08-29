<template>
    <div class="index ncm-page">
        <div class="wrapper">
            <div class="actions">
                <ActionItem v-for="a in action"
                    :key="a.title"
                    :to="a.to"
                    :icon="a.icon"
                    :title="a.title">
                </ActionItem>
            </div>
            <mu-card class="card">
                <div class="heading">推荐歌单</div>
                <div class="scroller">
                    <ScrollerItem v-for="p in playlist"
                        :key="p.id"
                        :to="{ name: 'playlist', params: { id: p.id } }"
                        :img="p.picUrl"
                        maskIcon="headset"
                        :maskText="humanCount(p.playcount)"
                        :title="p.copywriter"
                        :itemTitle="p.name"></ScrollerItem>
                </div>
            </mu-card>
            <mu-card v-if="!settings.filterRcmd"
                class="card">
                <div class="heading">最新音乐</div>
                <div class="scroller">
                    <ScrollerItem v-for="al in album"
                        :key="al.id"
                        :to="{ name: 'album', params: { id: al.id } }"
                        :img="itemImg(al.picUrl)"
                        :title="al.copywriter"
                        :itemTitle="al.name"
                        :itemSubTitle="al.artistName"></ScrollerItem>
                </div>
            </mu-card>
            <mu-card v-if="!settings.filterRcmd"
                class="card">
                <div class="heading">推荐 MV</div>
                <div class="scroller">
                    <ScrollerItem v-for="v in mv"
                        :key="v.id"
                        :to="{ name: 'video', params: { id: v.id } }"
                        :img="itemImg(v.picUrl)"
                        :title="v.copywriter"
                        :itemTitle="v.name"
                        :itemSubTitle="v.artistName"></ScrollerItem>
                </div>
            </mu-card>
        </div>
    </div>
</template>

<script>
import Api from '@/api/ipc';

import ActionItem from './ActionItem.vue';
import ScrollerItem from './ScrollerItem.vue';

import { humanCount } from '@/util/formatter';
import { sizeImg, HiDpiPx } from '@/util/image';
import { SET_LOGIN_VALID } from '@/store/mutation-types';

const algBlockList = [
    'official_playlist_sceneRank'
];

export default {
    name: 'index',
    data() {
        return {
            /** @type {{ title: string, icon: string, to: import('vue-router').RawLocation }[]} */
            action: [
                { title: '私人 FM', icon: 'radio', to: { name: 'radio' } },
                { title: '每日推荐', icon: 'audiotrack', to: { name: 'recommend' } },
                { title: '歌单', icon: 'playlist_play', to: { path: '/goodie' } },
                { title: '排行榜', icon: 'equalizer', to: { path: '/top' } }
            ],
            isRecommendPlaylist: false,
            /** @type {Types.RecommendPlaylist[]} */
            playlist: [],
            /** @type {Types.NewAlbumAlbum[]} */
            album: [],
            /** @type {Types.RecommendMVResult[]} */
            mv: []
        };
    },
    computed: {
        /** @returns {import('@/store/modules/user').State} */
        user() { return this.$store.state.user; },
        /** @returns {import('@/store/modules/settings').State} */
        settings() { return this.$store.state.settings; }
    },
    methods: {
        humanCount,
        filterRecommend(item) {
            return algBlockList.includes(item.alg);
        },
        async getPlaylists() {
            this.isRecommendPlaylist = this.user.loginPending || this.user.loginValid;
            if (this.isRecommendPlaylist) {
                const res = await Api.getRecommendPlaylist();
                if (res.code === 200) {
                    if (this.settings.filterRcmd) {
                        this.playlist = res.recommend.filter(r => !this.filterRecommend(r));
                    } else {
                        this.playlist = res.recommend;
                    }
                }
            } else {
                const res = await Api.getPersonalizedPlaylists();
                if (res.code === 200) {
                    // PersonalizedPlaylist is slightly different from RecommendPlaylist
                    res.result.forEach(p => p.playcount = p.playCount);
                    this.playlist = res.result;
                }
            }
        },
        async getAlbums() {
            const res = await Api.getNewAlbums();
            if (res.code === 200) {
                this.album = res.result;
            }
        },
        async getMVs() {
            const res = await Api.getRecommendMVs();
            if (res.code === 200) {
                this.mv = res.result;
            }
        },
        fetchData() {
            this.getPlaylists();
            if (this.settings.filterRcmd) return;
            this.getAlbums();
            this.getMVs();
        },
        itemImg(src) {
            return sizeImg(src, HiDpiPx(160));
        }
    },
    created() {
        if (navigator.onLine) {
            this.fetchData();
        } else {
            window.addEventListener('online', () => {
                if (navigator.onLine) {
                    this.fetchData();
                }
            }, { once: true });
        }
        this.unsub = this.$store.subscribe(({ type, payload }) => {
            if (
                type === SET_LOGIN_VALID &&
                (
                    payload === false ||  // clear personalized data on logout
                    (payload === true && this.playlist.length > 0 && !this.isRecommendPlaylist) // get personalized data on login
                )
            ) {
                this.fetchData();
            }
        });
    },
    mounted() {
        /** @type {HTMLDivElement[]} */
        const scrollers = Array.from(document.getElementsByClassName('scroller'));
        scrollers.forEach(s => {
            s.addEventListener('wheel', function (ev) {
                if (ev.deltaX !== 0 || ev.shiftKey) {
                    // horizontal scroll with touchpad || hold shift
                    return;
                }
                if (ev.deltaX === 0 && Number.isInteger(ev.deltaY)) {
                    // `ev.deltaY` is integer, (likely) vertical scroll with mouse wheel
                    ev.preventDefault();
                    this.scrollBy({ top: 0, left: ev.deltaY, behavior: 'instant' });
                }
            });
        });
    },
    beforeDestroy() {
        this.unsub();
    },
    components: {
        ActionItem,
        ScrollerItem
    }
};
</script>

<style lang="less">
.wrapper {
    user-select: none;
    max-width: 860px;
    margin: auto;
    padding: 16px 20px 80px;

    .actions {
        margin: 28px 0 32px;
        display: flex;
        align-items: center;
        justify-content: space-evenly;
    }

    .card {
        margin: 24px 0;
        border-radius: var(--md-shape-xl, 20px) !important;
        background-color: var(--md-sys-color-surface-container-low, var(--background-color)) !important;
        border: 1px solid var(--md-sys-color-outline-variant, rgba(0, 0, 0, 0.08));
        box-shadow: var(--md-elevation-1) !important;
        padding: 16px 8px 20px;

        .heading {
            font-size: 20px;
            font-weight: 700;
            padding: 4px 16px 14px;
            color: var(--text-color);
            letter-spacing: -0.2px;
        }

        .scroller {
            display: flex;
            overflow-x: auto;
            overflow-y: hidden;
            min-height: 230px;
            padding-bottom: 6px;
            scroll-behavior: smooth;

            &::after {
                content: ' ';
                flex-shrink: 0;
                flex-basis: 14px;
            }
        }
    }
}
</style>
