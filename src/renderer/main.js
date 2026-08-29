import Vue from 'vue';
import Router from 'vue-router';
import MuseUI from 'muse-ui';
import 'muse-ui/dist/muse-ui.css';
import Toast from 'muse-ui-toast';
import Message from 'muse-ui-message';
import { RecycleScroller } from 'vue-virtual-scroller';

import App from './App.vue';
import store from './store/index';
import { UPDATE_SETTINGS } from './store/mutation-types';
import routes from './routes';
import { setupNavigation } from './util/navigation';
import { encm, isLinux } from './util/globals';
import { initTheme, applyThemeFromSettings } from './util/theme';
import DblclickRipple from './util/dblclick-ripple';
import * as tray from './util/tray';
import * as mpris from './util/mpris';

import './style.css';
import './transition.css';
// because we upgraded vue-resize manually
import 'vue-resize/dist/vue-resize.css';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';

Vue.use(Router);
Vue.use(MuseUI);
Vue.use(Toast);
Vue.use(Message);
Vue.use(DblclickRipple);
Vue.component('RecycleScroller', RecycleScroller);

if (process.env.NODE_ENV === 'development') {
    if (!localStorage.getItem('debug')) {
        localStorage.setItem('debug', 'API');
    }
}

const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

try {
    let settings;
    const previousSettings = sessionStorage.getItem('settings');
    if (previousSettings) {
        settings = Object.assign({}, encm.initialSettings, JSON.parse(previousSettings));
    } else {
        settings = encm.initialSettings;
    }
    try {
        sessionStorage.setItem('settings', JSON.stringify(settings));
    } catch { /* ignore */ }
    store.commit(UPDATE_SETTINGS, settings);
    const themeVariety = settings.themeVariety === 'auto'
        ? (darkMediaQuery.matches ? 'dark' : 'light')
        : settings.themeVariety;
    initTheme({
        primary: settings.themePrimaryColor,
        secondary: settings.themeSecondaryColor
    }, themeVariety);
} catch { sessionStorage.removeItem('settings'); }

tray.injectStore(store);

function restoreUserInfoOnline() {
    store.dispatch('restoreUserInfo').catch(e => {
        Message.alert(e.msg, '登录失败');
    });
}

if (navigator.onLine) {
    restoreUserInfoOnline();
} else {
    window.addEventListener('online', () => {
        if (navigator.onLine) {
            restoreUserInfoOnline();
        }
    }, { once: true });
}

store.dispatch('restoreUiState').then(() => {
    Promise.all([
        store.dispatch('restoreRadio'),
        store.dispatch('restorePlaylist')
    ]).then(() => {
        store.dispatch('updateUiTrack').then(() => {
            if (store.state.settings.themeFollowCover) {
                applyThemeFromSettings(store.state.settings, store.state.ui, darkMediaQuery);
            }
        });
        if (store.state.settings.autoPlay) {
            store.dispatch('playAudio');
        }
    });
});

window.onbeforeunload = () => {
    store.dispatch('storeCredential');
    store.dispatch('storePlaylist');
    store.dispatch('storeUiState');
    store.dispatch('storeRadio');
};

const router = new Router({ routes });
setupNavigation(router);
if (store.state.settings.startupPage !== 'index') {
    router.replace({ name: store.state.settings.startupPage });
}

const app = new Vue({
    store,
    router,
    provide: {
        darkMediaQuery
    },
    // workaround HMR issues
    // https://github.com/vuejs/vue-hot-reload-api/issues/61#issuecomment-433654600
    render: h => h(App) 
});

store.subscribe((mutation, state) => {
    if (mutation.type === 'SET_COVER_IMG_SRC' && state.settings.themeFollowCover) {
        applyThemeFromSettings(state.settings, state.ui, darkMediaQuery);
    }
});

darkMediaQuery.addEventListener('change', () => {
    applyThemeFromSettings(store.state.settings, store.state.ui, darkMediaQuery);
});

if (isLinux) {
    app.$once('audio-ready', audio => {
        mpris.injectStore(store);
        mpris.bindAudioElement(audio);
    });
}

const el = document.createElement('div');
document.body.appendChild(el);
app.$mount(el);
