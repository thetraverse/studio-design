/* =========================================================================
   Quality checks — logic

   Ports of utils/qualityChecks.ts, verbatim from the 17 Sep 2026 POC: same
   function names, same rules. Verdicts, level achieved, diagnosis and category
   behaviour are all decided here, so the rebuild cannot drift from the POC's
   numbers. Presentation lives in quality-checks.html.
   ========================================================================= */
/* ================================================================== *
 * LOGIC — ports of utils/qualityChecks.ts (same names, same rules).
 * ================================================================== */
const round1 = v => Math.round(v * 10) / 10
function formatScore(v) { if (v == null) return '–'; return Number.isInteger(v) ? String(v) : v.toFixed(1) }
function mode(values) { const c = new Map(); for (const v of values) c.set(v, (c.get(v) ?? 0) + 1); let best = { value: null, count: 0 }; for (const [value, count] of c) if (count > best.count) best = { value, count }; return best }
const categoryKeyOf = g => g.testGradingCategoryId ?? g.categoryTitle ?? g.id

function aggregateSample(sample, passes) {
  const own = passes.filter(p => p.testSampleScriptId === sample.id)
  const graded = own.filter(p => p.status === 'complete' && p.scoreTotal != null)
  const failed = own.filter(p => p.status === 'error')
  const totals = graded.map(p => p.scoreTotal)
  const mean = totals.length ? round1(totals.reduce((a, b) => a + b, 0) / totals.length) : null
  const target = graded[0]?.targetScore ?? sample.targetScore ?? null
  const inRangeCount = graded.filter(p => p.withinTolerance === true).length
  const spread = new Set(totals).size > 1
  let verdict = 'pending'
  if (graded.length === 0) verdict = failed.length > 0 && failed.length === own.length ? 'error' : 'pending'
  else if (target == null) verdict = 'none'
  else if (inRangeCount === graded.length && graded.length > 1 && !spread) verdict = 'perfect'
  else if (inRangeCount * 2 > graded.length) verdict = 'ok'
  else if (inRangeCount === 0) verdict = mean < target ? 'under' : 'over'
  else verdict = 'flux'
  return { sample, passes: own, graded, failed, mean, min: totals.length ? Math.min(...totals) : null, max: totals.length ? Math.max(...totals) : null, maxPoints: graded[0]?.maxPoints ?? null, target, inRangeCount, verdict }
}

function flattenRubricCategories(categories) {
  const ordered = [...categories].sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0))
  return ordered.flatMap(c => c.children?.length ? flattenRubricCategories(c.children) : [c])
}
function rubricOrderIndex(rubric) { const m = new Map(); flattenRubricCategories(rubric).forEach((c, i) => { if (!m.has(c.id)) m.set(c.id, i); if (c.title && !m.has(c.title)) m.set(c.title, i) }); return m }
function intentFor(intents, sampleId, categoryId, title) {
  const own = intents.filter(i => i.testSampleScriptId === sampleId)
  return own.find(i => i.testGradingCategoryId === categoryId) ?? own.find(i => i.categoryTitle === title) ?? null
}

function buildSampleBreakdown(aggregate, intents = [], rubric = []) {
  const order = []; const buckets = new Map()
  for (const pass of aggregate.graded) for (const grade of pass.categoryGrades ?? []) {
    const key = categoryKeyOf(grade); if (!buckets.has(key)) { order.push(key); buckets.set(key, []) } buckets.get(key).push({ pass, grade })
  }
  const ro = rubricOrderIndex(rubric)
  const ordered = order.slice().sort((a, b) => { const l = ro.get(a), r = ro.get(b); if (l != null && r != null) return l - r; if (l != null) return -1; if (r != null) return 1; return 0 })
  return ordered.map(categoryId => {
    const entries = buckets.get(categoryId).slice().sort((a, b) => a.pass.repeatIndex - b.pass.repeatIndex)
    const grades = entries.map(e => e.grade); const repeatCount = grades.length
    const scores = grades.map(g => g.scoreDisplay).filter(s => s != null)
    const meanScore = scores.length ? round1(scores.reduce((a, b) => a + b, 0) / scores.length) : null
    const awardedLevels = grades.map(g => g.level).filter(l => l != null)
    const levels = [...new Set(awardedLevels)].sort((a, b) => a - b)
    const modal = mode(awardedLevels)
    const stableLevel = levels.length === 1 ? levels[0] : null
    const levelTitle = stableLevel != null ? (grades.find(g => g.level === stableLevel)?.levelTitle ?? null) : null
    const intendedLevel = grades[0]?.intendedLevel ?? null
    const intendedScore = grades[0]?.intendedScore ?? null
    const title = grades[0]?.categoryTitle ?? 'Untitled category'
    const intent = intentFor(intents, aggregate.sample.id, categoryId, title)
    const isPoints = grades.some(g => g.statementPoints?.length)
    let statements = null
    if (isPoints) {
      const by = new Map()
      for (const g of grades) for (const p of g.statementPoints ?? []) {
        const key = p.testGradingCategoryStatementId ?? p.statement ?? ''
        const e = by.get(key) ?? { statement: p.statement ?? '', points: p.points ?? null, awardedCount: 0 }
        if (p.awarded) e.awardedCount += 1; by.set(key, e)
      }
      statements = [...by.values()]
    }
    let state
    if (repeatCount === 0) state = 'off'
    else if (isPoints) {
      const scoresAgree = new Set(scores).size <= 1
      const stAgree = (statements ?? []).every(s => s.awardedCount === 0 || s.awardedCount === repeatCount)
      if (!scoresAgree || !stAgree) state = 'mixed'; else if (intendedScore != null && meanScore !== intendedScore) state = 'miss'; else state = 'on'
    } else if (levels.length > 1) state = 'mixed'
    else if (intendedLevel != null && stableLevel !== intendedLevel) state = 'miss'
    else state = 'on'
    const hasIntent = isPoints ? intendedScore != null : intendedLevel != null
    const modalScore = mode(scores)
    const repeats = entries.map(({ pass, grade }) => {
      const score = grade.scoreDisplay ?? null
      let passed
      if (hasIntent) passed = isPoints ? score === intendedScore : grade.level === intendedLevel
      else passed = isPoints ? score === modalScore.value : grade.level === modal.value
      return { passId: pass.id, repeatIndex: pass.repeatIndex, level: grade.level ?? null, score, pass: passed, basis: hasIntent ? 'intent' : 'agreement' }
    })
    return { categoryId, title, maxPoints: grades[0]?.maxPoints ?? null, meanScore, repeatCount, repeats, levels, level: stableLevel, levelTitle, agreementCount: modal.count,
      intendedLevel, intendedLevelTitle: intent?.intendedLevelTitle ?? null, intendedScore, intentRationale: intent?.rationale ?? null, intentSource: intent?.source ?? null, state, statements }
  })
}

const runCount = n => `${n} run${n === 1 ? '' : 's'}`
function describeLevelAchieved(category, isPoints) {
  if (isPoints) {
    const { statements, repeatCount, intendedScore, meanScore } = category
    const total = statements?.length ?? 0
    if (total === 0 && meanScore == null) return { code: null, title: 'Not graded', note: null, tone: 'none', mixed: false }
    const awarded = (statements ?? []).filter(s => s.awardedCount === repeatCount).length
    const contested = (statements ?? []).filter(s => s.awardedCount > 0 && s.awardedCount < repeatCount).length
    const code = meanScore != null ? formatScore(meanScore) : null
    const title = `${awarded} of ${total} statements`
    if (intendedScore == null) return { code, title, note: contested > 0 ? `${contested} contested across repeats` : null, tone: contested > 0 ? 'off' : 'none', mixed: contested > 0 }
    const target = `target ${formatScore(intendedScore)}`
    if (category.state === 'on') return { code, title, note: `Meets ${target}`, tone: 'on', mixed: false }
    const direction = meanScore != null && meanScore < intendedScore ? 'Below' : 'Above'
    return { code, title, note: `${direction} ${target}`, tone: 'off', mixed: contested > 0 }
  }
  const { level, levels, intendedLevel, repeats } = category
  const target = intendedLevel != null ? `target L${intendedLevel}` : null
  if (level == null && levels.length === 0) return { code: null, title: 'Not graded', note: null, tone: 'none', mixed: false }
  if (level != null) {
    if (target == null) return { code: `L${level}`, title: null, note: null, tone: 'none', mixed: false }
    if (level === intendedLevel) return { code: `L${level}`, title: null, note: `Meets ${target}`, tone: 'on', mixed: false }
    return { code: `L${level}`, title: null, note: `${level < intendedLevel ? 'Below' : 'Above'} ${target}`, tone: 'off', mixed: false }
  }
  const code = levels.length > 1 ? `L${levels[0]}–L${levels[levels.length - 1]}` : `L${levels[0]}`
  if (target == null) return { code, title: 'Mixed', note: `Levels disagree across ${runCount(repeats.length)}`, tone: 'off', mixed: true }
  const missed = repeats.filter(r => r.level !== intendedLevel)
  const below = missed.filter(r => r.level != null && r.level < intendedLevel).length
  const above = missed.length - below
  const direction = above === 0 ? 'below' : below === 0 ? 'above' : 'off'
  return { code, title: 'Mixed', note: direction === 'off' ? `${runCount(missed.length)} off ${target}` : `${runCount(missed.length)} ${direction} ${target}`, tone: 'off', mixed: true }
}
function formatRunOutcomes(category) {
  const isLevels = category.repeats.some(r => r.level != null)
  return category.repeats.map(r => isLevels ? (r.level != null ? `L${r.level}` : '–') : formatScore(r.score)).join(', ')
}
function describeRepeatOutcome(repeat, category) {
  const label = `Repeat ${repeat.repeatIndex + 1}`
  const got = repeat.level != null ? `level ${repeat.level}` : `${formatScore(repeat.score)} marks`
  if (repeat.basis === 'intent') { const t = category.intendedLevel != null ? `level ${category.intendedLevel}` : `${formatScore(category.intendedScore)} marks`; return repeat.pass ? `${label}: ${got} — on target` : `${label}: ${got}, target ${t}` }
  return repeat.pass ? `${label}: ${got} — the same as most repeats` : `${label}: ${got} — away from the other repeats`
}
const passedRepeatCount = c => c.repeats.filter(r => r.pass).length
const repeatsMostlyPassed = c => c.repeats.length === 0 ? true : passedRepeatCount(c) * 2 > c.repeats.length
function describeTarget(t) {
  if (!t) return null
  if (t.intendedLevel != null) return { label: `Level ${t.intendedLevel}`, name: t.intendedLevelTitle?.trim() || null }
  if (t.intendedScore != null) return { label: `${formatScore(t.intendedScore)} marks`, name: null }
  return null
}
function offIntentCategories(breakdown) {
  const withIntent = breakdown.filter(c => c.intendedLevel != null || c.intendedScore != null)
  return { off: withIntent.filter(c => !repeatsMostlyPassed(c)), total: withIntent.length }
}
const categoryCount = n => `${n} categor${n === 1 ? 'y' : 'ies'}`
function diagnoseSample(aggregate, breakdown, toleranceMarks) {
  const { verdict, mean, target, min, max } = aggregate
  if (verdict !== 'under' && verdict !== 'over' && verdict !== 'flux') return null
  if (mean == null || target == null) return null
  const tol = toleranceMarks ?? 0; const low = round1(target - tol), high = round1(target + tol)
  const range = toleranceMarks != null ? `${formatScore(low)}–${formatScore(high)}` : formatScore(target)
  const spread = min != null && max != null && min !== max ? `${formatScore(min)} to ${formatScore(max)}` : formatScore(mean)
  let title
  if (verdict === 'flux') title = `Unstable: in range on ${aggregate.inRangeCount} of ${aggregate.graded.length} repeats.`
  else { const edge = verdict === 'under' ? low : high; title = `Graded ${formatScore(round1(Math.abs(mean - edge)))} marks ${verdict === 'under' ? 'below' : 'above'} the accepted range on average (${spread} against ${range}).` }
  const withIntent = breakdown.filter(c => c.intendedLevel != null || c.intendedScore != null)
  if (withIntent.length === 0) return { kind: verdict, title, lines: ['This sample has no per-category targets, so only the total can be compared. Open the sample and estimate or set its targets to get the category-level breakdown.'], suggestion: verdict === 'flux' ? 'Rerun to see whether the movement persists.' : null }
  const misses = withIntent.filter(c => c.state === 'miss')
  const below = misses.filter(c => c.intendedLevel != null && c.level != null && c.level < c.intendedLevel)
  const above = misses.filter(c => c.intendedLevel != null && c.level != null && c.level > c.intendedLevel)
  const points = misses.filter(c => c.intendedLevel == null && c.intendedScore != null && c.meanScore != null)
  const mixed = withIntent.filter(c => c.state === 'mixed')
  const lines = []
  if (below.length) lines.push(`Graded below its target level in ${categoryCount(below.length)}: ${below.map(c => c.title).join('; ')}.`)
  if (above.length) lines.push(`Graded above its target level in ${categoryCount(above.length)}: ${above.map(c => c.title).join('; ')}.`)
  for (const c of points) lines.push(`${c.title}: scored ${formatScore(c.meanScore)}, ${c.meanScore < c.intendedScore ? 'below' : 'above'} the intended ${formatScore(c.intendedScore)}.`)
  if (mixed.length) lines.push(`${categoryCount(mixed.length)} changed answer between repeats: ${mixed.map(c => `${c.title} (agreed on ${c.agreementCount} of ${c.repeatCount})`).join('; ')}.`)
  let suggestion = null
  const pb = points.some(c => c.meanScore < c.intendedScore), pa = points.some(c => c.meanScore > c.intendedScore)
  if (below.length || pb) suggestion = 'Review the descriptors for the categories graded low.'
  else if (above.length || pa) suggestion = 'Tighten the descriptors for the categories graded high.'
  else if (mixed.length) suggestion = 'Rerun to see whether the movement persists.'
  return { kind: verdict, title, lines, suggestion }
}

function aboutFromRubric(c) {
  const clean = v => v && v.trim().length ? v.trim() : null
  const about = { description: clean(c.description), instructions: clean(c.instructions), contentToGradeInstruction: clean(c.contentToGradeInstruction),
    levels: (c.levels ?? []).filter(l => l.level != null).map(l => ({ level: l.level, title: l.title, description: clean(l.description) })).sort((a, b) => a.level - b.level) }
  return (!about.description && !about.instructions && !about.contentToGradeInstruction && about.levels.length === 0) ? null : about
}
function indexRubric(rubric) { return new Map(flattenRubricCategories(rubric).map(c => [c.id, { about: aboutFromRubric(c) }])) }
function categoryRunsFor(aggregate, categoryId) {
  return aggregate.graded.flatMap(pass => (pass.categoryGrades ?? []).filter(g => categoryKeyOf(g) === categoryId).map(grade => ({ pass, grade }))).sort((a, b) => a.pass.repeatIndex - b.pass.repeatIndex)
}
function missWentBelow(r) { if (r.intendedLevel != null && r.level != null) return r.level < r.intendedLevel; if (r.intendedScore != null && r.meanScore != null) return r.meanScore < r.intendedScore; return false }
function buildCategoryView(rubric, samples, passes, intents = []) {
  const perSample = samples.map(sample => { const aggregate = aggregateSample(sample, passes); const rollups = new Map(); for (const r of buildSampleBreakdown(aggregate, intents, rubric)) rollups.set(r.categoryId, r); return { sample, aggregate, rollups } })
  const spine = flattenRubricCategories(rubric).map(c => ({ categoryId: c.id, title: c.title, maxPoints: c.maxAvailablePoints ?? null, about: aboutFromRubric(c) }))
  const known = new Set(spine.map(c => c.categoryId))
  for (const { rollups } of perSample) for (const [key, r] of rollups) { if (known.has(key)) continue; known.add(key); spine.push({ categoryId: key, title: r.title, maxPoints: r.maxPoints, about: null }) }
  return spine.map(category => {
    const entries = perSample.map(({ sample, aggregate, rollups }) => { const rollup = rollups.get(category.categoryId) ?? null; return { sample, aggregate, rollup, runs: rollup ? categoryRunsFor(aggregate, category.categoryId) : [], intent: intentFor(intents, sample.id, category.categoryId, category.title) } })
    const graded = entries.filter(e => e.rollup !== null)
    const grades = entries.flatMap(e => e.runs.map(r => r.grade))
    const scores = grades.map(g => g.scoreDisplay).filter(s => s != null)
    const levels = grades.map(g => g.level).filter(l => l != null)
    const distinctLevels = [...new Set(levels)].sort((a, b) => a - b), distinctScores = [...new Set(scores)].sort((a, b) => a - b)
    let onCount = 0, missCount = 0, mixedCount = 0, intentCount = 0, belowCount = 0, aboveCount = 0
    for (const { rollup } of graded) {
      if (rollup.intendedLevel != null || rollup.intendedScore != null) intentCount++
      if (rollup.state === 'mixed') mixedCount++
      else if (rollup.state === 'miss') { missCount++; if (missWentBelow(rollup)) belowCount++; else aboveCount++ }
      else if (rollup.state === 'on') onCount++
    }
    const outcomes = levels.length ? distinctLevels : distinctScores
    const isFlat = graded.length > 1 && outcomes.length <= 1
    const everyOn = graded.length > 0 && onCount === graded.length
    const everyRepeated = graded.every(e => (e.rollup?.repeatCount ?? 0) > 1)
    let state
    if (grades.length === 0) state = 'none'; else if (everyOn) state = everyRepeated ? 'perfect' : 'ok'; else if (onCount * 2 > graded.length) state = 'ok'; else if (mixedCount >= missCount) state = 'unstable'; else if (aboveCount === 0) state = 'low'; else if (belowCount === 0) state = 'high'; else state = 'off'
    return { categoryId: category.categoryId, title: category.title, maxPoints: graded[0]?.rollup?.maxPoints ?? category.maxPoints, entries, gradedSampleCount: graded.length, gradedCount: grades.length,
      meanScore: scores.length ? round1(scores.reduce((a, b) => a + b, 0) / scores.length) : null, distinctLevels, distinctScores, onCount, missCount, mixedCount, intentCount, state, isFlat, about: category.about }
  })
}
function categoryAwardCode(category, isPoints) {
  const values = isPoints ? category.distinctScores : category.distinctLevels
  if (!values.length) return null
  const p = isPoints ? '' : 'L'; const first = isPoints ? formatScore(values[0]) : String(values[0])
  if (values.length === 1) return `${p}${first}`
  const last = values[values.length - 1]
  return `${p}${first}–${p}${isPoints ? formatScore(last) : String(last)}`
}
function toleranceMarksFor(max, pct) { if (max == null || max <= 0) return null; return round1(max * pct / 100) }
function smallestLevelStep(rubric) {
  let smallest = null
  const visit = c => { if (c.children?.length) { c.children.forEach(visit); return } const pts = (c.levels ?? []).map(l => l.requiredPoints).filter(v => v != null).sort((a, b) => a - b); for (let i = 1; i < pts.length; i++) { const s = pts[i] - pts[i - 1]; if (s > 0 && (smallest == null || s < smallest)) smallest = s } }
  rubric.forEach(visit); return smallest
}
function toleranceFloorPercentage(step, max) { if (step == null || max == null || max <= 0) return null; return Math.ceil(step / max * 100) }
function rubricLacksGradingStatements(rubric, rubricType) {
  if (rubricType === 'points-based') return false
  const leaves = flattenRubricCategories(rubric); if (!leaves.length) return false
  return !leaves.some(c => (c.levels ?? []).some(l => (l.gradingStatements ?? []).length > 0))
}
function describeIntentSource(s) { if (s === 'estimated') return 'Estimated target'; if (s === 'authored') return 'Target set by you'; return 'Marking expectation' }
function editableRubricCategories(rubric, isPoints) {
  const ordered = [...rubric].sort((a, b) => (a.displayIndex ?? 0) - (b.displayIndex ?? 0))
  if (isPoints) return flattenRubricCategories(ordered).filter(c => (c.statements ?? []).length > 0)
  return ordered.filter(c => (c.levels ?? []).length > 0)
}
const BAND_INFO = {
  'low': { name: 'Weak', cls: 'low', window: [25, 40] }, 'low-mid': { name: 'Weak–Average', cls: 'lowmid', window: [40, 55] }, 'mid': { name: 'Average', cls: 'mid', window: [55, 70] },
  'mid-high': { name: 'Average–Strong', cls: 'midhigh', window: [70, 82] }, 'high': { name: 'Strong', cls: 'high', window: [82, 95] },
}
const bandScale = () => Object.entries(BAND_INFO).map(([value, b]) => ({ value, ...b, window: [...b.window] }))
const describeBand = b => b ? (BAND_INFO[b]?.name ?? null) : null
const formatPercentageWindow = ([lo, hi]) => lo === hi ? `${lo}%` : `${lo}–${hi}%`
const SAMPLE_STALENESS_LABELS = { sampleEdited: 'the submission was edited', targetsEdited: 'the category targets changed', targetChanged: 'the target mark changed' }
function joinClauses(parts) { if (parts.length <= 1) return parts[0] ?? ''; return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` }
function describeSampleStaleness(reasons) {
  if (!reasons.length) return null
  const own = reasons.filter(r => r in SAMPLE_STALENESS_LABELS).map(r => SAMPLE_STALENESS_LABELS[r])
  if (reasons.some(r => !(r in SAMPLE_STALENESS_LABELS))) own.push('the rubric changed')
  return joinClauses(own) || null
}
const isSampleOnlyStaleness = reasons => reasons.length > 0 && reasons.every(r => r in SAMPLE_STALENESS_LABELS)
const cap = s => s.charAt(0).toUpperCase() + s.slice(1)
