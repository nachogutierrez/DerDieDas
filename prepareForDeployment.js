const fs = require('fs');

const args = process.argv.slice(2)

const exampleConfigFilePath = `./frontend/config.example.json`
const configFilePath = `./frontend/config.json`
const config = require(exampleConfigFilePath);

switch (args[0]) {
    case 'LOCAL':
        config.apiEndpoint = 'http://localhost:7070'
        break
    case 'PROD':
        config.apiEndpoint = 'https://derdiedas-backend.nachogutierrezibanez.com'
        break
    default:
        throw new Error('Invalid environment: ' + args[0])
}

fs.writeFileSync(configFilePath, JSON.stringify(config, null, 4), 'utf8');
console.log('Updated config for production deployment.');