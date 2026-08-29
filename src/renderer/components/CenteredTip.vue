<template>
    <div class="centered-tip">
        <mu-icon :value="icon"
            color="grey"
            :size="100"></mu-icon>
        <p class="tip-text mu-item-after-text">{{tip}}</p>
        <p v-if="subTip" class="tip-subtext">{{subTip}}</p>
    </div>
</template>

<script>
export default {
    props: {
        icon: {
            type: String,
            required: false,
            default: 'build'
        },
        tip: {
            type: String,
            required: false,
            default: '呃 ... 此功能正在开发中 ...'
        },
        subTip: {
            type: String,
            required: false,
            default: ''
        }
    }
};
</script>

<style lang="less">
.centered-tip {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 24px;
    box-sizing: border-box;
    user-select: none;

    .tip-text {
        font-size: 15px;
        font-weight: 500;
        margin: 14px 0 0 0;
        color: var(--secondary-text-color);
        text-align: center;
    }

    .tip-subtext {
        font-size: 13px;
        margin: 8px 0 0 0;
        color: var(--hint-text-color);
        opacity: 0.85;
        text-align: center;
    }
}
</style>
