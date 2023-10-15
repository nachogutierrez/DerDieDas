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
            return _runQuery(collection(db, 'Users', user.uid, 'Sets'))
        },
        async addSet(setName) {
            if (await self.hasSet(setName)) {
                throw new Error(`Set '${setName}' already exists`)
            }

            return setDoc(doc(db, 'Users', user.uid, 'Sets', setName), {
                creatorUID: user.uid
            })
        },
        async removeSet(setName) {
            return deleteDoc(doc(db, 'Users', user.uid, 'Sets', setName))
        },
        async hasSet(setName) {
            return _docExists(doc(db, 'Users', user.uid, 'Sets', setName))
        },
        async getWords(setName) {
            return _runQuery(collection(db, 'Users', user.uid, 'Sets', setName, 'Words'))
        },
        async addWord(setName, word) {
            if (await self.hasWord(setName, word)) {
                throw new Error(`Set '${setName}' already contains word ${word}`)
            }

            return setDoc(doc(db, 'Users', user.uid, 'Sets', setName, 'Words', word), {
                creatorUID: user.uid
            })
        },
        async removeWord(setName, word) {
            return deleteDoc(doc(db, 'Users', user.uid, 'Sets', setName, 'Words', word))
        },
        async hasWord(setName, word) {
            return _docExists(doc(db, 'Users', user.uid, 'Sets', setName, 'Words', word))
        }
    }
    return self
}