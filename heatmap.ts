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

function drawColumn(canvas: Svg): Rect[] {
    let column: Rect[] = []
    for (let i = 0; i < 7; i++) {
        let current_rect = canvas.rect().attr(rect_attributes)
        current_rect.radius(rect_attributes["radius"])
        current_rect.y(i * 15)

        column.push(current_rect)
    }
    return column
}

function moveColumn(column: Rect[], by = 0): void {
    for (const rect of column) {
        rect.x(by)
    }
}

function injectHeatmapIn(element: HTMLElement) {
    let canvas: Svg = SVG().addTo(element).size(box_width, box_height);
    canvas.attr({id: "heatmap"})

    let column: Rect[] = []
    let columns: Rect[][] = []

    const column_distance = 15
    for (let week = 0; week < 52; week++) {
        column = drawColumn(canvas)
        moveColumn(column, week * column_distance)
        columns.push(column)
    }

    
    let all_rects: Rect[] = [].concat(...columns)
    assignDatesToRects(all_rects)
}

async function assignDatesToRects(rects: Rect[]) {
    let pastYearArray: string[] = getPastYearArray();

    for (let i = 0; i < pastYearArray.length; i++) {
        let current_rect = rects[i];
        current_rect.attr('id', pastYearArray[i]);
    }
}

let observer = new MutationObserver(function(mutations) {
    let element = document.getElementById("agenda_view")
    if (element != null) {
        observer.disconnect();
        injectHeatmapIn(element)
    }
});

// observer.observe(document, {attributes: false, childList: true, characterData: false, subtree:true});

