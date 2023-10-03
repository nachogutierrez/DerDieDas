const CACHE_KEY = "cached_sets"

function saveSets(sets) {
    localStorage.setItem(CACHE_KEY, sets.serialize())
}

export function loadSets() {
    return Sets(localStorage.getItem(CACHE_KEY))
}

function Sets(serializedSets = "") {

    let sets = {}
    if (serializedSets) {
        sets = JSON.parse(serializedSets)
    }

    function getSets() {
        return Object.keys(sets).sort()
    }

    function getWords(setId) {
        if (!(setId in sets)) {
            return []
        }
        return Object.keys(sets[setId]).sort()
    }

    function hasWord(setId, word) {
        if (!(setId in sets)) {
            return false
        }
        return sets[setId][word]
    }

    function add(setName) {
        if (!(setName in sets)) {
            sets[setName] = {}
        }
        saveSets(this)
    }

    function remove(setName) {
        delete sets[setName]
        saveSets(this)
    }

    function addWord(setName, word) {
        if (!(setName in sets)) {
            sets[setName] = {}
        }
        sets[setName][word] = true
        saveSets(this)
    }

    function removeWord(setName, word) {
        if (!(setName in sets)) {
            return
        }
        delete sets[setName][word]
        saveSets(this)
    }

    function serialize() {
        return JSON.stringify(sets)
    }

    return {
        getSets,
        getWords,
        hasWord,
        add,
        remove,
        addWord,
        removeWord,
        serialize
    }
}