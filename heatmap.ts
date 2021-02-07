import { Rect, Svg, SVG } from '@svgdotjs/svg.js'
import { getPastYearArray } from "./time";
import tippy from 'tippy.js';
import * as Storage from './storage';
import { fetchAndUpdate } from "./todoist";
import { animateCSS } from "./animations";
import { library, dom } from "@fortawesome/fontawesome-svg-core";
import { faArrowRight, faCheck, faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
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
            hasToken = false;
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
        setupInputField();
    })
}

function setupSubmitButton() {
    let form = document.getElementById("form");
    form.addEventListener("submit", submitToken);
}

function setupInputField() {
    let input_element: HTMLInputElement = document.getElementById("token-input") as HTMLInputElement;
    input_element.addEventListener("input", () => {
        input_element.setCustomValidity("");
    });
}

function setupIcons(): void {
    library.add(faArrowRight)
    library.add(faCheck)
    library.add(faExclamationCircle)

    dom.watch()
}

function submitToken(event) {
    let input_element: HTMLInputElement = document.getElementById("token-input") as HTMLInputElement;
    let user_input = input_element.value;

    Storage.saveToken(user_input)
    .then(() => fetchAndUpdate())
    .then(() => animatedSwitchToHeatmap())
    .catch(() => {
        showErrorTooltip(input_element);
    })

    event.preventDefault();
}
function showErrorTooltip(input_element: HTMLInputElement) {
    input_element.setCustomValidity("Invalid API token");
    input_element.reportValidity();
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
    Storage.getCompletedTasks()
        .then((completed_tasks) => addDateAndColorAttribute(heatmap, completed_tasks))
        .then(() => heatmap.addTo(element))
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