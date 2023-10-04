import express from 'express'
import cors from 'cors'
import fs from 'fs/promises'

// Maybe replace with dotenv
const SECRETS = JSON.parse(await fs.readFile('.secrets.json', 'utf-8'))
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
    const ponsResponse = await fetch(url, options)
    console.log(`${formatDate(new Date())} Calling PONS api: ${url} Status=${ponsResponse.status}`)
    if (ponsResponse.status > 400) {
        console.error(await ponsResponse.text())
    }
    res.status(ponsResponse.status).send(await ponsResponse.text())
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