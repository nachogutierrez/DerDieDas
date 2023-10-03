import express from 'express'
import cors from 'cors'
import fs from 'fs/promises'

// Maybe replace with dotenv
const SECRETS = JSON.parse(await fs.readFile('secrets.json', 'utf-8'))
const PORT = process.env.PONS_API_PORT || 7070
const PONS_API = 'https://api.pons.com'
const app = express()

app.use(cors())

const options = {
    headers: {
        'X-Secret': SECRETS['pons.secret']
    }
}

app.use(async (req, res, next) => {
    const url = `${PONS_API}${req.originalUrl}`
    console.log(`Calling PONS api: ${url}`)
    const ponsResponse = await fetch(url, options)
    res.status(ponsResponse.status).send(await ponsResponse.text())
})

app.listen(PORT, () => {
    console.log(`app listening on port ${PORT}`)
})