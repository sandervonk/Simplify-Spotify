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



chrome.storage.sync.get({ "token_date": "", "token": "" }, function (response) {
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
        setTimeout(function () {
            window.location.reload()
        }, 1000)
    }
    else {
        console.log("using current token:")
        console.log({ "token": response.token, "token_date": new Date(response.token_date) })
        setTimeout(function () {
            spotifyApi = new SpotifyWebApi();
            spotifyPlayer = new SpotifyPlayer();
            initAddElement(response.token)
        }, 0)

    }

});


function initAddElement(token) {
    if (document.getElementsByClassName("simplify-prevent-scroll").length === 0) {
        document.body.innerHTML += `<div class=simplify-prevent-scroll><div class=simplify-spotify><div class=simplify-spotify-minimize onclick='element=document.getElementsByClassName("simplify-spotify")[0],element.className.includes(" minimized")?element.className=element.className.replace(" minimized",""):element.className+=" minimized"'>🗕︎</div><div class=simplify-container><div class="hidden login-container"id=js-login-container><button class="btn btn--login"id=js-btn-login>Login with Spotify</button></div><div class="hidden main-container"id=js-main-container></div></div></div></div>`
    }
    setTimeout(function () {
        spotifyPlayer.accessToken = token
        function pad2(number) {
            return (number < 10 ? '0' : '') + number
        }

        var mainContainer = document.getElementById('js-main-container'),
            loginContainer = document.getElementById('js-login-container'),
            loginButton = document.getElementById('js-btn-login'),
            topContainer = document.getElementById('js-top-container'),
            background = document.getElementById('js-background');

        spotifyApi.setAccessToken(token)
        //retain playlist or media icon for current page

        var template = function (data) {
            return `
        <div class="main-wrapper">
          <div class="now-playing__img">
            <img src="${currentImg}">
          </div>
          <div class="now-playing__side">
            <div class="now-playing__name">${data.item.name}</div>
            <div class="now-playing__artist">${data.item.artists[0].name}</div>
          </div>
          <div class="now-playing__controls">
            <div class="controls-center">
                <div id="skip-back" class="skip-btn" >&#9664;</div>
                <div id="js-status-play-pause"  class="now-playing__status ${data.is_playing ? 'playing' : 'paused'}">${data.is_playing ? '&#9612;&#9612;' : '&#9654;'}</div>
                <div id="skip-forward" class="skip-btn" >&#9654;</div>
            </div>
            <div class="progress-container">
                <div class="progress-time" >${Math.floor((data.progress_ms / 1000 / 60) << 0) + ':' + pad2(Math.floor((data.progress_ms / 1000) % 60))}</div>
                    <div class="progress">
                        <div class="progress__bar" style="width:${data.progress_ms * 100 / data.item.duration_ms}%"></div>
                     </div>
                <div class="progress-duration" >${Math.floor((data.item.duration_ms / 1000 / 60) << 0) + ':' + pad2(Math.floor((data.item.duration_ms / 1000) % 60))}</div>
            </div>
            </div>
        </div>
        </div>
        <div class="background-parent"><div class="background" style="background-image:url(${currentImg})"></div></div>
      `;
        };
        lastImg = ""
        lastProgress = 0
        lastStatus = false
        spotifyPlayer.on('update', response => {
            //fix for crash on custom songs:
            try {
                currentImg = response.item.album.images[0].url
            } catch {
                currentImg = "img/playlistNoImg.jpg"
            }
            if (currentImg != lastImg) {

                mainContainer.innerHTML = template(response);
                setTimeout(initListeners, 200)
                lastImg = currentImg
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
                topContainer.style.display = 'none';
            } else {
                loginContainer.style.display = 'none';
                topContainer.style.display = 'block';
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
