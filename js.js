var mainContainer = document.getElementById('js-main-container'),
    loginContainer = document.getElementById('js-login-container'),
    loginButton = document.getElementById('js-btn-login'),
    background = document.getElementById('js-background');

var spotifyPlayer = new SpotifyPlayer();

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
            <div id="skip-back" class="skip-btn"><b>|</b>&#9664;</div>
            <div class="now-playing__status ${data.is_playing ? 'playing' : 'paused'}">${data.is_playing ? '&#9612;&#9612;' : '&#9654;'}</div>
            <div id="skip-forward" class="skip-btn">&#9654;<b>|</b></div>
        </div>
        <div class="progress">
            <div class="progress__bar" style="width:${data.progress_ms * 100 / data.item.duration_ms}%"></div>
        </div>
      </div>
    </div>
    <div class="background-parent"><div class="background" style="background-image:url(${data.item.album.images[0].url})"></div></div>
  `;
};
lastImg = ""
lastProgress = 0
spotifyPlayer.on('update', response => {
    if (response.item.album.images[0].url != lastImg) {
        mainContainer.innerHTML = template(response);
        lastImg = response.item.album.images[0].url
    } else if (response.progress_ms != lastProgress) {
        document.getElementsByClassName("progress__bar")[0].style.width = `${response.progress_ms * 100 / response.item.duration_ms}%`
    }


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
});

spotifyPlayer.init();
