require('envkey')
const { Database } = require('arangojs')
// const knex = require('knex')

const AQL_URL = `${process.env.AQL_PROTOCOL}://${process.env.AQL_HOST}:${process.env.AQL_PORT}`
// const NOSQL_URL = `${process.env.NOSQL_PROTOCOL}://${process.env.NOSQL_HOST}:${process.env.NOSQL_PORT}`

const aql = new Database({ url: AQL_URL })
aql.useDatabase(process.env.AQL_NAME)
aql.useBasicAuth(process.env.AQL_USER, process.env.AQL_PASS)

// const sql = knex({
//   client: 'mysql',
//   connection: {
//     host: process.env.SQL_HOST,
//     port: process.env.SQL_PORT,
//     user: process.env.SQL_USER,
//     password: process.env.SQL_PASS,
//     database: process.env.SQL_NAME,
//     charset: 'utf8mb4'
//   }
// })
//
// const nosql = new Database({ url: NOSQL_URL })
// nosql.useDatabase(process.env.NOSQL_NAME)
// nosql.useBasicAuth(process.env.NOSQL_USER, process.env.NOSQL_PASS)

// const script = require(`./arango-to-mysql`);
const script = async ({ aql, sql, nosql }) => {
  console.log('Yaaaaaas!')
}

(async () => {
  let exitCode = 0
  try {
    // await script({ aql, sql, nosql })
    await script({})
  } catch (error) {
    console.log('\n\n', error)
    exitCode = 1
  } finally {
    // await sql.destroy()
    process.exit(exitCode)
  }
})()
