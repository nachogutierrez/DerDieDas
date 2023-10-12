import { Client } from '@elastic/elasticsearch'
const client = new Client({
    node: 'http://localhost:9200',
})

async function createIndex() {
    try {
        const response = await client.indices.create({
            index: 'nouns',
            body: {
                settings: {
                    number_of_shards: 1,
                    number_of_replicas: 1
                },
                mappings: {
                    properties: {
                        genus: { type: 'keyword' },
                        key: { type: 'text' },
                        singular: { type: 'keyword' },
                        plural: { type: 'keyword' },
                        translations: { type: 'text' }
                    }
                }
            }
        });
        console.log('Index created successfully:', response);
    } catch (error) {
        console.error('Error creating index:', error);
    }
}

createIndex();