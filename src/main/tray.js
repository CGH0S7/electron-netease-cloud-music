import { join } from 'path';
import { Tray, Menu, ipcMain, app } from 'electron';

import debug from 'debug';

const TAG = 'Tray';
const d = debug(TAG);

/**
 * @param {string} name
 */
function requireIcon(name) {
    let file = `${name}.png`;
    if (process.platform === 'darwin') {
        file = 'trayTemplate.png';
    }
    if (process.env.NODE_ENV === 'development') {
        return join(process.cwd(), 'assets/icons', file);
    }
    return join(__dirname, 'icons/', file);
}

/**
 * @param {string} str
 * @param {number} length
 */
function ellipsisText(str, length) {
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
}

function doDesktopHacks() {
    let isKDE = false;
    let isGNOME = false;
    let isUnity = false;
    const DesktopEnvs = [
        process.env['XDG_CURRENT_DESKTOP'] || '',
        process.env['XDG_SESSION_DESKTOP'] || ''
    ];
    for (const env of DesktopEnvs) {
        if (env.endsWith('KDE')) {
            isKDE = true;
            break;
        }
        if (env.endsWith('GNOME')) {
            isGNOME = true;
            break;
        }
        if (env.endsWith('Unity')) {
            isUnity = true;
            break;
        }
    }
    const xcd = process.env.XDG_CURRENT_DESKTOP;
    const name = app.name;
    const whatever = name.replace('electron', 'whatever');
    // Electron's Linux tray backend selects its implementation asynchronously.
    // Keep the KDE AppIndicator hint in place for the lifetime of the tray;
    // restoring it immediately after the constructor can leave a Wayland tray
    // object registered with no visible item.
    const sessionType = (process.env.XDG_SESSION_TYPE || '').toLowerCase();
    const isWayland = Boolean(process.env.WAYLAND_DISPLAY)
        || sessionType === 'wayland';
    d('desktop=%o session=%s wayland=%s', DesktopEnvs, sessionType || 'unknown', isWayland);
    if (isKDE) {
        // KDE tray backend hint (also needed by Electron 43 on Wayland)
        process.env.XDG_CURRENT_DESKTOP = 'Unity';
    } else if ((isGNOME || isUnity) && !isWayland) {
        // GNOME tray icon override by icon theme's Electron icon hack
        app.name = whatever;
    }
    return () => {
        if (isKDE && !isWayland) {
            process.env.XDG_CURRENT_DESKTOP = xcd;
        } else if ((isGNOME || isUnity) && !isWayland) {
            app.name = name;
        }
    };
}

export class AppTray {
    static get SendEvents() {
        return ['prev', 'next', 'playpause', 'favorite', 'dislike', 'get', 'mute'];
    }

    static get RecvEvents() {
        return ['track', 'mute'];
    }

    constructor(color = 'light') {
        /** @type {import('electron').BrowserWindow} */
        this.win = null;
        /** @type {import('electron').WebContents} */
        this.wc = null;
        const restore = doDesktopHacks();
        const iconPath = requireIcon(`tray.${color}`);
        d('creating tray: platform=%s icon=%s', process.platform, iconPath);
        try {
            this.tray = new Tray(iconPath);
        } catch (error) {
            // Keep the original error context in journal/system logs.  In
            // particular this makes failures caused by a missing tray backend
            // distinguishable from an invalid icon path.
            d('failed to create tray: %o', error);
            throw error;
        } finally {
            restore();
        }
        this.tray.on('click', () => this.raise() );
        this.tray.setToolTip('MaterialNCM');
        /**
         * @type {import('electron').MenuItemConstructorOptions[]}
         */
        this.controlMenu = [
            { type: 'separator' },
            { label: '⏮ 上一首', click: () => this.send('prev') },
            { label: '⏭ 下一首', click: () => this.send('next') },
            { label: '⏯ 播放 / 暂停', click: () => this.send('playpause') }
        ];
        /**
         * @type {import('electron').MenuItemConstructorOptions[]}
         */
        this.exitMenu = [
            { type: 'separator' },
            { label: '显示主界面', click: () => this.raise() },
            { label: '退出', click: () => this.quit() }
        ];
        this.muted = false;
        /** @type {import('@/util/tray').TrayTrack} */
        this.track = null;
        this.updateMenu();
        /**
         * @param {import('electron').IpcMainEvent} _
         * @param {string} type
         * @param {any[]} args
         */
        this.ipcListener = (_, type, ...args) => {
            d('↓ %s %o', type, ...args);
            switch (type) {
                case 'mute':
                    this.muted = args[0];
                    break;
                case 'track':
                    this.track = args[0];
                    break;
            }
            this.updateMenu();
        };
        ipcMain.on(TAG, this.ipcListener);
    }

    /**
     * @type {import('electron').MenuItemConstructorOptions[]}
     */
    get muteMenu() {
        return [
            { label: '静音', click: () => this.send('mute'), type: 'checkbox', checked: this.muted }
        ];
    }

    /**
     * @type {import('electron').MenuItemConstructorOptions[]}
     */
    get likeMenu() {
        if (!this.track) {
            return [];
        }
        return [
            { type: 'separator' },
            {
                label: '喜欢',
                type: 'checkbox',
                checked: this.track.favorite,
                enabled: this.track.canFavorite,
                click: () => this.send('favorite', this.track.id, !this.track.favorite)
            },
            {
                label: '不感兴趣',
                enabled: this.track.canDislike,
                click: () => this.send('dislike', this.track.id)
            },
        ];
    }

    /**
     * @type {import('electron').MenuItemConstructorOptions[]}
     */
    get trackMenu() {
        if (!this.track) {
            return [];
        }
        return [
            { type: 'separator' },
            { label: ellipsisText(this.track.name, 30) },
            { label: ellipsisText(`🎤 ${this.track.artist}`, 28) },
            { label: ellipsisText(`💿 ${this.track.album}`, 28) },
            { type: 'separator' },
        ];
    }

    /**
     * set tray icon color
     * @param {'light'|'dark'} color
     */
    setColor(color) {
        if (color === 'light' || color === 'dark') {
            const iconPath = requireIcon(`tray.${color}`);
            this.tray.setImage(iconPath);
        }
    }

    raise() {
        if (!this.win || this.win.isDestroyed()) return;
        if (this.win.isMinimized()) this.win.restore();
        this.win.show();
        app.focus({ steal: true });
        this.win.setAlwaysOnTop(true);
        this.win.focus({ steal: true });
        this.win.moveTop();
        this.win.setAlwaysOnTop(false);
    }

    quit() {
        app.quit();
    }

    /**
     * @param {string} event
     * @param {...any} args 
     */
    send(event, ...args) {
        if (!this.wc) {
            d(event, 'webContents not available');
            return;
        }
        d('↑ %s %o', event, ...args);
        this.wc.send(TAG, event, ...args);
    }

    updateMenu() {
        const tmpl = this.likeMenu.concat(this.controlMenu, this.muteMenu, this.trackMenu, this.exitMenu);
        const menu = Menu.buildFromTemplate(tmpl);
        this.contextMenu = menu;
        this.tray.setContextMenu(menu);
    }

    /**
     * @param {import('electron').BrowserWindow} win 
     */
    bindWindow(win) {
        this.win = win;
        this.wc = win.webContents;
        this.send('get');
    }

    destroy() {
        this.tray.destroy();
        this.tray = null;
        ipcMain.removeListener(TAG, this.ipcListener);
    }
}
