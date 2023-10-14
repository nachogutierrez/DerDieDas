import { html, styleString } from "../dom.js";
import { milestoneToAsset } from "../words.js";

export default function MilestoneIcon({ milestone, style = {} }) {
    const el = html(`<img src='${milestoneToAsset(milestone)}' width=32 height=32 style='${styleString(style)}'></img>`)
    el.setMilestone = function (newMilestone) {
        el.src = milestoneToAsset(newMilestone)
    }
    return el
}