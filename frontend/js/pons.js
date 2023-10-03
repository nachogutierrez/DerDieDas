import { LRUCache, serialize, deserialize } from "./lru.js"

function getCache(key) {
    let serializedLru = localStorage.getItem(key)
    if (serializedLru !== null) {
        return deserialize(serializedLru)
    } else {
        return new LRUCache(1000)
    }
}

function saveCache(key, lru) {
    localStorage.setItem(key, serialize(lru))
}

function jsonApiActions(api, endpoints = {}) {
    let actions = {}

    for (let key in endpoints) {
        actions[key] = async function (...params) {
            const endpoint = endpoints[key](...params)
            const url = `${api}${endpoint}`
            const response = await fetch(url)
            if (response.status === 204) {
                return undefined
            }
            return await (response).json()
        }
    }

    return actions
}

function cachedActions(name, actions = {}, options = {}) {
    const { cacheCapacity = 100 } = options
    const lru = getCache(name)
    cachedVersion = {}
    for (let key in actions) {
        cachedVersion[key] = function (...params) {
            const cacheKey = JSON.stringify([key, ...params])
            const response = lru.get(cacheKey)
            if (response < 0) {
                console.log(`Calling ${cacheKey}`)
                response = actions[key](...params)
                lru.put(cacheKey, response)
                localStorage.setItem(name, serialize(lru))
            } else {
                console.log(`Found ${cacheKey} in cache`)
            }
            return response
        }
    }
}

export function rawApi(api) {
    return jsonApiActions(api, {
        dictionaries: () => '/v1/dictionaries?language=en',
        dictionary: ({ l, q, inLanguage, fm = false }) => `/v1/dictionary?l=${l}&q=${q}${inLanguage !== undefined ? `&in=${inLanguage}` : ''}${fm ? '&fm=1' : ''}&language=en`
    })
}

export async function getPons() {
    const config = await (await fetch('config.json')).json()
    const { apiEndpoint } = config
    return PONS(apiEndpoint)
}

export function PONS(api = 'localhost:7070') {
    const raw = rawApi(api)

    async function get(word) {
        const wordsLru = getCache('words')
        const item = wordsLru.get(word)
        if (!(item < 0)) {
            return item
        }
        const response = await search(word)
        if (response.includes(word)) {
            return wordsLru.get(word)
        }
        return undefined
    }

    async function search(query) {

        let responsesLru = getCache('api_responses')
        const cachedResponse = responsesLru.get(query)
        if (!(cachedResponse < 0)) {
            console.debug(`search("${query}") cache hit`)
            return cachedResponse
        }
        console.debug(`search("${query}") cache miss`)

        const headwords = []
        let hits = []
        const wordsLru = getCache('words')
        let response = await raw.dictionary({ l: 'deen', q: query, inLanguage: 'de', fm: true })
        if (response) {
            response = response[0]
            hits = response.hits
        }


        const validCharactersRegex = /^[abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZäöüßÄÖÜ-]+$/

        // Some words don't have two parts, like Eis
        const pluralRegex = /<span class="flexion">&lt;(.+), (.+)&gt;<\/span>/
        const genderRegex = /<acronym title="(\w+)">(m|nt|f)<\/acronym>/

        for (let hit of hits) {
            if (!hit.roms) {
                continue
            }
            const rom = hit.roms[0]
            if (rom.wordclass !== 'noun') {
                continue
            }
            const word = rom.headword.replaceAll('·', '')
            if (word.match(validCharactersRegex) === null) {
                continue
            }

            const pluralMatching = rom.headword_full.match(pluralRegex)
            const genderMatching = rom.headword_full.match(genderRegex)

            if (genderMatching === null) {
                continue
            }
            let pluralWord
            if (pluralMatching !== null) {
                pluralWord = pluralMatching[2]
                if (pluralWord.startsWith('-')) {
                    pluralWord = `${word}${pluralWord.substring(1)}`
                }
            }
            const gender = genderMatching[2]
            const articles = { m: 'der', nt: 'das', f: 'die' }

            const translation = rom.arabs[0].translations[0].target

            const item = {
                article: articles[gender],
                word,
                pluralWord,
                translation
            }
            wordsLru.put(word, item)
            headwords.push(word)
        }

        responsesLru = getCache('api_responses')
        responsesLru.put(query, headwords)
        saveCache('api_responses', responsesLru)
        saveCache('words', wordsLru)
        return headwords
    }

    return {
        get,
        search
    }
}