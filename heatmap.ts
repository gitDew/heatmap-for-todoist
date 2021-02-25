import { Rect, Svg, SVG } from '@svgdotjs/svg.js'
import { getPastYearArray } from "./time";
import tippy from 'tippy.js';
import * as Storage from './storage';
import { fetchAndUpdate } from "./todoist";
import { animateCSS } from "./animations";
import { library, dom } from "@fortawesome/fontawesome-svg-core";
import { faArrowRight, faCheck, faExclamationCircle, faCircleNotch } from "@fortawesome/free-solid-svg-icons";
let Rainbow = require("rainbowvis.js")

const box_height = 128;
const box_width = 791;

const column_distance = 15;
const row_distance = 15;
const column_length = 7;

const default_rect_attributes = {
  width: 11,
  height: 11,
  radius: 2,
  fill: "#eee"
}

export interface CompletedTasks {
  [s: string]: number;
}

let observer = new MutationObserver(function() {
  let element: HTMLElement = document.getElementById("agenda_view")
  if (element != null) {
    observer.disconnect();

    let heatmap_box = document.createElement("div")
    heatmap_box.className = "heatmap-box";
    element.appendChild(heatmap_box)

    Storage.checkForToken()
      .then((hasToken) => {
        if (hasToken) {
          injectHeatmapIn(heatmap_box)
        } else {
          injectFormIn(heatmap_box)
        }
      })
  }
});
observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});

function injectFormIn(element: HTMLElement): void {

  setupIcons()

  let path_to_form = chrome.runtime.getURL("token-form.html");
  fetch(path_to_form)
  .then(response => response.text())
  .then(html => {
    element.innerHTML = html;        
    setupSubmitButton();
  })
}

function setupSubmitButton() {
  let form = document.getElementById("form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    hidePreviousError();
    submitToken(form);
  });
}

function disableSubmit(form) {
  form.querySelector('button[type="submit"]')
    .setAttribute('disabled', 'disabled');
}

function enableSubmit(form) {
  form.querySelector('button[type="submit"]')
    .removeAttribute('disabled');
}

function hidePreviousError() {
  let error_box = document.querySelector(".error-box")
  error_box.classList.add("hidden")
}

function setupIcons(): void {
  library.add(faArrowRight)
  library.add(faCheck)
  library.add(faExclamationCircle)
  library.add(faCircleNotch)
  dom.watch()
}

function submitToken(form) {
  let input_element: HTMLInputElement = document.getElementById("token-input") as HTMLInputElement;
  let user_input = input_element.value.trim();

  validateInput(input_element)
    .then(() => {
      disableSubmit(form); 
      showSpinner()
    })
    .then(() => Storage.saveToken(user_input))
    .then(() => fetchAndUpdate())
    .then(() => animatedSwitchToHeatmap())
    .catch((error) => {
      showError(input_element, error);
      hideSpinner();
      enableSubmit(form);
    })
}

function showSpinner() {
  let spinner = document.getElementById("spinner")
  spinner.classList.remove("hidden")
}

function hideSpinner() {
  let spinner = document.getElementById("spinner")
  spinner.classList.add("hidden")
}

function validateInput(input_element: HTMLInputElement): Promise<void> {
  return new Promise((resolve, reject) => {
    let reason = input_element.validity;

    if (reason.valueMissing) {
      reject("Input field empty.")
    } else {
      resolve()
    }
  })
}
function showError(input_element: HTMLInputElement, reason: string) {
  let form_column = input_element.parentElement;
  let error_box = form_column.querySelector(".error-box")
  let error_message = error_box.querySelector("small")

  error_message.innerText = reason;
  error_box.classList.remove("hidden")
}

function animatedSwitchToHeatmap() {
  const form = document.getElementById("form")

  animateCSS(form, "zoomOut")
    .then(() => {
      form.remove()
      let box: HTMLElement = document.querySelector(".heatmap-box")
      injectHeatmapIn(box)
      animateCSS(box, "zoomIn")
    })
}

function injectHeatmapIn(element: HTMLElement) {
  let heatmap: Svg = createHeatmap()
  heatmap.addTo(element)
  Storage.getCompletedTasks()
    .then((completed_tasks) => addDateAndColorAttribute(heatmap, completed_tasks))
    .then(() => setupTooltips())
}

function addDateAndColorAttribute(heatmap: Svg, completed_tasks: CompletedTasks, ) {
  let gradient = setupColorGradient(completed_tasks);

  for (const date in completed_tasks) {
    let color = gradient.colourAt(completed_tasks[date]);
    heatmap.findOne('#date_' + date).attr({ fill: '#' + color, completed_tasks: completed_tasks[date]});
  }
}

function createHeatmap() {
  let heatmap: Svg = SVG().size(box_width, box_height);
  heatmap.attr({id: "heatmap"})

  let pastYearArray: string[] = getPastYearArray();

  let current_column: Rect[] = [];
  let week_counter: number = 0;
  for (let i = 0; i < pastYearArray.length; i++) {
    let current_rect = drawRectangle(heatmap)

    let in_column_position = i % column_length;

    current_rect.y(in_column_position * row_distance)
    current_rect.id("date_" + pastYearArray[i])
    current_column.push(current_rect)

    if (columnIsFull(in_column_position) || isLastRect(i, pastYearArray.length)) {
      moveColumnRight(current_column, week_counter * column_distance)
      current_column = [];
      week_counter++;
    }
  }
  return heatmap;
}

function isLastRect(i: number, number_of_elements: number): boolean {
  return i === number_of_elements - 1;
}

function columnIsFull(in_column_position: number) {
  return in_column_position === 6;
}

function drawRectangle(canvas: Svg): Rect {
  let rectangle = canvas.rect().attr(default_rect_attributes)
  rectangle.radius(default_rect_attributes["radius"])
  return rectangle;
}

function moveColumnRight(column: Rect[], by = 0): void {
  for (const rect of column) {
    rect.x(by)
  }
}

function setupColorGradient(completed_tasks: CompletedTasks) {

  let completed_task_numbers: number[] = Object.values(completed_tasks);
  let min_completed = Math.min(...completed_task_numbers)
  let max_completed = Math.max(...completed_task_numbers)

  let gradient = new Rainbow();

  // transparent green to light green
  gradient.setSpectrum('#b7e5c7', '#00c647')
  gradient.setNumberRange(min_completed, max_completed)
  return gradient
}

function setupTooltips() {
  tippy('#heatmap rect', {
    content: function(reference) {
      let [, date] = reference.getAttribute("id").split("_")
      let date_string = new Date(date).toUTCString().slice(0, 16)
      if (reference.hasAttribute("completed_tasks")) {
        let completed_tasks = reference.getAttribute("completed_tasks");
        return `${completed_tasks} tasks completed on ${date_string}`;
      }
      return `No tasks completed on ${date_string}`
    }
  })
}
