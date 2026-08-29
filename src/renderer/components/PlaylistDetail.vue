<template>
    <div class="album-detail playlist-detail">
        <div class="header">
            <img :src="coverSrc"
                class="cover">
            <div class="side">
                <div class="info">
                    <div class="name">
                        <span>{{ playlist.name }}</span>
                        <span v-if="playlist.updateFrequency"
                            class="small">{{ playlist.updateFrequency }}</span>
                    </div>
                    <div class="creation-info">
                        <router-link class="creator"
                            :to="{ name: 'user', params: { id: playlist.creator.id } }">
                            <mu-avatar class="avatar">
                                <img :src="creatorAvatarSrc">
                            </mu-avatar>
                            <span class="creator-name">{{playlist.creator.nickname}}</span>
                        </router-link>
                        <span class="create-time  mu-item-after-text">创建于 {{createTime}}</span>
                    </div>
                </div>
                <div class="actions">
                    <mu-button flat
                        small
                        :disabled="playlist.creator.id === user.info.id"
                        @click="handleSubscribe">
                        <mu-icon left
                            :color="shouldSubscribed ? 'amber' : ''"
                            :value="shouldSubscribed ? 'star' : 'star_border'"></mu-icon>
                        <span>{{btnSubscribeText}}</span>
                    </mu-button>
                    <router-link :to="{ name: 'comment', params: { type: 'playlist', id: playlist.id } }"
                        v-slot="{ navigate }"
                        custom>
                        <mu-button flat
                            small
                            @click="navigate">
                            <mu-icon left
                                value="comment"></mu-icon>
                            <span>{{btnCommentText}}</span>
                        </mu-button>
                    </router-link>
                    <!-- Custom Playlist Edit / Reorder Button -->
                    <mu-button v-if="isMyPlaylist"
                        flat
                        small
                        class="btn-edit-playlist"
                        :color="isEditing ? 'primary' : ''"
                        @click="toggleEditMode">
                        <mu-icon left :value="isEditing ? 'close' : 'tune'"></mu-icon>
                        <span>{{ isEditing ? '退出整理' : '整理歌曲' }}</span>
                    </mu-button>
                </div>
                <div class="intro">
                    <mu-list dense
                        toggle-nested>
                        <mu-list-item button
                            nested
                            :open="descOpen"
                            @click="descOpen = !descOpen">
                            <mu-list-item-title>歌单介绍</mu-list-item-title>
                            <mu-list-item-action>
                                <mu-icon class="toggle-icon"
                                    size="24"
                                    value="keyboard_arrow_down"></mu-icon>
                            </mu-list-item-action>
                            <template #nested>
                                <mu-list-item-content>
                                    <p class="description">{{playlistDesc}}</p>
                                </mu-list-item-content>
                            </template>
                        </mu-list-item>
                    </mu-list>
                </div>
            </div>
        </div>

        <!-- Edit Mode Banner -->
        <div v-if="isEditing" class="playlist-edit-banner">
            <div class="edit-hint">
                <mu-icon value="info_outline" :size="18" class="hint-icon"></mu-icon>
                <span>正在整理歌单：按住左侧 <b>⠿</b> 手柄拖动调整顺序，点击 <b>🗑️</b> 移除歌曲</span>
            </div>
            <div class="edit-actions">
                <mu-button small flat class="btn-cancel" @click="cancelEdit">
                    <span>放弃更改</span>
                </mu-button>
                <mu-button small color="primary" class="btn-save" :loading="saving" @click="saveEdit">
                    <mu-icon left value="save" :size="18"></mu-icon>
                    <span>保存更改</span>
                </mu-button>
            </div>
        </div>

        <!-- Editable Track List vs Normal Virtual Track List -->
        <EditableTrackList v-if="isEditing"
            :tracks="editingTracks"
            @update:tracks="onTracksReordered"
            @delete="handleDeleteTrack"></EditableTrackList>
        <VirtualTrackList v-else
            ref="virtualList"
            filterable
            :source="trackSource"
            :trackIds="playlist.trackIds"></VirtualTrackList>
    </div>
</template>

<script>
import { mapActions } from 'vuex';

import Api from '@/api/ipc';
import { getSongDetail } from '@/api/typed';
import VirtualTrackList from './TrackList/VirtualTrackList.vue';
import EditableTrackList from './TrackList/EditableTrackList.vue';
import { shortDate } from '@/util/formatter';
import { sizeImg, HiDpiPx } from '@/util/image';

export default {
    props: {
        /** @type {Vue.PropOptions<Models.PlayList>} */
        playlist: {
            required: true
        }
    },
    data() {
        return {
            shouldSubscribed: null,
            subsCntOffset: 0,
            descOpen: false,
            isEditing: false,
            editingTracks: [],
            originalTrackIds: [],
            deletedTrackIds: [],
            saving: false
        };
    },
    computed: {
        /** @returns {import('@/store/modules/user').State}*/
        user() { return this.$store.state.user; },
        /** @returns {boolean} */
        isMyPlaylist() {
            return Boolean(this.user.loginValid && this.playlist.creator && this.playlist.creator.id === this.user.info.id);
        },
        /** @returns {string} */
        creatorAvatarSrc() {
            return sizeImg(this.playlist.creator.avatarUrl, HiDpiPx(40));
        },
        /** @returns {string} */
        coverSrc() {
            return sizeImg(this.playlist.coverImgUrl, HiDpiPx(160));
        },
        /** @returns {string} */
        createTime() {
            return shortDate(this.playlist.createTime);
        },
        /** @returns {string} */
        btnSubscribeText() {
            const t = this.shouldSubscribed ? '已收藏' : '收藏';
            const n = this.playlist.subscribedCount + this.subsCntOffset;
            return `${t} (${n})`;
        },
        /** @returns {string} */
        btnCommentText() {
            const n = this.playlist.commentCount;
            return `评论 (${n})`;
        },
        /** @returns {string} */
        playlistDesc() {
            const t = this.playlist.tags.join('，') || '无';
            const d = this.playlist.description || '暂无歌单介绍';
            return `标签：${t}\n\n${d}`;
        },
        /** @returns {{ name: 'list', id: number }} */
        trackSource() {
            return {
                name: 'list',
                id: this.playlist.id
            };
        }
    },
    methods: {
        ...mapActions([
            'subscribePlaylist',
            'unsubscribePlaylist',
            'updateUserPlaylistDetail'
        ]),
        async handleSubscribe() {
            if (!this.user.loginValid) {
                this.$toast.message('汝还没有登录呀      (눈‸눈)');
                return;
            }
            if (this.shouldSubscribed) {
                try {
                    await this.unsubscribePlaylist(this.playlist);
                    this.shouldSubscribed = false;
                    this.subsCntOffset--;
                } catch (e) {
                    this.$toast.message(`取消收藏失败 ●﹏● ： ${e.code}`);
                }
                return;
            }
            try {
                await this.subscribePlaylist(this.playlist);
                this.shouldSubscribed = true;
                this.subsCntOffset++;
            } catch (e) {
                this.$toast.message(`收藏歌单失败 ●﹏● ： ${e.code}`);
            }
        },
        async toggleEditMode() {
            if (this.isEditing) {
                this.cancelEdit();
                return;
            }
            const ids = (this.playlist.trackIds || []).map(i => i.id || i);
            this.originalTrackIds = [...ids];
            this.deletedTrackIds = [];
            this.saving = true;
            try {
                const loaded = await getSongDetail(ids);
                this.editingTracks = loaded;
                this.isEditing = true;
            } catch {
                this.$toast.message('加载歌曲列表失败，请重试');
            } finally {
                this.saving = false;
            }
        },
        onTracksReordered(newTracks) {
            this.editingTracks = newTracks;
        },
        handleDeleteTrack({ track, index }) {
            this.editingTracks.splice(index, 1);
            if (!this.deletedTrackIds.includes(track.id)) {
                this.deletedTrackIds.push(track.id);
            }
            this.$toast.message(`已移除《${track.name}》`);
        },
        cancelEdit() {
            this.isEditing = false;
            this.editingTracks = [];
            this.deletedTrackIds = [];
        },
        async saveEdit() {
            this.saving = true;
            try {
                const pid = this.playlist.id;
                // 1. Delete removed tracks from cloud playlist
                if (this.deletedTrackIds.length > 0) {
                    await Api.uncollectTrack(pid, ...this.deletedTrackIds);
                }
                // 2. Update track order in cloud playlist
                const currentIds = this.editingTracks.map(t => t.id);
                const remainingOriginalIds = this.originalTrackIds.filter(id => !this.deletedTrackIds.includes(id));
                const orderChanged = JSON.stringify(currentIds) !== JSON.stringify(remainingOriginalIds);

                if (orderChanged && currentIds.length > 0) {
                    await Api.updatePlaylistTracksOrder(pid, currentIds);
                }

                // 3. Update local playlist model & Vuex immediately
                const localUpdated = Object.assign({}, this.playlist, {
                    trackIds: currentIds.map(id => ({ id })),
                    trackCount: currentIds.length
                });
                this.$emit('update:playlist', localUpdated);
                this.updateUserPlaylistDetail(localUpdated);

                this.isEditing = false;
                this.editingTracks = [];
                this.deletedTrackIds = [];
                this.$toast.message('歌单已保存更新 (*^▽^*)');

                this.$nextTick(() => {
                    if (this.$refs.virtualList) {
                        this.$refs.virtualList.updateTrackDetails();
                    }
                });
            } catch (err) {
                this.$toast.message(`保存失败：${err.msg || err.message || '请重试'}`);
            } finally {
                this.saving = false;
            }
        }
    },
    created() {
        this.shouldSubscribed = this.playlist.subscribed;
    },
    components: {
        VirtualTrackList,
        EditableTrackList
    }
};
</script>

<style lang="less">
.album-detail {
    .header {
        .side {
            .info {
                .name {
                    .small {
                        margin-left: 8px;
                        font-size: 14px;
                        opacity: 0.7;
                    }
                }
            }
        }
    }
}

.playlist-edit-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 18px;
    margin: 8px 16px;
    border-radius: var(--md-shape-m, 12px);
    background-color: var(--md-sys-color-primary-container, rgba(229, 57, 53, 0.12));
    border: 1px solid var(--md-sys-color-outline-variant, rgba(0, 0, 0, 0.08));
    animation: fadeIn 0.25s cubic-bezier(0.2, 0, 0, 1);

    .edit-hint {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13.5px;
        color: var(--text-color);

        .hint-icon {
            color: var(--primary-color);
            flex-shrink: 0;
        }
    }

    .edit-actions {
        display: flex;
        align-items: center;
        gap: 8px;

        .btn-save {
            border-radius: var(--md-shape-full, 9999px);
            font-weight: 500;
        }

        .btn-cancel {
            border-radius: var(--md-shape-full, 9999px);
            color: var(--secondary-text-color);
        }
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-6px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
