import Vue from 'vue';

const navState = Vue.observable({
    history: [],
    currentIndex: -1,
    canGoBack: false,
    canGoForward: false
});

let routerInstance = null;
let isNavigatingBack = false;
let isNavigatingForward = false;

/**
 * Initialize navigation tracker with the Vue Router instance
 * @param {import('vue-router').default} router
 */
export function setupNavigation(router) {
    routerInstance = router;

    router.afterEach(to => {
        const fullPath = to.fullPath;

        if (isNavigatingBack) {
            isNavigatingBack = false;
            if (navState.currentIndex > 0) {
                navState.currentIndex--;
            }
        } else if (isNavigatingForward) {
            isNavigatingForward = false;
            if (navState.currentIndex < navState.history.length - 1) {
                navState.currentIndex++;
            }
        } else {
            // New navigation
            if (navState.currentIndex < navState.history.length - 1) {
                navState.history = navState.history.slice(0, navState.currentIndex + 1);
            }
            navState.history.push({
                fullPath,
                name: to.name,
                params: to.params,
                query: to.query
            });
            navState.currentIndex = navState.history.length - 1;
        }

        navState.canGoBack = navState.currentIndex > 0;
        navState.canGoForward = navState.currentIndex < navState.history.length - 1;
    });
}

/**
 * Navigate to the previous route in history
 */
export function goBack() {
    if (navState.canGoBack && routerInstance) {
        window.__NAV_BACK__ = true;
        isNavigatingBack = true;
        routerInstance.back();
    }
}

/**
 * Navigate to the next route in history
 */
export function goForward() {
    if (navState.canGoForward && routerInstance) {
        window.__NAV_BACK__ = false;
        isNavigatingForward = true;
        routerInstance.forward();
    }
}

export const navigation = navState;
export default navigation;
