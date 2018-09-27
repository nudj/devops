const reduce = require('lodash/reduce')
const map = require('lodash/map')
const mapValues = require('lodash/mapValues')
const uniq = require('lodash/uniq')
const get = require('lodash/get')
const isNil = require('lodash/isNil')
const promiseSerial = require('promise-serial')
const {
  OLD_COLLECTIONS,
  TABLE_ORDER,
  RELATIONS,
  SELF_RELATIONS,
  FROM_TO_RELATIONS,
  MANY_RELATIONS,
  ORDER_CACHES,
  fieldToPath,
  dateToTimestamp,
  newTableToOldCollection
} = require('./helpers')
const {
  TABLES,
  FIELDS,
  SLUG_GENERATORS
} = require('./sql')

async function action ({ db, sql }) {
  const idMaps = {}
  const slugMaps = {}

  // loop over sql tables in specific order to comply with foreign key contraints
  await promiseSerial(TABLE_ORDER.map(tableName => async () => {
    const slugConfig = SLUG_GENERATORS[tableName]
    idMaps[tableName] = {}
    slugMaps[tableName] = {}

    // fetch all items from the corresponding Arango collection
    const collectionName = newTableToOldCollection(tableName)
    const collectionCursor = db.collection(collectionName)
    const collectionCursorAll = await collectionCursor.all()
    const items = await collectionCursorAll.all()

    // loop over every item in the corresponding Arango collection
    await promiseSerial(items.map(item => async () => {
      const scalars = reduce(FIELDS[tableName], (scalars, field) => {
        const value = get(item, fieldToPath(tableName, field))
        if (!isNil(value)) {
          scalars[field] = typeof value === 'object' ? JSON.stringify(value) : value
        }
        return scalars
      }, {})
      const relations = mapValues(RELATIONS[tableName] || {}, (foreignTable, field) => {
        const value = idMaps[foreignTable][get(item, fieldToPath(tableName, field))]
        if (!value) {
          console.log('Relation not found for', tableName, item._key, field, get(item, fieldToPath(tableName, field)))
        }
        return value
      })

      // prepare insert data
      const data = {
        created: dateToTimestamp(item.created),
        modified: dateToTimestamp(item.modified),
        ...scalars,
        ...relations
      }

      // if slug required and slug does not already exist on the item, generate new slug
      if (slugConfig && !item.slug) {
        data.slug = slugConfig.generator(data)
      }

      // create new record in MySQL table
      let id
      // loop to allow for slug clashes
      while (!id) {
        try {
          [ id ] = await sql(tableName).insert(data)
        } catch (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            const index = error.sqlMessage.split("'").splice(-2, 1)[0]
            if (slugConfig && slugConfig.index && index && index === slugConfig.index) {
              // refresh slug when former slug clashes
              data.slug = slugConfig.generator(data, true)
            } else {
              // not a slug clash so throw
              throw error
            }
          } else {
            // not a duplicate entry error so throw
            throw error
          }
        }
      }

      // cache map from Arango key to MySQL id for the given table
      idMaps[tableName][item._key] = id

      // if required cache map from Arango key to slug for the given table
      if (slugConfig) {
        slugMaps[tableName][item._key] = data.slug
      }

      // create edge records for one->many relationships (which are stored as Array<key>'s in Arango and are unsupported in MySQL)
      if (MANY_RELATIONS[tableName]) {
        // loop over the fields that hold one->many relations
        await promiseSerial(map(MANY_RELATIONS[tableName], (edgeRelation, field) => async () => {
          const {
            tableName: edgeTableName,
            relations
          } = edgeRelation

          // loop over every key in the one->many Array<key>
          await promiseSerial(uniq(item[field]).map(childKey => async () => {
            // fetch the id mapping for the edge record foreign keys
            const edgeRelations = mapValues(relations, foreignTableName => {
              const key = foreignTableName === tableName ? item._key : childKey
              return idMaps[foreignTableName][key]
            })

            // create a new edge record in the edge table
            await sql(edgeTableName).insert({
              created: dateToTimestamp(item.created),
              modified: dateToTimestamp(item.modified),
              ...edgeRelations
            })
          }))
        }))
      }
    })) // items.map

    // retroactively update records with relations that reference the same table (because we need to know the id of the record we are referencing)
    if (SELF_RELATIONS[tableName]) {
      await promiseSerial(items.map(item => async () => {
        const selfRelations = SELF_RELATIONS[tableName].reduce((selfRelations, field) => {
          const id = idMaps[tableName][item[field]]
          if (id) {
            selfRelations[field] = id
          }
          return selfRelations
        }, {})
        if (Object.keys(selfRelations).length) {
          const recordId = idMaps[tableName][item._key]
          await sql(tableName).where('id', '=', recordId).update(selfRelations)
        }
      }))
    }

    // retroactively update records with relations that reference the same table (because we need to know the id of the record we are referencing) and store in a new edge table
    if (FROM_TO_RELATIONS[tableName]) {
      const {
        field,
        edgeTable
      } = FROM_TO_RELATIONS[tableName]
      await promiseSerial(items.map(item => () => {
        const oldToKeys = item[field] || []
        return Promise.all(oldToKeys.map(toOldKey => {
          const to = idMaps[tableName][toOldKey]
          if (to) {
            return sql(edgeTable).insert({
              from: idMaps[tableName][item._key],
              to
            })
          }
        }))
      }))
    }
  })) // TABLE_ORDER.map

  // retroactively update order caches with new child relation ids
  await promiseSerial(map(ORDER_CACHES, (orderCacheField, tableName) => async () => {
    await promiseSerial(map(orderCacheField, (foreignTableName, field) => async () => {
      const fieldValues = await sql.select('id', 'modified', field).from(tableName)
      await promiseSerial(fieldValues.map(item => async () => {
        const oldOrderArray = JSON.parse(item[field])
        const newOrderArray = oldOrderArray.map(oldId => idMaps[foreignTableName][oldId])
        await sql(tableName).where('id', '=', item.id).update({
          // preserve existing modified timestamp
          modified: item.modified,
          [field]: JSON.stringify(newOrderArray)
        })
      }))
    }))
  }))

  // create currentEmployments
  const employmentsCursor = db.collection(OLD_COLLECTIONS.EMPLOYMENTS)
  const employmentsCurrentCursor = await employmentsCursor.byExample({
    current: true
  })
  const employmentsCurrent = await employmentsCurrentCursor.all()
  await promiseSerial(employmentsCurrent.map(employment => async () => {
    await sql(TABLES.CURRENT_EMPLOYMENTS).insert({
      created: dateToTimestamp(employment.created),
      modified: dateToTimestamp(employment.modified),
      employment: idMaps[TABLES.EMPLOYMENTS][employment._key],
      person: idMaps[TABLES.PEOPLE][employment.person]
    })
  }))

  // create currentPersonRoles
  const personRolesCursor = db.collection(OLD_COLLECTIONS.PERSON_ROLES)
  const personRolesCurrentCursor = await personRolesCursor.byExample({
    current: true
  })
  const personRolesCurrent = await personRolesCurrentCursor.all()
  await promiseSerial(personRolesCurrent.map(personRole => async () => {
    await sql(TABLES.CURRENT_PERSON_ROLES).insert({
      created: dateToTimestamp(personRole.created),
      modified: dateToTimestamp(personRole.modified),
      personRole: idMaps[TABLES.PERSON_ROLES][personRole._key],
      person: idMaps[TABLES.PEOPLE][personRole.person]
    })
  }))

  // loop over referral key->slug and store to help with old url remapping
  await promiseSerial(map(slugMaps[TABLES.REFERRALS], (slug, _key) => async () => {
    await sql(TABLES.REFERRAL_KEY_TO_SLUG_MAP).insert({
      [FIELDS[TABLES.REFERRAL_KEY_TO_SLUG_MAP].REFERRAL_KEY]: _key,
      [FIELDS[TABLES.REFERRAL_KEY_TO_SLUG_MAP].JOB_SLUG]: slug
    })
  }))
}

module.exports = action
