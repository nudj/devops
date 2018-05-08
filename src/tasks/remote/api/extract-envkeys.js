require('envkey')
const vars = process.env
const args = process.argv.slice(2)

process.stdout.write(args.map(envName => `-e ${envName}=${vars[envName]}`).join(' '))
