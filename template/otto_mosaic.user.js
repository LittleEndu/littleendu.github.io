// ==UserScript==
// @name         Templating script for the mosaic site by Ottomated
// @namespace    http://tampermonkey.net/
// @version      1.0.4
// @updateURL    https://littleendu.github.io/template/otto_mosaic.user.js
// @description  try to take over the canvas!
// @author       LittleEndu
// @match        https://mosaic.ludwig.gg/*
// @require      https://littleendu.github.io/template/template.manager.user.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==

window.addEventListener('load', () => {
    console.log('running Templating script');
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    if (params.template) {
        console.log('loading template', params.template);
        let templates = []
        initTemplatesFromJsonUrl(templates, params.template, document.body, document.querySelector('canvas').parentNode)
        setInterval(() => {
            for (let template of templates) {
                template.update();
            }
        }, 500);
    }
})