import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Brain, Check, CheckCircle2, Clock3, Download, Mail, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react'

const grades = ['السادس الابتدائي', 'الأول المتوسط', 'الثاني المتوسط', 'الثالث المتوسط']

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || 'تعذر الاتصال بالخادم. تأكد من تشغيل التطبيق وحاول مجدداً.')
  return payload
}

function Header() {
  return <header className="topbar"><a className="brand" href="#home" aria-label="مِعيار، الصفحة الرئيسية"><span className="brand-mark"><Brain size={21} /></span><span className="brand-name">مِعيار<span className="brand-dot">.</span></span></a><div className="topbar-note"><span className="live-dot" />مدارس المتميزين والموهوبين · العراق</div></header>
}

function Landing({ onStart }) {
  const [student, setStudent] = useState({ fullName: '', grade: '', email: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function submit(event) {
    event.preventDefault()
    setError('')
    if (student.fullName.trim().split(/\s+/u).length < 3) return setError('يرجى إدخال الاسم الثلاثي كاملاً.')
    setLoading(true)
    try { onStart({ student, ...await api('/sessions', { method: 'POST', body: JSON.stringify(student) }) }) }
    catch (requestError) { setError(requestError.message) }
    finally { setLoading(false) }
  }
  return <main className="landing page-enter" id="home">
    <section className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" />منصة القياس والتحليل التربوي</div><h1>قدراتك،<br /><span>بداية اكتشافك.</span></h1><p className="hero-description">اختبار متوازن لطلبة مدارس المتميزين والموهوبين في العراق، يجمع التفكير العقلي بالتحصيل الدراسي ليمنحك صورة أوضح عن نقاط قوتك.</p><div className="hero-facts"><div className="fact"><span className="fact-icon fact-green"><Clock3 size={17} /></span><span><strong>١٥ دقيقة</strong><small>وقت الاختبار</small></span></div><span className="fact-divider" /><div className="fact"><span className="fact-icon fact-yellow"><Brain size={17} /></span><span><strong>١٦ سؤالاً</strong><small>ثماني مهارات</small></span></div></div><div className="trust-line"><ShieldCheck size={16} /> اختبار تدريبي، وبياناتك تبقى ضمن تقريرك</div></section>
    <section className="form-panel" aria-labelledby="form-title"><div className="form-panel-head"><div><span className="panel-index">٠١ / ملف الطالب</span><h2 id="form-title">ابدأ رحلتك</h2></div><div className="small-spark" aria-hidden="true">✳</div></div><p className="form-intro">أدخل بياناتك لإنشاء اختبار عشوائي خاص بجلسة اليوم.</p><form onSubmit={submit}>
      <label className="field-label" htmlFor="full-name">الاسم الثلاثي</label><input id="full-name" autoComplete="name" placeholder="مثال: زينب أحمد علي" value={student.fullName} onChange={(event) => setStudent({ ...student, fullName: event.target.value })} required minLength={5} maxLength={100} />
      <label className="field-label" htmlFor="grade">المرحلة الدراسية</label><select id="grade" value={student.grade} onChange={(event) => setStudent({ ...student, grade: event.target.value })} required><option value="" disabled>اختر صفك الدراسي</option>{grades.map((grade) => <option value={grade} key={grade}>{grade}</option>)}</select>
      <label className="field-label" htmlFor="email">البريد الإلكتروني</label><div className="input-with-icon"><Mail size={17} /><input id="email" type="email" autoComplete="email" placeholder="name@example.com" dir="ltr" value={student.email} onChange={(event) => setStudent({ ...student, email: event.target.value })} required maxLength={254} /></div>
      {error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button start-button" type="submit" disabled={loading}>{loading ? 'جارٍ إعداد اختبارك...' : <>ابدأ الاختبار <ArrowLeft size={18} /></>}</button></form><p className="privacy-note">تُستخدم إجاباتك لتكوين تقرير أدائك فقط.</p></section>
    <section className="skills-strip" aria-label="مجالات الاختبار"><span className="skills-title">مجالات القياس</span><span className="skill-tag"><i className="skill-dot dot-green" />الأنماط والاستدلال</span><span className="skill-tag"><i className="skill-dot dot-yellow" />الرياضيات</span><span className="skill-tag"><i className="skill-dot dot-coral" />العلوم</span><span className="skill-tag"><i className="skill-dot dot-blue" />العربية والإنجليزية</span></section>
  </main>
}

function formatTime(seconds) { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}` }

function Assessment({ session, onComplete }) {
  const [answers, setAnswers] = useState({})
  const [current, setCurrent] = useState(0)
  const [remaining, setRemaining] = useState(session.durationSeconds)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const question = session.questions[current]
  const submitted = useRef(false)
  useEffect(() => { const timer = window.setInterval(() => setRemaining((seconds) => Math.max(0, seconds - 1)), 1000); return () => window.clearInterval(timer) }, [])
  useEffect(() => { const timeout = window.setTimeout(() => { if (Object.keys(answers).length) api(`/sessions/${session.sessionId}/answers`, { method: 'PUT', body: JSON.stringify({ answers }) }).catch(() => {}) }, 350); return () => window.clearTimeout(timeout) }, [answers, session.sessionId])
  async function finish(finalAnswers = answers) {
    if (submitted.current) return
    submitted.current = true; setSubmitting(true); setError('')
    try { onComplete({ result: await api(`/sessions/${session.sessionId}/submit`, { method: 'POST', body: JSON.stringify({ answers: finalAnswers }) }), student: session.student }) }
    catch (requestError) { submitted.current = false; setSubmitting(false); setError(requestError.message) }
  }
  useEffect(() => { if (remaining === 0 && !submitted.current) finish() }, [remaining])
  return <main className="assessment page-enter"><div className="assessment-topline"><span className="panel-index">اختبار القدرات والتحصيل</span><div className={`timer ${remaining < 120 ? 'timer-warning' : ''}`}><Clock3 size={17} /><span dir="ltr">{formatTime(remaining)}</span></div></div>
    <div className="progress-row"><span>السؤال <strong>{current + 1}</strong> من {session.questions.length}</span><span>{Object.keys(answers).length} إجابات محفوظة</span></div><div className="progress-track"><span style={{ width: `${((current + 1) / session.questions.length) * 100}%` }} /></div>
    <div className="question-layout"><aside className="question-aside"><span className="aside-number">{String(current + 1).padStart(2, '0')}</span><span className="aside-total">/ {String(session.questions.length).padStart(2, '0')}</span><div className="aside-rule" /><span className="category-label">{question.category}</span></aside>
      <section className="question-main" aria-live="polite"><div className="question-card"><span className="domain-label">{question.domain}</span><h1>{question.prompt}</h1>{question.display && <div className="question-display" dir="rtl">{question.display}</div>}<div className="answer-list" role="radiogroup" aria-label="اختر إجابة واحدة">{question.options.map((option, index) => <button className={`answer-option ${answers[question.id] === index ? 'answer-selected' : ''}`} role="radio" aria-checked={answers[question.id] === index} key={option} onClick={() => setAnswers((existing) => ({ ...existing, [question.id]: index }))}><span className="option-letter">{['أ', 'ب', 'ج', 'د'][index]}</span><span>{option}</span>{answers[question.id] === index && <Check size={18} className="option-check" />}</button>)}</div></div>
        {error && <p className="form-error" role="alert">{error}</p>}<div className="question-actions"><button className="secondary-button" onClick={() => setCurrent((value) => Math.max(0, value - 1))} disabled={current === 0}><ArrowRight size={17} /> السابق</button>{current === session.questions.length - 1 ? <button className="primary-button" onClick={() => finish()} disabled={submitting}>{submitting ? 'جارٍ تحليل النتيجة...' : <>إنهاء الاختبار <CheckCircle2 size={18} /></>}</button> : <button className="primary-button" onClick={() => setCurrent((value) => value + 1)}>{answers[question.id] === undefined ? 'تخطَّ السؤال' : 'السؤال التالي'} <ArrowLeft size={18} /></button>}</div><p className="autosave-note"><ShieldCheck size={15} /> تُحفظ إجاباتك تلقائياً</p></section></div>
  </main>
}

function Results({ report, onRestart }) {
  const { result, student } = report
  return <main className="results page-enter"><div className="result-kicker"><CheckCircle2 size={16} /> اكتمل الاختبار</div><section className="result-heading"><div><span className="panel-index">تقرير الأداء الشخصي</span><h1>أحسنت يا {student.fullName.split(' ')[0]}.</h1><p>نتيجة تدريبية تساعدك على التعرف إلى مهاراتك ومجالات نموك.</p></div><div className="score-block"><span className="score-number" dir="ltr">{result.score}<small>/{result.total}</small></span><span className="score-caption">إجابات صحيحة</span></div></section>
    <section className="domain-comparison" aria-label="مقارنة الأداء بين المجالات">{result.domainBreakdown.map((item, index) => <div className="domain-score" key={item.domain}><div className="domain-score-meta"><span>{item.domain}</span><strong>{item.percentage}٪</strong></div><div className="bar-track"><span className={`bar-fill bar-${index}`} style={{ width: `${item.percentage}%` }} /></div></div>)}</section>
    <div className="result-grid"><section className="breakdown-panel"><div className="section-heading"><div><span className="panel-index">٠١ / المهارات</span><h2>تفاصيل أدائك</h2></div><span className="percent-pill">{result.percentage}٪ إجمالي</span></div><div className="skill-results">{result.breakdown.map((item, index) => <div className="skill-result" key={item.category}><div className="skill-result-meta"><span className="skill-name"><i className={`skill-dot ${['dot-green', 'dot-yellow', 'dot-coral', 'dot-blue'][index % 4]}`} />{item.category}</span><span className="skill-score" dir="ltr">{item.correct}<span> / {item.total}</span></span></div><div className="bar-track"><span className={`bar-fill bar-${index % 4}`} style={{ width: `${item.percentage}%` }} /></div></div>)}</div><p className="result-disclaimer">هذا اختبار تدريبي للاستكشاف الذاتي، ولا يمثل تشخيصاً أو مقياساً رسمياً للذكاء.</p></section>
      <section className="insight-panel"><div className="insight-icon"><Sparkles size={19} /></div><span className="panel-index">٠٢ / تحليل الأداء</span><h2>ملاحظاتك</h2><p>{result.insights}</p><div className="recommendation"><span className="recommendation-mark">✳</span><span>كل مهارة تنمو بالممارسة. واصل الاستكشاف والتعلّم خطوةً خطوة.</span></div></section></div>
    <div className="result-footer"><div className="email-status"><span className="email-status-icon"><Mail size={17} /></span><span><strong>{result.emailSent ? 'أُرسل التقرير إلى بريدك' : 'نتيجتك محفوظة في التقرير'}</strong><small>{result.emailSent ? student.email : 'يمكن للمدرسة تفعيل إرسال البريد من إعدادات الخادم.'}</small></span></div><div className="result-buttons"><button className="secondary-button" onClick={() => window.print()}><Download size={17} /> حفظ التقرير</button><button className="text-button" onClick={onRestart}><RotateCcw size={16} /> اختبار جديد</button></div></div>
  </main>
}

export default function AppView() {
  const [session, setSession] = useState(null)
  const [report, setReport] = useState(null)
  function restart() { setSession(null); setReport(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  return <div className="app-shell min-h-screen"><Header />{report ? <Results report={report} onRestart={restart} /> : session ? <Assessment session={session} onComplete={setReport} /> : <Landing onStart={setSession} />}<footer className="site-footer"><span>مِعيار <span className="brand-dot">.</span> نظام تحليل القدرات والأداء</span><span>العراق <span className="footer-star">✳</span></span></footer></div>
}