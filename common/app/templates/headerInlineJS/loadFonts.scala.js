@()

// Duplicated in /static/src/javascripts/projects/common/utils/detect.js
// Determine what type of font-hinting we want.

(function (window, document) {
    if (!window.guardian.isModernBrowser) {
        return false;
    }
    var fontHinting = function () {
        var ua = navigator.userAgent,
            windowsNT = /Windows NT (\d\.\d+)/.exec(ua),
            hinting = 'Off',
            version;

        if (windowsNT) {
            version = parseFloat(windowsNT[1], 10);

            // For Windows XP-7
            if (version >= 5.1 && version <= 6.1) {
                if (/Chrome/.exec(ua) && version < 6.0) {
                    // Chrome on windows XP wants auto-hinting
                    hinting = 'Auto';
                } else {
                    // All others use cleartype
                    hinting = 'Cleartype';
                }
            }
        }
        return hinting;
    }();

    // Check to see if you should get webfonts, and then try to load them from localStorage if so
    var cookieData = 'GU_fonts=off; domain=' + location.hostname + '; path=/';

    function disableFonts() {
        document.cookie = cookieData + '; max-age=' + (60 * 60 * 24 * 365);
    }

    function enableFonts() {
        document.cookie = cookieData + '; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }

    function fontsEnabled() {
        return document.cookie.indexOf('GU_fonts=off') === -1;
    }

    // Load fonts from `localStorage`.
    function loadFontsFromStorage() {
        var storedFontFormat = localStorage['gu.fonts.format'],
            fonts, fontFormat, font, dataAttrName, nameAndCacheKey, fontData;

        if (storedFontFormat) {
            fonts = document.querySelectorAll('.webfont');
            fontFormat = JSON.parse(storedFontFormat).value;

            for (var i = 0, j = fonts.length; i < j; ++i) {
                font = fonts[i];
                dataAttrName = 'data-cache-file-' + (fontHinting === 'Off' ? '' : 'hinted-' + fontHinting + '-') + fontFormat;
                nameAndCacheKey = font.getAttribute(dataAttrName).match(/fonts\/([^/]*?)\/?([^/]*)\.(woff2|woff|tff).json$/);
                fontData = localStorage['gu.fonts.' + nameAndCacheKey[2] + '.' + nameAndCacheKey[1]];

                if (fontData) {
                    font.innerHTML = JSON.parse(fontData).value;
                    font.setAttribute('data-loaded-from', 'local');
                }
            }
        }
    }

    // Load fonts by injecting a `link` element.
    function loadFontsAsynchronously() {
        var scripts = document.getElementsByTagName('script'),
            thisScript = scripts[scripts.length - 1],
            fonts = document.createElement('link');

        fonts.rel = 'stylesheet';
        fonts.className = 'webfonts';

        // show cleartype-hinted for Windows XP-7 IE, autohinted for non-IE
        fonts.href = window.guardian.config.stylesheets.fonts['hinting' + fontHinting].kerningOn;
        window.setTimeout(function () {
            thisScript.parentNode.insertBefore(fonts, thisScript);
        }, 0);
    }

    // Detect whether browser is smoothing its fonts.
    // Technique adapted from @@zoltandulac's clever hack:
    // http://www.useragentman.com/blog/2009/11/29/how-to-detect-font-smoothing-using-javascript
    //
    // Because IE always uses clear-type (unless you've done some *major* hackery
    // http://stackoverflow.com/questions/5427315/disable-cleartype-text-anti-aliasing-in-ie9#tab-top),
    // we only test non-IE, and only on Windows. Everyone else we assume `true`.
    function fontSmoothingEnabled() {
        var ua = navigator.userAgent,
            fontSmoothingEnabled = null,
            canvasNode, ctx, alpha, x, y;

        // If we've already run this test, return the result.
        // This can be force-overidden using a '#check-smoothing' hash fragment.
        if (document.cookie.indexOf('GU_fonts_smoothing') !== -1 && window.location.hash !== '#check-smoothing') {
            return document.cookie.indexOf('GU_fonts_smoothing=on') !== -1;
        }

        // Internal function to store font-smoothing state for 30 days
        function saveFontSmoothing(state) {
            state = state ? 'on' : 'off';
            document.cookie = 'GU_fonts_smoothing= ' + state + '; domain=' + location.hostname + '; path=/; max-age=' + (60 * 60 * 24 * 30);
        }

        // If Windows desktop and not IE…
        if (/Windows NT (\d\.\d+)/.exec(ua) && !/MSIE|Trident/.exec(ua)) {
            try {
                // Create a 35x35 Canvas block.
                canvasNode = document.createElement('canvas');
                canvasNode.width = '35';
                canvasNode.height = '35';
                canvasNode.style.display = 'none';
                document.documentElement.appendChild(canvasNode);

                // Draw a black '@@', in 32px Arial, onto it.
                ctx = canvasNode.getContext('2d');
                ctx.textBaseline = 'top';
                ctx.font = '32px Arial';
                ctx.fillStyle = 'black';
                ctx.strokeStyle = 'black';
                ctx.fillText('@@', 0, 0);

                // Search the top left-hand corner of the canvas from left to
                // right, top to bottom, until we find a non-black pixel (most
                // likely). If so we return true.

                // - no point in searching the whole thing, so keep it as short
                // as possible.
                for (x = 0; x <= 16; x++) {
                    for (y = 0; y <= 16; y++) {
                        alpha = ctx.getImageData(x, y, 1, 1).data[3];

                        if (alpha > 0 && alpha < 255) {
                            // font-smoothing must be on
                            // save this info for 30 days
                            saveFontSmoothing(true);
                            return true;
                        }
                    }
                }

                // Didn't find any non-black pixels - return false.
                saveFontSmoothing(false);
                return false;
            } catch (ex) {
                // Something went wrong (for example, non-blink Opera cannot use
                // the canvas fillText() method) so we assume false for safety's
                // sake.
                saveFontSmoothing(false);
                return false;
            }
        } else {
            // You're not on Windows or you're using IE, so we assume true
            return true;
        }
    }

    // Make it possible to toggle fonts with `#fonts-off/on`.
    if (window.location.hash === '#fonts-off') {
        disableFonts();
    } else if (window.location.hash === '#fonts-on' || window.location.hash === '#check-smoothing') {
        enableFonts();
    }

    // Finally, if we're meant to use fonts, check they'll render ok
    // and then try and load them from storage. If that fails (i.e. likely lack of
    // support), inject a standard stylesheet `link` to load them.
    // If they won't render properly (no smoothing), disable them entirely.
    if (fontsEnabled()) {
        if (fontSmoothingEnabled()) {
            try {
                loadFontsFromStorage();
            } catch (e) {
                loadFontsAsynchronously();
            }
        } else {
            disableFonts();
        }
    }
})(window, document);
