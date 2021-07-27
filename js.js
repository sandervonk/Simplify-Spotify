//https://accounts.spotify.com/authorize?response_type=token&redirect_uri=https:%2F%2Fsander.vonk.productions%2Fsimplify-spotify%2Fplayer.html&client_id=fc6786adda404b36a1f67a106913dd6f&scope=user-read-recently-played", "user-read-playback-position", "user-read-playback-state", "user-modify-playback-state", "user-read-currently-playing", "playlist-read-private", "playlist-read-collaborative", "user-library-read
//response type
response_type = "response_type=" + "token"
//response uri
redirect_url = "https://sander.vonk.productions/simplify-spotify/player.html"
redirect_uri = "redirect_uri=" + encodeURIComponent(redirect_url)
//scope
scopeList = ["user-read-recently-played", "user-read-playback-position", "user-read-playback-state", "user-modify-playback-state", "user-read-currently-playing", "playlist-read-private", "playlist-read-collaborative user-library-read"]
scope = "scope=" + encodeURIComponent(scopeList.join(' '))
client_id = "client_id=" + "fc6786adda404b36a1f67a106913dd6f"
requestURL = "https://accounts.spotify.com/authorize?" + [response_type, redirect_uri, scope, client_id].join("&")

function pad2(number) {

    return (number < 10 ? '0' : '') + number

}
//placeholder:
needs_refresh = false
/*
*/
var mainContainer = document.getElementById('js-main-container'),
    loginContainer = document.getElementById('js-login-container'),
    loginButton = document.getElementById('js-btn-login'),
    background = document.getElementById('js-background');

var spotifyPlayer = new SpotifyPlayer();
var spotifyApi = new SpotifyWebApi();
spotifyApi.setAccessToken(localStorage["simplify-token"])
if (window.location.href.includes("#access_token=")) {
    token = window.location.href.split("#access_token=")[window.location.href.split("#access_token=").length - 1].split("&")[0]
    localStorage["simplify-token"] = token
    spotifyApi.setAccessToken(token)
} else if (spotifyApi.getAccessToken().length != 186 || needs_refresh) {
    window.location.href = requestURL
}

var template = function (data) {
    return `
    <div class="main-wrapper">
    <img class="playlist-icon" src="img/playlist.svg">
      <div class="now-playing__img">
        <img src="${data.item.album.images[0].url}">
      </div>
      <div class="now-playing__side">
        <div class="now-playing__name">${data.item.name}</div>
        <div class="now-playing__artist">${data.item.artists[0].name}</div>
      </div>
      <div class="now-playing__controls">
        <div class="controls-center">
            <div id="skip-back" class="skip-btn" onclick="spotifyApi.skipToPrevious()">&#9664;</div>
            <div id="js-status-play-pause" class="now-playing__status ${data.is_playing ? 'playing' : 'paused'}">${data.is_playing ? '&#9612;&#9612;' : '&#9654;'}</div>
            <div id="skip-forward" class="skip-btn" onclick="spotifyApi.skipToNext()">&#9654;</div>
        </div>
        <div class="progress-container">
            <div class="progress-time">${Math.floor((data.progress_ms / 1000 / 60) << 0) + ':' + pad2(Math.floor((data.progress_ms / 1000) % 60))}</div>
                <div class="progress">
                    <div class="progress__bar" style="width:${data.progress_ms * 100 / data.item.duration_ms}%"></div>
                 </div>
            <div class="progress-duration">${Math.floor((data.item.duration_ms / 1000 / 60) << 0) + ':' + pad2(Math.floor((data.item.duration_ms / 1000) % 60))}</div>
        </div>
        </div>
    </div>
    </div>
    <div class="background-parent"><div class="background" style="background-image:url(${data.item.album.images[0].url})"></div></div>
  `;
};
lastImg = ""
lastProgress = 0
lastStatus = false
spotifyPlayer.on('update', response => {
    if (response.item.album.images[0].url != lastImg) {
        mainContainer.innerHTML = template(response);
        lastImg = response.item.album.images[0].url
    } else if (response.progress_ms != lastProgress) {
        //update progress
        document.getElementsByClassName("progress__bar")[0].style.width = `${response.progress_ms * 100 / response.item.duration_ms}%`
        document.getElementsByClassName("progress-time")[0].textContent = Math.floor((response.progress_ms / 1000 / 60) << 0) + ':' + pad2(Math.floor((response.progress_ms / 1000) % 60))
    }
    if (!(response.is_playing === lastStatus)) {
        mainContainer.innerHTML = template(response);
        document.getElementsByClassName("now-playing__status")[0].className = `now-playing__status ${response.is_playing ? 'playing' : 'paused'}`
        document.getElementsByClassName("now-playing__status")[0].innerHTML = `${response.is_playing ? '&#9612;&#9612;' : '&#9654;'}`
        lastStatus = response.is_playing
        console.log("different play state")
    }
    document.getElementById('js-status-play-pause').addEventListener('click', () => {
        if (document.getElementById('js-status-play-pause').className.includes("paused")) {
            spotifyApi.play()
        } else {
            spotifyApi.pause()
        }
    })

});

spotifyPlayer.on('login', user => {
    if (user === null) {
        loginContainer.style.display = 'block';
        mainContainer.style.display = 'none';
    } else {
        loginContainer.style.display = 'none';
        mainContainer.style.display = 'block';
    }

});
loginButton.addEventListener('click', () => {
    spotifyPlayer.login();
    window.location.href = requestURL
});


spotifyPlayer.init();
