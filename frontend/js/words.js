import { getFirestore, collection, addDoc, setDoc, getDocs, getDoc, deleteDoc, doc } from 'firebase/firestore'
import { getApp, getUser } from './firebase.js'

const secondsToMillis = n => 1000 * n
const minutesToMillis = n => secondsToMillis(60) * n
const hoursToMillis = n => minutesToMillis(60) * n
const daysToMillis = n => hoursToMillis(24) * n
const weeksToMillis = n => daysToMillis(7) * n

const CACHE_KEY = "cached_words"
export const MAX_REMEMBERED = 1000
export const MAX_REMEMBERED_PER_WORD = 16

export const PENALTY_FREQUENCY = daysToMillis(1)
export const PENALTY_GRACE_PERIOD = daysToMillis(1)

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

// TODO: make it so that the player loses score overtime
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

// TODO: read from settings which client to use
export function getWordsClient() {
    return LocalWords()
}

export function LocalWords(prefix) {

    const cacheKeyPrefix = `${prefix}_LocalWords`

    const lastUpdateKey = () => `${cacheKeyPrefix}_lastUpdate`
    const allWordsKey = () => `${cacheKeyPrefix}_Words`
    const wordKey = word => `${cacheKeyPrefix}_Words_${word}`

    function _updateLastUpdate() {
        localStorage.setItem(lastUpdateKey(), `${new Date().getTime()}`)
    }

    const self = {
        getWords() {
            return JSON.parse(localStorage.getItem(allWordsKey()) || '[]')
        },
        getWord(word) {
            return JSON.parse(localStorage.getItem(wordKey(word)) || `{ "score": 0, "lastUpdated": 0 }`)
        },
        updateWord(word, newScore) {
            const now = new Date().getTime()
            const allWords = self.getWords()
            if (!allWords.includes(word)) {
                allWords.push(word)
                allWords.sort()
                localStorage.setItem(allWordsKey(), JSON.stringify(allWords))
            }
            localStorage.setItem(wordKey(word), JSON.stringify({ score: newScore, lastUpdated: now }))
            _updateLastUpdate()
        },
        updateWordWithTime(word, newData) {
            const allWords = self.getWords()
            if (!allWords.includes(word)) {
                allWords.push(word)
                allWords.sort()
                localStorage.setItem(allWordsKey(), JSON.stringify(allWords))
            }
            localStorage.setItem(wordKey(word), JSON.stringify(newData))
            _updateLastUpdate()
        },
        readAll() {
            const allData = {}
            const allWords = self.getWords()
            for (let word of allWords) {
                allData[word] = self.getWord(word)
            }
            return allData
        },
        clearData() {
            const allWords = self.getWords()
            for (let word of allWords) {
                localStorage.removeItem(wordKey(word))
            }
            localStorage.removeItem(allWordsKey())
        },
        lastUpdate() {
            return parseInt(localStorage.getItem(lastUpdateKey()) || '0', 10)
        }
    }
    return self
}

export function FirestoreWords() {

    const app = getApp()
    if (!app) {
        throw new Error(`FirestoreSets requires Firebase app to be initialized`)
    }
    const user = getUser()
    if (!user) {
        throw new Error(`FirestoreSets requires user to be logged in`)
    }
    const db = getFirestore(app)

    function _wordTemplate() {
        return {
            score: 0,
            lastUpdated: 0,
            creatorUID: user.uid
        }
    }

    const self = {
        async getWord(word) {
            const docSnapshot = await getDoc(doc(db, 'Users', user.uid, 'Words', word))
            if (!docSnapshot.exists()) {
                return _wordTemplate()
            }
            return docSnapshot.data()
        },
        async updateWord(word, newScore) {
            const now = new Date().getTime()
            const newData = {
                score: newScore,
                lastUpdated: now,
                creatorUID: user.uid
            }
            await setDoc(doc(db, 'Users', user.uid, 'Words', word), newData)
        }
    }
    return self
}

export function updateScore(score, isHit) {
    if (isHit) {
        return Math.min(MILESTONES[MILESTONES.length - 1], score + 1)
    } else {
        return MILESTONES[previousMilestone(score)]
    }
}

export function getActualScore(score, lastUpdated) {
    const now = new Date().getTime()
    return Math.max(0, score - penalty(now - lastUpdated, PENALTY_FREQUENCY, PENALTY_GRACE_PERIOD))
}

export function getExperience(score) {
    const currentMilestoneScore = MILESTONES[currentMilestone(score)]
    const nextMilestoneScore = MILESTONES[nextMilestone(score)]

    if (currentMilestoneScore === MILESTONES[MILESTONES.length - 1]) {
        return 0
    }

    return (score - currentMilestoneScore) / (nextMilestoneScore - currentMilestoneScore)
}

export function isMaxScore(score) {
    return score === MILESTONES[MILESTONES.length - 1]
}

export function willLevelUp(score) {
    return currentMilestone(score) !== currentMilestone(score + 1)
}

export function currentMilestone(score) {
    const pair = MILESTONES.map((x, i) => ({ x, i })).find(({ x }) => score < x)
    if (pair) {
        return pair.i - 1
    }
    return MILESTONES.length - 1
}
export function nextMilestone(score) {
    return Math.min(currentMilestone(score) + 1, MILESTONES.length - 1)
}
export function previousMilestone(score) {
    return Math.max(currentMilestone(score) - 1, 0)
}

/**
 * There's a grace period where no penalty is applied.
 * After the grace period 1 score point is substracted regularly in accordance with the frequency parameter.
 * 
 * @param {*} t inactivity time
 * @returns score penalty for having not been active during t milliseconds
 */
export const penalty = (t, frequency = daysToMillis(1), gracePeriod = daysToMillis(1)) => (
    Math.floor(Math.max(0, t - gracePeriod) / frequency)
)

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