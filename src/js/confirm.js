require('envkey')
const { Database } = require('arangojs')
const knex = require('knex')

const DB_URL = `${process.env.DB_PROTOCOL}://${process.env.DB_HOST}:${process.env.DB_PORT}`
const db = new Database({ url: DB_URL })
db.useDatabase(process.env.DB_NAME)
db.useBasicAuth(process.env.DB_USER, process.env.DB_PASS)

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
