<template>
    <ListDetailLayout class="fav-djradio"
        :listLoading="listLoading"
        :detailLoading="detailLoading"
        tipText="登录后查看订阅的主播电台"
        :showTip="!user.loginValid"
        :isEmpty="user.loginValid && !listLoading && user.djradios.length === 0"
        emptyIcon="radio"
        emptyText="暂无订阅的主播电台"
        emptySubtext="目前为空，先去订阅喜欢的电台再来访问吧">
        <template #list>
            <mu-list>
                <AvatarListItem v-for="r in user.djradios"
                    :key="r.id"
                    :img="r.picUrl"
                    :title="r.name"
                    :subTitle="`${r.dj.nickname} / ${r.programCount} 期`"
                    @click="handleClick(r.id)">
                </AvatarListItem>
            </mu-list>
        </template>
        <DjRadioDetail v-if="djradio"
            :djradio="djradio"></DjRadioDetail>
    </ListDetailLayout>
</template>

<script>
import { mapActions } from 'vuex';

import Api from '@/api/ipc';

import DjRadioDetail from '@/components/DjRadioDetail/DjRadioDetail.vue';
import AvatarListItem from '@/components/AvatarListItem.vue';
import ListDetailLayout from '@/components/ListDetailLayout.vue';

import { FetchOnLoginMixin } from './fetch-on-login';

export default {
    mixins: [FetchOnLoginMixin],
    data() {
        return {
            /** @type {Types.DjDetailData} */
            djradio: null,
            listLoading: false,
            detailLoading: false
        };
    },
    computed: {
        /** @returns {import('@/store/modules/user').State} */
        user() { return this.$store.state.user; },
    },
    methods: {
        ...mapActions([
            'updateUserRadios'
        ]),
        async loadDjRadio(id) {
            this.detailLoading = true;
            const resp = await Api.getDjRadioDetail(id);
            this.djradio = resp.data;
            this.detailLoading = false;
        },
        async fetchData() {
            if (this.user.djradios.length <= 0) {
                this.listLoading = true;
                await this.updateUserRadios();
                this.listLoading = false;
            }
            const r = this.user.djradios[0];
            if (r && r.id) {
                this.loadDjRadio(r.id);
            }
        },
        handleClick(id) {
            this.loadDjRadio(id);
        }
    },
    components: {
        DjRadioDetail,
        AvatarListItem,
        ListDetailLayout
    }
};
</script>
