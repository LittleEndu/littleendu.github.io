// ==UserScript==
// @name         place2022 Templating script
// @namespace    http://tampermonkey.net/
// @version      1.0.9
// @updateURL    https://littleendu.github.io/template/place2022.user.js
// @downloadURL  https://littleendu.github.io/template/place2022.user.js
// @description  try to take over the canvas! Original version by oralekin, LittleEndu, ekgame, Wieku, DeadRote, exdeejay (xDJ_), 101arrowz
// @author       LittleEndu
// @match        https://hot-potato.reddit.com/embed*
// @match        https://new.reddit.com/r/place*
// @require      https://littleendu.github.io/template/template.manager.user.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==
// noinspection CssInvalidHtmlTagReference,DuplicatedCode

console.log("place2022.user.js loaded")

window.addEventListener('load', () => {
    console.log("onload")
    if (window.top !== window.self) {
        let intervalId = null;
        // inside the hot-potato iframe
        let gotUrlParams = false;
        window.addEventListener('message', ev => {
            if (intervalId) {
                clearInterval(intervalId);
            }
            if (gotUrlParams) return;
            if (ev.data.type === 'loadTemplates') {
                console.log(gotUrlParams ? 'templates should already be loaded' : 'loading templates');
                gotUrlParams = true;
                const params = ev.data.urlParams;
                if (params.template) {
                    const camera = document.querySelector("mona-lisa-embed").shadowRoot.querySelector("mona-lisa-camera");
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
                    let forceNth = false
                    window.addEventListener('keydown', ev => {
                        if (ev.key === 'x') {
                            forceNth = !forceNth;
                            for (let template of templates) {
                                template.forceNth = forceNth
                            }
                        } else if (ev.key === 'r') {
                            while (true) {
                                let t = templates.shift()
                                if (t === undefined) {
                                    break
                                }
                                t.destroy()
                            }
                            initTemplatesFromJsonUrl(templates, params.template, document.body, templateMountPoint)
                        }
                    })
                }
            }
        })

        // ask the top window for url params
        intervalId = window.setInterval(() => window.top.postMessage({type: 'loadTemplates'}, '*'), 5000);

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

        sendParams()
    }
})