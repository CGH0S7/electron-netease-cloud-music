<template>
    <mu-menu class="searchbox"
        cover
        placement="left"
        popover-class="searchbox-popover">
        <mu-button icon
            class="search-btn"
            title="搜索"
            @click="focusInput">
            <mu-icon value="search"></mu-icon>
        </mu-button>
        <template #content>
            <div class="searchbox-input-wrapper">
                <mu-icon value="search"
                    :size="20"
                    class="search-field-icon"></mu-icon>
                <mu-auto-complete dense
                    solo
                    full-width
                    color="secondary"
                    ref="textField"
                    placeholder="搜索单曲、歌手、专辑、用户 ..."
                    v-model="searchText"
                    :filter="filterData"
                    @select="handleSearch">
                </mu-auto-complete>
            </div>
        </template>
    </mu-menu>
</template>

<script>
import Api from '@/api/ipc';

export default {
    name: 'SearchBox',
    data() {
        return {
            searchText: ''
        };
    },
    methods: {
        focusInput() {
            setTimeout(() => {
                if (this._input) {
                    this._input.focus();
                }
            }, 200);
        },
        async filterData(query) {
            if (!query) {
                return [];
            }
            const resp = await Api.getSearchSuggest(query, this.$route.query.type);
            if (resp.code !== 200 || !resp.result.allMatch) {
                return [];
            }
            const re = new RegExp(`(${query.trim()})`, 'i');
            return resp.result.allMatch.map(item => ({
                item,
                value: item.keyword,
                highlight: item.keyword.replace(re, '<span class="mu-secondary-text-color">$1</span>')
            }));
        },
        handleSearch() {
            if (!this.searchText || !this.searchText.trim()) return;
            this.$router.push({
                name: 'search',
                query: {
                    ...this.$route.query,
                    keyword: this.searchText.trim()
                }
            }).catch(() => { /* noop */ });
        }
    },
    mounted() {
        this._input = this.$refs.textField.$el.querySelector('input');
        if (this._input) {
            this._input.onkeydown = ev => {
                if (ev.key === 'Enter') {
                    this.handleSearch();
                }
            };
        }
    }
};
</script>

<style lang="less">
.searchbox {
    height: unset !important;
    .search-btn {
        transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1);
        &:hover {
            transform: scale(1.08);
        }
    }
}

.searchbox-popover {
    width: 380px;
    border-radius: var(--md-shape-full, 9999px) !important;
    background-color: var(--md-sys-color-surface-container-high, var(--background-color)) !important;
    box-shadow: var(--md-elevation-3) !important;
    border: 1px solid var(--md-sys-color-outline-variant, rgba(0, 0, 0, 0.1)) !important;
    -webkit-app-region: no-drag;
    overflow: hidden;

    .searchbox-input-wrapper {
        display: flex;
        align-items: center;
        padding: 0 16px;
        height: 46px;
        box-sizing: border-box;

        .search-field-icon {
            color: var(--secondary-text-color);
            opacity: 0.8;
            margin-right: 10px;
            flex-shrink: 0;
        }

        .mu-input {
            margin: 0;
            padding: 0;
            min-height: unset;
            height: 38px;
            flex-grow: 1;

            .mu-input-content {
                height: 100%;
                display: flex;
                align-items: center;
            }

            .mu-text-field-input {
                font-size: 13.5px;
                padding: 0;
                height: 100%;
                line-height: 38px;
                color: var(--text-color);
            }
        }
    }
}
</style>
