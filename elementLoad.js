/*const nav = document.querySelector('.topbar')
fetch('../elements/topbar.html')
.then(res=>res.text())
.then(data=>{
    nav.innerHTML=data

    const parser = new DOMParser()
    const doc = parser.parseFromString(data, 'text/html')
    eval(doc.querySelector('script').textContent)
})*/

function loadHTMLIntoElement(className, htmlPath, options = {}) {
    const element = document.querySelector(`.${className}`);
    if (!element) {
        console.error(`Element with class "${className}" not found.`);
        return;
    }

    fetch(htmlPath)
        .then(res => {
            if (!res.ok) throw new Error(`Failed to load ${htmlPath}: ${res.statusText}`);
            return res.text();
        })
        .then(data => {
            element.innerHTML = data;

            if (options.audio) {
                updateAudioPlayer(element, options.audio);
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(data, 'text/html');
            const scriptTag = doc.querySelector('script');

            if (scriptTag && scriptTag.textContent.trim()) {
                try {
                    eval(scriptTag.textContent);
                } catch (err) {
                    console.error(`Error executing script in ${htmlPath}:`, err);
                }
            }
        })
        .catch(err => console.error(err));
}

function updateAudioPlayer(container, audioOptions) {
    const trackInfo = container.querySelector('#track-info');
    const audio = container.querySelector('#music');
    const source = container.querySelector('#music-source');

    if (!trackInfo || !audio || !source) {
        console.warn('Audio player elements not found.');
        return;
    }

    const { artist, trackName, gameTitle, src, volume } = audioOptions;
    const gameText = gameTitle ? ` | ${gameTitle}` : '';

    // Update text info
    trackInfo.innerHTML = `${artist} - <i>"${trackName}"</i>${gameText}`;

    // Update audio source safely
    if (src) {
        source.src = src;
        audio.load();
    }

    // Apply volume after the element can actually play
    const safeVolume =
        typeof volume === 'number' && volume >= 0 && volume <= 1 ? volume : 0.5;

    // Wait until metadata or play event to apply volume
    const applyVolume = () => {
        audio.volume = safeVolume;
        // Remove event listeners after applying
        audio.removeEventListener('loadedmetadata', applyVolume);
        audio.removeEventListener('play', applyVolume);
    };

    // In case it's not yet loaded
    audio.addEventListener('loadedmetadata', applyVolume);
    audio.addEventListener('play', applyVolume);

    // If it’s already ready, apply immediately too
    if (audio.readyState >= 1) {
        audio.volume = safeVolume;
    }
}


