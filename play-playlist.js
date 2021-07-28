if (window.location.href.includes("?play-playlist")) {
    setTimeout(function () {
        try {
            console.log("playing playlist")
            document.querySelector("[data-testid='play-button'][aria-label='Play']").click()
        } catch {
            console.log("playlist already playing")
        }
        setTimeout(function () {
            window.close()
        }, 500)
    }, 2000)
}