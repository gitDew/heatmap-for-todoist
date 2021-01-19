import { Rect, Svg, SVG } from '@svgdotjs/svg.js'
import { getPastYearArray } from "./time";
import tippy from 'tippy.js';
let Rainbow = require("rainbowvis.js")

const box_height = 128;
const box_width = 791;

const default_rect_attributes = {
    width: 11,
    height: 11,
    radius: 2,
    fill: "#eee"
}

let observer = new MutationObserver(function(mutations) {
    let element: HTMLElement = document.getElementById("agenda_view")
    if (element != null) {
        observer.disconnect();
        
        setupHeatmapIn(element)
    }
});
observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});

function setupHeatmapIn(element: HTMLElement) {
    let heatmap: Svg = injectHeatmapIn(element)
    addColorAndCompletedTasksTo(heatmap)
        .then(() => setupTooltips())
}

function injectHeatmapIn(element: HTMLElement) {
    let heatmap: Svg = SVG().addTo(element).size(box_width, box_height);
    heatmap.attr({id: "heatmap"})

    const column_distance = 15;
    const row_distance = 15;
    const column_length = 7;
    
    let pastYearArray: string[] = getPastYearArray();

    let current_column: Rect[] = [];
    let week_counter: number = 0;
    for (let i = 0; i < pastYearArray.length; i++) {
        let current_rect = drawRectangle(heatmap)

        let in_column_position = i % column_length;
        
        current_rect.y(in_column_position * row_distance)
        current_rect.id("date_" + pastYearArray[i])
        current_column.push(current_rect)

        if (in_column_position === 6 || i === pastYearArray.length - 1) {
            moveColumn(current_column, week_counter * column_distance)
            current_column = [];
            week_counter++;
        }
    }
    return heatmap;
}

function drawRectangle(canvas: Svg): Rect {
    let rectangle = canvas.rect().attr(default_rect_attributes)
    rectangle.radius(default_rect_attributes["radius"])
    return rectangle;
}

function moveColumn(column: Rect[], by = 0): void {
    for (const rect of column) {
        rect.x(by)
    }
}

function addColorAndCompletedTasksTo(heatmap: Svg): Promise<void> {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get({todoist_completed_tasks: {}}, function(result) {
            let tasks_for_date = result["todoist_completed_tasks"];
    
            let gradient = setupColorGradient(tasks_for_date)
    
            for (const date in tasks_for_date) {
                let color = gradient.colourAt(tasks_for_date[date])
                heatmap.findOne('#date_' + date).attr({fill: '#' + color, completed_tasks: tasks_for_date[date]})
            }
            resolve()
        })
    })
}

function setupColorGradient(tasks_for_date: { [s: string]: number; }) {

    let completed_task_numbers: number[] = Object.values(tasks_for_date);
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
            let [prefix, date] = reference.getAttribute("id").split("_")
            let date_string = new Date(date).toUTCString().slice(0, 16)
            if (reference.hasAttribute("completed_tasks")) {
                let completed_tasks = reference.getAttribute("completed_tasks");
                return `${completed_tasks} tasks completed on ${date_string}`;
            }
            return `No tasks completed on ${date_string}`
        }
    })
}