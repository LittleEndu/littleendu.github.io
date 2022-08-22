// ==UserScript==
// @name         Templating script for any canvas
// @namespace    http://tampermonkey.net/
// @version      1.1
// @updateURL    https://littleendu.github.io/template/any.canvas.user.js
// @downloadURL  https://littleendu.github.io/template/any.canvas.user.js
// @description  try to take over the canvas! but only if the site is using a 1:1 html canvas
// @author       LittleEndu
// @match        http*://*/*
// @require      https://littleendu.github.io/template/template.manager.user.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==


let canvas;
let urlParamsFound = false;
let templateUrl;

function findCanvas(element) {
    if (element.tagName === 'CANVAS') {
        console.log('found canvas', element, window.location.href);
        canvas = element;
    }

    // find Shadow DOM elements
    if (element.shadowRoot) {
        findCanvas(element.shadowRoot);
    }
    // find children
    for (let child of element.children) {
        findCanvas(child);
    }
}


// try to find canvas regardless of whether the code is running in iframe or not
findCanvas(document.body);

if (window.top !== window.self) {
    // iframe portion of the script
    window.addEventListener('message', ev => {
        if (ev.data.type === 'loadTemplates') {
            console.log("got url params from window.top", ev.data.urlParams);
            templateUrl = ev.data.urlParams.template;
            urlParamsFound = true;
        }
    })

    window.top.postMessage({type: 'loadTemplates'}, '*');
} else {
    // window.top portion of the script
    const sendParams = () => {
        const urlSearchParams = new URLSearchParams(window.location.search);
        const params = Object.fromEntries(urlSearchParams.entries());
        templateUrl = params.template;
        urlParamsFound = true;
        for (let iframe of document.querySelectorAll('iframe')) {
            iframe.contentWindow.postMessage({type: 'loadTemplates', urlParams: params}, '*');
        }
    }

    window.addEventListener('message', ev => {
        if (ev.data.type === 'loadTemplates') {
            console.log("iframe requesting templates");
            sendParams()
        }
    })
    window.addEventListener('load', () => {
        sendParams()
    })
    sendParams()
}


const initializer = setInterval(() => {
    if (canvas && urlParamsFound) {
        clearInterval(initializer);
        console.log("canvas and url params found");
        if (templateUrl) {
            console.log('loading template from url parameter', templateUrl);
            let templates = []
            initTemplatesFromJsonUrl(templates, templateUrl, document.body, canvas.parentNode)
            setInterval(() => {
                for (let template of templates) {
                    template.update();
                    template.templateElement.style.background = 'none'
                }
            }, 500);
            let forceNth = false;
            window.addEventListener('keydown', ev => {
                if (['KeyX', 'KeyE', 'KeyF'].includes(ev.code)) {
                    forceNth = !forceNth;
                    for (let template of templates) {
                        template.forceNth = forceNth
                    }
                } else if (ev.code === 'KeyR') {
                    while (true) {
                        let t = templates.shift()
                        if (t === undefined) {
                            break
                        }
                        t.destroy()
                    }
                    initTemplatesFromJsonUrl(templates, templateUrl, document.body, canvas.parentNode)
                }
            })
        }
    }
}, 1000)