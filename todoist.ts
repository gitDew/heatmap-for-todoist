import axios from 'axios';
import { getToken, getCompletedTasks, saveCompletedTasks } from "./storage";

export function fetchAndUpdate(): Promise<void> {
    return getToken()
        .then((api_token) => fetchStatsFromTodoistAPI(api_token))
        .then((response) => {
            let relevantData = convertResponse(response);
            updateStorage(relevantData)
        })
}

function fetchStatsFromTodoistAPI(user_token: string) {
    console.log("Fetching data from Todoist...");
    const api_url: string = "https://api.todoist.com/sync/v8/completed/get_stats" 
    return axios.post(api_url, {token: user_token})
    .catch((error) => {
      throw new Error("Invalid API token or network error.")
    })

}

function convertResponse(response) {
    let days = response.data["days_items"]
    for (const day of days) {
        delete day.items
    }
    return days
}

function updateStorage(newData) {
    let dataToBeSaved = convertToSaveable(newData);

    console.log("Fetching saved completed tasks from storage...");
    getCompletedTasks()
    .then((dataFromStorage) => {
      console.log("Completed tasks fetched.")
      return merge(dataFromStorage.todoist_completed_tasks, dataToBeSaved) 
    })
    .then((updatedObject) => {
      saveCompletedTasks(updatedObject)
    })
}

function convertToSaveable(newData) {
    let dataToBeSaved = {}
    for (const day of newData) {
        dataToBeSaved[day.date] = day.total_completed;
    }
    return dataToBeSaved;
}

function merge(o1: any, o2: any) {
  for (const key in o2) {
    o1[key] = o2[key];
  }
  return o1;
}
