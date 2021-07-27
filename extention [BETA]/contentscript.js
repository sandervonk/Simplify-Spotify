var spotifyApi;
var spotifyPlayer;

function getScript(source, callback) {
    var script = document.createElement('script');
    var prior = document.getElementsByTagName('script')[0];
    script.async = 1;

    script.onload = script.onreadystatechange = function (_, isAbort) {
        if (isAbort || !script.readyState || /loaded|complete/.test(script.readyState)) {
            script.onload = script.onreadystatechange = null;
            script = undefined;

            if (!isAbort && callback) setTimeout(callback, 0);
        }
    };

    script.src = source;
    prior.parentNode.insertBefore(script, prior);
}

getScript("https://cdn.polyfill.io/v2/polyfill.min.js?features=fetch")

chrome.storage.sync.get(["token_date", "token"], function (response) {
    console.log("value retreived")
    console.log(response)
    needNewToken = false
    create = new Date(response.token_date)
    now = new Date()
    console.log("time since: ", (now.getTime() - create.getTime()) / 1000, "s")

    //refresh every half hour
    if ((now.getTime() - create.getTime()) / 1000 >= 1800) {
        needNewToken = true
    }
    if (needNewToken || response.token.length != 186) {
        console.log("getting new token")
        chrome.runtime.sendMessage({ "action": 'run_auth_flow' });
        console.log("sent message")
    }
    else {
        console.log("using current token:")
        console.log({ "token": response.token, "token_date": new Date(response.token_date) })
        setTimeout(function () {
            spotifyApi = new SpotifyWebApi();
            spotifyPlayer = new SpotifyPlayer();
            initAddElement(response.token)
        }, 200)

    }

});


function initAddElement(token) {
    document.body.innerHTML += `<div class=simplify-prevent-scroll><div class=simplify-spotify><div class=simplify-spotify-minimize onclick='element=document.getElementsByClassName("simplify-spotify")[0],element.className.includes(" minimized")?element.className=element.className.replace(" minimized",""):element.className+=" minimized"'>🗕︎</div><div class=simplify-container><div class="hidden login-container"id=js-login-container><button class="btn btn--login"id=js-btn-login>Login with Spotify</button></div><div class="hidden main-container"id=js-main-container></div></div></div></div>`
    setTimeout(function () {

        function pad2(number) {
            return (number < 10 ? '0' : '') + number
        }

        var mainContainer = document.getElementById('js-main-container'),
            loginContainer = document.getElementById('js-login-container'),
            loginButton = document.getElementById('js-btn-login'),
            background = document.getElementById('js-background');

        spotifyApi.setAccessToken(token)


        var template = function (data) {
            return `
        <div class="main-wrapper">
        <img class="playlist-icon" src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgNDQ4LjEzOCA0NDguMTM4IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA0NDguMTM4IDQ0OC4xMzg7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxwYXRoIGQ9Ik00MzYuNzY4LDE1MS44NDVjLTEzLjE1Mi0yNi45NzYtMzUuNzQ0LTQyLjA4LTU3LjYtNTYuNzA0QzM2Mi44OCw4NC4yMjksMzQ3LjUyLDczLjkyNSwzMzYuNjQsNTkuMTczbC0yLjAxNi0yLjcyDQoJYy02LjQtOC42MDgtMTMuNjk2LTE4LjM2OC0xNC44MTYtMjYuNTZjLTEuMTItOC4yODgtNy42NDgtMTQuMDQ4LTE2LjkyOC0xMy43OTJDMjk0LjQ5NiwxNi42NzcsMjg4LDIzLjY1MywyODgsMzIuMDY5djI4NS4xMg0KCWMtMTMuNDA4LTguMTI4LTI5LjkyLTEzLjEyLTQ4LTEzLjEyYy00NC4wOTYsMC04MCwyOC43MDQtODAsNjRzMzUuOTA0LDY0LDgwLDY0YzQ0LjEyOCwwLDgwLTI4LjcwNCw4MC02NFYxODEuNTczDQoJYzI0LjAzMiw5LjE4NCw2My4zNiwzMi41NzYsNzQuMTc2LDg3LjJjLTIuMDE2LDIuOTc2LTMuOTM2LDYuMjA4LTYuMTc2LDguNzM2Yy01Ljg1Niw2LjYyNC01LjE4NCwxNi43MzYsMS40NCwyMi41Ng0KCWM2LjU5Miw1Ljg4OCwxNi43MDQsNS4xODQsMjIuNTYtMS40NGMyMC4wMzItMjIuNzUyLDMzLjgyNC01OC43ODQsMzUuOTY4LTk0LjAxNkM0NDkuMDI0LDE4Ny4yMzcsNDQ1LjE1MiwxNjguOTk3LDQzNi43NjgsMTUxLjg0NXoNCgkiLz4NCjxwYXRoIGQ9Ik0xNiw0OC4wNjloMTkyYzguODMyLDAsMTYtNy4xNjgsMTYtMTZzLTcuMTY4LTE2LTE2LTE2SDE2Yy04LjgzMiwwLTE2LDcuMTY4LTE2LDE2UzcuMTY4LDQ4LjA2OSwxNiw0OC4wNjl6Ii8+DQo8cGF0aCBkPSJNMTYsMTQ0LjA2OWgxOTJjOC44MzIsMCwxNi03LjE2OCwxNi0xNnMtNy4xNjgtMTYtMTYtMTZIMTZjLTguODMyLDAtMTYsNy4xNjgtMTYsMTZTNy4xNjgsMTQ0LjA2OSwxNiwxNDQuMDY5eiIvPg0KPHBhdGggZD0iTTExMiwyMDguMDY5SDE2Yy04LjgzMiwwLTE2LDcuMTY4LTE2LDE2czcuMTY4LDE2LDE2LDE2aDk2YzguODMyLDAsMTYtNy4xNjgsMTYtMTZTMTIwLjgzMiwyMDguMDY5LDExMiwyMDguMDY5eiIvPg0KPHBhdGggZD0iTTExMiwzMDQuMDY5SDE2Yy04LjgzMiwwLTE2LDcuMTY4LTE2LDE2czcuMTY4LDE2LDE2LDE2aDk2YzguODMyLDAsMTYtNy4xNjgsMTYtMTZTMTIwLjgzMiwzMDQuMDY5LDExMiwzMDQuMDY5eiIvPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPC9zdmc+DQo=">
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
                <div id="js-status-play-pause" onclick="document.getElementById('js-status-play-pause').className.includes('paused')?spotifyApi.play():spotifyApi.pause();" class="now-playing__status ${data.is_playing ? 'playing' : 'paused'}">${data.is_playing ? '&#9612;&#9612;' : '&#9654;'}</div>
                <div id="skip-forward" class="skip-btn" onclick="spotifyApi.skipToNext()">&#9654;</div>
            </div>
            <div class="progress-container">
                <div class="progress-time" onclick="spotifyApi.getMyCurrentPlaybackState().then(response => spotifyApi.seek(response.progress_ms - 15000));">${Math.floor((data.progress_ms / 1000 / 60) << 0) + ':' + pad2(Math.floor((data.progress_ms / 1000) % 60))}</div>
                    <div class="progress">
                        <div class="progress__bar" style="width:${data.progress_ms * 100 / data.item.duration_ms}%"></div>
                     </div>
                <div class="progress-duration" onclick="spotifyApi.getMyCurrentPlaybackState().then(response => spotifyApi.seek(response.progress_ms + 15000));">${Math.floor((data.item.duration_ms / 1000 / 60) << 0) + ':' + pad2(Math.floor((data.item.duration_ms / 1000) % 60))}</div>
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
                try {
                    document.getElementsByClassName("now-playing__status")[0].className = `now-playing__status ${response.is_playing ? 'playing' : 'paused'}`
                    document.getElementsByClassName("now-playing__status")[0].innerHTML = `${response.is_playing ? '&#9612;&#9612;' : '&#9654;'}`
                    lastStatus = response.is_playing
                } catch { console.log("failed to get elements by classname") }
                console.log("different play state")
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
            spotifyPlayer.accessToken = token
            spotifyPlayer.login();
        });


        spotifyPlayer.init();


    }, 300)

    //future ref:
    //document.body.outerHTML = document.body.outerHTML.split("</body>")[0] + `<div class=simplify-prevent-scroll><div class=simplify-spotify><div class=simplify-spotify-minimize onclick='element=document.getElementsByClassName("simplify-spotify")[0],element.className.includes(" minimized")?element.className=element.className.replace(" minimized",""):element.className+=" minimized"'>🗕︎</div><div class=container><div class="hidden login-container"id=js-login-container><button class="btn btn--login"id=js-btn-login>Login with Spotify</button></div><div class="hidden main-container"id=js-main-container></div></div></div></div>` + "</body>" + document.body.outerHTML.split("</body>")[1]
}
