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
getScript("https://spotify-player.herokuapp.com/spotify-player.js")
getScript("https://sander.vonk.productions/simplify-spotify/src/spotify-web-api.js")

chrome.runtime.sendMessage("run_auth_flow");
console.log("sent message")
