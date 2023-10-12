import express from 'express'
import cors from 'cors'
import DB from './elasticsearch/db.js'
import fs from 'fs/promises'

// Maybe replace with dotenv
const PORT = process.env.PONS_API_PORT || 7070
const app = express()
const db = DB()

const articles = { m: 'der', n: 'das', f: 'die' }

app.use(cors())

function formatDocument(document) {
    return {
        ...document._source,
        article: articles[document._source.genus]
    }
}

app.get('/search', async (req, res) => {
    const { query } = req.query
    try {
        const response = await db.search(query)
        const mapped = response.map(formatDocument)
        res.json(mapped)
        console.log(`${formatDate(new Date())} GET /search?query=${query} Status=200`)
    } catch (e) {
        console.log(`${formatDate(new Date())} GET /search?query=${query} Status=400`)
        throw e
    }
})

app.get('/get', async (req, res) => {
    const { query } = req.query
    const response = await db.get(query)
    let status = 200
    if (response.length === 0) {
        status = 404
        res.status(404).send('Not found')
    } else {
        const mapped = response.map(formatDocument)
        res.json(mapped[0])
    }

    console.log(`${formatDate(new Date())} GET /get?query=${query} Status=${status}`)
})

app.listen(PORT, () => {
    console.log(`app listening on port ${PORT}`)
})

function formatDate(d) {
    const pad = (n) => (n < 10 ? '0' + n : n);

    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);  // Months are zero-based
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    const ss = pad(d.getSeconds());

    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}