<template functional>
    <mu-list-item button
        :disabled="Boolean(parent.settings.themeFollowCover)"
        :class="{ 'option-color--disabled': parent.settings.themeFollowCover }"
        @click="!parent.settings.themeFollowCover && parent.setColorByName(props.prop)">
        <mu-list-item-title>
            <span>{{ props.title }}</span>
            <span v-if="parent.settings.themeFollowCover" class="option-color-hint">（已启用封面自动取色）</span>
        </mu-list-item-title>
        <mu-list-item-action>
            <mu-avatar :size="24"
                :color="parent.settings[props.prop]"></mu-avatar>
        </mu-list-item-action>
    </mu-list-item>
</template>

<script>
export default {
    props: {
        title: {
            type: String,
            required: true
        },
        prop: {
            type: String,
            required: true
        }
    }
};
</script>

<style lang="less">
.option-color--disabled {
    opacity: 0.45 !important;
    cursor: not-allowed !important;
    .option-color-hint {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-left: 6px;
        font-weight: normal;
    }
}
</style>
