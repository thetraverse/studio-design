/* =========================================================================
   Quality checks — mock data and scenarios

   Lifted verbatim from the 17 Sep 2026 POC. Shapes mirror types/QualityChecks.ts.
   Nothing here is real and nothing calls an API: every number on screen is
   derived from these fixtures by the same rules the app uses, so the views stay
   consistent when you click around.

   Presentation lives in quality-checks.html; the ports of utils/qualityChecks.ts
   live in quality-checks.logic.js. This file is data only — if you are changing
   how something LOOKS, you are in the wrong file.
   ========================================================================= */
/* ================================================================== *
 * MOCK DATA — shapes mirror types/QualityChecks.ts. Nothing here is real.
 * ================================================================== */
const LEVEL_TITLES = ['Beginning', 'Developing', 'Proficient', 'Excellent']
const LEVEL_POINTS = [3, 6, 9, 12]

function levelCategory(id, title, description, instructions, scope, ladder, displayIndex) {
  return {
    id, title, description, instructions, contentToGradeInstruction: scope, displayIndex,
    maxAvailablePoints: 12,
    levels: ladder.map((l, i) => ({ level: i + 1, title: LEVEL_TITLES[i], requiredPoints: LEVEL_POINTS[i], description: l.d, gradingStatements: l.s })),
  }
}

const RUBRIC_LEVEL = [
  levelCategory('c1', 'Entity and attribute identification',
    'Whether the design names the entities the scenario needs and gives each a sensible set of attributes with a primary key.',
    'Credit entities that are implied by the scenario even when the candidate names them differently. Do not credit attributes that belong on another entity.',
    'The entity list and the attribute tables in the first section of the submission.',
    [
      { d: 'Fewer than half of the required entities are identified.', s: ['Entities are missing or merged so the scenario cannot be represented', 'No primary keys are declared'] },
      { d: 'Most entities are identified; attributes are incomplete or misplaced.', s: ['All core entities are named', 'Some attributes are on the wrong entity or missing'] },
      { d: 'All entities are identified with appropriate attributes and keys.', s: ['Every entity has a primary key', 'Attributes belong to the right entity'] },
      { d: 'Entities and attributes are complete, well named and typed.', s: ['Data types are stated for every attribute', 'Naming is consistent throughout'] },
    ], 0),
  levelCategory('c2', 'Relationships and cardinality',
    'Whether relationships between entities are modelled with correct cardinality and many-to-many relationships are resolved.',
    'A relationship stated in prose counts as modelled. Cardinality must be stated for both directions to count as correct.',
    'The ERD or relationship section.',
    [
      { d: 'Relationships are absent or mostly wrong.', s: ['No cardinality is stated', 'Many-to-many relationships are left unresolved'] },
      { d: 'Main relationships are present; cardinality is partly wrong or unstated.', s: ['Most relationships are shown', 'Cardinality is stated for some relationships'] },
      { d: 'Relationships and cardinality are correct; many-to-many resolved.', s: ['Cardinality is stated and correct for every relationship', 'Every many-to-many relationship is resolved with a junction entity'] },
      { d: 'Relationships are complete, correct and explained.', s: ['Optionality is stated', 'The choice of junction attributes is explained'] },
    ], 1),
  levelCategory('c3', 'Normalisation',
    'Whether the schema reaches third normal form and any deliberate denormalisation is explained.',
    'Check each table against 1NF, 2NF and 3NF in turn. A justified denormalisation is not a fault.',
    'The normalisation discussion and the final table definitions.',
    [
      { d: 'No evidence of normalisation.', s: ['Repeating groups remain', 'Normal forms are not mentioned'] },
      { d: 'Some normalisation; transitive dependencies remain.', s: ['Tables are in 1NF', 'At least one transitive dependency remains'] },
      { d: 'Schema is in 3NF with the steps shown.', s: ['Every table is in 3NF', 'The candidate shows the normalisation steps'] },
      { d: '3NF with deliberate, justified denormalisation where useful.', s: ['Any denormalisation is explained with a performance or reporting reason'] },
    ], 2),
  levelCategory('c4', 'Constraints and integrity',
    'Whether keys, foreign keys and check constraints are declared so the data stays consistent.',
    'Constraints may be stated in DDL or in prose. A foreign key without an ON DELETE rule still counts as declared.',
    'The DDL listing or the constraints table.',
    [
      { d: 'No constraints beyond a primary key.', s: ['No foreign keys are declared', 'No check or unique constraints'] },
      { d: 'Foreign keys declared; other constraints missing.', s: ['Foreign keys are declared for most relationships', 'No check constraints'] },
      { d: 'Keys, foreign keys and sensible check constraints throughout.', s: ['Every relationship has a foreign key', 'Check or unique constraints cover the obvious business rules'] },
      { d: 'Constraints are complete and referential actions are chosen deliberately.', s: ['ON DELETE / ON UPDATE actions are chosen and explained'] },
    ], 3),
  levelCategory('c5', 'Justification of design decisions',
    'Whether the candidate explains the trade-offs behind the design and relates them to the scenario.',
    'Look for reasoning, not description. Restating what the schema contains is not justification.',
    'The final "Design decisions" section.',
    [
      { d: 'No justification; the design is only described.', s: ['No decision is explained', 'No reference to the scenario\'s requirements'] },
      { d: 'Some decisions justified in general terms.', s: ['At least one decision is explained', 'Justification is generic rather than tied to the scenario'] },
      { d: 'Key decisions justified with reference to the scenario.', s: ['Each major decision is tied to a requirement in the scenario', 'At least one alternative is considered'] },
      { d: 'Trade-offs weighed with alternatives and consequences.', s: ['Alternatives are compared with their consequences', 'Limitations of the chosen design are acknowledged'] },
    ], 4),
]

/* Points rubric: sub-questions under two parent categories; leaves carry statements. */
function stmt(id, statement, points) { return { id, statement, points } }
const RUBRIC_POINTS = [
  { id: 'q1', title: '1. Revenue recognition', displayIndex: 0, children: [
    { id: 'q1a', title: '1a. Performance obligations', displayIndex: 0, maxAvailablePoints: 8,
      description: 'Identifies the distinct performance obligations in the contract and explains why they are distinct.',
      instructions: 'Award each statement independently. Partial explanations earn nothing.',
      statements: [stmt('A1', 'Identifies the two distinct performance obligations (equipment and support)', 4), stmt('A2', 'Explains why installation is not a distinct obligation', 3), stmt('A3', 'Cites step two of the IFRS 15 model', 1)] },
    { id: 'q1b', title: '1b. Transaction price allocation', displayIndex: 1, maxAvailablePoints: 12,
      description: 'Allocates the transaction price to each obligation on relative stand-alone selling prices.',
      instructions: 'The allocation must be numerically correct to earn the second statement.',
      statements: [stmt('B1', 'Allocates on relative stand-alone selling prices', 4), stmt('B2', 'Computes the allocation correctly (R120 000 equipment / R30 000 support)', 4), stmt('B3', 'States when revenue is recognised for each obligation', 4)] },
  ]},
  { id: 'q2', title: '2. Lease classification', displayIndex: 1, maxAvailablePoints: 15,
    description: 'Applies IFRS 16 to the warehouse contract.',
    instructions: 'Accept either the annuity or the year-by-year discounting method for the liability.',
    statements: [stmt('C1', 'Identifies the contract as a lease under IFRS 16', 3), stmt('C2', 'Computes the initial lease liability', 5), stmt('C3', 'Explains the right-of-use asset measurement', 4), stmt('C4', 'Discusses the short-term exemption and why it does not apply', 3)] },
  { id: 'q3', title: '3. Presentation and disclosure', displayIndex: 2, maxAvailablePoints: 5,
    description: 'Journal entries and disclosure notes for both transactions.',
    instructions: 'Entries must balance to earn the first statement.',
    statements: [stmt('D1', 'Presents balanced journal entries for both transactions', 2), stmt('D2', 'Notes the disclosure requirements', 3)] },
]

/* ---------------- sample markdown (as graded) ---------------- */
const MD = {
  weak: `# Database design – Campus Library

## Entities
The library has books and members. I have made two tables.

**Book**: title, author, year, isbn
**Member**: name, email, phone

## Relationships
A member borrows a book. I would put the member's name in the book table so we know who has it.

## Normalisation
The tables are simple so I did not need to normalise them.

## Constraints
Each book has an isbn which is the key.

## Design decisions
This design is simple and easy to understand. It covers books and members which is what the library needs.`,

  average: `# Database design – Campus Library

## 1. Entities and attributes

| Entity | Attributes |
|---|---|
| Book | book_id (PK), title, isbn, publisher, published_year |
| Author | author_id (PK), first_name, last_name |
| Member | member_id (PK), first_name, last_name, email, joined_on |
| Loan | loan_id (PK), book_id (FK), member_id (FK), loaned_on, due_on, returned_on |

Books can have several authors, so I added a **BookAuthor** table with book_id and author_id.

## 2. Relationships

- Member 1 — many Loan
- Book 1 — many Loan
- Book many — many Author, resolved through BookAuthor

Cardinality is one-to-many in each case except BookAuthor.

## 3. Normalisation

All tables are in first normal form because every column holds one value. Loan depends wholly on loan_id so it is in 2NF. I have left publisher on the Book table, which repeats the publisher name for each book by the same publisher; a Publisher table would remove this.

## 4. Constraints

Primary keys on every table. Foreign keys from Loan to Book and Member, and from BookAuthor to Book and Author. The email on Member should be unique.

## 5. Design decisions

I kept the Loan table separate from Book so that a book keeps its loan history. A Publisher table would be more normalised but the library only has a few publishers, so I left it out for simplicity.`,

  strong: `# Database design – Campus Library

## 1. Entities and attributes

**Book** (book_id INT PK, isbn CHAR(13) UNIQUE, title VARCHAR(200), publisher_id INT FK, published_year SMALLINT)
**Author** (author_id INT PK, first_name VARCHAR(80), last_name VARCHAR(80))
**BookAuthor** (book_id INT FK, author_id INT FK, author_order SMALLINT; PK(book_id, author_id))
**Publisher** (publisher_id INT PK, name VARCHAR(120))
**Copy** (copy_id INT PK, book_id INT FK, barcode CHAR(10) UNIQUE, condition VARCHAR(20))
**Member** (member_id INT PK, first_name, last_name, email VARCHAR(120) UNIQUE, joined_on DATE)
**Loan** (loan_id INT PK, copy_id INT FK, member_id INT FK, loaned_on DATE, due_on DATE, returned_on DATE NULL)

A *Copy* entity separates the physical item from the title, because the library holds several copies of popular books and a loan is of a copy, not of a title.

## 2. Relationships and cardinality

- Publisher 1 : 0..* Book — a book has exactly one publisher.
- Book 1..* : 1..* Author — resolved through BookAuthor; author_order preserves the credited order.
- Book 1 : 1..* Copy — every title has at least one copy.
- Member 1 : 0..* Loan; Copy 1 : 0..* Loan — a copy has at most one open loan, enforced below.

## 3. Normalisation

Every table is in 1NF (atomic columns, no repeating groups). Loan's non-key columns depend on the whole key, and BookAuthor's only non-key column, author_order, depends on the full composite key, so both are in 2NF. Publisher name was a transitive dependency on Book (book_id → publisher_id → name) and has been moved to its own table, which brings the schema to 3NF. No denormalisation has been applied; a due-date report would join Loan to Member directly.

## 4. Constraints and integrity

- Foreign keys on every relationship; ON DELETE RESTRICT for Book → Publisher and Copy → Book so a title cannot vanish under its copies.
- CHECK (due_on > loaned_on) and CHECK (returned_on IS NULL OR returned_on >= loaned_on) on Loan.
- A partial unique index on Loan(copy_id) WHERE returned_on IS NULL guarantees a copy has at most one open loan.

## 5. Design decisions

The Copy entity was the main choice. The alternative — a quantity column on Book — is simpler but cannot say *which* copy is overdue or damaged, which the scenario's stock-take requirement needs. Splitting Publisher out adds a join to every catalogue query; with only a few hundred titles that cost is negligible and it prevents inconsistent spellings. The design does not model reservations, which the scenario mentions once; that would add a Reservation entity between Member and Book.`,

  uploaded: `# Library Database Design

## Entities

I identified the following entities: Book, Member, Loan, Author and Publisher.

Book has book_id (primary key), title, isbn, year and publisher_id. Author has author_id and name. Member has member_id, name, email and join date. Loan has loan_id, book_id, member_id, date out and date due. Publisher has publisher_id and name.

## Relationships

A member can have many loans and a loan belongs to one member. A book can be on many loans over time. Books and authors are many-to-many so I created a linking table called Wrote with book_id and author_id.

## Normalisation

The design is in third normal form. There are no repeating groups, every non-key column depends on the whole key, and I moved publisher out of Book into its own table so that it is not a transitive dependency.

## Constraints

All tables have a primary key. Loan.book_id references Book and Loan.member_id references Member. Member.email is unique. I have not added check constraints.

## Justification

I split Publisher out to avoid repeating the publisher name and to make it easy to change. Loans are kept in a separate table so that the history is kept. I considered a Copy table for multiple copies of a book but decided the library does not need it yet.`,

  points: `# Financial Reporting – Case Study Answer

## Question 1: Revenue recognition

The contract with Mbeki Logistics contains equipment, installation and two years of support. Under IFRS 15 step two, the equipment and the support are distinct performance obligations because the customer can benefit from each on its own. Installation is not distinct: it is routine, could be performed by another supplier, and is not separately identifiable from the equipment.

The transaction price of R150 000 is allocated on relative stand-alone selling prices: equipment R120 000 and support R30 000. Equipment revenue is recognised on delivery; support revenue over the two-year period.

## Question 2: Lease classification

The warehouse contract conveys the right to control an identified asset for three years, so it is a lease under IFRS 16. The initial lease liability is the present value of the three annual payments of R200 000 discounted at 8%, which is R515 420. The right-of-use asset is measured at the same amount plus the initial direct costs of R10 000.

## Question 3: Presentation

Dr Right-of-use asset 525 420 / Cr Lease liability 515 420 / Cr Bank 10 000.`,
}

/* ---------------- level-rubric grades: one pass per repeat ---------------- */
function levelRationale(cat, level, met, notMet, quote) {
  const lv = cat.levels[level - 1]
  const parts = []
  parts.push(`Grading statements for level ${level} (${lv.title}):`)
  lv.gradingStatements.forEach((s, i) => {
    const isMet = i < met
    parts.push(`'${s}' - ${isMet ? 'Met' : 'Not Met'}${isMet && i === 0 && quote ? ` ("${quote}")` : ''}.`)
  })
  if (notMet) parts.push(notMet)
  parts.push(`Selected level: ${level} (${lv.title}).`)
  return parts.join(' ')
}

const QUOTES = {
  weak: ['I have made two tables', 'I would put the member\'s name in the book table', 'I did not need to normalise them', 'Each book has an isbn which is the key', 'This design is simple and easy to understand'],
  average: ['Books can have several authors, so I added a BookAuthor table', 'Cardinality is one-to-many in each case except BookAuthor', 'I have left publisher on the Book table', 'The email on Member should be unique', 'A Publisher table would be more normalised but the library only has a few publishers'],
  strong: ['A Copy entity separates the physical item from the title', 'author_order preserves the credited order', 'Publisher name was a transitive dependency on Book', 'A partial unique index on Loan(copy_id) WHERE returned_on IS NULL', 'The alternative — a quantity column on Book — is simpler'],
  uploaded: ['I identified the following entities: Book, Member, Loan, Author and Publisher', 'I created a linking table called Wrote', 'I moved publisher out of Book into its own table', 'Member.email is unique', 'I considered a Copy table for multiple copies'],
}

const NOT_MET_NOTES = {
  c1: 'The higher level is not reached: data types are not stated for any attribute.',
  c2: 'Optionality is not stated, so the top level is not reached.',
  c3: 'No denormalisation is discussed, so the top level is not reached.',
  c4: 'No ON DELETE or ON UPDATE actions are chosen, so the top level is not reached.',
  c5: 'Alternatives are not compared with their consequences, so the top level is not reached.',
}

/** Build a pass (test_sample_attempt_grades row) for a level rubric. */
function levelPass(id, runId, sampleId, repeatIndex, levels, target, tolerance, intents, quoteKey, opts = {}) {
  const status = opts.status ?? 'complete'
  if (status !== 'complete') {
    return { id, testSampleRunId: runId, testSampleScriptId: sampleId, repeatIndex, status, targetScore: target, scoreTotal: null, maxPoints: 60, scoreDelta: null, withinTolerance: null, summaryFeedback: null, error: opts.error ?? null, gradedAt: null, categoryGrades: [] }
  }
  const categoryGrades = RUBRIC_LEVEL.map((cat, i) => {
    const level = levels[i]
    const intent = intents.find(x => x.testSampleScriptId === sampleId && x.testGradingCategoryId === cat.id)
        return {
      id: `${id}-${cat.id}`, testGradingCategoryId: cat.id, categoryTitle: cat.title,
      level, levelTitle: LEVEL_TITLES[level - 1], levelDescription: cat.levels[level - 1].description,
      categoryLevelScore: LEVEL_POINTS[level - 1], candidateScore: LEVEL_POINTS[level - 1], scoreDisplay: LEVEL_POINTS[level - 1], maxPoints: 12,
      weighting: 0,
      rationale: levelRationale(cat, level, 2, level < 4 ? NOT_MET_NOTES[cat.id] : 'Every statement of the top level is met.', QUOTES[quoteKey]?.[i]),
      feedback: null,
      gradingConfidenceRating: [88, 74, 91, 82, 79][(i + repeatIndex) % 5],
      statementPoints: null,
      intendedLevel: intent?.intendedLevel ?? null,
      intendedScore: intent?.intendedScore ?? null,
    }
  })
  const scoreTotal = categoryGrades.reduce((s, g) => s + g.scoreDisplay, 0)
  const delta = target == null ? null : scoreTotal - target
  return {
    id, testSampleRunId: runId, testSampleScriptId: sampleId, repeatIndex, status: 'complete',
    targetScore: target, scoreTotal, maxPoints: 60, scoreDelta: delta,
    withinTolerance: target == null ? null : Math.abs(delta) <= 60 * tolerance / 100 + 1e-9,
    summaryFeedback: null, error: null, gradedAt: '2026-09-16T14:2' + repeatIndex + ':00.000Z', categoryGrades,
  }
}

function levelIntents(sampleId, levels, source, rationales) {
  return RUBRIC_LEVEL.map((cat, i) => ({
    id: `${sampleId}-int-${cat.id}`, testSampleScriptId: sampleId, testGradingCategoryId: cat.id, categoryTitle: cat.title,
    intendedLevel: levels[i], intendedLevelTitle: LEVEL_TITLES[levels[i] - 1], intendedStatementIds: null,
    intendedScore: LEVEL_POINTS[levels[i] - 1], maxPoints: 12, source: Array.isArray(source) ? source[i] : source,
    rationale: rationales ? rationales[i] : (source === 'estimated' ? `Estimated from the target mark: level ${levels[i]} is the nearest share of this category's 12 marks.` : null),
  }))
}

const PLAN_LINES = {
  weak: [
    'Omits three of the five entities (Author, Publisher, Loan) and declares no primary key on Member, so the design cannot represent a loan.',
    'Names only the borrow relationship, states no cardinality, and resolves nothing — the member\'s name is placed in the Book table.',
    'Leaves repeating groups in place and never mentions a normal form.',
    'Declares foreign keys for the one relationship it has, but no check or unique constraints.',
    'Describes the design as simple; never ties a decision to a scenario requirement or explains a choice.',
  ],
  average: [
    'Names all five core entities with a key each, but leaves published_year and publisher on Book, so attributes are partly misplaced.',
    'States cardinality for every relationship and resolves Book–Author through BookAuthor; optionality is never stated.',
    'Reaches 1NF and 2NF explicitly, then leaves the publisher transitive dependency in place and says so.',
    'Declares every foreign key and one unique constraint; no check constraints anywhere.',
    'Justifies keeping Loan separate and the missing Publisher table in general terms, without weighing alternatives.',
  ],
  strong: [
    'Complete entity set with data types on every attribute and consistent snake_case naming throughout.',
    'Every relationship carries cardinality and optionality; Book–Author is resolved and the junction attribute is explained.',
    'Shows each normal-form step and reaches 3NF; no denormalisation is applied, and none is justified.',
    'Foreign keys on every relationship with chosen ON DELETE actions, plus check and partial unique constraints.',
    'Weighs the Copy entity against a quantity column with consequences; acknowledges the unmodelled reservations.',
  ],
}

/* ---------------- points-rubric grades ---------------- */
const POINT_LEAVES = [RUBRIC_POINTS[0].children[0], RUBRIC_POINTS[0].children[1], RUBRIC_POINTS[1], RUBRIC_POINTS[2]]
function pointsPass(id, runId, sampleId, repeatIndex, awardedSets, target, tolerance, intents) {
  const categoryGrades = POINT_LEAVES.map((cat, i) => {
    const awarded = awardedSets[i]
    const statementPoints = cat.statements.map(s => ({
      testGradingCategoryStatementId: s.id, statement: s.statement, points: s.points, awarded: awarded.includes(s.id),
      rationale: awarded.includes(s.id) ? 'Present in the answer.' : 'Not found in the answer.',
    }))
    const score = statementPoints.filter(s => s.awarded).reduce((a, s) => a + s.points, 0)
    const intent = intents.find(x => x.testSampleScriptId === sampleId && x.testGradingCategoryId === cat.id)
    return {
      id: `${id}-${cat.id}`, testGradingCategoryId: cat.id, categoryTitle: cat.title, level: null, levelTitle: null, levelDescription: null,
      categoryLevelScore: null, candidateScore: score, scoreDisplay: score, maxPoints: cat.maxAvailablePoints, weighting: 0,
      rationale: cat.statements.map(s => `'${s.statement}' - ${awarded.includes(s.id) ? 'Met' : 'Not Met'}.`).join(' ') + ` Awarded ${score} of ${cat.maxAvailablePoints}.`,
      feedback: null, gradingConfidenceRating: [86, 77, 90, 83][(i + repeatIndex) % 4], statementPoints,
      intendedLevel: null, intendedScore: intent?.intendedScore ?? null,
    }
  })
  const scoreTotal = categoryGrades.reduce((s, g) => s + g.scoreDisplay, 0)
  const delta = target == null ? null : scoreTotal - target
  return { id, testSampleRunId: runId, testSampleScriptId: sampleId, repeatIndex, status: 'complete', targetScore: target, scoreTotal, maxPoints: 40, scoreDelta: delta,
    withinTolerance: target == null ? null : Math.abs(delta) <= 40 * tolerance / 100 + 1e-9, summaryFeedback: null, error: null, gradedAt: '2026-09-16T15:1' + repeatIndex + ':00.000Z', categoryGrades }
}
function pointsIntents(sampleId, sets, plans) {
  return POINT_LEAVES.map((cat, i) => ({
    id: `${sampleId}-int-${cat.id}`, testSampleScriptId: sampleId, testGradingCategoryId: cat.id, categoryTitle: cat.title,
    intendedLevel: null, intendedLevelTitle: null, intendedStatementIds: sets[i],
    intendedScore: cat.statements.filter(s => sets[i].includes(s.id)).reduce((a, s) => a + s.points, 0), maxPoints: cat.maxAvailablePoints,
    source: 'generated', rationale: plans[i],
  }))
}

/* ---------------- sample rows ---------------- */
function sample(id, o) {
  return Object.assign({
    id, label: null, source: 'generated', band: null, targetScore: null, originalFileName: null, hasMarkdown: true,
    conversionStatus: 'complete', conversionError: null, displayIndex: 0, generatedByRunId: 'gen-1', rubricUpdatedAt: '2026-09-15T09:00:00.000Z',
    contentUpdatedAt: null, targetsUpdatedAt: null, createdAt: '2026-09-15T09:02:00.000Z', updatedAt: '2026-09-16T14:20:00.000Z',
    latestRunId: null, latestRunFailed: false, isOutOfDate: false, outOfDateReasons: [], needsGrading: false,
  }, o)
}
function run(id, o) {
  return Object.assign({ id, kind: 'grading', status: 'complete', repeatCount: 3, tolerancePercentage: 10, rubricType: 'level-based', rubricUpdatedAt: '2026-09-15T09:00:00.000Z',
    maxAvailablePoints: 60, gradingRoute: 'standard', totalPasses: 12, completedPasses: 12, failedPasses: 0, startedAt: '2026-09-16T14:18:00.000Z', completedAt: '2026-09-16T14:31:00.000Z', error: null, createdAt: '2026-09-16T14:18:00.000Z' }, o)
}

/* ================================================================== *
 * SCENARIOS — each returns what the tab would receive from the API:
 *   overview  = GET …/quality-checks
 *   results   = GET …/quality-checks/results  ({ passes, runs, intents })
 * ================================================================== */
const SETTINGS = { tolerancePercentage: 10, defaultRepeatCount: 3 }

function baseOverview(samples, extra) {
  return Object.assign({
    testId: 'test-1', settings: { ...SETTINGS }, test: { rubricType: 'level-based', maxAvailablePoints: 60 },
    samples, sampleCount: samples.length, maxSamples: 5, pendingCount: samples.filter(s => s.needsGrading).length,
    latestRun: null, latestGeneration: run('gen-1', { kind: 'generation', totalPasses: 3, completedPasses: 3, repeatCount: 1 }),
    rubricUpdatedAt: '2026-09-15T09:00:00.000Z', isOutOfDate: false, outOfDateReasons: [], intents: [],
  }, extra)
}

const LEVEL_PLANS = {
  s1: { levels: [1, 2, 1, 2, 1], target: 21, band: 'low', label: 'Weak sample', key: 'weak' },
  s2: { levels: [2, 3, 2, 3, 2], target: 36, band: 'mid', label: 'Average sample', key: 'average' },
  s3: { levels: [4, 3, 3, 4, 3], target: 51, band: 'high', label: 'Strong sample', key: 'strong' },
}
const LEVEL_REPEATS = {
  s1: [[1, 2, 1, 2, 1], [1, 2, 2, 2, 1], [1, 2, 1, 2, 1]],
  s2: [[2, 3, 2, 3, 2], [3, 3, 3, 3, 2], [2, 3, 3, 3, 3]],
  s3: [[3, 3, 2, 3, 2], [3, 2, 2, 3, 3], [3, 3, 2, 3, 2]],
  s4: [[3, 3, 3, 3, 3], [3, 4, 3, 3, 3], [3, 3, 2, 3, 3]],
  s5: [[2, 2, 2, 2, 2], [2, 2, 1, 2, 2], [2, 2, 2, 2, 2]],
}

function generatedSamples(overrides = {}) {
  return ['s1', 's2', 's3'].map((id, i) => sample(id, Object.assign({
    label: LEVEL_PLANS[id].label, band: LEVEL_PLANS[id].band, targetScore: LEVEL_PLANS[id].target, displayIndex: i,
  }, overrides[id] || {})))
}
function thandi(o = {}) {
  return sample('s4', Object.assign({ source: 'uploaded', label: 'Marked script – Thandi M.', originalFileName: 'thandi-m-database-design.pdf', targetScore: 42, displayIndex: 3, generatedByRunId: null, createdAt: '2026-09-15T11:40:00.000Z' }, o))
}
function kabelo(o = {}) {
  return sample('s5', Object.assign({ source: 'uploaded', label: 'Marked script – Kabelo N.', originalFileName: 'kabelo-n-schema.docx', targetScore: null, displayIndex: 4, generatedByRunId: null, createdAt: '2026-09-16T08:05:00.000Z' }, o))
}
function generatedIntents() {
  return ['s1', 's2', 's3'].flatMap(id => levelIntents(id, LEVEL_PLANS[id].levels, 'generated', PLAN_LINES[LEVEL_PLANS[id].key]))
}
const THANDI_ESTIMATE = [3, 3, 2, 3, 3]
function thandiIntents(authoredC3) {
  const levels = authoredC3 ? [3, 3, 3, 3, 3] : THANDI_ESTIMATE
  const src = authoredC3 ? ['estimated', 'estimated', 'authored', 'estimated', 'estimated'] : 'estimated'
  const ints = levelIntents('s4', levels, src)
  if (authoredC3) ints[2].rationale = 'Set by the author: the script shows each normal-form step explicitly.'
  return ints
}
function passesFor(runId, sampleId, repeats, target, intents, quoteKey, statuses) {
  return repeats.map((levels, r) => levelPass(`${runId}-${sampleId}-r${r}`, runId, sampleId, r, levels, target, 10, intents, quoteKey, statuses ? statuses[r] : {}))
}

const SCENARIOS = {
  empty: {
    label: '1 · Starting view (no samples)', rubric: 'level',
    build() { return { overview: baseOverview([], { latestGeneration: null }), results: { passes: [], runs: [], intents: [] } } },
  },
  generating: {
    label: '2 · Generating samples (run in progress)', rubric: 'level',
    build() {
      const samples = generatedSamples({ s2: { conversionStatus: 'in-progress', hasMarkdown: false }, s3: { conversionStatus: 'in-progress', hasMarkdown: false } })
      samples[0].needsGrading = true
      const gen = run('gen-2', { kind: 'generation', status: 'processing', totalPasses: 3, completedPasses: 1, repeatCount: 1, completedAt: null })
      return { overview: baseOverview(samples, { latestGeneration: gen, intents: levelIntents('s1', LEVEL_PLANS.s1.levels, 'generated', PLAN_LINES.weak) }), results: { passes: [], runs: [], intents: [] } }
    },
  },
  ready: {
    label: '3 · Samples ready, nothing graded yet', rubric: 'level',
    build() {
      const samples = [...generatedSamples(), thandi({ conversionStatus: 'queued', hasMarkdown: false }), kabelo()]
      samples.slice(0, 3).forEach(s => (s.needsGrading = true))
      return { overview: baseOverview(samples, { intents: [...generatedIntents(), ...thandiIntents(false)] }), results: { passes: [], runs: [], intents: [] } }
    },
  },
  grading: {
    label: '4 · Grading run in progress', rubric: 'level',
    build() {
      const samples = [...generatedSamples({ s1: { latestRunId: 'run-4' }, s2: { latestRunId: 'run-4' }, s3: { latestRunId: 'run-4' } }), thandi({ latestRunId: 'run-4' }), kabelo()]
      const r = run('run-4', { status: 'processing', totalPasses: 12, completedPasses: 5, completedAt: null, startedAt: '2026-09-17T10:02:00.000Z' })
      const gi = generatedIntents(); const ti = thandiIntents(false)
      const passes = [
        ...passesFor('run-4', 's1', LEVEL_REPEATS.s1, 21, gi, 'weak'),
        ...passesFor('run-4', 's2', LEVEL_REPEATS.s2, 36, gi, 'average', [{}, {}, { status: 'in-progress' }]),
        ...passesFor('run-4', 's3', LEVEL_REPEATS.s3, 51, gi, 'strong', [{ status: 'queued' }, { status: 'queued' }, { status: 'queued' }]),
        ...passesFor('run-4', 's4', LEVEL_REPEATS.s4, 42, ti, 'uploaded', [{ status: 'in-progress' }, { status: 'queued' }, { status: 'queued' }]),
      ]
      return { overview: baseOverview(samples, { latestRun: r, intents: [...gi, ...ti] }), results: { passes, runs: [r], intents: [...gi, ...ti] } }
    },
  },
  results: {
    label: '5 · Results (×3 repeats, one sample out of date)', rubric: 'level',
    build() {
      const samples = [...generatedSamples({ s1: { latestRunId: 'run-3' }, s2: { latestRunId: 'run-3' }, s3: { latestRunId: 'run-3' } }),
        thandi({ latestRunId: 'run-3', isOutOfDate: true, outOfDateReasons: ['targetsEdited'], needsGrading: true, targetsUpdatedAt: '2026-09-17T09:12:00.000Z' }), kabelo()]
      const r = run('run-3')
      const gi = generatedIntents(); const snap = thandiIntents(false); const live = thandiIntents(true)
      const passes = [
        ...passesFor('run-3', 's1', LEVEL_REPEATS.s1, 21, gi, 'weak'),
        ...passesFor('run-3', 's2', LEVEL_REPEATS.s2, 36, gi, 'average'),
        ...passesFor('run-3', 's3', LEVEL_REPEATS.s3, 51, gi, 'strong'),
        ...passesFor('run-3', 's4', LEVEL_REPEATS.s4, 42, snap, 'uploaded'),
      ]
      return { overview: baseOverview(samples, { latestRun: r, intents: [...gi, ...live] }), results: { passes, runs: [r], intents: [...gi, ...live] } }
    },
  },
  stale: {
    label: '6 · Out of date — rubric edited after the run', rubric: 'level',
    build() {
      const s = SCENARIOS.results.build()
      s.overview.isOutOfDate = true; s.overview.outOfDateReasons = ['rubric', 'maxAvailablePoints']; s.overview.rubricUpdatedAt = '2026-09-17T11:30:00.000Z'
      s.overview.samples.forEach(x => { if (x.latestRunId) { x.isOutOfDate = true; x.outOfDateReasons = ['rubric', 'maxAvailablePoints', ...x.outOfDateReasons]; x.needsGrading = true } })
      s.overview.pendingCount = 4
      return s
    },
  },
  failures: {
    label: '7 · Failure states (generation, conversion, grading, draft)', rubric: 'level',
    build() {
      const samples = [
        ...generatedSamples({
          s1: { conversionStatus: 'error', hasMarkdown: false, conversionError: 'The model returned an empty script after two attempts.' },
          s2: { latestRunId: 'run-5', latestRunFailed: true, needsGrading: true },
          s3: { latestRunId: 'run-5' },
        }),
        thandi({ conversionStatus: 'error', hasMarkdown: false, conversionError: 'Unsupported file: the PDF is scanned images with no text layer.' }),
        kabelo({ targetScore: 30, latestRunId: 'run-5', hasDraft: true }),
      ]
      const r = run('run-5', { totalPasses: 9, completedPasses: 6, failedPasses: 3 })
      const gi = generatedIntents(); const ki = levelIntents('s5', [2, 2, 1, 2, 2], 'estimated')
      const passes = [
        ...passesFor('run-5', 's2', LEVEL_REPEATS.s2, 36, gi, 'average', [0, 1, 2].map(() => ({ status: 'error', error: 'Grader timed out after 900 s' }))),
        ...passesFor('run-5', 's3', LEVEL_REPEATS.s3, 51, gi, 'strong'),
        ...passesFor('run-5', 's5', LEVEL_REPEATS.s5, 30, ki, 'uploaded'),
      ]
      return { overview: baseOverview(samples, { latestRun: r, intents: [...gi, ...ki] }), results: { passes, runs: [r], intents: [...gi, ...ki] } }
    },
  },
  /* ---- points rubric ---- */
  pointsEmpty: { label: '1 · Starting view (no samples)', rubric: 'points',
    build() { const s = SCENARIOS.empty.build(); s.overview.test = { rubricType: 'points-based', maxAvailablePoints: 40 }; return s } },
  pointsReady: { label: '3 · Samples ready, nothing graded yet', rubric: 'points',
    build() { const s = SCENARIOS.pointsResults.build(); s.overview.samples.forEach(x => { x.latestRunId = null; x.needsGrading = true }); s.overview.pendingCount = 3; s.overview.latestRun = null; s.results = { passes: [], runs: [], intents: s.results.intents }; return s } },
  pointsResults: { label: '5 · Results (×3 repeats)', rubric: 'points',
    build() {
      const plans = {
        p1: { sets: [['A1'], ['B1'], ['C1'], ['D2']], target: 14, band: 'low', label: 'Weak sample',
          plan: ['Identifies the equipment obligation only; never explains why installation is not distinct and does not cite the IFRS 15 model.', 'States that the price is allocated on stand-alone prices but gives no figures and no timing.', 'Calls the contract a lease; computes nothing.', 'Mentions that disclosures are required; no journal entries.'] },
        p2: { sets: [['A1', 'A2'], ['B1', 'B3'], ['C1', 'C4'], ['D2']], target: 24, band: 'mid', label: 'Average sample',
          plan: ['Identifies both obligations and explains installation; does not cite the five-step model.', 'Allocates on relative stand-alone prices and states timing, but the R120 000 / R30 000 split is miscomputed.', 'Identifies the lease and rules out the short-term exemption; no liability computation.', 'Notes disclosures; journal entries omitted.'] },
        p3: { sets: [['A1', 'A2', 'A3'], ['B1', 'B2', 'B3'], ['C1', 'C2', 'C3'], ['D1']], target: 34, band: 'high', label: 'Strong sample',
          plan: ['Full answer on obligations with the step-two citation.', 'Correct allocation with timing for each obligation.', 'Lease identified, liability and right-of-use asset computed; the short-term exemption is not discussed.', 'Balanced journal entries; disclosure notes omitted.'] },
      }
      const repeats = {
        p1: [[['A1'], ['B1'], ['C1'], ['D2']], [['A1'], ['B1', 'B3'], ['C1'], ['D2']], [['A1'], ['B1'], ['C1'], ['D2']]],
        p2: [[['A1', 'A2'], ['B1', 'B3'], ['C1', 'C4'], ['D2']], [['A1', 'A2'], ['B1', 'B3'], ['C1', 'C2', 'C4'], ['D2']], [['A1'], ['B1', 'B3'], ['C1', 'C4'], ['D2']]],
        p3: [[['A1', 'A2', 'A3'], ['B1', 'B2', 'B3'], ['C1', 'C2'], ['D1']], [['A1', 'A2', 'A3'], ['B1', 'B2'], ['C1', 'C2'], ['D1']], [['A1', 'A2', 'A3'], ['B1', 'B2', 'B3'], ['C1', 'C3'], ['D1']]],
      }
      const samples = ['p1', 'p2', 'p3'].map((id, i) => sample(id, { label: plans[id].label, band: plans[id].band, targetScore: plans[id].target, displayIndex: i, latestRunId: 'run-p1' }))
      const intents = ['p1', 'p2', 'p3'].flatMap(id => pointsIntents(id, plans[id].sets, plans[id].plan))
      const r = run('run-p1', { rubricType: 'points-based', maxAvailablePoints: 40, totalPasses: 9, completedPasses: 9 })
      const passes = ['p1', 'p2', 'p3'].flatMap(id => repeats[id].map((sets, ri) => pointsPass(`run-p1-${id}-r${ri}`, 'run-p1', id, ri, sets, plans[id].target, 10, intents)))
      const overview = baseOverview(samples, { test: { rubricType: 'points-based', maxAvailablePoints: 40 }, latestRun: r, intents })
      return { overview, results: { passes, runs: [r], intents } }
    } },
}
