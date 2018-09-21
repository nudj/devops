require('envkey')
const { Database } = require('arangojs')
const knex = require('knex')

const AQL_URL = `${process.env.AQL_PROTOCOL}://${process.env.AQL_HOST}:${process.env.AQL_PORT}`
const db = new Database({ url: AQL_URL })
db.useDatabase(process.env.AQL_NAME)
db.useBasicAuth(process.env.AQL_USER, process.env.AQL_PASS)

const sql = knex({
  client: 'mysql',
  connection: {
    host: process.env.SQL_HOST,
    port: process.env.SQL_PORT,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASS,
    database: process.env.SQL_NAME,
    charset: 'utf8mb4'
  }
})

const script = require(`./confirm-evacuation`);

(async () => {
  let exitCode = 0
  try {
    await script({ db, sql })
  } catch (error) {
    console.log('\n\n', error)
    exitCode = 1
  } finally {
    // await sql.destroy()
    process.exit(exitCode)
  }
})()
