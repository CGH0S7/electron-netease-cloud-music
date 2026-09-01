import MuseUI from 'muse-ui';

const overrides = {
    divider: 'rgba(0,0,0,.08)'
};

function hexToRgb(hex) {
    if (!hex) return '229, 57, 53';
    let c = hex.replace('#', '');
    if (c.length === 3) {
        c = c.split('').map(x => x + x).join('');
    }
    const num = parseInt(c, 16);
    return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}

export function getLuminance(hex) {
    if (!hex) return 0.2;
    let c = hex.replace('#', '');
    if (c.length === 3) {
        c = c.split('').map(x => x + x).join('');
    }
    const num = parseInt(c, 16);
    if (isNaN(num)) return 0.2;
    const r = ((num >> 16) & 255) / 255;
    const g = ((num >> 8) & 255) / 255;
    const b = (num & 255) / 255;
    const a = [r, g, b].map(v => {
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    let l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    return [h * 360, s, l];
}

export function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            let val = t;
            if (val < 0) val += 1;
            if (val > 1) val -= 1;
            if (val < 1 / 6) return p + (q - p) * 6 * val;
            if (val < 1 / 2) return q;
            if (val < 2 / 3) return p + (q - p) * (2 / 3 - val) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        const hNorm = h / 360;
        r = hue2rgb(p, q, hNorm + 1 / 3);
        g = hue2rgb(p, q, hNorm);
        b = hue2rgb(p, q, hNorm - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Adjusts color lightness and saturation for WCAG contrast in dark vs light theme
 * @param {string} hex
 * @param {boolean} isDark
 * @returns {string}
 */
export function adjustColorForTheme(hex, isDark) {
    if (!hex) return hex;
    const rgbStr = hexToRgb(hex);
    const [r, g, b] = rgbStr.split(',').map(Number);
    let [h, s, l] = rgbToHsl(r, g, b);

    if (isDark) {
        // In dark theme, ensure adequate brightness (tone 68~82%) and saturation for clear visibility
        if (l < 0.65) {
            l = Math.min(0.82, Math.max(0.68, l + 0.38));
        }
        s = Math.min(1.0, Math.max(0.42, s));
    } else {
        // In light theme, ensure adequate darkness (tone 30~44%) for clear readability on white
        if (l > 0.46) {
            l = Math.max(0.28, Math.min(0.42, l - 0.22));
        }
        s = Math.min(1.0, Math.max(0.48, s));
    }
    const [adjR, adjG, adjB] = hslToRgb(h, s, l);
    const toHex = rgb => '#' + rgb.map(x => Math.min(255, Math.max(0, Math.round(x))).toString(16).padStart(2, '0')).join('');
    return toHex([adjR, adjG, adjB]);
}

/**
 * add app specific theme variable, then set theme color
 * @param {any} theme theme option
 * @param {string} extendName theme name to extend
 */
export function initTheme(theme, extendName) {
    MuseUI.theme.addCreateTheme((theme) => {
        const isDark = theme.type === 'dark';
        const primaryRgb = hexToRgb(theme.primary);
        const secondaryRgb = hexToRgb(theme.secondary);
        const isPrimaryLight = getLuminance(theme.primary) > 0.45;
        const onPrimary = isPrimaryLight ? 'rgba(0, 0, 0, 0.88)' : '#ffffff';
        const onPrimarySecondary = isPrimaryLight ? 'rgba(0, 0, 0, 0.60)' : 'rgba(255, 255, 255, 0.75)';
        const onPrimarySurface = isPrimaryLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.15)';
        const onPrimarySurfaceHover = isPrimaryLight ? 'rgba(0, 0, 0, 0.14)' : 'rgba(255, 255, 255, 0.25)';

        return `body {
--primary-color: ${theme.primary};
--primary-rgb: ${primaryRgb};
--accent-color: ${theme.secondary};
--secondary-rgb: ${secondaryRgb};
--text-color: ${theme.text.primary};
--secondary-text-color: ${theme.text.secondary};
--hint-text-color: ${theme.text.hint};
--disabled-text-color: ${theme.text.disabled};
--background-color: ${theme.background.default};
--paper-color: ${theme.background.paper};
--is-dark-theme: ${isDark ? '1' : '0'};

/* Adaptive Top Bar Foreground Tokens */
--on-primary-color: ${onPrimary};
--on-primary-secondary: ${onPrimarySecondary};
--on-primary-surface: ${onPrimarySurface};
--on-primary-surface-hover: ${onPrimarySurfaceHover};

/* Material 3 Expressive Design Tokens */
--md-sys-color-primary: ${theme.primary};
--md-sys-color-on-primary: ${onPrimary};
--md-sys-color-primary-container: rgba(${primaryRgb}, ${isDark ? 0.28 : 0.12});
--md-sys-color-on-primary-container: ${isDark ? '#ffdad6' : '#410002'};
--md-sys-color-secondary: ${theme.secondary};
--md-sys-color-secondary-container: rgba(${secondaryRgb}, ${isDark ? 0.28 : 0.12});

--md-sys-color-surface: ${isDark ? '#141218' : '#fffbfe'};
--md-sys-color-surface-dim: ${isDark ? '#141218' : '#ded8e1'};
--md-sys-color-surface-bright: ${isDark ? '#3b383e' : '#fef7ff'};
--md-sys-color-surface-container-lowest: ${isDark ? '#0f0d13' : '#ffffff'};
--md-sys-color-surface-container-low: ${isDark ? '#1d1b20' : '#f7f2fa'};
--md-sys-color-surface-container: ${isDark ? '#211f26' : '#f3edf7'};
--md-sys-color-surface-container-high: ${isDark ? '#2b2930' : '#ece6f0'};
--md-sys-color-surface-container-highest: ${isDark ? '#36343b' : '#e6e0e9'};

--md-sys-color-outline: ${isDark ? '#938f99' : '#79747e'};
--md-sys-color-outline-variant: ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.10)'};
--md-sys-color-inverse-surface: ${isDark ? '#e6e0e9' : '#313033'};
--md-sys-color-inverse-on-surface: ${isDark ? '#313033' : '#f4eff4'};

/* Glassmorphism Tokens */
--md-glass-bg: ${isDark ? 'rgba(25, 23, 32, 0.70)' : 'rgba(255, 255, 255, 0.70)'};
--md-glass-border: ${isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.45)'};
--md-glass-highlight: ${isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.85)'};

/* Shapes */
--md-shape-xs: 4px;
--md-shape-s: 8px;
--md-shape-m: 12px;
--md-shape-l: 16px;
--md-shape-xl: 20px;
--md-shape-xxl: 28px;
--md-shape-full: 9999px;

/* Elevation Shadows */
--md-elevation-1: 0 1px 3px 0 rgba(0, 0, 0, ${isDark ? 0.35 : 0.12}), 0 1px 2px -1px rgba(0, 0, 0, ${isDark ? 0.3 : 0.08});
--md-elevation-2: 0 4px 12px 0 rgba(0, 0, 0, ${isDark ? 0.45 : 0.08}), 0 2px 4px -1px rgba(0, 0, 0, ${isDark ? 0.3 : 0.06});
--md-elevation-3: 0 8px 24px 0 rgba(0, 0, 0, ${isDark ? 0.55 : 0.12}), 0 3px 8px -2px rgba(0, 0, 0, ${isDark ? 0.4 : 0.08});

/* Motion */
--md-motion-standard: cubic-bezier(0.2, 0, 0, 1);
--md-motion-expressive: cubic-bezier(0.34, 1.56, 0.64, 1);
}`;
    });
    setTheme(theme, extendName);
}

/**
 * set MuseUI theme color
 * @param {any} theme theme option
 * @param {string} extendName theme name to extend
 */
export function setTheme(theme, extendName) {
    const isDark = extendName === 'dark';
    const primary = adjustColorForTheme(theme.primary, isDark);
    const secondary = adjustColorForTheme(theme.secondary, isDark);
    const id = 'ncm';
    MuseUI.theme.add(id, { ...overrides, ...theme, primary, secondary }, extendName).use(id);
}

/**
 * Extract vibrant primary and secondary colors and brightness from an image URL
 * @param {string} src
 * @returns {Promise<{ primary: string, secondary: string, isDark: boolean }>}
 */
export async function extractColorsFromImage(src) {
    if (!src) return null;
    try {
        const response = await fetch(src);
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        const canvas = document.createElement('canvas');
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(bitmap, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size).data;

        const colorCounts = new Map();
        let totalBrightness = 0;
        let pixelCount = 0;

        for (let i = 0; i < imageData.length; i += 4) {
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            const a = imageData[i + 3];

            if (a < 128) continue;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const l = (max + min) / 510;
            const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
            totalBrightness += brightness;
            pixelCount++;

            const d = (max - min) / 255;
            const s = l > 0.5 ? d / (2 - max / 255 - min / 255) : d / (max / 255 + min / 255);

            if (l > 0.1 && l < 0.9 && s > 0.15) {
                const qr = Math.round(r / 16) * 16;
                const qg = Math.round(g / 16) * 16;
                const qb = Math.round(b / 16) * 16;
                const key = `${qr},${qg},${qb}`;
                const weight = (1 + s * 2) * (1 - Math.abs(l - 0.5));
                colorCounts.set(key, (colorCounts.get(key) || 0) + weight);
            }
        }

        const avgBrightness = pixelCount > 0 ? totalBrightness / pixelCount : 128;
        const isDark = avgBrightness < 120;

        const sortedColors = Array.from(colorCounts.entries()).sort((a, b) => b[1] - a[1]);

        let primaryRgb = [229, 57, 53];
        let secondaryRgb = [255, 82, 82];

        if (sortedColors.length > 0) {
            const [pr, pg, pb] = sortedColors[0][0].split(',').map(Number);
            primaryRgb = [pr, pg, pb];

            let foundSecondary = false;
            for (let i = 1; i < sortedColors.length; i++) {
                const [sr, sg, sb] = sortedColors[i][0].split(',').map(Number);
                const dist = Math.sqrt((pr - sr) ** 2 + (pg - sg) ** 2 + (pb - sb) ** 2);
                if (dist > 60) {
                    secondaryRgb = [sr, sg, sb];
                    foundSecondary = true;
                    break;
                }
            }
            if (!foundSecondary) {
                secondaryRgb = [
                    Math.min(255, Math.max(0, primaryRgb[0] + 30)),
                    Math.min(255, Math.max(0, primaryRgb[1] + 30)),
                    Math.min(255, Math.max(0, primaryRgb[2] + 40))
                ];
            }
        }

        const toHex = rgb => '#' + rgb.map(x => Math.min(255, Math.max(0, Math.round(x))).toString(16).padStart(2, '0')).join('');

        return {
            primary: toHex(primaryRgb),
            secondary: toHex(secondaryRgb),
            isDark
        };
    } catch (e) {
        console.error('Failed to extract dynamic colors:', e); // eslint-disable-line no-console
        return null;
    }
}

/**
 * Apply theme based on current settings and cover image
 * @param {import('@/store/modules/settings').State} settings
 * @param {import('@/store/modules/ui').State} ui
 * @param {MediaQueryList} darkMediaQuery
 */
export async function applyThemeFromSettings(settings, ui, darkMediaQuery) {
    const variety = settings.themeVariety === 'auto'
        ? (darkMediaQuery && darkMediaQuery.matches ? 'dark' : 'light')
        : settings.themeVariety;

    if (settings.themeFollowCover && ui && ui.coverImgSrc) {
        const extracted = await extractColorsFromImage(ui.coverImgSrc);
        if (extracted) {
            setTheme({
                primary: extracted.primary,
                secondary: extracted.secondary
            }, variety);
            return;
        }
    }

    setTheme({
        primary: settings.themePrimaryColor,
        secondary: settings.themeSecondaryColor
    }, variety);
}
