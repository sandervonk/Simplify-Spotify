var lastRan = -1
var timeoutId = 0
var simplifySetting = {}
function removeItemAll(arr, value) {
    var i = 0;
    while (i < arr.length) {
        if (arr[i] === value) {
            arr.splice(i, 1);
        } else {
            ++i;
        }
    }
    return arr;
}

var playlistTemplate = function (playlist, isCustom) {
    if (arguments.length != 2) {
        isCustom = false
    }
    templateComplete = `
    <div class="simplify-playlist" id="spotify-playlist-${playlist.id}">
        <div class="simplify-playlist-img">
            <img src="${playlist.images[0].url}">
            <div class="start-parent">
                <a href="?${playlist.uri.replace('spotify:', '')}"><div class="start-button">&#9654;</div></a>    
            </div>  
        </div>
        <div class="simplify-playlist-content">
            <div class="playlist-title">${playlist.name}</div>
            <div style="${playlist.description.length > 0 ? "" : "display: none"}" class="playlist-description">"${playlist.description}"</div>
            <div class="playlist-details">${[playlist.owner.display_name, (playlist.tracks.total + " tracks"), ((playlist.public > 0 ? "public" : "private") + (playlist.collaborative > 0 ? " (collab)" : ""))].join(" <b>&centerdot;</b> ")}
            </div>
        </div>
        ${isCustom ? "<div class='remove-custom'>-</div>" : ""}
    </div>`
    return templateComplete

}

function addRemoveListener() {
    setTimeout(function () {
        for (remove_btn of document.getElementsByClassName("remove-custom")) {
            let btn_parent = remove_btn.parentElement
            let btn_playlist_id = btn_parent.id.replace("spotify-playlist-", '')
            remove_btn.addEventListener("click", function () {
                //to remove from display
                btn_parent.remove()
                //remove from variable
                simplifySetting['custom-playlists'] = removeItemAll(simplifySetting['custom-playlists'], btn_playlist_id)
                chrome.storage.sync.set(simplifySetting, function (response) {
                    console.log("changed saved playlists to version with removed playlist:")
                    console.log(simplifySetting["custom-playlists"])
                })
            })
        }
    }, 200)
}
function addCustomsListener() {
    setTimeout(function () {
        document.getElementById("addCustomButton").addEventListener("click", function () {
            let playlist_input = document.getElementById("playlist-input").value
            let playlistID = playlist_input.split("playlist:")[playlist_input.split("playlist:").length - 1]
            playlistID = playlistID.split("/playlist/")[playlist_input.split("/playlist/").length - 1]
            playlistID = playlistID.split("?")[0]
            document.getElementById("playlist-input").value = ""
            if (simplifySetting["custom-playlists"].indexOf(playlistID) === -1) {
                simplifySetting["custom-playlists"].push(playlistID)
                let customs = simplifySetting["custom-playlists"]
                chrome.storage.sync.set(simplifySetting, function (reply) {
                    console.log("saved playlists to storage")
                    console.log("saved new custom with reply:")
                    console.log(reply)
                    console.log(customs)
                    setTimeout(function () {
                        window.location.href += "?new-custom"
                    }, 100)
                })
            } else {
                console.log("playlist already added")
            }


        })
        document.getElementById("playlist-input").addEventListener("input", function () {
            let addPlaylistInputs = document.getElementsByClassName("addPlaylistInputs")[0]
            let playlist_input = document.getElementById("playlist-input").value
            let playlistID = playlist_input.split("playlist:")[playlist_input.split("playlist:").length - 1]
            playlistID = playlistID.split("/playlist/")[playlist_input.split("/playlist/").length - 1]
            playlistID = playlistID.split("?")[0]
            if (playlist_input.includes("/album/") || playlist_input.includes("album:")) {
                document.getElementById("playlist-preview").innerHTML = `<div class="centered-info">Sorry, albums are not currently supported</div>`
            } else if (playlist_input === "") {
                document.getElementById("playlist-preview").innerHTML = `<div class="centered-info">Input is empty, try adding something!</div>`
            } else {
                if (simplifySetting["custom-playlists"].indexOf(playlistID) === -1) {
                    spotifyApi.getPlaylist(playlistID).then(playlistData => {
                        console.log("got playlist for preview:")
                        console.log(playlistData)
                        console.log("created and adding element:")
                        let previewElement = playlistTemplate(playlistData)
                        console.log(previewElement)
                        document.getElementById("playlist-preview").innerHTML = previewElement
                        document.getElementById("addCustomButton").style.display = "block"
                    }).catch(error => {
                        document.getElementById("playlist-preview").innerHTML = `<div class="centered-info">Sorry, that's not a valid playlist</div>`
                        console.warn("Not a playlist, passed err", error)
                        setTimeout(function () {
                            document.getElementById("addCustomButton").style.display = "none"
                        }, 100)

                    })
                } else {
                    document.getElementById("playlist-preview").innerHTML = `<div class="centered-info"><b>Playlist Already Added</b></div>`
                }
            }


        })
    }, 500)
}
function initListeners() {
    //requisite for playlist formatter


    function createPlaylists(playlistsInput) {
        document.getElementsByTagName("html")[0].style = "width: 400px; height: 600px"
        console.log("PLAYLISTS:")
        console.log(playlistsInput)
        let playlistElements = `<div id="playlist-background" style="background-image: url(${lastImg})"></div>`
        if (playlistsInput.length > 1) {
            for (playlist of playlistsInput) {
                playlistElements += playlistTemplate(playlist)
            }
        } else {
            playlistElements += playlistTemplate(playlist)
        }

        return playlistElements
    }


    //requisite for volume things 
    var deviceTemplate = function (device) {
        console.log("template got device:")
        console.log(device)
        if (device.name.includes("Web Player")) {
            device.type = "browser"
        }
        deviceIcon = "img/devices/48/" + device.type + ".png"
        if (device.volume > 75) {
            speakerImg = "3"
        } else if (device.volume > 50) {
            speakerImg = "2"
        } else if (device.volume > 25) {
            speakerImg = "1"
        } else if (device.volume >= 1) {
            speakerImg = "0"
        } else {
            speakerImg = "Mute"
        }
        filter = (device.active ? "filter: brightness(4) sepia(1) hue-rotate(72deg) saturate(4000%) !important" : "")
        if (device.active) {
            filter = (device.type === "browser") ? "filter: brightness(175) sepia(1) hue-rotate(72deg) saturate(10000%) !important" : filter
        }
        sliderType = device.active ? `<input type="range" min="0" max="100" value="${device.volume}" class="vol-slider slider" id="volSlider">` : `<div class="volume-bar" style="width: ${device.volume}%;"></div>`
        return `
        <div class='spotify-device active-${device.active}'>
            <div class="device-icon" style="${filter}" title="${device.type.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}">
                <a href="?device:${device.id}"><img src="${deviceIcon}"></a>
            </div>
            <div class="device-volume" title="Volume: ${device.volume}%">
                <img src="img/speaker/speaker${speakerImg}.png">
                <div class="volume-parent">
                    <div class="volume">
                        ${sliderType}
                    </div>
                </div>
            </div>
            <div class="device-name">
                <div class="name-child">${device.name}</div>
            </div>
        </div>`
    }




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


    document.getElementsByClassName("devices-icon")[0].addEventListener("click", function () {
        icon = document.getElementsByClassName("devices-icon")[0]
        overlay = document.getElementsByClassName("devices-container")[0]
        parent = document.getElementsByClassName("devices-parent")[0]
        if (icon.className.includes("open-devices")) {
            icon.className = "devices-icon close-devices"
            overlay.style.display = "flex"


            spotifyApi.getMyDevices().then(response => {
                deviceInfo = {}
                for (device of response.devices) {
                    deviceInfo[device.name] = ({
                        "type": device.type.toLowerCase(),
                        "name": device.name,
                        "active": device.is_active,
                        "private": device.is_private_session,
                        "volume": device.volume_percent,
                        "id": device.id
                    })
                }
                console.log(deviceInfo)

                devicesElement = ""
                for (device of Object.keys(deviceInfo)) {
                    templateDevice = deviceInfo[device]
                    devicesElement += deviceTemplate(templateDevice)
                }
                parent.innerHTML = devicesElement
                setTimeout(function () {
                    try {
                        //function to update volume(s)
                        activeSlider = document.querySelector(".active-true .vol-slider")
                        activeSlider.addEventListener("input", function () {
                            value = activeSlider.value
                            try { window.clearTimeout(timeoutId) } catch { console.log("no timeouts") }

                            lastId = timeoutId
                            timeoutId = window.setTimeout(function () {
                                run = (lastRan != timeoutId)
                                lastRan = timeoutId
                                setTimeout(function () {
                                    console.log("set volume")
                                    if (value > 75) {
                                        speakerImg = "3"
                                    } else if (value > 50) {
                                        speakerImg = "2"
                                    } else if (value > 25) {
                                        speakerImg = "1"
                                    } else if (value >= 1) {
                                        speakerImg = "0"
                                    } else {
                                        speakerImg = "Mute"
                                    }
                                    newParent = document.querySelector(".spotify-device.active-true div.device-volume > img")
                                    newParent.src = `img/speaker/speaker${speakerImg}.png`

                                    if (run) {
                                        spotifyApi.setVolume(value, function () {
                                            console.log("ran timeout", timeoutId)

                                        })

                                    }
                                }, 100)
                            }, 100)
                        });
                    } catch { }
                }, 500)
            })



        } else {
            icon.className = "devices-icon open-devices"
            overlay.style.display = "none"
        }
    })

    document.getElementsByClassName("settings-icon")[0].addEventListener("click", function () {
        icon = document.getElementsByClassName("settings-icon")[0]
        overlay = document.getElementsByClassName("settings-container")[0]
        if (icon.className.includes("open-settings")) {
            icon.className = "settings-icon close-settings"
            overlay.style.display = "flex"
        } else {
            icon.className = "settings-icon open-settings"
            overlay.style.display = "none"
            //window.location.reload()
        }
    });
    document.getElementsByClassName("playlist-icon")[0].addEventListener("click", function () {
        icon = document.getElementsByClassName("playlist-icon")[0]
        overlay = document.getElementsByClassName("playlists-container")[0]
        if (icon.className.includes("open-playlists")) {
            if (!(simplifySetting["setting-playlist-type"] === "custom")) {
                Promise.all([
                    spotifyApi.getFeaturedPlaylists(),
                    spotifyApi.getUserPlaylists(),
                    spotifyApi.getPlaylist("37i9dQZEVXbMDoHDwVN2tF"),
                    spotifyApi.getPlaylist("37i9dQZF1DXcBWIGoYBM5M")
                ]).then(playlists => {
                    playlists.feature = playlists[0].playlists.items
                    playlists.user = playlists[1].items
                    playlists.trending = [playlists[2], playlists[3]]
                    for (featurePlaylist of playlists.feature) {
                        featurePlaylist.public = true
                        //override null default
                    }
                    playlists.shift()
                    playlists.shift()
                    playlists.shift()
                    playlists.shift()
                    console.log(playlists)
                    //show the menu
                    if (simplifySetting["setting-playlist-type"] === "user") {
                        playlistsList = playlists.user
                    } else if (simplifySetting["setting-playlist-type"] === "trending") {
                        playlistsList = playlists.trending
                    } else {
                        playlistsList = playlists.feature
                    }
                    //moved element show to creatPlaylists
                    overlay.innerHTML = createPlaylists(playlistsList)
                    overlay.style.display = "flex"
                    //set icon
                    icon.src = `img/player.png`
                    icon.className = "playlist-icon close-playlists"
                });
            } else {
                custom_playlists = simplifySetting["custom-playlists"]
                icon = document.getElementsByClassName("playlist-icon")[0]
                overlay = document.getElementsByClassName("playlists-container")[0]
                custom_playlists = simplifySetting["custom-playlists"]
                overlay.innerHTML = ""
                console.error("Sorry, custom playlists are not yet fully supported :(, please select another source")
                let addElement = `
                <div class="simplify-playlist add-element">
                    <div class="simplify-playlist-img" style="">+</div>
                    <div class="simplify-playlist-content">
                        <div class="playlist-title" style="font-size: 25px;">Add a Playlist</div>
                    </div>
                </div>`

                let addBox = `
                <div class="simplify-playlist addPlaylistInputs" style="display: block !important; height: fit-content;min-height: 30px;justify-content: space-between;padding: 0px;font-size: 20px;text-align: left;">
                    <div style="display: flex; padding: 10px;">
                        Playlist URI or Share link
                        <input type="text" id="playlist-input" style="" placeholder="spotify:playlist:id-here">
                    </div>
                    <div style="display: block; font-size: 10px; padding: 10px; padding-top: 0px; margin-top: 0px;"> 
                        Playlist Preview:
                        <div style="width: 100%;"></div>
                    </div>
                    <div id="playlist-preview" style="height: 70px; padding: 5px; width: 100%; border-radius: 15px; border: grey solid thin;"></div>
                </div>
                <div class="addCustomButton" id="addCustomButton" style="display: none;">+</div>
                `

                if (custom_playlists.length === 1) {
                    console.log("one custom playlist")
                    spotifyApi.getPlaylist(custom_playlists).then(playlistInfo => {
                        console.log(`got playlist by id ${custom_playlists}:`)
                        console.log(playlistInfo)
                        playlistText = playlistTemplate(playlistInfo, true)
                        let playlistElement = document.createRange().createContextualFragment(playlistText)
                        overlay.appendChild(playlistElement)
                    })
                } else if (custom_playlists.length === 0) {
                    console.log("no custom playlists")
                } else {
                    console.log("multiple playlists")
                    for (customID of custom_playlists) {
                        spotifyApi.getPlaylist(customID).then(playlistInfo => {
                            console.log(`got playlist by id ${customID}:`)
                            console.log(playlistInfo)
                            playlistText = playlistTemplate(playlistInfo, true)
                            let playlistElement = document.createRange().createContextualFragment(playlistText)
                            overlay.appendChild(playlistElement)
                            addRemoveListener()
                        })

                    }
                }
                overlay.innerHTML += addElement
                setTimeout(function () {
                    document.querySelector(".simplify-playlist.add-element .simplify-playlist-img").addEventListener("click", function () {
                        console.log("add playlist functionality goes here")
                        overlay.innerHTML += addBox
                        addCustomsListener()
                    })
                }, 300)

                overlay.style.display = "flex"
                overlay.className = "playlists-container edit"
                icon.src = `img/player.png`
                icon.className = "playlist-icon close-playlists"
                document.getElementsByTagName("html")[0].style = "width: 400px; height: 600px"

            }

        } else {
            //if playlists are open
            icon.className = "playlist-icon open-playlists"
            document.getElementsByTagName("html")[0].style = "width: 400px; height: 200px"
            overlay.style.display = "none"
            icon.src = `img/playlists.png`
        }
    })



    document.getElementsByClassName("progress-marker pm1")[0].addEventListener("click", function () {

        spotifyApi.seek(document.getElementsByClassName("progress-marker pm1")[0].id.replace('js-seek-', '')).then(response => {
            console.log("seeked to", document.getElementsByClassName("progress-marker pm1")[0].id.replace('js-seek-', ''), "ms")
        })
    })
    document.getElementsByClassName("progress-marker pm2")[0].addEventListener("click", function () {

        spotifyApi.seek(document.getElementsByClassName("progress-marker pm2")[0].id.replace('js-seek-', '')).then(response => {
            console.log("seeked to", document.getElementsByClassName("progress-marker pm2")[0].id.replace('js-seek-', ''), "ms")
        })
    })
    document.getElementsByClassName("progress-marker pm3")[0].addEventListener("click", function () {

        spotifyApi.seek(document.getElementsByClassName("progress-marker pm3")[0].id.replace('js-seek-', '')).then(response => {
            console.log("seeked to", document.getElementsByClassName("progress-marker pm3")[0].id.replace('js-seek-', ''), "ms")
        })
    })
    document.getElementsByClassName("progress-marker pm4")[0].addEventListener("click", function () {

        spotifyApi.seek(document.getElementsByClassName("progress-marker pm4")[0].id.replace('js-seek-', '')).then(response => {
            console.log("seeked to", document.getElementsByClassName("progress-marker pm4")[0].id.replace('js-seek-', ''), "ms")
        })
    })


    //load settings
    chrome.storage.sync.get({ "setting-filter": "none", "setting-playlist-type": "user", "setting-theme": "light", "custom-playlists": [] }, response => {
        console.log("settings response:")
        console.log(response)
        simplifySetting = response
        reloadSettings(simplifySetting)
    })
    function reloadSettings(simplifySetting) {
        if (!(simplifySetting["setting-filter"] === "none")) {
            document.getElementById("js-setting-filter").className += " active"
            console.log("enabled filter icon")
        } else {
            document.getElementById("js-setting-filter").className = document.getElementById("js-setting-filter").className.replace(" active", "")
            console.log("disabled filter icon")
        }
        playlistType = `js-setting-playlist-type-${simplifySetting["setting-playlist-type"]}`
        theme = `js-setting-theme-${simplifySetting["setting-theme"]}`
        //console.log(typeof (playlistType))
        for (currentSetting of [playlistType, theme]) {
            //console.log("setting:")
            //console.log(currentSetting)
            parentSelector = currentSetting.split("-")
            //console.log("after split")
            //console.log(parentSelector)
            parentSelector.pop()
            parentSelector = parentSelector.join("-")
            parentObj = document.getElementById(parentSelector)
            try {
                for (settingChild of parentObj.children) {
                    settingChild.className = settingChild.className.replace(" active", "")
                }
            } catch { }
            document.getElementById(currentSetting).className += " active"
            //console.log("parent selector:", parentSelector)
        }
        chrome.storage.sync.set(simplifySetting, function (response) {
            console.log("set settings, settings:")
            console.log(simplifySetting)
        })
        applySettings()
    }
    function applySettings() {
        if (!(simplifySetting["setting-filter"] === "none")) {
            document.body.className += " black-and-white"
        } else {
            document.body.className = document.body.className.replace(" black-and-white", "")
        }
    }
    document.getElementById("js-setting-filter").addEventListener("click", function () {
        if (document.getElementById("js-setting-filter").className.includes(" active")) {
            simplifySetting["setting-filter"] = "none"
        } else {
            simplifySetting["setting-filter"] = "b&w"
        }
        reloadSettings(simplifySetting)
    })
    document.getElementById("js-setting-playlist-type-trending").addEventListener("click", function () {
        simplifySetting["setting-playlist-type"] = "trending"
        reloadSettings(simplifySetting)
    })
    document.getElementById("js-setting-playlist-type-user").addEventListener("click", function () {
        simplifySetting["setting-playlist-type"] = "user"
        reloadSettings(simplifySetting)
    })
    document.getElementById("js-setting-playlist-type-featured").addEventListener("click", function () {
        simplifySetting["setting-playlist-type"] = "featured"
        reloadSettings(simplifySetting)
    })
    document.getElementById("js-setting-playlist-type-custom").addEventListener("click", function () {
        simplifySetting["setting-playlist-type"] = "custom"
        reloadSettings(simplifySetting)
    })
}