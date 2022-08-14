// ==UserScript==
// @name         place2022 Templating script
// @namespace    http://tampermonkey.net/
// @version      0.8
// @description  try to take over the canvas! Original version by oralekin, LittleEndu, ekgame, Wieku, DeadRote, exdeejay (xDJ_), 101arrowz
// @author       LittleEndu
// @match        https://hot-potato.reddit.com/embed*
// @match        https://new.reddit.com/r/place*
// @match        https://reddit.com/r/place*
// @require      https://littleendu.github.io/template/template.manager.user.js
// @grant        none
// ==/UserScript==

if (window.top !== window.self) {
    // inside the hot-potato iframe
    let gotUrlParams = false;
    window.addEventListener('message', ev => {
        console.log('got message from top window', ev.data);
        if (gotUrlParams) return;
        if (ev.data.type === 'loadTemplates') {
            console.log(`loading templates, gotUrlParams=${gotUrlParams}`);
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
            }
        }
    })
    window.addEventListener('load', () => {
        // ask the top window for url params
        console.log('sending message to top window');
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
        console.log('got message from iframe', ev.data);
        if (ev.data.type === 'loadTemplates') {
            sendParams()
        }
    })
    window.addEventListener('load', () => {
        console.log('sending message to iframes');
        sendParams()
    })
}