const client_id = 'fc6786adda404b36a1f67a106913dd6f'
const redirectUri = chrome.identity.getRedirectURL();

console.log(redirectUri);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(sender)
    if (message.action === 'run_auth_flow') {
        chrome.identity.launchWebAuthFlow({
            "url": `https://accounts.spotify.com/authorize?client_id=${client_id}&redirect_uri=${redirectUri}&response_type=token`,
            'interactive': true,
        }, (redirect_url) => {
            console.log(redirect_url);
        });
    }
    //sendResponse({ status: 'ok' })
    return true;
});

chrome.identity.onSignInChanged.addListener((account, signedIn) => {
    console.log(account, signedIn)
});
