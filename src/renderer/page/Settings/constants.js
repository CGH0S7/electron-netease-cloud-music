import { process } from '@/util/globals';

const versions = process.versions;

export const Versions = `Electron: ${versions.electron}
Chrome: ${versions.chrome}
Node: ${versions.node}
V8: ${versions.v8}`;

export const RepoURL = 'https://github.com/CGH0S7/electron-netease-cloud-music';

export const IpcTag = 'Settings';
