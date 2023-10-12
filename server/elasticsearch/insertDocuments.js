import { Client } from '@elastic/elasticsearch'
import nouns from '../datasets/nouns.json' assert { type: "json" }
const client = new Client({
    node: 'http://localhost:9200',
});

async function insertDocuments() {
    const milestones = new Set()
    const start = new Date().getTime()
    const keys = Object.keys(nouns.words)
    let current = 0

    let body = []
    for (let key of keys) {
        let word = nouns.words[key]
        if (!word.genus) {
            word.plural = key
        } else {
            word.singular = key
        }
        word.key = key

        body.push({
            index: {
                _index: 'nouns',
                _id: key
            }
        })
        body.push(word)
        current++

        if (current % 1000 === 0) {
            await client.bulk({ refresh: true, body })
            body = []
        }

        const pct = Math.floor(100 * (current / keys.length))
        if (pct % 5 === 0 && !milestones.has(pct)) {
            milestones.add(pct)
            const elapsed = new Date().getTime() - start
            console.log(`Inserted ${pct}% of nouns in ${elapsed}ms`);
        }
    }

    if (body.length > 0) {
        await client.bulk({ refresh: true, body })
        body = []
    }
}

insertDocuments();