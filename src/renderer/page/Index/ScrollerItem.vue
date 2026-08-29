<template functional>
    <router-link :to="props.to"
        :title="props.title"
        class="scroll-item">
        <div class="cover">
            <img class="img"
                :src="props.img"
                :alt="props.title"
                width="160"
                height="160">
            <div v-if="props.maskIcon"
                class="mask">
                <mu-icon :value="props.maskIcon"
                    :size="14"></mu-icon>
                <span class="text">{{ props.maskText }}</span>
            </div>
        </div>
        <div v-if="props.itemSubTitle"
            class="caption">
            <div class="title__sup">{{ props.itemTitle }}</div>
            <div class="title__sub">{{ props.itemSubTitle }}</div>
        </div>
        <div class="caption"
            v-else>{{ props.itemTitle }}</div>
    </router-link>
</template>

<script>
export default {
    props: {
        to: {
            required: true
        },
        img: {
            type: String
        },
        title: {
            type: String,
            required: false
        },
        maskIcon: {
            type: String,
            required: false
        },
        maskText: {
            type: String,
            required: false
        },
        itemTitle: {
            type: String,
            required: true
        },
        itemSubTitle: {
            type: String,
            required: false
        }
    }
};
</script>

<style lang="less">
.scroll-item {
    width: 160px;
    height: 224px;
    margin-left: 14px;
    flex-shrink: 0;
    cursor: pointer;
    text-decoration: none !important;
    display: flex;
    flex-direction: column;
    transition: transform 0.25s cubic-bezier(0.2, 0, 0, 1);

    .cover {
        height: 160px;
        width: 160px;
        position: relative;
        border-radius: var(--md-shape-l, 16px);
        overflow: hidden;
        box-shadow: var(--md-elevation-1);
        background-color: var(--md-sys-color-surface-container-high, rgba(0, 0, 0, 0.05));
        transition: all 0.25s cubic-bezier(0.2, 0, 0, 1);

        .img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            transition: transform 0.35s cubic-bezier(0.2, 0, 0, 1);
        }

        .mask {
            position: absolute;
            right: 8px;
            top: 8px;
            bottom: unset;
            left: unset;
            color: #ffffff;
            font-size: 11px;
            font-weight: 500;
            padding: 3px 8px;
            border-radius: var(--md-shape-full, 9999px);
            background-color: rgba(0, 0, 0, 0.55);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);

            .text {
                margin-left: 4px;
                line-height: 1;
            }

            .mu-icon {
                font-size: 13px;
            }
        }
    }

    .caption {
        color: var(--text-color);
        margin-top: 8px;
        font-size: 13px;
        line-height: 18px;
        height: 38px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
        font-weight: 500;
    }

    .title__sup,
    .title__sub {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .title__sub {
        font-size: 12px;
        opacity: 0.65;
        margin-top: 2px;
    }

    &:hover {
        transform: translateY(-4px);
        .cover {
            box-shadow: var(--md-elevation-3);
            .img {
                transform: scale(1.06);
            }
        }
        .caption {
            color: var(--primary-color);
        }
    }
}
</style>
