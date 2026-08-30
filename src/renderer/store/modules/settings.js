import Vue from 'vue';
import * as types from '../mutation-types';

const DefaultSettings = {
    autoPlay: false,
    autoSign: false,
    autoRefreshLogin: false,
    bitRate: 'l',
    bitRateDownload: 'ex',
    filterRcmd: false,
    startupPage: 'favorite',
    windowBorder: true,
    windowZoom: null,
    showTrayIcon: true,
    trayIconVariety: 'light',
    exitOnWindowClose: true,
    minimizeOnStartup: false,
    themePrimaryColor: '#e53935',
    themeSecondaryColor: '#c62828',
    themeVariety: 'auto',
    themeFollowCover: true,
    customDrawerBkg: '',
    wavyProgressBar: true,
    playerBarGlassEffect: true,
    showTrackMiniCover: true,
    autoReplacePlaylist: false,
    lyricTranslation: 'translation',
    titleBarShowsTrackName: true,
    prevTrackBehavior: 'smart',
    enableUnblock: false
};

/**
 * @typedef {typeof DefaultSettings} State
 * @type {State}
 */
const state = Object.assign({}, DefaultSettings);

/**
 * @type {{ [x: string]: (state: State, payload: any) => void }}
 */
const mutations = {
    [types.UPDATE_SETTINGS](state, /** @type {Partial<State>} */ payload) {
        if (!payload || typeof payload !== 'object') return;
        Object.entries(payload).forEach(([key, val]) => {
            Vue.set(state, key, val);
        });
    }
};

export default {
    state,
    mutations
};
