import { dom, html } from "../dom.js";
import { loadWords } from "../words.js";


export default function ExperienceBar({ experience, isMaxedOut = false }) {

    const text = html(`<p style='margin: 0; padding: 0; font-size: 10px;'></p>`)
    const experienceBar = dom('div',
        {
            class: 'experience-bar',
            style: `width: ${Math.floor(100 * experience)}%; display: flex; justify-content: center; align-items: center;`
        },
        text
    )
    const experienceBarContainer = dom('div', { class: 'experience-bar-container' }, experienceBar)

    if (isMaxedOut) {
        text.innerHTML = 'MAX'
    } else {
        text.innerHTML = ''
    }

    experienceBarContainer.setExperience = function (newExperience) {
        experienceBar.style.width = `${Math.floor(100 * newExperience)}%`
    }

    experienceBarContainer.setAnimate = function (animate) {
        if (animate) {
            experienceBar.classList.add('animate')
        } else {
            experienceBar.classList.remove('animate')
        }
    }

    experienceBarContainer.setMaxedOut = function (newIsMaxedOut) {

        if (newIsMaxedOut) {
            text.innerHTML = 'MAX'
        } else {
            text.innerHTML = ''
        }
    }

    return experienceBarContainer
}