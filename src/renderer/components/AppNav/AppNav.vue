<template>
    <div class="appbar"
        :class="appbarDynamicClassName">
        <template v-if="!settings.windowBorder">
            <div v-if="!isDarwin"
                id="appbar-window-control">
                <mu-button icon
                    small
                    color="white"
                    @click="handleClose()">
                    <mu-icon value="close"
                        :size="16"></mu-icon>
                </mu-button>
                <mu-button icon
                    small
                    color="white"
                    @click="handleMaximize()">
                    <mu-icon value="keyboard_arrow_up"
                        :size="16"></mu-icon>
                </mu-button>
                <mu-button icon
                    small
                    color="white"
                    @click="handleMinimize()">
                    <mu-icon value="keyboard_arrow_down"
                        :size="16"></mu-icon>
                </mu-button>
            </div>
            <div id="appbar-drag-region"></div>
        </template>
        <mu-appbar title="Electron Netease Cloud Music"
            color="primary">
            <template #left>
                <div class="nav-control-group">
                    <mu-button icon
                        class="nav-btn nav-drawer-btn"
                        title="主菜单"
                        @click="drawerOpen = true">
                        <mu-icon value="menu"></mu-icon>
                    </mu-button>
                    <div class="nav-history-buttons">
                        <mu-button icon
                            small
                            class="nav-btn nav-history-btn"
                            :disabled="!canGoBack"
                            title="后退 (Alt + ←)"
                            @click="handleNavBack">
                            <mu-icon value="arrow_back" :size="20"></mu-icon>
                        </mu-button>
                        <mu-button icon
                            small
                            class="nav-btn nav-history-btn"
                            :disabled="!canGoForward"
                            title="前进 (Alt + →)"
                            @click="handleNavForward">
                            <mu-icon value="arrow_forward" :size="20"></mu-icon>
                        </mu-button>
                    </div>
                </div>
            </template>
            <template #right>
                <SearchBox></SearchBox>
            </template>
        </mu-appbar>
        <mu-drawer :width="300"
            :docked="false"
            :open.sync="drawerOpen"
            class="appbar-drawer">
            <div class="header"
                :style="backgroundUrlStyle">
                <mu-avatar :size="80" class="user-avatar">
                    <img v-if="user.loginValid"
                        :src="avatarUrl">
                    <mu-icon v-else
                        value="person"
                        :size="40"></mu-icon>
                </mu-avatar>
                <div class="text">
                    <span class="username"
                        @click="handleNameClick()">{{username}}</span>
                </div>
            </div>
            <mu-list class="drawer-nav-list">
                <mu-list-item v-for="route in validRoutes"
                    button
                    class="drawer-nav-item"
                    :class="{ 'is-active': $route.name === route.name }"
                    :key="route.name"
                    @click="handleSideNav(route)">
                    <mu-list-item-action>
                        <mu-icon :value="route.icon || 'bug_report'"></mu-icon>
                    </mu-list-item-action>
                    <mu-list-item-title>{{route.title}}</mu-list-item-title>
                </mu-list-item>
            </mu-list>
        </mu-drawer>
        <LoginDialog :show.sync="loginDlgShow"></LoginDialog>
    </div>
</template>

<script>
import { mapActions } from 'vuex';

import Routes from '@/routes';
import SearchBox from './SearchBox.vue';
import LoginDialog from './LoginDialog.vue';
import { sizeImg, HiDpiPx } from '@/util/image';
import { isDarwin, browserWindow } from '@/util/globals';
import { UPDATE_SETTINGS, SET_USER_SIGN_STATUS } from '@/store/mutation-types';
import { navigation, goBack, goForward } from '@/util/navigation';

const SignIcon = {
    [0b00]: 'radio_button_unchecked',
    [0b01]: 'contrast',
    [0b10]: 'contrast',
    [0b11]: 'check_circle'
};

export default {
    data() {
        return {
            isDarwin,
            drawerOpen: false,
            loginDlgShow: false
        };
    },
    computed: {
        /** @returns {import('@/store/modules/user').State}*/
        user() { return this.$store.state.user; },
        /** @returns {import('@/store/modules/settings').State}*/
        settings() { return this.$store.state.settings; },
        /** @returns {import('@/routes').Route[]} */
        validRoutes() {
            return Routes.filter(r => r.title);
        },
        canGoBack() {
            return navigation.canGoBack;
        },
        canGoForward() {
            return navigation.canGoForward;
        },
        /** @returns {string} */
        appbarDynamicClassName() {
            return {
                'is-darwin': this.isDarwin,
                'is-frameless': this.settings.windowBorder === false
            };
        },
        /** @returns {string} */
        avatarUrl() {
            return sizeImg(this.user.info.avatarUrl, HiDpiPx(80));
        },
        /** @returns {string} */
        username() {
            if (this.user.loginPending) return '登录中 ...';
            if (this.user.loginValid) return this.user.info.nickname;
            return '点击登录';
        },
        /** @returns {Record<string, string>} */
        backgroundUrlStyle() {
            if (this.settings.customDrawerBkg) {
                return {
                    backgroundImage: `url(${this.settings.customDrawerBkg})`
                };
            }
            if (this.user.info.bkgUrl) {
                return {
                    backgroundImage: `url(${sizeImg(this.user.info.bkgUrl, HiDpiPx(300), HiDpiPx(200))})`
                };
            }
            return {};
        },
        /** @returns {number} */
        signLevel() {
            let res = 0b00;
            if (this.user.signStatus.pcSign) res += 0b01;
            if (this.user.signStatus.mobileSign) res += 0b10;
            return res;
        },
        /** @returns {number} */
        btnSignDisabled() {
            return this.user.signPending || this.signLevel === 0b11;
        },
        /** @returns {string} */
        btnSignText() {
            if (this.signLevel === 0b11) return '已签到';
            return '未签到';
        },
        /** @returns {string} */
        btnSignIcon() {
            return SignIcon[this.signLevel];
        }
    },
    methods: {
        ...mapActions([
            'checkin'
        ]),
        handleClose() {
            browserWindow.close();
        },
        handleMinimize() {
            browserWindow.minimize();
        },
        handleMaximize() {
            browserWindow.maximize();
        },
        handleNavBack() {
            goBack();
        },
        handleNavForward() {
            goForward();
        },
        handleSideNav(route) {
            this.drawerOpen = false;
            if (route.name === this.$route.name) return;
            if (route.name === 'index') window.__NAV_BACK__ = true;
            if (this.$route.name === 'player') {
                this.$router.replace(route);
            } else {
                this.$router.push(route);
            }
        },
        handleNameClick() {
            if (!this.user.loginValid) {
                this.loginDlgShow = true;
            } else {
                this.handleSideNav({ name: 'profile' });
            }
        },
        async handleSign() {
            const points = await this.checkin();
            if (points > 0) {
                this.$toast.message(`签到成功，获得 ${points} 点积分`);
            } else {
                this.$toast.message('是不是已经签到过了呢 ：）');
            }
        }
    },
    created() {
        // register autoSign handler
        this.$store.subscribe(({ type, payload }, state) => {
            if (// settings.autoSign enabled
                (type === UPDATE_SETTINGS && payload && payload.autoSign === true) ||
                // signStatus updated via `actions.updateUserSignStatus`
                (type === SET_USER_SIGN_STATUS && payload && payload.timestamp)
            ) {
                const { timestamp, pcSign, mobileSign } = state.user.signStatus;
                // autoSign not enabled || signStatus was not up-to-date || signed already
                if (state.settings.autoSign !== true || timestamp < 0 || (pcSign && mobileSign)) return;
                this.handleSign();
            }
        });
    },
    components: {
        LoginDialog,
        SearchBox
    }
};
</script>

<style lang="less">
.appbar {
    &.is-frameless {
        .mu-appbar {
            padding-top: 16px;
        }
    }
    &.is-darwin {
        &.is-frameless {
            .mu-appbar {
                padding-top: 12px;
            }
        }
    }
    #appbar-window-control {
        z-index: 11;
        position: fixed;
        top: 0;
        left: 0;
        button {
            cursor: default !important;
            width: 28px;
            height: 28px;
        }
    }
    #appbar-drag-region {
        position: fixed;
        left: 170px;
        top: 2px;
        right: 60px;
        height: 62px;
        -webkit-app-region: drag;
    }
    .mu-appbar {
        user-select: none;
        z-index: 10;
        position: fixed;
        width: 100%;
        top: 0;
        left: 0;
        box-shadow: var(--md-elevation-1);
        backdrop-filter: blur(16px);
        transition: background-color 0.3s cubic-bezier(0.2, 0, 0, 1);

        .mu-appbar-title {
            line-height: unset;
            font-size: 18px;
            font-weight: 600;
            letter-spacing: 0.2px;
        }
    }

    .nav-control-group {
        display: flex;
        align-items: center;
        gap: 6px;
        -webkit-app-region: no-drag;

        .nav-history-buttons {
            display: flex;
            align-items: center;
            background: rgba(255, 255, 255, 0.15);
            border-radius: var(--md-shape-full, 9999px);
            padding: 2px 4px;
            margin-left: 4px;

            .nav-history-btn {
                width: 32px;
                height: 32px;
                min-width: 32px;
                opacity: 0.95;
                transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);

                &:disabled {
                    opacity: 0.35 !important;
                }

                &:not(:disabled):hover {
                    background: rgba(255, 255, 255, 0.25);
                    transform: scale(1.08);
                }

                &:not(:disabled):active {
                    transform: scale(0.92);
                }
            }
        }
    }
}

.appbar-drawer {
    border-radius: 0 28px 28px 0 !important;
    user-select: none;
    background-color: var(--md-sys-color-surface-container, var(--background-color)) !important;
    box-shadow: var(--md-elevation-3) !important;
    overflow: hidden;

    .header {
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        box-sizing: border-box;
        padding: 16px;
        width: 100%;
        height: 200px;
        background-size: cover;
        background-image: url('assets/img/bkg.svg');
        background-position: center;
        background-repeat: no-repeat;
        -webkit-app-region: no-drag;

        .user-avatar {
            box-shadow: var(--md-elevation-2);
            border: 2px solid rgba(255, 255, 255, 0.8);
        }

        .text {
            margin-top: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.66));
            .username {
                color: white;
                font-size: 18px;
                font-weight: 600;
                cursor: pointer;
                line-height: 36px;
                width: 160px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .btn-sign {
                border-radius: var(--md-shape-full, 9999px);
                backdrop-filter: blur(8px);
                background: rgba(255, 255, 255, 0.2);
                &.disabled {
                    color: rgba(255, 255, 255, 0.7);
                }
            }
        }
    }

    .drawer-nav-list {
        padding: 12px 10px;

        .drawer-nav-item,
        .mu-item-wrapper {
            border-radius: var(--md-shape-full, 9999px) !important;
            overflow: hidden !important;
            margin-bottom: 4px;
            transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);

            .mu-item {
                border-radius: var(--md-shape-full, 9999px) !important;
                overflow: hidden !important;
                padding: 0 16px;
                height: 44px;
            }

            .mu-ripple-wrapper {
                border-radius: var(--md-shape-full, 9999px) !important;
                overflow: hidden !important;
            }

            &:hover:not(.is-active) {
                background-color: var(--md-sys-color-surface-container-high, rgba(0, 0, 0, 0.05)) !important;
            }
        }

        .drawer-nav-item.is-active,
        .mu-item-wrapper.is-active {
            background-color: var(--md-sys-color-primary-container, rgba(229, 57, 53, 0.14)) !important;
            color: var(--primary-color) !important;
            font-weight: 600;
            .mu-icon {
                color: var(--primary-color);
            }
        }
    }
}
</style>
