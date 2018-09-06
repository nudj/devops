const deepmerge = require('deepmerge')
const invert = require('lodash/invert')
const reduce = require('lodash/reduce')

const slugGenerators = require('./slug-generators')

// make merge non-destructive (emulates immutability)
const merge = (...objs) => deepmerge.all([{}, ...objs], { clone: true })

const TABLES = {
  ACCEPTED_ACCESS_REQUESTS: 'acceptedAccessRequests',
  ACCESS_REQUESTS: 'accessRequests',
  ACCOUNTS: 'accounts',
  APPLICATIONS: 'applications',
  COMPANIES: 'companies',
  COMPANY_SURVEYS: 'companySurveys',
  CONNECTIONS: 'connections',
  CONVERSATIONS: 'conversations',
  CURRENT_EMPLOYMENTS: 'currentEmployments',
  CURRENT_PERSON_ROLES: 'currentPersonRoles',
  EMPLOYEES: 'employees',
  EMPLOYMENTS: 'employments',
  HIRERS: 'hirers',
  JOBS: 'jobs',
  JOB_TAGS: 'jobTags',
  PEOPLE: 'people',
  PERSON_ROLES: 'personRoles',
  REFERRALS: 'referrals',
  RELATED_JOBS: 'relatedJobs',
  ROLES: 'roles',
  ROLE_TAGS: 'roleTags',
  SURVEYS: 'surveys',
  SURVEY_ANSWERS: 'surveyAnswers',
  SURVEY_ANSWER_CONNECTIONS: 'surveyAnswerConnections',
  SURVEY_QUESTIONS: 'surveyQuestions',
  SURVEY_QUESTION_TAGS: 'surveyQuestionTags',
  SURVEY_SECTIONS: 'surveySections',
  TAGS: 'tags'
}
const TABLES_INVERTED = invert(TABLES)
const FIELDS = {
  GENERIC: {
    ID: 'id',
    CREATED: 'created',
    MODIFIED: 'modified'
  },
  [TABLES.ACCOUNTS]: {
    EMAIL: 'email',
    EMAIL_ADDRESSES: 'emailAddresses',
    DATA: 'data',
    TYPE: 'type',
    PERSON: 'person'
  },
  [TABLES.APPLICATIONS]: {
    PERSON: 'person',
    JOB: 'job',
    REFERRAL: 'referral'
  },
  [TABLES.COMPANIES]: {
    NAME: 'name',
    SLUG: 'slug',
    DESCRIPTION: 'description',
    LOCATION: 'location',
    LOGO: 'logo',
    URL: 'url',
    CLIENT: 'client',
    HASH: 'hash'
  },
  [TABLES.CONNECTIONS]: {
    FIRST_NAME: 'firstName',
    LAST_NAME: 'lastName',
    SOURCE: 'source',
    PERSON: 'person',
    FROM: 'from',
    ROLE: 'role',
    COMPANY: 'company'
  },
  [TABLES.CONVERSATIONS]: {
    THREAD_ID: 'threadId',
    TYPE: 'type',
    PERSON: 'person',
    RECIPIENT: 'recipient'
  },
  [TABLES.EMPLOYEES]: {
    PERSON: 'person',
    COMPANY: 'company'
  },
  [TABLES.EMPLOYMENTS]: {
    SOURCE: 'source',
    PERSON: 'person',
    COMPANY: 'company'
  },
  [TABLES.CURRENT_EMPLOYMENTS]: {
    EMPLOYMENT: 'employment',
    PERSON: 'person'
  },
  [TABLES.HIRERS]: {
    ONBOARDED: 'onboarded',
    TYPE: 'type',
    PERSON: 'person',
    COMPANY: 'company'
  },
  [TABLES.JOBS]: {
    TITLE: 'title',
    SLUG: 'slug',
    URL: 'url',
    LOCATION: 'location',
    REMUNERATION: 'remuneration',
    TEMPLATE: 'template',
    DESCRIPTION: 'description',
    CANDIDATE_DESCRIPTION: 'candidateDescription',
    ROLE_DESCRIPTION: 'roleDescription',
    EXPERIENCE: 'experience',
    REQUIREMENTS: 'requirements',
    BONUS: 'bonus',
    STATUS: 'status',
    COMPANY: 'company'
  },
  [TABLES.JOB_TAGS]: {
    SOURCE: 'source',
    JOB: 'job',
    TAG: 'tag'
  },
  [TABLES.PEOPLE]: {
    EMAIL: 'email',
    FIRST_NAME: 'firstName',
    LAST_NAME: 'lastName',
    URL: 'url',
    EMAIL_PREFERENCE: 'emailPreference'
  },
  [TABLES.PERSON_ROLES]: {
    PERSON: 'person',
    ROLE: 'role',
    SOURCE: 'source'
  },
  [TABLES.CURRENT_PERSON_ROLES]: {
    PERSON: 'person',
    PERSON_ROLE: 'personRole'
  },
  [TABLES.REFERRALS]: {
    SLUG: 'slug',
    PERSON: 'person',
    JOB: 'job',
    PARENT: 'parent'
  },
  [TABLES.RELATED_JOBS]: {
    FROM: 'from',
    TO: 'to'
  },
  [TABLES.ROLES]: {
    NAME: 'name'
  },
  [TABLES.ROLE_TAGS]: {
    SOURCE: 'source',
    ROLE: 'role',
    TAG: 'tag'
  },
  [TABLES.SURVEYS]: {
    SLUG: 'slug',
    INTRO_TITLE: 'introTitle',
    INTRO_DESCRIPTION: 'introDescription',
    OUTRO_TITLE: 'outroTitle',
    OUTRO_DESCRIPTION: 'outroDescription',
    SURVEY_SECTIONS: 'surveySections'
  },
  [TABLES.SURVEY_ANSWERS]: {
    PERSON: 'person',
    SURVEY_QUESTION: 'surveyQuestion'
  },
  [TABLES.SURVEY_ANSWER_CONNECTIONS]: {
    SURVEY_ANSWER: 'surveyAnswer',
    CONNECTION: 'connection'
  },
  [TABLES.SURVEY_QUESTIONS]: {
    SLUG: 'slug',
    TITLE: 'title',
    DESCRIPTION: 'description',
    REQUIRED: 'required',
    TYPE: 'type',
    SURVEY_SECTION: 'surveySection'
  },
  [TABLES.SURVEY_QUESTION_TAGS]: {
    SOURCE: 'source',
    SURVEY_QUESTION: 'surveyQuestion',
    TAG: 'tag'
  },
  [TABLES.SURVEY_SECTIONS]: {
    SLUG: 'slug',
    TITLE: 'title',
    DESCRIPTION: 'description',
    SURVEY_QUESTIONS: 'surveyQuestions',
    SURVEY: 'survey'
  },
  [TABLES.COMPANY_SURVEYS]: {
    COMPANY: 'company',
    SURVEY: 'survey'
  },
  [TABLES.TAGS]: {
    NAME: 'name',
    TYPE: 'type'
  },
  [TABLES.ACCESS_REQUESTS]: {
    SLUG: 'slug',
    COMPANY: 'company',
    PERSON: 'person'
  },
  [TABLES.ACCEPTED_ACCESS_REQUESTS]: {
    ACCESS_REQUEST: 'accessRequest',
    HIRER: 'hirer'
  }
}
// F is only used in this file so shortened for simplicity
const F = reduce(FIELDS, (fieldsMap, tableFields, tableName) => {
  if (tableName !== 'GENERIC') {
    fieldsMap[TABLES_INVERTED[tableName]] = {
      ...FIELDS.GENERIC,
      ...tableFields
    }
  }
  return fieldsMap
}, {})
const ENUMS = {
  JOB_STATUSES: createEnumDefinition(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  HIRER_TYPES: createEnumDefinition(['MEMBER', 'ADMIN']),
  DATA_SOURCES: createEnumDefinition(['MANUAL', 'LINKEDIN', 'SURVEY', 'NUDJ']),
  ACCOUNT_TYPES: createEnumDefinition(['GOOGLE', 'OTHER']),
  QUESTION_TYPES: createEnumDefinition(['CONNECTIONS', 'COMPANIES']),
  TAG_TYPES: createEnumDefinition(['EXPERTISE', 'SENIORITY'])
}
const INDICES = merge(
  reduce(TABLES, (indexes, tableName) => {
    indexes[tableName] = indexes[tableName] || {}
    indexes[tableName].id = {
      name: `${tableName}ById`,
      fields: ['id']
    }
    return indexes
  }, {}),
  {
    [TABLES.PEOPLE]: {
      [F.PEOPLE.EMAIL]: {
        name: `${TABLES.PEOPLE}ByEmail`,
        fields: [F.PEOPLE.EMAIL]
      }
    },
    [TABLES.COMPANIES]: {
      [F.COMPANIES.NAME]: {
        name: `${TABLES.COMPANIES}ByName`,
        fields: [F.COMPANIES.NAME]
      },
      [F.COMPANIES.SLUG]: {
        name: `${TABLES.COMPANIES}BySlug`,
        fields: [F.COMPANIES.SLUG]
      }
    },
    [TABLES.JOBS]: {
      [F.JOBS.COMPANY + F.JOBS.SLUG]: {
        name: `${TABLES.JOBS}ByCompanySlug`,
        fields: [F.JOBS.COMPANY, F.JOBS.SLUG]
      }
    },
    [TABLES.HIRERS]: {
      [F.HIRERS.PERSON]: {
        name: `${TABLES.HIRERS}ByPerson`,
        fields: [F.HIRERS.PERSON]
      }
    },
    [TABLES.REFERRALS]: {
      [F.REFERRALS.SLUG]: {
        name: `${TABLES.REFERRALS}BySlug`,
        fields: [F.REFERRALS.SLUG]
      },
      [F.REFERRALS.JOB + F.REFERRALS.PERSON]: {
        name: `${TABLES.REFERRALS}ByJobPerson`,
        fields: [F.REFERRALS.JOB, F.REFERRALS.PERSON]
      }
    },
    [TABLES.RELATED_JOBS]: {
      [F.RELATED_JOBS.FROM + F.RELATED_JOBS.TO]: {
        name: `${TABLES.RELATED_JOBS}ByFromTo`,
        fields: [F.RELATED_JOBS.FROM, F.RELATED_JOBS.TO]
      }
    },
    [TABLES.APPLICATIONS]: {
      [F.APPLICATIONS.JOB + F.APPLICATIONS.PERSON]: {
        name: `${TABLES.APPLICATIONS}ByJobPerson`,
        fields: [F.APPLICATIONS.JOB, F.APPLICATIONS.PERSON]
      }
    },
    [TABLES.EMPLOYMENTS]: {
      [F.EMPLOYMENTS.COMPANY + F.EMPLOYMENTS.PERSON]: {
        name: `${TABLES.EMPLOYMENTS}ByCompanyPerson`,
        fields: [F.EMPLOYMENTS.COMPANY, F.EMPLOYMENTS.PERSON]
      }
    },
    [TABLES.CURRENT_EMPLOYMENTS]: {
      [F.CURRENT_EMPLOYMENTS.PERSON]: {
        name: `${TABLES.CURRENT_EMPLOYMENTS}ByPerson`,
        fields: [F.CURRENT_EMPLOYMENTS.PERSON]
      }
    },
    [TABLES.EMPLOYEES]: {
      [F.EMPLOYEES.PERSON]: {
        name: `${TABLES.EMPLOYEES}ByPerson`,
        fields: [F.EMPLOYEES.PERSON]
      }
    },
    [TABLES.ROLES]: {
      [F.ROLES.NAME]: {
        name: `${TABLES.ROLES}ByName`,
        fields: [F.ROLES.NAME]
      }
    },
    [TABLES.PERSON_ROLES]: {
      [F.PERSON_ROLES.PERSON + F.PERSON_ROLES.ROLE]: {
        name: `${TABLES.PERSON_ROLES}ByPersonRole`,
        fields: [F.PERSON_ROLES.PERSON, F.PERSON_ROLES.ROLE]
      }
    },
    [TABLES.CURRENT_PERSON_ROLES]: {
      [F.CURRENT_PERSON_ROLES.PERSON]: {
        name: `${TABLES.CURRENT_PERSON_ROLES}ByPerson`,
        fields: [F.CURRENT_PERSON_ROLES.PERSON]
      }
    },
    [TABLES.CONNECTIONS]: {
      [F.CONNECTIONS.FROM + F.CONNECTIONS.PERSON]: {
        name: `${TABLES.CONNECTIONS}ByFromPerson`,
        fields: [F.CONNECTIONS.FROM, F.CONNECTIONS.PERSON]
      }
    },
    [TABLES.ACCOUNTS]: {
      [F.ACCOUNTS.EMAIL]: {
        name: `${TABLES.ACCOUNTS}ByEmail`,
        fields: [F.ACCOUNTS.EMAIL]
      }
    },
    [TABLES.CONVERSATIONS]: {
      [F.CONVERSATIONS.THREAD_ID]: {
        name: `${TABLES.CONVERSATIONS}ByThreadId`,
        fields: [F.CONVERSATIONS.THREAD_ID]
      }
    },
    [TABLES.SURVEYS]: {
      [F.SURVEYS.SLUG]: {
        name: `${TABLES.SURVEYS}BySlug`,
        fields: [F.SURVEYS.SLUG]
      }
    },
    [TABLES.SURVEY_SECTIONS]: {
      [F.SURVEY_SECTIONS.SLUG + F.SURVEY_SECTIONS.SURVEY]: {
        name: `${TABLES.SURVEY_SECTIONS}BySlugSurvey`,
        fields: [F.SURVEY_SECTIONS.SLUG, F.SURVEY_SECTIONS.SURVEY]
      }
    },
    [TABLES.SURVEY_QUESTIONS]: {
      [F.SURVEY_QUESTIONS.SLUG + F.SURVEY_QUESTIONS.SURVEY_SECTION]: {
        name: `${TABLES.SURVEY_QUESTIONS}BySlugSurveySection`,
        fields: [F.SURVEY_QUESTIONS.SURVEY_SECTION, F.SURVEY_QUESTIONS.SLUG]
      }
    },
    [TABLES.SURVEY_ANSWERS]: {
      [F.SURVEY_ANSWERS.PERSON + F.SURVEY_ANSWERS.SURVEY_QUESTION]: {
        name: `${TABLES.SURVEY_ANSWERS}ByPersonSurveyQuestion`,
        fields: [F.SURVEY_ANSWERS.PERSON, F.SURVEY_ANSWERS.SURVEY_QUESTION]
      }
    },
    [TABLES.SURVEY_ANSWER_CONNECTIONS]: {
      [F.SURVEY_ANSWER_CONNECTIONS.CONNECTION + F.SURVEY_ANSWER_CONNECTIONS.SURVEY_ANSWER]: {
        name: `${TABLES.SURVEY_ANSWER_CONNECTIONS}ByConnectionSurveyAnswer`,
        fields: [F.SURVEY_ANSWER_CONNECTIONS.CONNECTION, F.SURVEY_ANSWER_CONNECTIONS.SURVEY_ANSWER]
      }
    },
    [TABLES.COMPANY_SURVEYS]: {
      [F.COMPANY_SURVEYS.COMPANY + F.COMPANY_SURVEYS.SURVEY]: {
        name: `${TABLES.COMPANY_SURVEYS}ByCompanySurvey`,
        fields: [F.COMPANY_SURVEYS.COMPANY, F.COMPANY_SURVEYS.SURVEY]
      }
    },
    [TABLES.TAGS]: {
      [F.TAGS.NAME + F.TAGS.TYPE]: {
        name: `${TABLES.TAGS}ByNameType`,
        fields: [F.TAGS.NAME, F.TAGS.TYPE]
      }
    },
    [TABLES.JOB_TAGS]: {
      [F.JOB_TAGS.JOB + F.JOB_TAGS.TAG]: {
        name: `${TABLES.JOB_TAGS}ByJobTag`,
        fields: [F.JOB_TAGS.JOB, F.JOB_TAGS.TAG]
      }
    },
    [TABLES.ROLE_TAGS]: {
      [F.ROLE_TAGS.ROLE + F.ROLE_TAGS.TAG]: {
        name: `${TABLES.ROLE_TAGS}ByRoleTag`,
        fields: [F.ROLE_TAGS.ROLE, F.ROLE_TAGS.TAG]
      }
    },
    [TABLES.SURVEY_QUESTION_TAGS]: {
      [F.SURVEY_QUESTION_TAGS.SURVEY_QUESTION + F.SURVEY_QUESTION_TAGS.TAG]: {
        name: `${TABLES.SURVEY_QUESTION_TAGS}ByQuestionTag`,
        fields: [F.SURVEY_QUESTION_TAGS.SURVEY_QUESTION, F.SURVEY_QUESTION_TAGS.TAG]
      }
    },
    [TABLES.ACCESS_REQUESTS]: {
      [F.ACCESS_REQUESTS.SLUG]: {
        name: `${TABLES.ACCESS_REQUESTS}BySlug`,
        fields: [F.ACCESS_REQUESTS.SLUG]
      },
      [F.ACCESS_REQUESTS.COMPANY + F.ACCESS_REQUESTS.PERSON]: {
        name: `${TABLES.ACCESS_REQUESTS}ByCompanyPerson`,
        fields: [F.ACCESS_REQUESTS.COMPANY, F.ACCESS_REQUESTS.PERSON]
      }
    },
    [TABLES.ACCEPTED_ACCESS_REQUESTS]: {
      [F.ACCEPTED_ACCESS_REQUESTS.ACCESS_REQUEST + F.ACCEPTED_ACCESS_REQUESTS.HIRER]: {
        name: `${TABLES.ACCEPTED_ACCESS_REQUESTS}ByAccessRequestHirer`,
        fields: [F.ACCEPTED_ACCESS_REQUESTS.ACCESS_REQUEST, F.ACCEPTED_ACCESS_REQUESTS.HIRER]
      }
    }
  }
)
const getIndexKey = (index, item) => index.fields.map(field => item[field]).join('|')

function createEnumDefinition (items) {
  const enumDefinition = items.reduce((enumDefinition, item) => {
    enumDefinition[item] = item
    return enumDefinition
  }, {})
  enumDefinition.values = items
  return enumDefinition
}

function defaultConfig (t, knex) {
  t.charset('utf8mb4') // to support emoji
  t.collate('utf8mb4_bin') // to support emoji
  // Reason for choosing INT over BIGINT as the primary key
  // http://ronaldbradford.com/blog/bigint-v-int-is-there-a-big-deal-2008-07-18/
  t.increments(FIELDS.GENERIC.ID).primary('byId')
  t.timestamp(FIELDS.GENERIC.CREATED).defaultTo(knex.raw('CURRENT_TIMESTAMP')).notNullable()
  t.timestamp(FIELDS.GENERIC.MODIFIED).defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')).notNullable()
}
function emailType (fieldName, t, knex) {
  // https://dba.stackexchange.com/questions/37014/in-what-data-type-should-i-store-an-email-address-in-database
  return t.string(fieldName, 320)
}
function urlType (fieldName, t, knex) {
  // https://stackoverflow.com/questions/219569/best-database-field-type-for-a-url
  return t.string(fieldName, 2083)
}
function relationType (fieldName, table, t, knex) {
  return t.integer(fieldName).unsigned().references(FIELDS.GENERIC.ID).inTable(table)
}

const SLUG_GENERATORS = {
  [TABLES.REFERRALS]: {
    generator: slugGenerators.random
  },
  [TABLES.SURVEY_SECTIONS]: {
    generator: slugGenerators.field(FIELDS[TABLES.SURVEY_SECTIONS].TITLE),
    index: 'surveySectionsBySlugSurvey'
  },
  [TABLES.SURVEY_QUESTIONS]: {
    generator: slugGenerators.field(FIELDS[TABLES.SURVEY_QUESTIONS].TITLE),
    index: 'surveyQuestionsBySlugSurveySection'
  },
  [TABLES.COMPANIES]: {
    generator: slugGenerators.field(FIELDS[TABLES.COMPANIES].NAME),
    index: 'companiesBySlug'
  },
  [TABLES.JOBS]: {
    generator: slugGenerators.field(FIELDS[TABLES.JOBS].TITLE),
    index: 'jobsBySlug'
  },
  [TABLES.SURVEYS]: {
    generator: slugGenerators.field(FIELDS[TABLES.SURVEYS].INTRO_TITLE),
    index: 'surveysBySlug'
  },
  [TABLES.ACCESS_REQUESTS]: {
    generator: slugGenerators.random
  }
}
const COLLECTIONS = {
  JOB_VIEW_EVENTS: 'jobViewEvents',
  REFERRAL_KEY_TO_SLUG_MAP: 'referralKeyToSlugMaps',
  MESSAGE_EVENTS: 'messageEvents'
}

module.exports = {
  // constants
  TABLES,
  FIELDS,
  ENUMS,
  INDICES,
  SLUG_GENERATORS,
  COLLECTIONS,

  // functions
  defaultConfig,
  emailType,
  urlType,
  relationType,
  getIndexKey
}