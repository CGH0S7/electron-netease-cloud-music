<template functional>
    <router-link :to="props.to"
        class="action-item">
        <div class="item-icon">
            <mu-icon :value="props.icon"
                :size="36"></mu-icon>
        </div>
        <p class="item-desc">{{ props.title }}</p>
    </router-link>
</template>

<script>
export default {
    props: {
        to: {
            required: true
        },
        icon: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        }
    }
};
</script>

<style lang="less">
.action-item {
    cursor: pointer;
    text-decoration: none !important;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

    .item-icon {
        width: 68px;
        height: 68px;
        box-sizing: border-box;
        border-radius: var(--md-shape-xl, 20px);
        background: var(--md-sys-color-primary-container, rgba(229, 57, 53, 0.12));
        color: var(--primary-color);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--md-elevation-1);
        transition: all 0.25s cubic-bezier(0.2, 0, 0, 1);
    }

    .item-desc {
        color: var(--text-color);
        font-size: 13px;
        font-weight: 500;
        text-align: center;
        margin: 10px 0 0 0;
        transition: color 0.2s cubic-bezier(0.2, 0, 0, 1);
    }

    &:hover {
        transform: translateY(-4px);
        .item-icon {
            background-color: var(--primary-color);
            color: #ffffff;
            box-shadow: var(--md-elevation-2);
            transform: scale(1.05);
            .mu-icon {
                color: #ffffff;
            }
        }
        .item-desc {
            color: var(--primary-color);
        }
    }

    &:active {
        transform: scale(0.95);
    }
}
</style>
