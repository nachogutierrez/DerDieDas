import { LRUCache, serialize, deserialize } from "./lru.js"

function loadCache() {
    let serializedLru = localStorage.getItem('api_responses')
    if (serializedLru !== null) {
        return deserialize(serializedLru)
    } else {
        return new LRUCache(500)
    }
}

function saveCache(cache) {
    localStorage.setItem('api_responses', serialize(cache))
}

export async function getApi() {
    const config = await (await fetch('config.json')).json()
    const { apiEndpoint } = config
    return API(apiEndpoint)
}

function API(endpoint) {

    async function search(query) {
        let cache = loadCache()
        const cachedResponse = cache.get(query)
        if (!(cachedResponse < 0)) {
            console.debug(`search("${query}") cache hit`)
            return cachedResponse
        }
        console.debug(`search("${query}") cache miss`)

        const url = `${endpoint}/search?query=${encodeURIComponent(query)}`
        const response = await fetch(url)
        const wordList = await response.json()

        cache = loadCache()
        cache.put(query, wordList)
        saveCache(cache)
        return wordList
    }

    async function get(query) {
        const response = await search(query)
        const word = response.find(x => x.key.toLowerCase() === query.toLowerCase())
        if (!word) {
            throw new Error(`Word not found: ${query}`)
        }
        return word
    }

    return {
        search,
        get
    }
}