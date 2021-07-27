function initListeners() {
    document.getElementsByClassName("simplify-spotify-minimize")[0].addEventListener("click", function () {
        element = document.getElementsByClassName('simplify-spotify')[0], element.className.includes(' minimized') ? element.className = element.className.replace(' minimized', '') : element.className += ' minimized';
    })
    document.getElementById("skip-back").addEventListener("click", function () {
        spotifyApi.skipToPrevious()
    })
    document.getElementById("js-status-play-pause").addEventListener("click", function () {
        document.getElementById('js-status-play-pause').className.includes('paused') ? spotifyApi.play() : spotifyApi.pause();
    })
    document.getElementById("skip-forward").addEventListener("click", function () {
        spotifyApi.skipToNext()
    })
    document.getElementsByClassName("progress-duration")[0].addEventListener("click", function () {
        spotifyApi.getMyCurrentPlaybackState().then(response => spotifyApi.seek(response.progress_ms + 15000));
    })
    document.getElementsByClassName("progress-time")[0].addEventListener("click", function () {
        spotifyApi.getMyCurrentPlaybackState().then(response => spotifyApi.seek(response.progress_ms - 15000));
    })
}