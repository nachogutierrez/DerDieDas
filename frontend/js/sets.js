import { getFirestore, collection, addDoc, setDoc, getDocs, getDoc, deleteDoc, doc } from 'firebase/firestore'
import { getApp, getUser } from './firebase.js'

const CACHE_KEY = "cached_sets"

function saveSets(sets) {
    localStorage.setItem(CACHE_KEY, sets.serialize())
}

export function loadSets() {
    return Sets(localStorage.getItem(CACHE_KEY), saveSets)
}

export function Sets(serializedSets = "", save = () => { }) {

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
        save(this)
    }

    function remove(setName) {
        delete sets[setName]
        save(this)
    }

    function addWord(setName, word) {
        if (!(setName in sets)) {
            sets[setName] = {}
        }
        sets[setName][word] = true
        save(this)
    }

    function removeWord(setName, word) {
        if (!(setName in sets)) {
            return
        }
        delete sets[setName][word]
        save(this)
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

// TODO: read from settings which client to use
export function getSetsClient() {
    return LocalSets()
}

export function LocalSets(prefix = '') {

    const cacheKeyPrefix = `${prefix}_LocalSets`

    const lastUpdateKey = () => `${cacheKeyPrefix}_lastUpdate`
    const setIdsKey = () => `${cacheKeyPrefix}_Sets`
    const wordIdsKey = setName => `${cacheKeyPrefix}_Sets_${setName}`

    function _updateLastUpdate() {
        localStorage.setItem(lastUpdateKey(), `${new Date().getTime()}`)
    }

    const self = {
        getSets() {
            return JSON.parse(localStorage.getItem(setIdsKey()) || '[]')
        },
        addSet(setName) {
            const sets = self.getSets()
            if (sets.includes(setName)) {
                console.warn(`LocalSets already includes set with name '${setName}'`)
                return
            }
            sets.push(setName)
            sets.sort()
            localStorage.setItem(setIdsKey(), JSON.stringify(sets))
            _updateLastUpdate()
        },
        removeSet(setName) {
            const sets = self.getSets().filter(name => name !== setName)
            localStorage.setItem(setIdsKey(), JSON.stringify(sets))
            localStorage.removeItem(wordIdsKey(setName))
            _updateLastUpdate()
        },
        hasSet(setName) {
            return self.getSets().includes(setName)
        },
        getWords(setName) {
            return JSON.parse(localStorage.getItem(wordIdsKey(setName)) || '[]')
        },
        addWord(setName, word) {
            const words = self.getWords(setName)
            if (words.includes(word)) {
                console.warn(`LocalSets already includes word '${word}' in set '${setName}'`)
                return
            }
            words.push(word)
            words.sort()
            localStorage.setItem(wordIdsKey(setName), JSON.stringify(words))
            _updateLastUpdate()
        },
        removeWord(setName, word) {
            const words = self.getWords(setName).filter(name => name !== word)
            localStorage.removeItem(wordIdsKey(setName), words)
            _updateLastUpdate()
        },
        hasWord(setName, word) {
            return self.getWords(setName).includes(word)
        },
        readAll() {
            let allData = {}
            const sets = self.getSets()
            for (let setName of self.getSets()) {
                allData[setName] = self.getWords(setName)
            }
            return allData
        },
        clearData() {
            const sets = self.getSets()
            for (let setName of self.getSets()) {
                localStorage.removeItem(wordIdsKey(setName))
            }
            localStorage.removeItem(setIdsKey())
        },
        lastUpdate() {
            return parseInt(localStorage.getItem(lastUpdateKey()) || '0', 10)
        }
    }
    return self
}

export function FirestoreSets() {

    const app = getApp()
    if (!app) {
        throw new Error(`FirestoreSets requires Firebase app to be initialized`)
    }
    const user = getUser()
    if (!user) {
        throw new Error(`FirestoreSets requires user to be logged in`)
    }
    const db = getFirestore(app)

    async function _runQuery(query) {
        const querySnapshot = await getDocs(query)
        let documents = []
        querySnapshot.forEach(doc => documents.push(doc))
        return documents
    }

    async function _docExists(docRef) {
        const docSnapshot = await getDoc(docRef)
        return docSnapshot.exists()
    }

    const self = {
        async getSets() {
            const snapshot = await _runQuery(collection(db, 'Users', user.uid, 'Sets'))
            return snapshot.map(doc => doc.id)
        },
        async addSet(setName) {
            if (await self.hasSet(setName)) {
                console.warn(`FirestoreSets already includes set with name '${setName}'`)
                return
            }

            await setDoc(doc(db, 'Users', user.uid, 'Sets', setName), {
                creatorUID: user.uid
            })
        },
        async removeSet(setName) {
            await deleteDoc(doc(db, 'Users', user.uid, 'Sets', setName))
        },
        async hasSet(setName) {
            return _docExists(doc(db, 'Users', user.uid, 'Sets', setName))
        },
        async getWords(setName) {
            const snapshot = await _runQuery(collection(db, 'Users', user.uid, 'Sets', setName, 'Words'))
            return snapshot.map(doc => doc.id)
        },
        async addWord(setName, word) {
            if (await self.hasWord(setName, word)) {
                console.warn(`FirestoreSets already includes word '${word}' in set '${setName}'`)
                return
            }

            await setDoc(doc(db, 'Users', user.uid, 'Sets', setName, 'Words', word), {
                creatorUID: user.uid
            })
        },
        async removeWord(setName, word) {
            await deleteDoc(doc(db, 'Users', user.uid, 'Sets', setName, 'Words', word))
        },
        async hasWord(setName, word) {
            return _docExists(doc(db, 'Users', user.uid, 'Sets', setName, 'Words', word))
        }
    }
    return self
}