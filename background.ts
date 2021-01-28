import { fetchAndUpdate } from "./todoist";

chrome.runtime.onStartup.addListener(() => {
    fetchAndUpdate();
});
  
chrome.webNavigation.onCompleted.addListener(function() {
    fetchAndUpdate();
}, {url: [{urlMatches : 'https://en.todoist.com/'}]});