<template>
    <ncm-mu-dbclick-ripple class="track-row"
        :class="dynamicClassName"
        @dblclick="handleDblClick">
        <div v-if="index"
            class="track-col index">
            <i v-if="isPlaying"
                class="material-icons playing-icon">volume_up</i>
            <template v-else>{{ index }}</template>
        </div>
        <div v-if="settings.showTrackMiniCover"
            class="track-col mini-cover"
            :title="albumName">
            <img :src="coverUrl"
                class="mini-cover-img"
                loading="lazy">
        </div>
        <div class="track-col name">{{track.name}}</div>
        <div class="track-col artist">
            <template v-for="(ar, index) in track.artists">
                <span v-if="index !== 0"
                    :key="'sep' + index"
                    class="sep">/</span>
                <router-link v-if="ar.id !== 0"
                    class="link"
                    :to="{ name: 'artist', params: { id: ar.id } }"
                    :key="ar.id">{{ar.name}}</router-link>
                <span v-else
                    :key="'ar' + index">{{ar.name}}</span>
            </template>
        </div>
        <div class="track-col album">
            <router-link v-if="track.album !== null && track.album.id !== 0"
                class="link"
                :to="{ name: 'album', params: { id: track.album.id } }"
                :key="track.album.id">{{track.album.name}}</router-link>
            <span v-else
                :key="'album' + track.album.name">{{ track.album.name }}</span>
        </div>
        <div class="track-col duration">{{duration}}</div>
        <div class="track-col buttons">
            <mu-button v-for="act in shortcuts"
                :key="act.event"
                icon
                small
                class="track-action-btn"
                :title="act.title"
                @click="handleAction(act)">
                <mu-icon :value="act.icon" :size="18"></mu-icon>
            </mu-button>
        </div>
    </ncm-mu-dbclick-ripple>
</template>

<script>
import { shortTime } from '@/util/formatter';
import { getTrackCoverUrl } from '@/util/image';
import coverDefault from 'assets/img/cover_default.webp';

/**
 * @typedef {import('./TrackList.vue').TrackListShortcut} Shortcut
 */

export default {
    props: {
        index: {
            type: Number,
            required: false
        },
        /** @type {Vue.PropOptions<Models.Track>} */
        track: {
            required: true
        },
        /** @type {Vue.PropOptions<Shortcut[]>} */
        shortcuts: {
            type: Array,
            required: false
        }
    },
    computed: {
        /** @returns {import('@/store/modules/settings').State} */
        settings() {
            return this.$store.state.settings;
        },
        albumName() {
            return (this.track.album && this.track.album.name) || '';
        },
        coverUrl() {
            return getTrackCoverUrl(this.track, 36) || coverDefault;
        },
        /** @returns {boolean} */
        isPlaying() {
            return this.$store.getters.playing.id === this.track.id;
        },
        /** @returns {{ [key: string]: boolean }} */
        dynamicClassName() {
            return {
                'track--active': this.isPlaying,
                'track--grey': (this.track.privilege && this.track.privilege.st !== 0)
            };
        },
        /** @returns {string} */
        duration() {
            return shortTime(this.track.duration);
        }
    },
    methods: {
        handleDblClick() {
            this.$emit('dblclick');
        },
        handleAction(act) {
            this.$emit(act.event);
        }
    }
};
</script>

<style lang="less">
.track-row {
    display: flex;
    position: relative;
    border-radius: var(--md-shape-m, 12px);
    margin: 2px 6px;
    padding: 0 4px;
    transition: background-color 0.2s cubic-bezier(0.2, 0, 0, 1);

    .track-col {
        height: 42px;
        line-height: 42px;
        font-size: 13.5px;
    }

    .index {
        width: 44px;
        text-align: center;
        color: var(--secondary-text-color);
        font-size: 12px;
        font-weight: 500;

        .playing-icon {
            line-height: 42px;
            font-size: 18px;
            color: var(--primary-color);
            animation: pulse-icon 1.6s ease-in-out infinite alternate;
        }
    }

    .mini-cover {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        min-width: 36px;
        height: 42px;
        margin-right: 8px;
        flex-shrink: 0;
        z-index: 1;

        .mini-cover-img {
            width: 30px;
            height: 30px;
            border-radius: var(--md-shape-xs, 6px);
            object-fit: cover;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
            background-color: var(--md-sys-color-surface-container-highest, rgba(0, 0, 0, 0.05));
            transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1);
        }
    }

    &:hover .mini-cover .mini-cover-img {
        transform: scale(1.08);
    }

    .name,
    .album,
    .artist {
        flex-grow: 1;
        flex-basis: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        z-index: 1;

        .link {
            color: inherit;
            &:hover {
                text-decoration: underline;
                color: var(--primary-color);
            }
        }
        .sep {
            margin: 0 3px;
            opacity: 0.5;
        }
    }

    .name {
        font-weight: 500;
        color: var(--text-color);
    }

    .artist,
    .album {
        color: var(--secondary-text-color);
    }

    .duration {
        width: 52px;
        text-align: right;
        margin-right: 8px;
        font-size: 12px;
        font-family: 'Roboto Mono', var(--mono-font), monospace;
        color: var(--secondary-text-color);
        opacity: 0.8;
    }

    .buttons {
        display: flex;
        align-items: center;
        margin-right: 4px;

        .track-action-btn {
            opacity: 0.7;
            transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
            &:hover {
                opacity: 1;
                transform: scale(1.1);
                color: var(--primary-color);
            }
        }
    }

    &:hover {
        background-color: var(--md-sys-color-surface-container-high, rgba(0, 0, 0, 0.04));
    }

    &.track--active {
        background-color: var(--md-sys-color-primary-container, rgba(229, 57, 53, 0.12));
        .name {
            color: var(--primary-color);
            font-weight: 600;
        }
    }
}

.track--grey {
    .name,
    .artist,
    .album,
    .duration,
    .buttons .mu-icon {
        color: var(--disabled-text-color) !important;
    }
}

@keyframes pulse-icon {
    from {
        transform: scale(0.9);
        opacity: 0.75;
    }
    to {
        transform: scale(1.1);
        opacity: 1;
    }
}
</style>
