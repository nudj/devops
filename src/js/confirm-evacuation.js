const promiseSerial = require('promise-serial')
const {
  TABLE_ORDER,
  newTableToOldCollection
} = require('./helpers')

async function action ({ db, sql }) {
  await promiseSerial(TABLE_ORDER.map(tableName => async () => {
    const collectionName = newTableToOldCollection(tableName)
    const collectionCursor = db.collection(collectionName)
    const aqlCount = await collectionCursor.count()

    const sqlCount = await sql(tableName).count()

    console.log('aqlCount', aqlCount)
    console.log('sqlCount', sqlCount)
    const result = aqlCount === sqlCount ? '👍' : '👎'
    console.log(`${tableName} (${sqlCount}) - ${collectionName} (${aqlCount}) - ${result}`)
  }))
}

module.exports = action
