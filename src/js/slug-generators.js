const kebabCase = require('lodash/kebabCase')
const hash = require('hash-generator')

const randomSlugGenerator = () => hash(10)
const fieldSlugGenerator = field => (data, addRandom) => {
  let random = ''
  if (addRandom) {
    random = `-${hash(8)}`
  }
  return kebabCase(data[field]) + random
}

module.exports = {
  random: randomSlugGenerator,
  field: fieldSlugGenerator
}
