import { CompletedTasks } from "./heatmap";

export function getToken(): Promise<string> {
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

export function checkForToken(): Promise<boolean> {
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

export function saveToken(api_token: string): Promise<void> {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.set({"todoist_api_token": api_token}, resolve)
    })
}

export function getCompletedTasks(): Promise<CompletedTasks> {
    return new Promise((resolve) => {
        chrome.storage.sync.get({todoist_completed_tasks: {}}, function(result) {
            resolve(result["todoist_completed_tasks"]);
        })
    })
}

export function saveCompletedTasks(newCompletedTasks: CompletedTasks): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({todoist_completed_tasks: newCompletedTasks })
    console.log("Completed tasks saved.")
    resolve()
  })
}
