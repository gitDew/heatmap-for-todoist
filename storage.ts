export function getTokenFromStorage(): Promise<string> {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get({"todoist_api_token" : ""}, function(items) {
            if (items["todoist_api_token"] == "") {
                reject(new Error("No API token found in storage."));
            } else{
                resolve(items["todoist_api_token"]);
            }
        })
    })
}

export function checkIfTokenInStorage(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get({"todoist_api_token" : ""}, function(items) {
            if (items["todoist_api_token"] == "") {
                resolve(false)
            } else{
                resolve(true)
            }
        })
    })
}

export function saveTokenToStorage(api_token: string): Promise<void> {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.set({"todoist_api_token": api_token}, resolve)
    })
} 