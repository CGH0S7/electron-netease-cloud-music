import { dirname, parse } from 'path';

import debug from 'debug';
import { sessionBus, NameFlag, Variant, interface as DbusInterface } from 'dbus-next';

const { method, property, signal, Interface, ACCESS_READ } = DbusInterface;
const d = debug('Tray:SNI');
const WatcherName = 'org.kde.StatusNotifierWatcher';
const WatcherPath = '/StatusNotifierWatcher';
const ItemPath = '/StatusNotifierItem';
const MenuPath = '/Menu';
let nextId = 0;

class DbusMenu extends Interface {
    constructor() {
        super('com.canonical.dbusmenu');
        this.revision = 1;
        this.items = [];
        this.handlers = new Map();
    }

    @property({ signature: 'u', access: ACCESS_READ }) Version = 3;
    @property({ signature: 's', access: ACCESS_READ }) TextDirection = 'ltr';
    @property({ signature: 's', access: ACCESS_READ }) Status = 'normal';
    @property({ signature: 'as', access: ACCESS_READ }) IconThemePath = [];

    setTemplate(template) {
        this.handlers.clear();
        this.items = template.map((item, index) => {
            const id = index + 1;
            if (item.click) this.handlers.set(id, item.click);
            const properties = {};
            if (item.type === 'separator') {
                properties.type = new Variant('s', 'separator');
            } else {
                properties.label = new Variant('s', item.label || '');
                properties.enabled = new Variant('b', item.enabled !== false);
                properties.visible = new Variant('b', item.visible !== false);
                if (item.type === 'checkbox') {
                    properties['toggle-type'] = new Variant('s', 'checkmark');
                    properties['toggle-state'] = new Variant('i', item.checked ? 1 : 0);
                }
            }
            return [id, properties, []];
        });
        this.revision += 1;
        this.LayoutUpdated(this.revision, 0);
    }

    layout() {
        const children = this.items.map(item => new Variant('(ia{sv}av)', item));
        return [0, {}, children];
    }

    @method({ inSignature: 'iias', outSignature: 'u(ia{sv}av)' })
    GetLayout() {
        return [this.revision, this.layout()];
    }

    @method({ inSignature: 'is', outSignature: 'v' })
    GetProperty(id, name) {
        const item = this.items.find(entry => entry[0] === id);
        return item && item[1][name] ? item[1][name] : new Variant('s', '');
    }

    @method({ inSignature: 'isvu' })
    Event(id, eventId) {
        if (eventId !== 'clicked') return;
        const handler = this.handlers.get(id);
        if (handler) handler();
    }

    @method({ inSignature: 'i', outSignature: 'b' })
    AboutToShow() {
        return false;
    }

    @signal({ signature: 'ui' })
    LayoutUpdated(revision, parent) {
        return [revision, parent];
    }
}

class StatusNotifierItem extends Interface {
    constructor(contextMenu) {
        super('org.kde.StatusNotifierItem');
        this.contextMenu = contextMenu;
    }

    @property({ signature: 's', access: ACCESS_READ }) Category = 'ApplicationStatus';
    @property({ signature: 's', access: ACCESS_READ }) Id = 'electron-netease-cloud-music';
    @property({ signature: 's', access: ACCESS_READ }) Title = 'Electron NCM';
    @property({ signature: 's', access: ACCESS_READ }) Status = 'Active';
    @property({ signature: 'u', access: ACCESS_READ }) WindowId = 0;
    @property({ signature: 's', access: ACCESS_READ }) IconName = '';
    @property({ signature: 's', access: ACCESS_READ }) IconThemePath = '';
    @property({ signature: 'b', access: ACCESS_READ }) ItemIsMenu = true;
    @property({ signature: 'o', access: ACCESS_READ }) Menu = MenuPath;

    @method({ inSignature: 'ii' })
    Activate(x, y) {
        this.contextMenu(x, y);
    }

    @method({ inSignature: 'ii' })
    ContextMenu(x, y) {
        d('context menu request at %d,%d', x, y);
        this.contextMenu(x, y);
    }

    @method({ inSignature: 'ii' })
    SecondaryActivate(x, y) {
        this.contextMenu(x, y);
    }
    @method({ inSignature: 'is' }) Scroll() {}

    @signal({ signature: '' }) NewIcon() {}

    setIcon(iconPath) {
        this.IconName = parse(iconPath).name;
        this.IconThemePath = dirname(iconPath);
        this.NewIcon();
        Interface.emitPropertiesChanged(this, {
            IconName: this.IconName,
            IconThemePath: this.IconThemePath
        });
    }
}

export class StatusNotifier {
    constructor(iconPath, contextMenu) {
        this.bus = sessionBus();
        this.serviceName = `org.kde.StatusNotifierItem-${process.pid}-${++nextId}`;
        this.item = new StatusNotifierItem(contextMenu);
        this.menu = new DbusMenu();
        this.item.setIcon(iconPath);
        this.destroyed = false;
        this.ready = this.start();
        this.ready.catch(error => d('registration failed: %o', error));
    }

    async start() {
        this.bus.export(ItemPath, this.item);
        this.bus.export(MenuPath, this.menu);
        await this.bus.requestName(this.serviceName, NameFlag.DO_NOT_QUEUE);
        if (this.destroyed) return;
        const watcher = await this.bus.getProxyObject(WatcherName, WatcherPath);
        await watcher.getInterface(WatcherName).RegisterStatusNotifierItem(this.serviceName);
        d('registered %s icon=%s/%s', this.serviceName,
            this.item.IconThemePath, this.item.IconName);
    }

    setIcon(iconPath) {
        this.item.setIcon(iconPath);
    }

    setMenu(template) {
        this.menu.setTemplate(template);
    }

    async destroy() {
        this.destroyed = true;
        try {
            await this.ready.catch(() => {});
            await this.bus.releaseName(this.serviceName);
        } finally {
            this.bus.disconnect();
        }
    }
}
