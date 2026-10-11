import express from 'express'
import Database from 'better-sqlite3'
import nodemailer from 'nodemailer'
import { randomInt, randomUUID } from 'node:crypto'
import { mkdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(root, '.env')
if (existsSync(envPath) && process.loadEnvFile) process.loadEnvFile(envPath)

const app = express()
app.use(express.json({ limit: '32kb' }))

const questionBank = [
  { id: 'iq-pattern-1', domain: 'القدرات العقلية', category: 'الأنماط الرقمية', prompt: 'ما العدد التالي في السلسلة؟', display: '٣، ٦، ١٢، ٢٤، ؟', options: ['٣٠', '٣٦', '٤٨', '٥٤'], answer: 2 },
  { id: 'iq-pattern-2', domain: 'القدرات العقلية', category: 'الأنماط الرقمية', prompt: 'ما العدد الذي يكمل النمط؟', display: '٢، ٥، ١٠، ١٧، ٢٦، ؟', options: ['٣٥', '٣٧', '٣٩', '٤١'], answer: 1 },
  { id: 'iq-pattern-3', domain: 'القدرات العقلية', category: 'الأنماط الرقمية', prompt: 'اختر العدد الناقص في النمط.', display: '٨١، ٢٧، ٩، ٣، ؟', options: ['٠', '١', '٢', '٦'], answer: 1 },
  { id: 'iq-pattern-4', domain: 'القدرات العقلية', category: 'الأنماط الرقمية', prompt: 'ما العدد التالي؟', display: '١، ٤، ٩، ١٦، ؟', options: ['٢٠', '٢٤', '٢٥', '٣٦'], answer: 2 },
  { id: 'iq-verbal-1', domain: 'القدرات العقلية', category: 'الاستدلال اللفظي', prompt: 'الكتاب بالنسبة إلى القراءة مثل الشوكة بالنسبة إلى:', options: ['الطبخ', 'الأكل', 'المطبخ', 'الطعام'], answer: 1 },
  { id: 'iq-verbal-2', domain: 'القدرات العقلية', category: 'الاستدلال اللفظي', prompt: 'ما الكلمة الأقرب في معناها إلى «واسع»؟', options: ['فسيح', 'عميق', 'مرتفع', 'بعيد'], answer: 0 },
  { id: 'iq-verbal-3', domain: 'القدرات العقلية', category: 'الاستدلال اللفظي', prompt: 'اختر الكلمة المختلفة عن بقية الكلمات.', options: ['تفاح', 'موز', 'جزر', 'عنب'], answer: 2 },
  { id: 'iq-verbal-4', domain: 'القدرات العقلية', category: 'الاستدلال اللفظي', prompt: 'الطبيب يعالج المريض، كما أن المعلم:', options: ['يبني المدرسة', 'يدرّس الطالب', 'يقرأ الكتاب', 'يكتب الدواء'], answer: 1 },
  { id: 'iq-math-1', domain: 'القدرات العقلية', category: 'الاستدلال الرياضي', prompt: 'إذا كان مجموع عددين ٢٤ والفرق بينهما ٦، فما العدد الأكبر؟', options: ['٩', '١٢', '١٥', '١٨'], answer: 2 },
  { id: 'iq-math-2', domain: 'القدرات العقلية', category: 'الاستدلال الرياضي', prompt: 'ثمن قلم ودفتر ١١ ألف دينار، والدفتر أغلى من القلم بـ١٠ آلاف. كم ثمن القلم؟', options: ['٥٠٠ دينار', '١٠٠٠ دينار', '١٥٠٠ دينار', '٢٠٠٠ دينار'], answer: 0 },
  { id: 'iq-math-3', domain: 'القدرات العقلية', category: 'الاستدلال الرياضي', prompt: 'إذا أنجز ٣ عمال ٣ صناديق في ٣ دقائق، فكم دقيقة يحتاج ٦ عمال لإنجاز ٦ صناديق بالمعدل نفسه؟', options: ['٣ دقائق', '٦ دقائق', '٩ دقائق', '١٢ دقيقة'], answer: 0 },
  { id: 'iq-math-4', domain: 'القدرات العقلية', category: 'الاستدلال الرياضي', prompt: 'أكمل العلاقة: ٤ ↦ ١٦، ٧ ↦ ٤٩، ٩ ↦ ؟', options: ['١٨', '٧٢', '٨١', '٩٠'], answer: 2 },
  { id: 'iq-spatial-1', domain: 'القدرات العقلية', category: 'التفكير الهندسي والحركي', prompt: 'مربع طول ضلعه ٣ سم. ما مساحته؟', options: ['٦ سم²', '٩ سم²', '١٢ سم²', '١٨ سم²'], answer: 1 },
  { id: 'iq-spatial-2', domain: 'القدرات العقلية', category: 'التفكير الهندسي والحركي', prompt: 'دار سهم يشير إلى الأعلى ربع دورة مع عقارب الساعة. أين يشير الآن؟', display: '↑', options: ['←', '→', '↓', '↑'], answer: 1 },
  { id: 'iq-spatial-3', domain: 'القدرات العقلية', category: 'التفكير الهندسي والحركي', prompt: 'كم وجهاً وحافةً للمكعب؟', options: ['٦ أوجه و٨ حواف', '٨ أوجه و١٢ حافة', '١٢ وجهاً و٦ حواف', '٦ أوجه و١٢ حافة'], answer: 3 },
  { id: 'iq-spatial-4', domain: 'القدرات العقلية', category: 'التفكير الهندسي والحركي', prompt: 'أي شكل له أربعة أضلاع متساوية وأربع زوايا قائمة؟', options: ['المستطيل', 'المعين', 'المربع', 'شبه المنحرف'], answer: 2 },
  { id: 'math-1', domain: 'التحصيل الدراسي', category: 'الرياضيات', prompt: 'إذا كان (س + ٥) ÷ ٢ = ١٢، فما قيمة (٢س − ٣)؟', options: ['٣١', '٣٥', '١٩', '٢٩'], answer: 1 },
  { id: 'math-2', domain: 'التحصيل الدراسي', category: 'الرياضيات', prompt: 'ما ناتج ٣⁄٤ + ١⁄٨؟', options: ['٤⁄١٢', '٥⁄٨', '٧⁄٨', '١'], answer: 2 },
  { id: 'math-3', domain: 'التحصيل الدراسي', category: 'الرياضيات', prompt: 'محيط مستطيل طوله ٨ سم وعرضه ٥ سم يساوي:', options: ['١٣ سم', '٢٦ سم', '٤٠ سم', '٥٢ سم'], answer: 1 },
  { id: 'math-4', domain: 'التحصيل الدراسي', category: 'الرياضيات', prompt: 'اشترى ٤ طلاب ٣ دفاتر لكل منهم، وسعر الدفتر ١٢٥٠ ديناراً. ما المجموع؟', options: ['١٠٬٠٠٠ دينار', '١٢٬٥٠٠ دينار', '١٥٬٠٠٠ دينار', '٢٠٬٠٠٠ دينار'], answer: 2 },
  { id: 'science-1', domain: 'التحصيل الدراسي', category: 'العلوم', prompt: 'ما الغاز الذي تمتصه النباتات غالباً في عملية البناء الضوئي؟', options: ['الأكسجين', 'ثاني أكسيد الكربون', 'النيتروجين', 'الهيدروجين'], answer: 1 },
  { id: 'science-2', domain: 'التحصيل الدراسي', category: 'العلوم', prompt: 'ما القوة التي تبقي الأجسام في مسار دائري؟', options: ['قوة الطفو', 'القوة الجاذبة المركزية', 'القوة المغناطيسية', 'قوة الدفع'], answer: 1 },
  { id: 'science-3', domain: 'التحصيل الدراسي', category: 'العلوم', prompt: 'ما العضو الرئيس المسؤول عن ضخ الدم في جسم الإنسان؟', options: ['الرئة', 'الكبد', 'القلب', 'المعدة'], answer: 2 },
  { id: 'science-4', domain: 'التحصيل الدراسي', category: 'العلوم', prompt: 'عند مستوى سطح البحر، عند أي درجة مئوية يغلي الماء؟', options: ['٠°', '٥٠°', '١٠٠°', '١٢٠°'], answer: 2 },
  { id: 'english-1', domain: 'التحصيل الدراسي', category: 'اللغة الإنجليزية', prompt: 'Choose the correct word: She ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], answer: 1 },
  { id: 'english-2', domain: 'التحصيل الدراسي', category: 'اللغة الإنجليزية', prompt: 'What is the opposite of “early”?', options: ['Fast', 'Late', 'Soon', 'First'], answer: 1 },
  { id: 'english-3', domain: 'التحصيل الدراسي', category: 'اللغة الإنجليزية', prompt: 'Choose the correct past form: They ___ their homework yesterday.', options: ['finish', 'finishes', 'finished', 'finishing'], answer: 2 },
  { id: 'english-4', domain: 'التحصيل الدراسي', category: 'اللغة الإنجليزية', prompt: 'Choose the correct question word: ___ is your birthday?', options: ['Where', 'When', 'Who', 'Why'], answer: 1 },
  { id: 'arabic-1', domain: 'التحصيل الدراسي', category: 'اللغة العربية', prompt: 'ما إعراب كلمة «مجتهداً» في جملة: بات الطالب مجتهداً؟', options: ['حال منصوب', 'خبر بات منصوب', 'مفعول به', 'صفة مرفوعة'], answer: 1 },
  { id: 'arabic-2', domain: 'التحصيل الدراسي', category: 'اللغة العربية', prompt: 'أي الكلمات الآتية جمع تكسير؟', options: ['معلمون', 'طالبات', 'كتب', 'مهندسان'], answer: 2 },
  { id: 'arabic-3', domain: 'التحصيل الدراسي', category: 'اللغة العربية', prompt: 'ما ضد كلمة «الشجاعة»؟', options: ['الكرم', 'الجبن', 'القوة', 'الصدق'], answer: 1 },
  { id: 'arabic-4', domain: 'التحصيل الدراسي', category: 'اللغة العربية', prompt: 'أي الجمل الآتية تبدأ بفعل؟', options: ['العلم نور', 'الطالب مجتهد', 'قرأَ التلميذُ الدرسَ', 'السماء صافية'], answer: 2 },
]

const durationSeconds = 900
const questionsPerCategory = 2

const dbPath = resolve(root, 'data/results.sqlite')
mkdirSync(dirname(dbPath), { recursive: true })
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    grade TEXT NOT NULL,
    email TEXT NOT NULL,
    answers TEXT NOT NULL DEFAULT '{}',
    questions TEXT NOT NULL DEFAULT '[]',
    started_at INTEGER NOT NULL,
    submitted_at INTEGER,
    result TEXT
  );
`)

if (!db.pragma('table_info(sessions)').some((column) => column.name === 'questions')) db.exec("ALTER TABLE sessions ADD COLUMN questions TEXT NOT NULL DEFAULT '[]'")

const sessionById = db.prepare('SELECT * FROM sessions WHERE id = ?')
const setAnswers = db.prepare('UPDATE sessions SET answers = ? WHERE id = ? AND submitted_at IS NULL')
const saveResult = db.prepare('UPDATE sessions SET submitted_at = ?, result = ? WHERE id = ? AND submitted_at IS NULL')

function shuffle(items) {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1)
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

function createStudentQuestions() {
  const categories = [...new Set(questionBank.map((question) => question.category))]
  return shuffle(categories.flatMap((category) => shuffle(questionBank.filter((question) => question.category === category)).slice(0, questionsPerCategory).map((question) => {
    const options = shuffle(question.options.map((text, index) => ({ text, correct: index === question.answer })))
    return { ...question, options: options.map((option) => option.text), answer: options.findIndex((option) => option.correct) }
  })))
}

function analyze(answers, questions) {
  const categories = [...new Set(questions.map((question) => question.category))]
  const breakdown = categories.map((category) => {
    const categoryQuestions = questions.filter((question) => question.category === category)
    const correct = categoryQuestions.filter((question) => answers[question.id] === question.answer).length
    return { category, domain: categoryQuestions[0].domain, correct, total: categoryQuestions.length, percentage: Math.round((correct / categoryQuestions.length) * 100) }
  })
  const domains = [...new Set(questions.map((question) => question.domain))]
  const domainBreakdown = domains.map((domain) => {
    const domainQuestions = questions.filter((question) => question.domain === domain)
    const correct = domainQuestions.filter((question) => answers[question.id] === question.answer).length
    return { domain, correct, total: domainQuestions.length, percentage: Math.round((correct / domainQuestions.length) * 100) }
  })
  const score = questions.filter((question) => answers[question.id] === question.answer).length
  return { score, total: questions.length, percentage: Math.round((score / questions.length) * 100), breakdown, domainBreakdown }
}

async function createInsights(result) {
  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `اكتب تقريراً تربوياً عربياً موجزاً من جملتين إلى ثلاث لطالب مدرسة، بناء على نتيجة اختبار قدرات وتحصيل تجريبي. قارن بين القدرات العقلية والتحصيل الدراسي، واذكر أبرز قوة ومجالاً للتدريب. لا تصف النتيجة كتشخيص أو كدرجة ذكاء رسمية. البيانات: ${JSON.stringify({ domains: result.domainBreakdown, skills: result.breakdown })}` }] }],
        }),
        signal: AbortSignal.timeout(10000),
      })
      if (response.ok) {
        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) return text
      }
    } catch (error) {
      console.error('AI insights unavailable:', error.message)
    }
  }

  const strongest = [...result.breakdown].sort((left, right) => right.percentage - left.percentage)[0]
  const focus = [...result.breakdown].sort((left, right) => left.percentage - right.percentage)[0]
  const [aptitude, academic] = result.domainBreakdown
  const comparison = aptitude.percentage === academic.percentage ? `كان أداؤك متوازناً بين القدرات العقلية والتحصيل الدراسي عند ${aptitude.percentage}٪.` : `بلغ أداؤك في ${aptitude.domain} ${aptitude.percentage}٪، وفي ${academic.domain} ${academic.percentage}٪.`
  return `${comparison} برزت مهارة ${strongest.category}، ويمكنك تطوير ${focus.category} بمزيد من التمارين المتنوعة. هذه النتيجة للتعلّم وليست تشخيصاً أو مقياساً رسمياً للذكاء.`
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

async function sendReport(student, result) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return false
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  const rows = result.breakdown.map((item) => `<tr><td style="padding:10px;border-bottom:1px solid #e8e7e0">${item.category}</td><td style="padding:10px;border-bottom:1px solid #e8e7e0">${item.correct} / ${item.total} (${item.percentage}٪)</td></tr>`).join('')
  const studentName = escapeHtml(student.full_name)
  const insights = escapeHtml(result.insights)
  await transporter.sendMail({
    from: MAIL_FROM || SMTP_USER,
    to: student.email,
    subject: 'نتيجة اختبار القدرات العقلية | مِعيار',
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;color:#20251f;max-width:600px;margin:auto"><h1 style="color:#315c45">مرحباً ${studentName}</h1><p>نتيجتك في اختبار القدرات العقلية للمرحلة ${escapeHtml(student.grade)}:</p><h2>${result.score} من ${result.total} (${result.percentage}٪)</h2><table style="width:100%;border-collapse:collapse">${rows}</table><p style="line-height:1.8">${insights}</p><small>هذا الاختبار تدريبي ولا يمثل تشخيصاً أو مقياساً رسمياً للذكاء.</small></div>`,
  })
  return true
}

app.get('/api/health', (_request, response) => response.json({ ok: true }))

app.post('/api/sessions', (request, response) => {
  const { fullName, grade, email } = request.body ?? {}
  if (typeof fullName !== 'string' || fullName.trim().split(/\s+/u).length < 3 || fullName.length > 100) return response.status(400).json({ error: 'يرجى إدخال الاسم الثلاثي كاملاً.' })
  if (typeof grade !== 'string' || grade.trim().length < 1 || grade.length > 40) return response.status(400).json({ error: 'يرجى اختيار المرحلة الدراسية.' })
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response.status(400).json({ error: 'يرجى إدخال بريد إلكتروني صحيح.' })
  const id = randomUUID()
  const questions = createStudentQuestions()
  db.prepare('INSERT INTO sessions (id, full_name, grade, email, questions, started_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, fullName.trim(), grade.trim(), email.trim(), JSON.stringify(questions), Date.now())
  response.status(201).json({ sessionId: id, durationSeconds, questions: questions.map(({ answer, ...question }) => question) })
})

function parseAnswers(rawAnswers, questions) {
  if (!rawAnswers || typeof rawAnswers !== 'object' || Array.isArray(rawAnswers)) return null
  const allowedIds = new Set(questions.map((question) => question.id))
  if (Object.entries(rawAnswers).some(([id, choice]) => !allowedIds.has(id) || !Number.isInteger(choice) || choice < 0 || choice > 3)) return null
  return rawAnswers
}

app.put('/api/sessions/:id/answers', (request, response) => {
  const session = sessionById.get(request.params.id)
  if (!session) return response.status(404).json({ error: 'جلسة الاختبار غير موجودة.' })
  if (session.submitted_at) return response.status(409).json({ error: 'تم تسليم الاختبار مسبقاً.' })
  const questions = JSON.parse(session.questions)
  const answers = parseAnswers(request.body?.answers, questions)
  if (!answers) {
    return response.status(400).json({ error: 'الإجابات غير صالحة.' })
  }
  setAnswers.run(JSON.stringify(answers), session.id)
  response.json({ saved: true })
})

app.post('/api/sessions/:id/submit', async (request, response) => {
  const session = sessionById.get(request.params.id)
  if (!session) return response.status(404).json({ error: 'جلسة الاختبار غير موجودة.' })
  if (session.submitted_at) return response.json(JSON.parse(session.result))
  const questions = JSON.parse(session.questions)
  const submittedAnswers = parseAnswers(request.body?.answers ?? {}, questions)
  if (!submittedAnswers) return response.status(400).json({ error: 'الإجابات غير صالحة.' })
  const answers = { ...JSON.parse(session.answers), ...submittedAnswers }
  const scored = analyze(answers, questions)
  const report = { ...scored, insights: await createInsights(scored) }
  saveResult.run(Date.now(), JSON.stringify(report), session.id)
  let emailSent = false
  try {
    emailSent = await sendReport(session, report)
  } catch (error) {
    console.error('Email report unavailable:', error.message)
  }
  response.json({ ...report, emailSent })
})

const port = Number(process.env.PORT) || 3001
app.listen(port, () => console.log(`Assessment API listening on http://localhost:${port}`))