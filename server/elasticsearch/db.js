import { Client } from '@elastic/elasticsearch'


export default function DB() {
    const client = new Client({
        node: 'http://localhost:9200',
    })

    async function search(query) {
        const response = await client.search({
            index: 'nouns',
            body: {
                query: {
                    bool: {
                        should: [
                            {
                                match: {
                                    key: {
                                        query,
                                        fuzziness: "AUTO"
                                    }
                                }
                            },
                            {
                                match: {
                                    translations: {
                                        query,
                                        fuzziness: "AUTO"
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        });

        return response.hits.hits
    }

    async function get(key) {
        const response = await client.search({
            index: 'nouns',
            body: {
                query: {
                    match: {
                        key: {
                            query: key
                        }
                    }
                }
            }
        });

        return response.hits.hits
    }

    return {
        search,
        get
    }
}