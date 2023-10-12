import { Client } from '@elastic/elasticsearch'
const client = new Client({
    node: 'http://localhost:9200',
});

const args = process.argv.slice(2)
let fuzziness = 1

if (!args[0]) {
    throw new Error(`fuzzySearch.js requires at least 1 positional argument to indicate the search query`)
}
const query = args[0].trim()

if (args[1]) {
    fuzziness = parseInt(args[1], 10)
}

async function fuzzySearch() {
    try {
        const response = await client.search({
            index: 'nouns',
            body: {
                // explain: true,
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

        console.log(response.hits.hits)
    } catch (error) {
        console.error('Error executing search:', error);
    }
}

fuzzySearch();