<template>
    <div class="ld-layout"
        :class="$props.class">
        <div class="ld-list">
            <mu-list v-if="showBack">
                <ListItemBack></ListItemBack>
            </mu-list>
            <div v-if="showTip"
                class="tip">
                <mu-icon :value="tipIcon"
                    color="grey"
                    :size="100"></mu-icon>
                <p class="tip-title">{{tipText}}</p>
            </div>
            <CenteredLoading v-else-if="listLoading"></CenteredLoading>
            <div v-else-if="isEmpty"
                class="tip empty-tip">
                <mu-icon :value="emptyIcon"
                    color="grey"
                    :size="72"></mu-icon>
                <p class="tip-title">{{emptyText}}</p>
                <span v-if="emptySubtext" class="tip-subtitle">{{emptySubtext}}</span>
            </div>
            <slot v-else
                name="list"></slot>
        </div>
        <div class="ld-detail">
            <template v-if="showTip"></template>
            <div v-else-if="isEmpty" class="empty-detail-tip">
                <CenteredTip :icon="emptyIcon"
                    :tip="emptyText"
                    :subTip="emptySubtext"></CenteredTip>
            </div>
            <CenteredLoading v-else-if="detailLoading"></CenteredLoading>
            <!-- default slot -->
            <slot v-else></slot>
        </div>
    </div>
</template>

<script>
import ListItemBack from '@/components/ListItemBack.vue';
import CenteredLoading from '@/components/CenteredLoading.vue';
import CenteredTip from '@/components/CenteredTip.vue';

export default {
    props: {
        listLoading: {
            required: false,
            type: Boolean,
            default: false
        },
        detailLoading: {
            required: false,
            type: Boolean,
            default: false
        },
        showBack: {
            required: false,
            type: Boolean,
            default: false
        },
        showTip: {
            required: false,
            type: Boolean,
            default: false
        },
        tipIcon: {
            required: false,
            type: String,
            default: 'nature_people'
        },
        tipText: {
            required: false,
            type: String,
            default: ''
        },
        isEmpty: {
            required: false,
            type: Boolean,
            default: false
        },
        emptyIcon: {
            required: false,
            type: String,
            default: 'inbox'
        },
        emptyText: {
            required: false,
            type: String,
            default: '暂无内容'
        },
        emptySubtext: {
            required: false,
            type: String,
            default: ''
        }
    },
    components: {
        ListItemBack,
        CenteredLoading,
        CenteredTip
    }
};
</script>

<style lang="less">
.ld-layout {
    display: flex;
    flex-direction: row;
    height: 100%;
    .ld-list {
        flex: 1;
        height: 100%;
        overflow: auto;
        box-shadow: var(--md-elevation-1, 0 0 6px rgba(0, 0, 0, 0.2));
        display: flex;
        flex-direction: column;
        .tip {
            height: 100%;
            color: var(--secondary-text-color, grey);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 24px 16px;
            box-sizing: border-box;
            text-align: center;
            user-select: none;

            .tip-title {
                margin: 12px 0 0 0;
                font-size: 14.5px;
                font-weight: 500;
            }

            .tip-subtitle {
                margin-top: 6px;
                font-size: 12.5px;
                color: var(--hint-text-color, #999);
                line-height: 1.4;
            }
        }
        .mu-item-title {
            font-size: 14px;
        }
    }
    .ld-detail {
        flex: 3;
        height: 100%;
        overflow: auto;

        .empty-detail-tip {
            width: 100%;
            height: 100%;
        }
    }
}
</style>
