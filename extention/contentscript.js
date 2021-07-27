//just add these two lines to your html <head>:
//<script src="spotify-playlist.js"></script>
//<link rel="stylesheet" href="spotify-playlist.css"/>
//use this to make the popup start *not* minimized:
//document.getElementById("spotify-playlist").className = ""
//use this to set the playlist despite user's prefrences from last session:
//localstorage["spotify-playlist"] = "https://open.spotify.com/embed/playlist/YourPlaylistID"

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
getScript("https://sander.vonk.productions/spotify-playlist/spotify-playlist.js")

