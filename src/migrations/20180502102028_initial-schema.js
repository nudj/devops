const {
  TABLES,
  FIELDS,
  ENUMS,
  INDICES,
  defaultConfig,
  defaultFields,
  emailType,
  urlType,
  relationType
} = require('../lib/sql')

exports.up = async knex => {
  await knex.schema

    .createTable(TABLES.PEOPLE, table => {
      const {
        EMAIL,
        FIRST_NAME,
        LAST_NAME,
        URL,
        EMAIL_PREFERENCE
      } = FIELDS[TABLES.PEOPLE]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      emailType(EMAIL, table, knex).notNullable()
      table.string(FIRST_NAME).nullable()
      table.string(LAST_NAME).nullable()
      urlType(URL, table, knex).nullable()
      table.enum(EMAIL_PREFERENCE, ENUMS.ACCOUNT_TYPES.values).nullable()
      table.unique(EMAIL, INDICES[TABLES.PEOPLE][EMAIL].name)
    })

    .createTable(TABLES.COMPANIES, table => {
      const {
        NAME,
        SLUG,
        DESCRIPTION,
        LOCATION,
        LOGO,
        URL,
        CLIENT,
        HASH
      } = FIELDS[TABLES.COMPANIES]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      table.string(NAME).notNullable()
      table.string(SLUG).notNullable()
      table.string(HASH).nullable()
      table.text(DESCRIPTION).nullable()
      table.string(LOCATION).nullable()
      urlType(LOGO, table, knex).nullable()
      urlType(URL, table, knex).nullable()
      table.boolean(CLIENT).defaultTo(false).notNullable()
      table.unique(NAME, INDICES[TABLES.COMPANIES][NAME].name)
      table.unique(SLUG, INDICES[TABLES.COMPANIES][SLUG].name)
    })

    .createTable(TABLES.JOBS, table => {
      const {
        TITLE,
        SLUG,
        URL,
        LOCATION,
        REMUNERATION,
        TEMPLATE,
        DESCRIPTION,
        CANDIDATE_DESCRIPTION,
        ROLE_DESCRIPTION,
        EXPERIENCE,
        REQUIREMENTS,
        BONUS,
        STATUS,
        COMPANY
      } = FIELDS[TABLES.JOBS]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      table.string(TITLE).notNullable()
      table.string(SLUG).notNullable()
      urlType(URL, table, knex).nullable()
      table.string(LOCATION).nullable()
      table.string(REMUNERATION).nullable()
      table.string(TEMPLATE).nullable()
      table.text(DESCRIPTION).nullable()
      table.text(CANDIDATE_DESCRIPTION).nullable()
      table.text(ROLE_DESCRIPTION).nullable()
      table.text(EXPERIENCE).nullable()
      table.text(REQUIREMENTS).nullable()
      table.string(BONUS).notNullable()
      table.enum(STATUS, ENUMS.JOB_STATUSES.values).defaultTo(ENUMS.JOB_STATUSES.DRAFT).notNullable()
      relationType(COMPANY, TABLES.COMPANIES, table, knex).notNullable()
      table.unique([COMPANY, SLUG], INDICES[TABLES.JOBS][[COMPANY, SLUG].join('')].name)
    })

    .createTable(TABLES.HIRERS, table => {
      const {
        ONBOARDED,
        TYPE,
        PERSON,
        COMPANY
      } = FIELDS[TABLES.HIRERS]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      table.boolean(ONBOARDED).defaultTo(false).notNullable()
      table.enum(TYPE, ENUMS.HIRER_TYPES.values).defaultTo(ENUMS.HIRER_TYPES.MEMBER).notNullable()
      relationType(PERSON, TABLES.PEOPLE, table, knex).notNullable()
      relationType(COMPANY, TABLES.COMPANIES, table, knex).notNullable()
      table.unique(PERSON, INDICES[TABLES.HIRERS][PERSON].name)
    })

    .createTable(TABLES.REFERRALS, table => {
      const {
        SLUG,
        PERSON,
        JOB,
        PARENT
      } = FIELDS[TABLES.REFERRALS]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      table.string(SLUG, 10).notNullable()
      relationType(PERSON, TABLES.PEOPLE, table, knex).notNullable()
      relationType(JOB, TABLES.JOBS, table, knex).notNullable()
      relationType(PARENT, TABLES.REFERRALS, table, knex).nullable()
      table.unique(SLUG, INDICES[TABLES.REFERRALS][SLUG].name)
      table.unique([JOB, PERSON], INDICES[TABLES.REFERRALS][[JOB, PERSON].join('')].name)
    })

    .createTable(TABLES.APPLICATIONS, table => {
      const {
        PERSON,
        JOB,
        REFERRAL
      } = FIELDS[TABLES.APPLICATIONS]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      relationType(PERSON, TABLES.PEOPLE, table, knex).notNullable()
      relationType(JOB, TABLES.JOBS, table, knex).notNullable()
      relationType(REFERRAL, TABLES.REFERRALS, table, knex).nullable()
      table.unique([JOB, PERSON], INDICES[TABLES.APPLICATIONS][[JOB, PERSON].join('')].name)
    })

    .createTable(TABLES.EMPLOYMENTS, table => {
      const {
        SOURCE,
        PERSON,
        COMPANY
      } = FIELDS[TABLES.EMPLOYMENTS]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      table.enum(SOURCE, ENUMS.DATA_SOURCES.values).notNullable()
      relationType(PERSON, TABLES.PEOPLE, table, knex).notNullable()
      relationType(COMPANY, TABLES.COMPANIES, table, knex).notNullable()
      table.unique([COMPANY, PERSON], INDICES[TABLES.EMPLOYMENTS][[COMPANY, PERSON].join('')].name)
    })

    .createTable(TABLES.CURRENT_EMPLOYMENTS, table => {
      const {
        EMPLOYMENT,
        PERSON
      } = FIELDS[TABLES.CURRENT_EMPLOYMENTS]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      relationType(EMPLOYMENT, TABLES.EMPLOYMENTS, table, knex).notNullable()
      relationType(PERSON, TABLES.PEOPLE, table, knex).notNullable()
      table.unique(PERSON, INDICES[TABLES.CURRENT_EMPLOYMENTS][PERSON].name)
    })

    .createTable(TABLES.EMPLOYEES, table => {
      const {
        PERSON,
        COMPANY
      } = FIELDS[TABLES.EMPLOYEES]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      relationType(PERSON, TABLES.PEOPLE, table, knex).notNullable()
      relationType(COMPANY, TABLES.COMPANIES, table, knex).notNullable()
      table.unique(PERSON, INDICES[TABLES.EMPLOYEES][PERSON].name)
    })

    .createTable(TABLES.ROLES, table => {
      const {
        NAME
      } = FIELDS[TABLES.ROLES]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      table.string(NAME).notNullable()
      table.unique(NAME, INDICES[TABLES.ROLES][NAME].name)
    })

    .createTable(TABLES.PERSON_ROLES, table => {
      const {
        PERSON,
        ROLE,
        SOURCE
      } = FIELDS[TABLES.PERSON_ROLES]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      relationType(PERSON, TABLES.PEOPLE, table, knex).notNullable()
      relationType(ROLE, TABLES.ROLES, table, knex).notNullable()
      table.enum(SOURCE, ENUMS.DATA_SOURCES.values).notNullable()
      table.unique([PERSON, ROLE], INDICES[TABLES.PERSON_ROLES][[PERSON, ROLE].join('')].name)
    })

    .createTable(TABLES.CURRENT_PERSON_ROLES, table => {
      const {
        PERSON,
        PERSON_ROLE
      } = FIELDS[TABLES.CURRENT_PERSON_ROLES]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      relationType(PERSON, TABLES.PEOPLE, table, knex).notNullable()
      relationType(PERSON_ROLE, TABLES.PERSON_ROLES, table, knex).notNullable()
      table.unique(PERSON, INDICES[TABLES.CURRENT_PERSON_ROLES][PERSON].name)
    })

    .createTable(TABLES.CONNECTIONS, table => {
      const {
        FIRST_NAME,
        LAST_NAME,
        SOURCE,
        PERSON,
        FROM,
        ROLE,
        COMPANY
      } = FIELDS[TABLES.CONNECTIONS]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      table.string(FIRST_NAME).notNullable()
      table.string(LAST_NAME).notNullable()
      table.enum(SOURCE, ENUMS.DATA_SOURCES.values).defaultTo(ENUMS.DATA_SOURCES.LINKEDIN).notNullable()
      relationType(PERSON, TABLES.PEOPLE, table, knex).notNullable()
      relationType(FROM, TABLES.PEOPLE, table, knex).notNullable()
      relationType(ROLE, TABLES.ROLES, table, knex).nullable()
      relationType(COMPANY, TABLES.COMPANIES, table, knex).nullable()
      table.unique([FROM, PERSON], INDICES[TABLES.CONNECTIONS][[FROM, PERSON].join('')].name)
    })

    .createTable(TABLES.ACCOUNTS, table => {
      const {
        EMAIL,
        EMAIL_ADDRESSES,
        DATA,
        TYPE,
        PERSON
      } = FIELDS[TABLES.ACCOUNTS]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      emailType(EMAIL, table, knex).notNullable()
      table.json(EMAIL_ADDRESSES).notNullable().comment('Array of all emails associated with account')
      table.json(DATA).notNullable().comment('Object of account authorisation secrets')
      table.enum(TYPE, ENUMS.ACCOUNT_TYPES.values).defaultTo(ENUMS.ACCOUNT_TYPES.GOOGLE).notNullable()
      relationType(PERSON, TABLES.PEOPLE, table, knex).notNullable()
      table.unique(EMAIL, INDICES[TABLES.ACCOUNTS][EMAIL].name)
    })

    .createTable(TABLES.CONVERSATIONS, table => {
      const {
        THREAD_ID,
        TYPE,
        PERSON,
        RECIPIENT
      } = FIELDS[TABLES.CONVERSATIONS]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      table.string(THREAD_ID).notNullable()
      table.enum(TYPE, ENUMS.ACCOUNT_TYPES.values).defaultTo(ENUMS.ACCOUNT_TYPES.GOOGLE).notNullable()
      relationType(PERSON, TABLES.PEOPLE, table, knex).notNullable()
      relationType(RECIPIENT, TABLES.PEOPLE, table, knex).notNullable()
      table.unique(THREAD_ID, INDICES[TABLES.CONVERSATIONS][THREAD_ID].name)
    })

    .createTable(TABLES.SURVEYS, table => {
      const {
        SLUG,
        INTRO_TITLE,
        INTRO_DESCRIPTION,
        OUTRO_TITLE,
        OUTRO_DESCRIPTION,
        SURVEY_SECTIONS
      } = FIELDS[TABLES.SURVEYS]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      table.string(SLUG).notNullable()
      table.string(INTRO_TITLE).notNullable()
      table.text(INTRO_DESCRIPTION).notNullable()
      table.string(OUTRO_TITLE).nullable()
      table.text(OUTRO_DESCRIPTION).nullable()
      table.json(SURVEY_SECTIONS).notNullable().comment('Array of surveySection ids denoting their order')
      table.unique(SLUG, INDICES[TABLES.SURVEYS][SLUG].name)
    })

    .createTable(TABLES.SURVEY_SECTIONS, table => {
      const {
        SLUG,
        TITLE,
        DESCRIPTION,
        SURVEY_QUESTIONS,
        SURVEY
      } = FIELDS[TABLES.SURVEY_SECTIONS]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      table.string(SLUG).notNullable()
      table.string(TITLE).notNullable()
      table.text(DESCRIPTION).notNullable()
      table.json(SURVEY_QUESTIONS).notNullable().comment('Array of surveyQuestion ids denoting their order')
      relationType(SURVEY, TABLES.SURVEYS, table, knex).notNullable()
      table.unique([SLUG, SURVEY], INDICES[TABLES.SURVEY_SECTIONS][[SLUG, SURVEY].join('')].name)
    })

    .createTable(TABLES.SURVEY_QUESTIONS, table => {
      const {
        SLUG,
        TITLE,
        DESCRIPTION,
        REQUIRED,
        TYPE,
        SURVEY_SECTION
      } = FIELDS[TABLES.SURVEY_QUESTIONS]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      table.string(SLUG).notNullable()
      table.string(TITLE).notNullable()
      table.text(DESCRIPTION).notNullable()
      table.boolean(REQUIRED).defaultTo(false).notNullable()
      table.enum(TYPE, ENUMS.QUESTION_TYPES.values).notNullable()
      relationType(SURVEY_SECTION, TABLES.SURVEY_SECTIONS, table, knex).notNullable()
      table.unique([SLUG, SURVEY_SECTION], INDICES[TABLES.SURVEY_QUESTIONS][[SLUG, SURVEY_SECTION].join('')].name)
    })

    .createTable(TABLES.SURVEY_ANSWERS, table => {
      const {
        PERSON,
        SURVEY_QUESTION
      } = FIELDS[TABLES.SURVEY_ANSWERS]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      relationType(PERSON, TABLES.PEOPLE, table, knex).notNullable()
      relationType(SURVEY_QUESTION, TABLES.SURVEY_QUESTIONS, table, knex).notNullable()
      table.unique([PERSON, SURVEY_QUESTION], INDICES[TABLES.SURVEY_ANSWERS][[PERSON, SURVEY_QUESTION].join('')].name)
    })

    .createTable(TABLES.SURVEY_ANSWER_CONNECTIONS, table => {
      const {
        SURVEY_ANSWER,
        CONNECTION
      } = FIELDS[TABLES.SURVEY_ANSWER_CONNECTIONS]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      relationType(SURVEY_ANSWER, TABLES.SURVEY_ANSWERS, table, knex).notNullable()
      relationType(CONNECTION, TABLES.CONNECTIONS, table, knex).notNullable()
      table.unique([CONNECTION, SURVEY_ANSWER], INDICES[TABLES.SURVEY_ANSWER_CONNECTIONS][[CONNECTION, SURVEY_ANSWER].join('')].name)
    })

    .createTable(TABLES.COMPANY_SURVEYS, table => {
      const {
        COMPANY,
        SURVEY
      } = FIELDS[TABLES.COMPANY_SURVEYS]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      relationType(COMPANY, TABLES.COMPANIES, table, knex).notNullable()
      relationType(SURVEY, TABLES.SURVEYS, table, knex).notNullable()
      table.unique([COMPANY, SURVEY], INDICES[TABLES.COMPANY_SURVEYS][[COMPANY, SURVEY].join('')].name)
    })

    .createTable(TABLES.TAGS, table => {
      const {
        NAME,
        TYPE
      } = FIELDS[TABLES.TAGS]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      table.string(NAME).notNullable()
      table.enum(TYPE, ENUMS.TAG_TYPES.values).notNullable()
      table.unique([NAME, TYPE], INDICES[TABLES.TAGS][[NAME, TYPE].join('')].name)
    })

    .createTable(TABLES.JOB_TAGS, table => {
      const {
        SOURCE,
        JOB,
        TAG
      } = FIELDS[TABLES.JOB_TAGS]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      table.enum(SOURCE, ENUMS.DATA_SOURCES.values).notNullable()
      relationType(JOB, TABLES.JOBS, table, knex).notNullable()
      relationType(TAG, TABLES.TAGS, table, knex).notNullable()
      table.unique([JOB, TAG], INDICES[TABLES.JOB_TAGS][[JOB, TAG].join('')].name)
    })

    .createTable(TABLES.ROLE_TAGS, table => {
      const {
        SOURCE,
        ROLE,
        TAG
      } = FIELDS[TABLES.ROLE_TAGS]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      table.enum(SOURCE, ENUMS.DATA_SOURCES.values).notNullable()
      relationType(ROLE, TABLES.ROLES, table, knex).notNullable()
      relationType(TAG, TABLES.TAGS, table, knex).notNullable()
      table.unique([ROLE, TAG], INDICES[TABLES.ROLE_TAGS][[ROLE, TAG].join('')].name)
    })

    .createTable(TABLES.SURVEY_QUESTION_TAGS, table => {
      const {
        SOURCE,
        SURVEY_QUESTION,
        TAG
      } = FIELDS[TABLES.SURVEY_QUESTION_TAGS]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      table.enum(SOURCE, ENUMS.DATA_SOURCES.values).notNullable()
      relationType(SURVEY_QUESTION, TABLES.SURVEY_QUESTIONS, table, knex).notNullable()
      relationType(TAG, TABLES.TAGS, table, knex).notNullable()
      table.unique([SURVEY_QUESTION, TAG], INDICES[TABLES.SURVEY_QUESTION_TAGS][[SURVEY_QUESTION, TAG].join('')].name)
    })

    .createTable(TABLES.RELATED_JOBS, table => {
      const {
        FROM,
        TO
      } = FIELDS[TABLES.RELATED_JOBS]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      relationType(FROM, TABLES.JOBS, table, knex).notNullable()
      relationType(TO, TABLES.JOBS, table, knex).notNullable()
      table.unique([FROM, TO], INDICES[TABLES.RELATED_JOBS][[FROM, TO].join('')].name)
    })

    .createTable(TABLES.ACCESS_REQUESTS, table => {
      const {
        SLUG,
        PERSON,
        COMPANY
      } = FIELDS[TABLES.ACCESS_REQUESTS]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      table.string(SLUG).notNullable()
      relationType(PERSON, TABLES.PEOPLE, table, knex).notNullable()
      relationType(COMPANY, TABLES.COMPANIES, table, knex).notNullable()
      table.unique(SLUG, INDICES[TABLES.ACCESS_REQUESTS][SLUG].name)
      table.unique([COMPANY, PERSON], INDICES[TABLES.ACCESS_REQUESTS][[COMPANY, PERSON].join('')].name)
    })

    .createTable(TABLES.ACCEPTED_ACCESS_REQUESTS, table => {
      const {
        ACCESS_REQUEST,
        HIRER
      } = FIELDS[TABLES.ACCEPTED_ACCESS_REQUESTS]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      relationType(ACCESS_REQUEST, TABLES.ACCESS_REQUESTS, table, knex).notNullable()
      relationType(HIRER, TABLES.HIRERS, table, knex).notNullable()
      table.unique([ACCESS_REQUEST, HIRER], INDICES[TABLES.ACCEPTED_ACCESS_REQUESTS][[ACCESS_REQUEST, HIRER].join('')].name)
    })

    .createTable(TABLES.JOB_VIEW_EVENTS, table => {
      const {
        BROWSER_ID,
        JOB
      } = FIELDS[TABLES.JOB_VIEW_EVENTS]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      table.string(BROWSER_ID).notNullable()
      relationType(JOB, TABLES.JOBS, table, knex).notNullable()
    })

    .createTable(TABLES.MESSAGE_EVENTS, table => {
      const {
        HASH
      } = FIELDS[TABLES.MESSAGE_EVENTS]

      defaultConfig(table, knex)
      defaultFields(table, knex)
      table.string(HASH).notNullable()
    })

    .createTable(TABLES.REFERRAL_KEY_TO_SLUG_MAP, table => {
      const {
        REFERRAL_KEY,
        JOB_SLUG
      } = FIELDS[TABLES.REFERRAL_KEY_TO_SLUG_MAP]

      defaultConfig(table, knex)
      table.string(REFERRAL_KEY).primary('byReferralKey')
      table.string(JOB_SLUG).notNullable()
      table.unique(JOB_SLUG, INDICES[TABLES.REFERRAL_KEY_TO_SLUG_MAP][JOB_SLUG].name)
    })
}

exports.down = async knex => {
  await knex.schema
    .dropTable(TABLES.REFERRAL_KEY_TO_SLUG_MAP)
    .dropTable(TABLES.MESSAGE_EVENTS)
    .dropTable(TABLES.JOB_VIEW_EVENTS)
    .dropTable(TABLES.ACCEPTED_ACCESS_REQUESTS)
    .dropTable(TABLES.ACCESS_REQUESTS)
    .dropTable(TABLES.RELATED_JOBS)
    .dropTable(TABLES.SURVEY_QUESTION_TAGS)
    .dropTable(TABLES.ROLE_TAGS)
    .dropTable(TABLES.JOB_TAGS)
    .dropTable(TABLES.TAGS)
    .dropTable(TABLES.SURVEY_ANSWER_CONNECTIONS)
    .dropTable(TABLES.SURVEY_ANSWERS)
    .dropTable(TABLES.SURVEY_QUESTIONS)
    .dropTable(TABLES.SURVEY_SECTIONS)
    .dropTable(TABLES.COMPANY_SURVEYS)
    .dropTable(TABLES.SURVEYS)
    .dropTable(TABLES.CONVERSATIONS)
    .dropTable(TABLES.ACCOUNTS)
    .dropTable(TABLES.CONNECTIONS)
    .dropTable(TABLES.CURRENT_PERSON_ROLES)
    .dropTable(TABLES.PERSON_ROLES)
    .dropTable(TABLES.ROLES)
    .dropTable(TABLES.EMPLOYEES)
    .dropTable(TABLES.CURRENT_EMPLOYMENTS)
    .dropTable(TABLES.EMPLOYMENTS)
    .dropTable(TABLES.APPLICATIONS)
    .dropTable(TABLES.REFERRALS)
    .dropTable(TABLES.HIRERS)
    .dropTable(TABLES.JOBS)
    .dropTable(TABLES.COMPANIES)
    .dropTable(TABLES.PEOPLE)
}
