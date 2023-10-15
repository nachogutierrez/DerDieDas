import { LocalSets } from "./sets.js";
import { LocalWords } from "./words.js";
import { getApp, getUser } from "./firebase.js";
import { getStorage, ref, uploadBytes, getMetadata, getDownloadURL } from "firebase/storage";

export async function downloadData() {
    const app = getApp()
    const user = getUser()
    if (!app) {
        throw new Error(`_uploadState requires Firebase app to be initialized`)
    }
    if (!user) {
        throw new Error(`_uploadState requires the user to be authenticated`)
    }
    const storage = getStorage()
    const setsFileRef = ref(storage, `${user.uid}/sets/data.json`)
    const wordsFileRef = ref(storage, `${user.uid}/words/data.json`)

    const sets = LocalSets()
    const words = LocalWords()

    sets.clearData()
    words.clearData()

    if (await _fileExists(setsFileRef)) {
        console.debug(`Found sets data, downloading...`)
        const setsData = await _downloadJson(setsFileRef)
        for (let setName of Object.keys(setsData)) {
            sets.addSet(setName)
            for (let word of setsData[setName]) {
                sets.addWord(setName, word)
            }
        }
        console.debug(`Successfully downloaded sets data`)
    }

    if (await _fileExists(wordsFileRef)) {
        console.debug(`Found words data, downloading...`)
        const wordsData = await _downloadJson(wordsFileRef)
        for (let word of Object.keys(wordsData)) {
            words.updateWordWithTime(word, wordsData[word])
        }
        console.debug(`Successfully downloaded words data`)
    }
}

async function _downloadJson(fileRef) {
    const url = await getDownloadURL(fileRef)
    const response = await fetch(url)
    return response.json()
}

async function _fileExists(fileRef) {
    try {
        await getMetadata(fileRef)
        return true
    } catch (error) {
        if (error.code === 'storage/object-not-found') {
            return false
        } else {
            throw error
        }
    }
}

export function startStateUploader() {
    _uploadState('sets', LocalSets())
    _uploadState('words', LocalWords())
}

async function _uploadState(name, client, freq = 1000 * 60) {
    const lastUploadKey = `${name}_lastUpload`
    const lastUpload = parseInt(localStorage.getItem(lastUploadKey) || '0', 10)
    const lastUpdate = client.lastUpdate()
    if (lastUpdate >= lastUpload) {
        const app = getApp()
        const user = getUser()
        if (!app) {
            throw new Error(`_uploadState requires Firebase app to be initialized`)
        }
        if (!user) {
            throw new Error(`_uploadState requires the user to be authenticated`)
        }
        const storage = getStorage()
        const fileRef = ref(storage, `${user.uid}/${name}/data.json`)
        const file = new Blob([JSON.stringify(client.readAll())], { type: 'application/json' })

        console.debug(`Client ${name} changed, uploading...`)
        await uploadBytes(fileRef, file)
        localStorage.setItem(lastUploadKey, `${new Date().getTime()}`)
        console.debug(`Upload successful. Sleeping for ${freq}ms...`)
        setTimeout(() => _uploadState(name, client, freq), freq)

    } else {
        console.debug(`Client ${name} hasn't changed. Sleeping for ${freq}ms...`);
        setTimeout(() => _uploadState(name, client, freq), freq)
    }
}