/**
 * @param {string} url
 * @param {number} width
 * @param {number} height
 */
export function sizeImg(url, width, height = width) {
    if (!url) return '';
    if (process.env.NODE_ENV === 'development') {
        if (url.startsWith('http://localhost:')) {
            return url;
        }
    }
    if (url.startsWith('http:')) url = 'https' + url.slice(4);
    return `${url}?param=${width.toFixed(0)}y${height.toFixed(0)}`;
}

/**
 * @param {string} url
 */
export function bkgImg(url) {
    if (!url) return '';
    return `background-image:url(${url})`;
}

/**
 * @param {number|string} id
 * @param {number} width
 * @param {number} height
 */
export function blurImg(id, width, height = width) {
    return `https://music.163.com/api/img/blur/${id}?param=${width}y${height}`;
}

/**
 * @param {number} px
 */
export function HiDpiPx(px) {
    return px * window.devicePixelRatio;
}

function md5(string) {
    function rotateLeft(lValue, iShiftBits) {
        return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }
    function addUnsigned(lX, lY) {
        const lX8 = (lX & 0x80000000);
        const lY8 = (lY & 0x80000000);
        const lX4 = (lX & 0x40000000);
        const lY4 = (lY & 0x40000000);
        const lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
        if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
        if (lX4 | lY4) {
            if (lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
            return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
        }
        return (lResult ^ lX8 ^ lY8);
    }
    function F(x, y, z) { return (x & y) | ((~x) & z); }
    function G(x, y, z) { return (x & z) | (y & (~z)); }
    function H(x, y, z) { return (x ^ y ^ z); }
    function I(x, y, z) { return (y ^ (x | (~z))); }
    function FF(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function GG(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function HH(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function II(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }

    const utf8Bytes = [];
    for (let i = 0; i < string.length; i++) {
        let code = string.charCodeAt(i);
        if (code < 0x80) utf8Bytes.push(code);
        else if (code < 0x800) {
            utf8Bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
        } else if (code < 0xd800 || code >= 0xe000) {
            utf8Bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
        } else {
            i++;
            code = 0x10000 + (((code & 0x3ff) << 10) | (string.charCodeAt(i) & 0x3ff));
            utf8Bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
        }
    }

    const nWords = (((utf8Bytes.length + 8) >> 6) + 1) * 16;
    const x = new Array(nWords).fill(0);
    for (let i = 0; i < utf8Bytes.length; i++) {
        x[i >> 2] |= (utf8Bytes[i] & 0xFF) << ((i % 4) * 8);
    }
    x[utf8Bytes.length >> 2] |= 0x80 << ((utf8Bytes.length % 4) * 8);
    x[nWords - 2] = (utf8Bytes.length * 8) & 0xFFFFFFFF;
    x[nWords - 1] = Math.floor((utf8Bytes.length * 8) / 0x100000000);

    let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;

    for (let k = 0; k < x.length; k += 16) {
        const AA = a, BB = b, CC = c, DD = d;
        a = FF(a, b, c, d, x[k + 0], 7, -680876936);
        d = FF(d, a, b, c, x[k + 1], 12, -389564586);
        c = FF(c, d, a, b, x[k + 2], 17, 606105819);
        b = FF(b, c, d, a, x[k + 3], 22, -1044525330);
        a = FF(a, b, c, d, x[k + 4], 7, -176418897);
        d = FF(d, a, b, c, x[k + 5], 12, 1200080426);
        c = FF(c, d, a, b, x[k + 6], 17, -1473231341);
        b = FF(b, c, d, a, x[k + 7], 22, -45705983);
        a = FF(a, b, c, d, x[k + 8], 7, 1770035416);
        d = FF(d, a, b, c, x[k + 9], 12, -1958414417);
        c = FF(c, d, a, b, x[k + 10], 17, -42063);
        b = FF(b, c, d, a, x[k + 11], 22, -1990404162);
        a = FF(a, b, c, d, x[k + 12], 7, 1804603682);
        d = FF(d, a, b, c, x[k + 13], 12, -40341101);
        c = FF(c, d, a, b, x[k + 14], 17, -1502002290);
        b = FF(b, c, d, a, x[k + 15], 22, 1236535329);

        a = GG(a, b, c, d, x[k + 1], 5, -165796510);
        d = GG(d, a, b, c, x[k + 6], 9, -1069501632);
        c = GG(c, d, a, b, x[k + 11], 14, 643717713);
        b = GG(b, c, d, a, x[k + 0], 20, -373897302);
        a = GG(a, b, c, d, x[k + 5], 5, -701558691);
        d = GG(d, a, b, c, x[k + 10], 9, 38016083);
        c = GG(c, d, a, b, x[k + 15], 14, -660478335);
        b = GG(b, c, d, a, x[k + 4], 20, -405537848);
        a = GG(a, b, c, d, x[k + 9], 5, 568446438);
        d = GG(d, a, b, c, x[k + 14], 9, -1019803690);
        c = GG(c, d, a, b, x[k + 3], 14, -187363961);
        b = GG(b, c, d, a, x[k + 8], 20, 1163531501);
        a = GG(a, b, c, d, x[k + 13], 5, -1444681467);
        d = GG(d, a, b, c, x[k + 2], 9, -51403784);
        c = GG(c, d, a, b, x[k + 7], 14, 1735328473);
        b = GG(b, c, d, a, x[k + 12], 20, -1926607734);

        a = HH(a, b, c, d, x[k + 5], 4, -378558);
        d = HH(d, a, b, c, x[k + 8], 11, -2022574463);
        c = HH(c, d, a, b, x[k + 11], 16, 1839030562);
        b = HH(b, c, d, a, x[k + 14], 23, -35309556);
        a = HH(a, b, c, d, x[k + 1], 4, -1530992060);
        d = HH(d, a, b, c, x[k + 4], 11, 1272893353);
        c = HH(c, d, a, b, x[k + 7], 16, -155497632);
        b = HH(b, c, d, a, x[k + 10], 23, -1094730640);
        a = HH(a, b, c, d, x[k + 13], 4, 681279174);
        d = HH(d, a, b, c, x[k + 0], 11, -358537222);
        c = HH(c, d, a, b, x[k + 3], 16, -722521979);
        b = HH(b, c, d, a, x[k + 6], 23, 76029189);
        a = HH(a, b, c, d, x[k + 9], 4, -640364487);
        d = HH(d, a, b, c, x[k + 12], 11, -421815835);
        c = HH(c, d, a, b, x[k + 15], 16, 530742520);
        b = HH(b, c, d, a, x[k + 2], 23, -995338651);

        a = II(a, b, c, d, x[k + 0], 6, -198630844);
        d = II(d, a, b, c, x[k + 7], 10, 1126891415);
        c = II(c, d, a, b, x[k + 14], 15, -1416354905);
        b = II(b, c, d, a, x[k + 5], 21, -57434055);
        a = II(a, b, c, d, x[k + 12], 6, 1700485571);
        d = II(d, a, b, c, x[k + 3], 10, -1894986606);
        c = II(c, d, a, b, x[k + 10], 15, -1051523);
        b = II(b, c, d, a, x[k + 1], 21, -2054922799);
        a = II(a, b, c, d, x[k + 8], 6, 1873313359);
        d = II(d, a, b, c, x[k + 15], 10, -30611744);
        c = II(c, d, a, b, x[k + 6], 15, -1560198380);
        b = II(b, c, d, a, x[k + 13], 21, 1309151649);
        a = II(a, b, c, d, x[k + 4], 6, -145523070);
        d = II(d, a, b, c, x[k + 11], 10, -1120210379);
        c = II(c, d, a, b, x[k + 2], 15, 718787259);
        b = II(b, c, d, a, x[k + 9], 21, -343485551);

        a = addUnsigned(a, AA);
        b = addUnsigned(b, BB);
        c = addUnsigned(c, CC);
        d = addUnsigned(d, DD);
    }

    const rawBytes = [
        a & 0xFF, (a >> 8) & 0xFF, (a >> 16) & 0xFF, (a >> 24) & 0xFF,
        b & 0xFF, (b >> 8) & 0xFF, (b >> 16) & 0xFF, (b >> 24) & 0xFF,
        c & 0xFF, (c >> 8) & 0xFF, (c >> 16) & 0xFF, (c >> 24) & 0xFF,
        d & 0xFF, (d >> 8) & 0xFF, (d >> 16) & 0xFF, (d >> 24) & 0xFF
    ];
    let binary = '';
    for (let i = 0; i < rawBytes.length; i++) {
        binary += String.fromCharCode(rawBytes[i]);
    }
    return btoa(binary).replace(/\//g, '_').replace(/\+/g, '-');
}

/**
 * Encode NetEase picId to image URL hash
 * @param {string | number} id
 * @param {1|2|3|4} cdn
 */
export function encodePicUrl(id, cdn = 3) {
    if (!id || id === -1 || id === 0 || id === '0') return '';
    const key = '3go8&$8*3*3h0k(2)2';
    const idStr = `${id}`;
    let xorStr = '';
    for (let i = 0; i < idStr.length; i++) {
        xorStr += String.fromCharCode(idStr.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    const hash = md5(xorStr);
    return `https://p${cdn}.music.126.net/${hash}/${idStr}.jpg`;
}

/**
 * Get track cover image URL (sync & instant)
 * @param {any} track
 * @param {number} size
 */
export function getTrackCoverUrl(track, size = 40) {
    if (!track) return '';
    if (track.album && track.album.picUrl) {
        return sizeImg(track.album.picUrl, HiDpiPx(size));
    }
    if (track.picUrl) {
        return sizeImg(track.picUrl, HiDpiPx(size));
    }
    const picId = (track.album && track.album.pic) || (track.album && (track.album.pic_str || track.album.picId));
    if (picId && picId !== -1 && picId !== 0 && picId !== '0') {
        const rawUrl = encodePicUrl(picId);
        if (rawUrl) {
            return sizeImg(rawUrl, HiDpiPx(size));
        }
    }
    return '';
}
