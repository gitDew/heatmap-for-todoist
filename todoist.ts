import axios from 'axios';

function fetchAndUpdate() {
    getTokenFromStorage()
        .then((api_token) => fetchProductivityStats(api_token))
        .then((response) => {
            let relevantData = convertResponse(response);
            updateStorage(relevantData)
        })
}

function getTokenFromStorage(): Promise<string> {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get("todoist_api_token", function(result) {
            resolve(result["todoist_api_token"]);
        })
    })
}

function fetchProductivityStats(user_token: string) {
    console.log("Fetching data from Todoist...");
    const api_url: string = "https://api.todoist.com/sync/v8/completed/get_stats" 
    try {
        let response = axios.post(api_url, {token: user_token})
        return response;
    } catch (error) {
        console.error("Fetching data from Todoist failed. " + error);
    }
}

function convertResponse(response) {
    let days = response.data["days_items"]
    for (const day of days) {
        delete day.items
    }
    return days
}

function updateStorage(data) {
    let storageData = {}
    for (const day of data) {
        storageData[day.date] = day.total_completed
    }

    console.log("Fetching saved completed tasks from storage...");
    
    chrome.storage.sync.get({todoist_completed_tasks: {}}, function(result) {
        console.log("Completed tasks fetched.");
        for (const day in storageData) {
            result.todoist_completed_tasks[day] = storageData[day]
        }

        chrome.storage.sync.set({todoist_completed_tasks: result.todoist_completed_tasks}, function() {
            console.log("Completed tasks updated.");
        })
    })
}

chrome.runtime.onStartup.addListener(() => {
    fetchAndUpdate();
});
  
chrome.webNavigation.onCompleted.addListener(function() {
    fetchAndUpdate();
}, {url: [{urlMatches : 'https://en.todoist.com/'}]});
