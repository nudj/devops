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

// const script = require(`./arango-to-mysql`);
const script = async ({ db, sql }) => {
  console.log('Yaaaaaas!')

  const collectionCursor = db.collection('surveys')
  const collectionCursorAll = await collectionCursor.all()
  const surveys = await collectionCursorAll.all()
  console.log('surveys', surveys)

  try {
    const people = await sql.select().from('people')
    console.log('people', people)
  } catch (error) {
    console.log('error', error.message)
  }
}

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
