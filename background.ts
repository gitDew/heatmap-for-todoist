import { fetchAndUpdate } from "./todoist";
import { getToken, saveToken, checkForToken} from "./storage";

chrome.webNavigation.onCompleted.addListener(function() {
  checkForToken()
    .then((hasToken: boolean) => {
      if (hasToken) {
        fetchAndUpdate()
          .catch((error) => {
            console.error("Failed to fetch and update todoist tasks in the background. Reason: " + error.message)
          })
      } else {
        console.log("No token found in storage. Tasks will not be fetched.")
      }
    })
}, {url: [{urlMatches : 'https://en.todoist.com/'}]});
