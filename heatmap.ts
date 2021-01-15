import { Rect, Svg, SVG, extend as SVGextend, Element as SVGElement } from '@svgdotjs/svg.js'
import { getPastYearArray } from "./time";

const box_height = 128;
const box_width = 776;

const rect_width = 11;
const rect_height = 11;
const rect_radius = 10;

const empty_bg = "#eee"

const rect_attributes = {
    width: 11,
    height: 11,
    radius: 2,
    fill: "#eee"
}

function injectHeatmapIn(element: HTMLElement) {
    let canvas: Svg = SVG().addTo(element).size(box_width, box_height);
    canvas.attr({id: "heatmap"})

    const column_distance = 15;
    const row_distance = 15;
    const column_length = 7;
    
    let pastYearArray: string[] = getPastYearArray();

    let current_column: Rect[] = [];
    let week_counter: number = 0;
    for (let i = 0; i < pastYearArray.length; i++) {
        let current_rect = drawRectangle(canvas)

        let in_column_position = i % column_length;
        
        current_rect.y(in_column_position * row_distance)
        current_rect.attr('id', pastYearArray[i]);
        current_column.push(current_rect)

        if (in_column_position === 6) {
            moveColumn(current_column, week_counter * column_distance)
            current_column = [];
            week_counter++;
        }
    }
}

function drawRectangle(canvas: Svg): Rect {
    let rectangle = canvas.rect().attr(rect_attributes)
    rectangle.radius(rect_attributes["radius"])
    return rectangle;
}

function moveColumn(column: Rect[], by = 0): void {
    for (const rect of column) {
        rect.x(by)
    }
}

let observer = new MutationObserver(function(mutations) {
    let element = document.getElementById("agenda_view")
    if (element != null) {
        observer.disconnect();
        injectHeatmapIn(element)
    }
});

observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});