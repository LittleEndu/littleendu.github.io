// ==UserScript==
// @name         place2022 Templating script
// @namespace    http://tampermonkey.net/
// @version      1.0.3
// @updateURL    https://littleendu.github.io/template/place2022.user.js
// @description  try to take over the canvas! Original version by oralekin, LittleEndu, ekgame, Wieku, DeadRote, exdeejay (xDJ_), 101arrowz
// @author       LittleEndu
// @match        https://hot-potato.reddit.com/embed*
// @match        https://new.reddit.com/r/place*
// @require      https://littleendu.github.io/template/template.manager.user.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==

if (window.top !== window.self) {
    // inside the hot-potato iframe
    let gotUrlParams = false;
    window.addEventListener('message', ev => {
        if (gotUrlParams) return;
        if (ev.data.type === 'loadTemplates') {
            console.log(`loading templates, gotUrlParams=${gotUrlParams}`);
            gotUrlParams = true;
            const params = ev.data.urlParams;
            if (params.template) {
                // noinspection CssInvalidHtmlTagReference
                const camera = document.querySelector("mona-lisa-embed").shadowRoot.querySelector("mona-lisa-camera");
                // noinspection CssInvalidHtmlTagReference
                const canvas = camera.querySelector("mona-lisa-canvas");
                const templateMountPoint = canvas.shadowRoot.querySelector('.container')
                console.log(templateMountPoint)

                let templates = []
                initTemplatesFromJsonUrl(templates, params.template, document.body, templateMountPoint)
                setInterval(() => {
                    for (let template of templates) {
                        template.update();
                    }
                }, 500);
            }
        }
    })
    window.addEventListener('load', () => {
        // ask the top window for url params
        window.top.postMessage({type: 'loadTemplates'}, '*');
    })
} else {
    // inside the r/place subreddit
    const sendParams = () => {
        const urlSearchParams = new URLSearchParams(window.location.search);
        const params = Object.fromEntries(urlSearchParams.entries());
        for (let iframe of document.querySelectorAll('iframe')) {
            if (iframe.src.includes('hot-potato.reddit.com/embed')) {
                iframe.contentWindow.postMessage({type: 'loadTemplates', urlParams: params}, '*');
            }
        }
    }
    window.addEventListener('message', ev => {
        if (ev.data.type === 'loadTemplates') {
            sendParams()
        }
    })
    window.addEventListener('load', () => {
        sendParams()
    })
}