const client_id = 'fc6786adda404b36a1f67a106913dd6f'
var redirectUri = chrome.identity.getRedirectURL();
redirectUri = redirectUri.substring(0, redirectUri.length - 1)

console.log(redirectUri);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(sender)
    console.log([`message:`, message])
    if (message.action === 'run_auth_flow') {
        console.log("running auth flow for url:")
        console.log(`https://accounts.spotify.com/authorize?client_id=${client_id}&redirect_uri=${redirectUri}&response_type=token`)
        chrome.identity.launchWebAuthFlow({
            "url": `https://accounts.spotify.com/authorize?client_id=${client_id}&redirect_uri=${redirectUri}&response_type=token`,
            'interactive': true,
        }, (redirect_url) => {
            console.log(redirect_url);
            token = redirect_url.split("#access_token=")[1].split("&")[0]
            createDate = new Date()
            chrome.storage.sync.set({ "token": token, "token_date": String(createDate) }, function () {
                console.log("value saved")
                console.log({ "token": token, "token_date": String(createDate) })
            });
        });
    }
    //sendResponse({ status: 'ok' })
    return true;
});

chrome.identity.onSignInChanged.addListener((account, signedIn) => {
    console.log("SignInChanged")
    console.log(account, signedIn)
});
