// ==UserScript==
// @name         Template Manager
// @namespace    http://tampermonkey.net/
// @version      1.5
// @updateUrl    https://littleendu.github.io/template/template.manager.user.js
// @downloadUrl  https://littleendu.github.io/template/template.manager.user.js
// @description  Main script that manages the templates for other scripts
// @author       LittleEndu
// @grant        GM_xmlhttpRequest
// ==/UserScript==

function currentSeconds() {
    return Date.now() / 1000;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const SECONDS_SPENT_BLINKING = 5;
const AMOUNT_OF_BLINKING = 15;

class Template {
    constructor(source, priority, loaderMountPoint, templateMountPoint,
                x, y, frameWidth, frameHeight,
                frameCount = null, frameRate = null, startTime = null) {
        // save params
        this.source = source;
        this.priority = priority;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.frameCount = frameCount || 1;
        this.frameRate = frameRate || 1;
        this.startTime = startTime || 0;
        this.lastFrame = -1;
        this.randomness = Math.floor(Math.random() * 4);
        this.blinkingInterval = null;
        this.isCurrentlyNth = true;
        this.shouldNth = false;
        this.secondsSpentNthd = (frameRate - SECONDS_SPENT_BLINKING) / 2
        this.forceNth = false;

        // create element to hold the image
        this.imageLoader = document.createElement('img');
        this.imageLoader.onload = () => {
            this.frameWidth = this.frameWidth || this.imageLoader.naturalWidth;
            this.frameHeight = this.frameHeight || this.imageLoader.naturalHeight;
            this.atlasSize = Math.round(this.imageLoader.naturalWidth / this.frameWidth);

            // create element to hold the template
            this.templateElement = document.createElement('img');
            this.templateElement.style = `
                position: absolute;
                top: ${y}px;
                left: ${x}px;
                width: ${this.frameWidth}px;
                height: ${this.frameHeight}px;
                pointer-events: none;
                image-rendering: pixelated;
            `;
            this.templateElement.priority = priority;
            // mount template element to the template mount point according to the priority
            // get all template elements and sort them by priority
            let templateElements = templateMountPoint.children;
            let templateElementsArray = Array.from(templateElements);
            // remove from array any element where priority is undefined
            templateElementsArray = templateElementsArray.filter(element => element.priority !== undefined);
            // if there are no elements with priority, just append the template element to the template mount point
            if (templateElementsArray.length === 0) {
                templateMountPoint.appendChild(this.templateElement);
            } else {
                // add the new template element to the array
                templateElementsArray.push(this.templateElement);
                // sort the array by priority
                templateElementsArray.sort((a, b) => b.priority - a.priority);
                // find the index of the new template element in the sorted array
                let index = templateElementsArray.findIndex(element => element === this.templateElement);
                // insert the new template element at the index
                if (index === templateElementsArray.length - 1) {
                    templateMountPoint.appendChild(this.templateElement);
                } else {
                    templateMountPoint.insertBefore(this.templateElement, templateElementsArray[index + 1]);
                }
            }
        }
        this.imageLoader.style = `
            position: absolute; 
            top: 0; 
            left: 0; 
            width: 1px; 
            height: 1px; 
            opacity: ${Number.MIN_VALUE}; 
            pointer-events: none;
        `;
        this.imageLoader.crossOrigin = 'Anonymous';
        this.imageLoader.src = source;
        loaderMountPoint.appendChild(this.imageLoader) // firefox would otherwise not load the image
    }

    update() {
        if (this.imageLoader === undefined || !this.imageLoader.complete || this.imageLoader.naturalWidth === 0) {
            return;
        }

        let currentFrameIndex = Math.floor((currentSeconds() - this.startTime) / this.frameRate);
        let currentFrame = (currentFrameIndex % this.frameCount + this.frameCount) % this.frameCount;

        let blinkingFrameIndex = Math.floor((currentSeconds() + SECONDS_SPENT_BLINKING - this.startTime) / this.frameRate)
        let blinkingFrame = (blinkingFrameIndex % this.frameCount + this.frameCount) % this.frameCount;

        let nthFrameIndex = Math.floor((currentSeconds() + this.secondsSpentNthd + SECONDS_SPENT_BLINKING - this.startTime) / this.frameRate)
        let nthFrame = (nthFrameIndex % this.frameCount + this.frameCount) % this.frameCount;
        this.shouldNth = (this.frameRate >= 30 ? currentFrame === nthFrame : false) || this.forceNth;

        if (this.frameRate >= 30 && !this.blinkingInterval && blinkingFrame !== currentFrame) {
            this.startBlinking()
        }

        if (currentFrame !== this.lastFrame || this.isCurrentlyNth !== this.shouldNth) {
            let scaledCanvas = document.createElement('canvas');
            scaledCanvas.width = this.frameWidth;
            scaledCanvas.height = this.frameHeight;
            let scaledContext = scaledCanvas.getContext('2d');
            if (this.frameCount !== null || this.frameWidth === this.imageLoader.naturalWidth && this.frameHeight === this.imageLoader.naturalHeight) {
                // animated template or 1:1 template (so nothing to scale)
                let frameX = currentFrame % this.atlasSize;
                let frameY = Math.floor(currentFrame / this.atlasSize);

                // draw the frame
                scaledContext.drawImage(
                    this.imageLoader,
                    frameX * this.frameWidth, frameY * this.frameHeight,
                    this.frameWidth, this.frameHeight,
                    0, 0,
                    this.frameWidth, this.frameHeight
                )
            } else {
                // non-animated template that needs to be scaled
                scaledContext.drawImage(
                    this.imageLoader,
                    0, 0,
                    this.imageLoader.naturalWidth, this.imageLoader.naturalHeight,
                    0, 0,
                    this.frameWidth, this.frameHeight
                )
            }
            // our website should help putting an already scaled image into an atlas so
            // animated templates that need to be scaled can not exist

            // dither the image in scaledCanvas
            let data = scaledContext.getImageData(0, 0, this.frameWidth, this.frameHeight)
            let ditheredData = new ImageData(this.frameWidth * 3, this.frameHeight * 3)
            for (let y = 0; y < this.frameHeight; y++) {
                for (let x = 0; x < this.frameWidth; x++) {
                    if (this.shouldNth && (x + y * 2 + this.randomness) % 4 !== 0) {
                        continue
                    }
                    let index = (y * this.frameWidth + x) * 4
                    let middlePixelIndex = ((y * 3 + 1) * ditheredData.width + x * 3 + 1) * 4;
                    ditheredData.data[middlePixelIndex] = data.data[index];
                    ditheredData.data[middlePixelIndex + 1] = data.data[index + 1];
                    ditheredData.data[middlePixelIndex + 2] = data.data[index + 2];
                    ditheredData.data[middlePixelIndex + 3] = data.data[index + 3];
                }
            }

            // convert to data url and set the image
            let ditheredCanvas = document.createElement('canvas')
            ditheredCanvas.width = ditheredData.width
            ditheredCanvas.height = ditheredData.height
            let ditheredContext = ditheredCanvas.getContext('2d')
            ditheredContext.putImageData(ditheredData, 0, 0)
            this.templateElement.src = ditheredCanvas.toDataURL()
            // reset blinking here
            if (this.lastFrame !== currentFrame) {
                if (this.blinkingInterval) {
                    clearInterval(this.blinkingInterval)
                    this.blinkingInterval = null
                }
                this.templateElement.style.opacity = Number.MIN_VALUE.toString()
                setTimeout(() => {
                    this.templateElement.style.opacity = '1'
                }, SECONDS_SPENT_BLINKING / AMOUNT_OF_BLINKING * 1000)
            }
            if (this.frameRate > 30) {
                console.log(`updated ${this.source} to frame ${currentFrame}/${this.frameCount}`)
            }

            this.isCurrentlyNth = this.shouldNth
            this.lastFrame = currentFrame;
        }
    }

    startBlinking() {
        if (this.blinkingInterval) {
            clearInterval(this.blinkingInterval)
            this.templateElement.style.opacity = '1'
        }
        this.blinkingInterval = setInterval(() => {
            let currentOpacity = this.templateElement.style.opacity
            this.templateElement.style.opacity = Number.parseFloat(currentOpacity) !== 1 ? '1' : Number.MIN_VALUE.toString()
        }, SECONDS_SPENT_BLINKING / AMOUNT_OF_BLINKING * 1000)
    }
}

function initTemplatesFromJsonUrl(templates, url, loaderMountPoint, templateMountPoint,
                                  priority = 0, depth = 0, alreadyLoaded = []) {
    if (depth > 10 || templates.length > 100) {
        return
    }
    let _url = new URL(url);
    let uniqueString = `${_url.origin}${_url.pathname}`
    if (alreadyLoaded.includes(uniqueString)) {
        return
    }
    alreadyLoaded.push(uniqueString)
    console.log(`loading ${uniqueString}`)
    // do some cache busting
    _url.searchParams.append((Math.random() + 1).toString(36).substring(7), Date.now().toString(36));

    // HACKY IMPLEMENTATION OF BREATH FIRST SEARCH
    // this works because xmlHttpRequest happens in parallel (template adding is triggered in onload)
    // must use GM_xmlhttpRequest to bypass CORS
    GM_xmlhttpRequest({
        method: 'GET',
        url: _url.href,
        onload: function (response) {
            let json = JSON.parse(response.responseText);
            // load our templates
            for (let template of json.templates || []) {
                let t = new Template(
                    template.url,
                    priority++,
                    loaderMountPoint,
                    templateMountPoint,
                    template.x, template.y,
                    template.frameWidth, template.frameHeight,
                    template.frameCount,
                    template.frameRate,
                    template.startTime
                );
                templates.push(t);
            }
            // load templates from other json files
            for (let child of json.children || []) {
                initTemplatesFromJsonUrl(templates, child.url, loaderMountPoint, templateMountPoint, priority, depth + 1, alreadyLoaded);
            }
        }
    })
}