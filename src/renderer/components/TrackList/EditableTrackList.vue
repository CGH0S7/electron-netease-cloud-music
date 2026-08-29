<template>
    <div class="editable-tracklist">
        <transition-group name="track-move" tag="div" class="list-container">
            <div v-for="(track, index) in tracks"
                :key="track.id"
                class="editable-track-row"
                :class="{
                    'is-dragging': draggingIndex === index,
                    'drag-over-top': dragOverIndex === index && dragOverPosition === 'top',
                    'drag-over-bottom': dragOverIndex === index && dragOverPosition === 'bottom'
                }"
                draggable="true"
                @dragstart="handleDragStart(index, $event)"
                @dragover.prevent="handleDragOver(index, $event)"
                @dragenter.prevent="handleDragEnter(index, $event)"
                @dragleave="handleDragLeave(index, $event)"
                @drop="handleDrop(index, $event)"
                @dragend="handleDragEnd">
                <!-- Drag Handle & Index -->
                <div class="drag-handle" title="按住拖拽调整顺序">
                    <mu-icon value="drag_indicator" :size="20"></mu-icon>
                </div>
                <div class="track-col index">
                    {{ index + 1 }}
                </div>
                <!-- Mini Cover -->
                <div v-if="settings.showTrackMiniCover"
                    class="track-col mini-cover"
                    :title="track.album ? track.album.name : ''">
                    <img :src="getCover(track)"
                        class="mini-cover-img"
                        loading="lazy">
                </div>
                <!-- Track Details -->
                <div class="track-col name" :title="track.name">{{ track.name }}</div>
                <div class="track-col artist" :title="track.artistName">{{ track.artistName }}</div>
                <div class="track-col album" :title="track.album ? track.album.name : ''">
                    {{ track.album ? track.album.name : '' }}
                </div>
                <div class="track-col duration">{{ getDuration(track.duration) }}</div>
                <!-- Action Buttons (Move Up, Move Down, Delete) -->
                <div class="track-col actions">
                    <mu-button icon
                        small
                        class="action-btn"
                        :disabled="index === 0"
                        title="上移"
                        @click.stop="moveTrack(index, -1)">
                        <mu-icon value="keyboard_arrow_up" :size="20"></mu-icon>
                    </mu-button>
                    <mu-button icon
                        small
                        class="action-btn"
                        :disabled="index === tracks.length - 1"
                        title="下移"
                        @click.stop="moveTrack(index, 1)">
                        <mu-icon value="keyboard_arrow_down" :size="20"></mu-icon>
                    </mu-button>
                    <mu-button icon
                        small
                        class="action-btn btn-delete"
                        title="从歌单中移除"
                        @click.stop="handleDelete(track, index)">
                        <mu-icon value="delete_outline" :size="19"></mu-icon>
                    </mu-button>
                </div>
            </div>
        </transition-group>
        <div v-if="tracks.length === 0" class="empty-edit-tip">
            <mu-icon value="inbox" color="grey" :size="72"></mu-icon>
            <p>歌单已无歌曲</p>
        </div>
    </div>
</template>

<script>
import { shortTime } from '@/util/formatter';
import { getTrackCoverUrl } from '@/util/image';
import coverDefault from 'assets/img/cover_default.webp';

export default {
    name: 'EditableTrackList',
    props: {
        tracks: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            draggingIndex: null,
            dragOverIndex: null,
            dragOverPosition: null // 'top' | 'bottom'
        };
    },
    computed: {
        /** @returns {import('@/store/modules/settings').State} */
        settings() {
            return this.$store.state.settings;
        }
    },
    methods: {
        getCover(track) {
            return getTrackCoverUrl(track, 36) || coverDefault;
        },
        getDuration(dt) {
            return shortTime(dt);
        },
        moveTrack(index, offset) {
            const targetIndex = index + offset;
            if (targetIndex < 0 || targetIndex >= this.tracks.length) return;
            const updated = [...this.tracks];
            const [movedItem] = updated.splice(index, 1);
            updated.splice(targetIndex, 0, movedItem);
            this.$emit('update:tracks', updated);
        },
        handleDelete(track, index) {
            this.$emit('delete', { track, index });
        },
        handleDragStart(index, event) {
            this.draggingIndex = index;
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', String(index));
        },
        handleDragOver(index, event) {
            if (this.draggingIndex === null || this.draggingIndex === index) {
                this.dragOverIndex = null;
                this.dragOverPosition = null;
                return;
            }
            const targetRect = event.currentTarget.getBoundingClientRect();
            const midpoint = targetRect.top + targetRect.height / 2;
            const position = event.clientY < midpoint ? 'top' : 'bottom';
            this.dragOverIndex = index;
            this.dragOverPosition = position;
        },
        handleDragEnter(index) {
            if (this.draggingIndex !== null && this.draggingIndex !== index) {
                this.dragOverIndex = index;
            }
        },
        handleDragLeave(index, event) {
            if (event.currentTarget && !event.currentTarget.contains(event.relatedTarget)) {
                if (this.dragOverIndex === index) {
                    this.dragOverIndex = null;
                    this.dragOverPosition = null;
                }
            }
        },
        handleDrop(index) {
            if (this.draggingIndex === null || this.draggingIndex === index) {
                this.handleDragEnd();
                return;
            }
            const fromIndex = this.draggingIndex;
            let toIndex = index;
            if (this.dragOverPosition === 'bottom' && fromIndex > index) {
                toIndex = index + 1;
            } else if (this.dragOverPosition === 'top' && fromIndex < index) {
                toIndex = index - 1;
            }
            toIndex = Math.max(0, Math.min(this.tracks.length - 1, toIndex));

            const updated = [...this.tracks];
            const [movedItem] = updated.splice(fromIndex, 1);
            updated.splice(toIndex, 0, movedItem);
            this.$emit('update:tracks', updated);
            this.handleDragEnd();
        },
        handleDragEnd() {
            this.draggingIndex = null;
            this.dragOverIndex = null;
            this.dragOverPosition = null;
        }
    }
};
</script>

<style lang="less">
.editable-tracklist {
    padding: 8px 12px;
    box-sizing: border-box;

    .list-container {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .editable-track-row {
        display: flex;
        align-items: center;
        position: relative;
        height: 48px;
        border-radius: var(--md-shape-m, 12px);
        padding: 0 10px;
        background-color: var(--md-sys-color-surface-container-low, rgba(0, 0, 0, 0.02));
        border: 1px solid transparent;
        transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
        user-select: none;

        &:hover {
            background-color: var(--md-sys-color-surface-container-high, rgba(0, 0, 0, 0.05));
            border-color: var(--md-sys-color-outline-variant, rgba(0, 0, 0, 0.08));
        }

        &.is-dragging {
            opacity: 0.35;
            background-color: var(--md-sys-color-primary-container, rgba(229, 57, 53, 0.1));
            border: 1px dashed var(--primary-color);
        }

        &.drag-over-top {
            border-top: 2px solid var(--primary-color) !important;
            border-top-left-radius: 0;
            border-top-right-radius: 0;
        }

        &.drag-over-bottom {
            border-bottom: 2px solid var(--primary-color) !important;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
        }

        .drag-handle {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            color: var(--secondary-text-color);
            cursor: grab;
            opacity: 0.65;
            transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
            margin-right: 4px;

            &:hover {
                opacity: 1;
                color: var(--primary-color);
                transform: scale(1.15);
            }

            &:active {
                cursor: grabbing;
            }
        }

        .index {
            width: 32px;
            text-align: center;
            font-size: 13px;
            color: var(--secondary-text-color);
            font-weight: 500;
        }

        .mini-cover {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            min-width: 36px;
            height: 42px;
            margin-right: 10px;
            flex-shrink: 0;

            .mini-cover-img {
                width: 32px;
                height: 32px;
                border-radius: var(--md-shape-xs, 6px);
                object-fit: cover;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
            }
        }

        .name,
        .artist,
        .album {
            flex-grow: 1;
            flex-basis: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 13.5px;
            padding: 0 6px;
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
            margin-right: 12px;
            font-size: 12px;
            font-family: 'Roboto Mono', var(--mono-font), monospace;
            color: var(--secondary-text-color);
            opacity: 0.8;
        }

        .actions {
            display: flex;
            align-items: center;
            gap: 2px;
            margin-right: 4px;

            .action-btn {
                width: 30px;
                height: 30px;
                min-width: 30px;
                color: var(--secondary-text-color);
                opacity: 0.75;
                transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);

                &:not(:disabled):hover {
                    opacity: 1;
                    color: var(--primary-color);
                    background-color: var(--md-sys-color-primary-container, rgba(0, 0, 0, 0.05));
                    transform: scale(1.1);
                }

                &:disabled {
                    opacity: 0.25;
                }

                &.btn-delete:hover {
                    color: #d32f2f !important;
                    background-color: rgba(211, 47, 47, 0.1) !important;
                }
            }
        }
    }

    .empty-edit-tip {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px;
        color: var(--secondary-text-color);
    }
}

.track-move-move {
    transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1);
}
</style>
