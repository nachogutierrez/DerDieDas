const CACHE_KEY = "cached_words"
export const MAX_REMEMBERED = 1000
export const MAX_REMEMBERED_PER_WORD = 20

const SCORE_QUARTZ = 0
const SCORE_AMETHYST = 4
const SCORE_EMERALD = 8
const SCORE_SAPPHIRE = 12
const SCORE_DIAMOND = 16
const MILESTONES = [
    SCORE_QUARTZ,
    SCORE_AMETHYST,
    SCORE_EMERALD,
    SCORE_SAPPHIRE,
    SCORE_DIAMOND
]

function saveWords(words) {
    localStorage.setItem(CACHE_KEY, words.serialize())
}

export function loadWords() {
    return Words(localStorage.getItem(CACHE_KEY), saveWords)
}

export function Words(serializedWords = "", save = () => { }) {

    let words = {}
    if (serializedWords) {
        ({ words } = JSON.parse(serializedWords))
    }

    const obj = {}

    obj.getWord = function (word) {
        if (!(word in words)) {
            words[word] = _wordTemplate()
        }
        return {
            ...words[word],
            attempts: [...words[word].attempts]
        }
    }

    obj.lastPlayed = function (word) {
        const wordDetails = this.getWord(word)
        return Math.abs(wordDetails.attempts[0] || 0)
    }

    obj.missedLastPeriod = function (word, duration) {
        const wordDetails = this.getWord(word)
        const now = new Date().getTime()
        return wordDetails.attempts.filter(x => x < 0 && -x > now - duration)
    }

    obj.playedLastPeriod = function (word, duration) {
        const wordDetails = this.getWord(word)
        const now = new Date().getTime()
        return wordDetails.attempts.filter(x => Math.abs(x) > now - duration)
    }

    obj.hit = function (word) {
        _updateScore(word, true)
    }

    // TODO: implement a less forgiving score update. If missed move score to the beginning of the previous gemstone.
    obj.miss = function (word) {
        _updateScore(word, false)
    }

    obj.serialize = function () {
        return JSON.stringify({ words })
    }

    obj.getScore = function (word) {
        const { score } = this.getWord(word)
        if (score === undefined) {
            return 0
        }
        return score
    }

    obj.currentMilestone = function (word) {
        return currentMilestone(MILESTONES, this.getScore(word))
    }

    obj.willLevelUp = function (word) {
        const score = this.getScore(word)
        return currentMilestone(MILESTONES, score) !== currentMilestone(MILESTONES, score + 1)
    }

    obj.getExperience = function (word) {
        const score = this.getScore(word)
        const currentMilestoneScore = MILESTONES[currentMilestone(MILESTONES, score)]
        const nextMilestoneScore = MILESTONES[nextMilestone(MILESTONES, score)]

        if (currentMilestoneScore === MILESTONES[MILESTONES.length - 1]) {
            return 0
        }

        return (score - currentMilestoneScore) / (nextMilestoneScore - currentMilestoneScore)
    }

    obj.isMaxScore = function (word) {
        const score = this.getScore(word)
        return score === MILESTONES[MILESTONES.length - 1]
    }

    let _updateScore = function (word, isHit) {
        if (!(word in words)) {
            words[word] = _wordTemplate()
        }

        // Update attempts
        let timestamp = new Date().getTime()
        if (!isHit) {
            timestamp = -timestamp
        }
        words[word].attempts.unshift(timestamp)
        words[word].attempts = words[word].attempts.slice(0, MAX_REMEMBERED_PER_WORD)

        // Update score
        if (isHit) {
            words[word].score = Math.min(words[word].score + 1, MILESTONES[MILESTONES.length - 1])
        } else {
            words[word].score = MILESTONES[previousMilestone(MILESTONES, words[word].score)]
        }

        save(this)
    }

    function _wordTemplate() {
        return {
            attempts: [],
            score: 0
        }
    }

    obj.getWord = obj.getWord.bind(obj)
    obj.hit = obj.hit.bind(obj)
    obj.miss = obj.miss.bind(obj)
    obj.serialize = obj.serialize.bind(obj)
    obj.lastPlayed = obj.lastPlayed.bind(obj)
    obj.playedLastPeriod = obj.playedLastPeriod.bind(obj)
    obj.missedLastPeriod = obj.missedLastPeriod.bind(obj)
    obj.getScore = obj.getScore.bind(obj)
    obj.currentMilestone = obj.currentMilestone.bind(obj)
    obj.willLevelUp = obj.willLevelUp.bind(obj)
    obj.getExperience = obj.getExperience.bind(obj)
    obj.isMaxScore = obj.isMaxScore.bind(obj)
    _updateScore = _updateScore.bind(obj)

    return obj
}

export function milestoneToColor(milestone) {
    switch (milestone) {
        case 0: return 'pink' // quartz
        case 1: return 'purple' // amethyst
        case 2: return 'green' // emerald
        case 3: return '#4A8BEE' // sapphire
        case 4: return '#EDEDED' // diamond
        default: return 'gray'
    }
}

export function milestoneToAsset(milestone) {
    switch (milestone) {
        case 0: return 'assets/quartz.png'
        case 1: return 'assets/amethyst.png'
        case 2: return 'assets/emerald.png'
        case 3: return 'assets/sapphire.png'
        case 4: return 'assets/diamond.png'
        default: return ''
    }
}

export function currentMilestone(allMilestones, score) {
    const pair = allMilestones.map((x, i) => ({ x, i })).find(({ x }) => score < x)
    if (pair) {
        return pair.i - 1
    }
    return allMilestones.length - 1
}
export function nextMilestone(allMilestones, score) {
    return Math.min(currentMilestone(allMilestones, score) + 1, allMilestones.length - 1)
}
export function previousMilestone(allMilestones, score) {
    return Math.max(currentMilestone(allMilestones, score) - 1, 0)
}