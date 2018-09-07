require('envkey')
const { Database } = require('arangojs')
const knex = require('knex')
const AWS = require('aws-sdk')

const AQL_URL = `${process.env.AQL_PROTOCOL}://${process.env.AQL_HOST}:${process.env.AQL_PORT}`
const aql = new Database({ url: AQL_URL })
aql.useDatabase(process.env.AQL_NAME)
aql.useBasicAuth(process.env.AQL_USER, process.env.AQL_PASS)

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

AWS.config.update({
  region: process.env.AWS_DEFAULT_REGION
})
const nosql = new AWS.DynamoDB.DocumentClient()

// const nosql = new Database({ url: NOSQL_URL })
// nosql.useDatabase(process.env.NOSQL_NAME)
// nosql.useBasicAuth(process.env.NOSQL_USER, process.env.NOSQL_PASS)

// const script = require(`./arango-to-mysql`);
const script = async ({ aql, sql, nosql }) => {
  console.log('Yaaaaaas!')

  const collectionCursor = aql.collection('surveys')
  const collectionCursorAll = await collectionCursor.all()
  const surveys = await collectionCursorAll.all()
  console.log('surveys', surveys)

  try {
    const people = await sql.select().from('people')
    console.log('people', people)
  } catch (error) {
    console.log('error', error.message)
  }

  const newitem = await nosql.put({
    TableName: 'test',
    Item: {
      id: 0,
      key: 'value'
    }
  })
  console.log('newitem', newitem)
}

(async () => {
  let exitCode = 0
  try {
    await script({ aql, sql, nosql })
  } catch (error) {
    console.log('\n\n', error)
    exitCode = 1
  } finally {
    // await sql.destroy()
    process.exit(exitCode)
  }
})()
