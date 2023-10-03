const CACHE_KEY = "cached_words"
export const MAX_REMEMBERED = 1000
export const MAX_REMEMBERED_PER_WORD = 20

function saveWords(words) {
    localStorage.setItem(CACHE_KEY, words.serialize())
}

export function loadWords() {
    return Words(localStorage.getItem(CACHE_KEY))
}

function Words(serializedWords = "") {

    let general = _wordTemplate()
    let words = {}
    if (serializedWords) {
        ({ general, words } = JSON.parse(serializedWords))
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
        return JSON.stringify({ general, words })
    }

    /**
     * Checks last 10 attempts in the past week.
     * 0 hits: RED
     * [1, 2] hits: ORANGE
     * [3, 4, 5] hits: YELLOW
     * [6, 7, 8, 9] hits: GREEN
     * [10] hits: DIAMOND
     */
    obj.getScore = function (word) {
        const wordDetails = this.getWord(word)
        const now = new Date().getTime()
        const oneWeek = 1000 * 60 * 60 * 24 * 7 // 1 week in milliseconds
        const attempts = wordDetails.attempts
            .filter(x => Math.abs(x) > now - oneWeek)
            .slice(0, 10)
        const totalHits = attempts.filter(x => x > 0).length
        if (totalHits === 0) {
            return 0
        } else if (totalHits <= 2) {
            return 1
        } else if (totalHits <= 5) {
            return 2
        } else if (totalHits <= 9) {
            return 3
        } else {
            return 4
        }
    }

    let _updateScore = function (word, isHit) {
        if (!(word in words)) {
            words[word] = _wordTemplate()
        }
        let timestamp = new Date().getTime()
        if (!isHit) {
            timestamp = -timestamp
        }
        words[word].attempts.unshift(timestamp)
        words[word].attempts = words[word].attempts.slice(0, MAX_REMEMBERED_PER_WORD)
        general.attempts.unshift(timestamp)
        general.attempts = general.attempts.slice(0, MAX_REMEMBERED)
        saveWords(this)
    }

    function _wordTemplate() {
        return {
            attempts: []
        }
    }

    obj.getWord = obj.getWord.bind(obj)
    obj.hit = obj.hit.bind(obj)
    obj.miss = obj.miss.bind(obj)
    obj.serialize = obj.serialize.bind(obj)
    obj.lastPlayed = obj.lastPlayed.bind(obj)
    obj.playedLastPeriod = obj.playedLastPeriod.bind(obj)
    obj.missedLastPeriod = obj.missedLastPeriod.bind(obj)
    _updateScore = _updateScore.bind(obj)

    return obj
}

export function scoreToColor(score) {
    switch (score) {
        case 0: return 'pink' // quartz
        case 1: return 'purple' // amethyst
        case 2: return 'green' // emerald
        case 3: return '#4A8BEE' // sapphire
        case 4: return '#EDEDED' // diamond
        default: return 'gray'
    }
}

export function scoreToAsset(score) {
    switch (score) {
        case 0: return 'assets/quartz.png'
        case 1: return 'assets/amethyst.png'
        case 2: return 'assets/emerald.png'
        case 3: return 'assets/sapphire.png'
        case 4: return 'assets/diamond.png'
        default: return ''
    }
}