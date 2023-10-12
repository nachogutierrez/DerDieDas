export async function getApi() {
    const config = await (await fetch('config.json')).json()
    const { apiEndpoint } = config
    return API(apiEndpoint)
}

// TODO: implement caching using LRU
function API(endpoint) {

    async function search(query) {
        const url = `${endpoint}/search?query=${encodeURIComponent(query)}`
        const response = await fetch(url)
        return response.json()
    }

    async function get(query) {
        const url = `${endpoint}/get?query=${encodeURIComponent(query)}`
        const response = await fetch(url)
        return response.json()
    }

    return {
        search,
        get
    }
}