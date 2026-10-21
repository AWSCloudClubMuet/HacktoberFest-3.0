import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Bot, PenLine, Search, Send, ShieldCheck, Sparkles, X } from 'lucide-react'

const quickPrompts = [
  { label: 'Find gigs for me', prompt: 'Find gigs that match my skills', icon: Search },
  { label: 'Draft an application', prompt: 'Help me draft an application message', icon: PenLine },
  { label: 'Explain reputation', prompt: 'How do reviews and reputation work?', icon: ShieldCheck },
]

export default function Assistant({ user, openGig }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [messages, setMessages] = useState([{ role: 'assistant', text: `Hi ${user.name.split(' ')[0]}! I’m Loop AI. I can match you with gigs, improve an application, or explain how CampusLoop works.`, gigs: [] }])
  const endRef = useRef(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, busy])

  const send = async (text = input) => {
    const message = text.trim()
    if (!message || busy) return
    setInput(''); setMessages((old) => [...old, { role: 'user', text: message, gigs: [] }]); setBusy(true)
    try {
      const response = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('campusloop_token')}` }, body: JSON.stringify({ message }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'I could not answer that right now.')
      setMessages((old) => [...old, { role: 'assistant', text: data.reply, gigs: data.suggested_gigs || [] }])
    } catch (error) { setMessages((old) => [...old, { role: 'assistant', text: error.message, gigs: [], error: true }]) } finally { setBusy(false) }
  }

  return <>
    <button className={`ai-launcher ${open ? 'is-open' : ''}`} onClick={() => setOpen(!open)} aria-label={open ? 'Close Loop AI' : 'Open Loop AI assistant'}>{open ? <X /> : <><Bot /><span>Ask Loop AI</span><i /></>}</button>
    {open && <section className="ai-panel" aria-label="Loop AI assistant">
      <header><span className="ai-logo"><Sparkles /></span><div><h2>Loop AI <b>BETA</b></h2><p><i /> Your campus copilot</p></div><button onClick={() => setOpen(false)} aria-label="Close assistant"><X /></button></header>
      <div className="ai-messages">
        {messages.map((message, index) => <div key={index} className={`ai-message ${message.role} ${message.error ? 'error' : ''}`}>
          {message.role === 'assistant' && <span className="ai-avatar"><Bot /></span>}
          <div className="ai-bubble"><p>{message.text}</p>{message.gigs?.length > 0 && <div className="ai-suggestions">{message.gigs.map((gig) => <button key={gig.id} onClick={() => { openGig(gig); setOpen(false) }}><span>{gig.category} · {gig.payment_type === 'SkillSwap' ? 'Skill swap' : gig.payment_type}</span><strong>{gig.title}</strong><small>{gig.payment_type === 'Paid' ? `PKR ${Number(gig.budget).toLocaleString('en-PK')}` : gig.payment_type}<ArrowRight size={13} /></small></button>)}</div>}</div>
        </div>)}
        {busy && <div className="ai-message assistant"><span className="ai-avatar"><Bot /></span><div className="ai-typing"><i /><i /><i /></div></div>}
        <div ref={endRef} />
      </div>
      {messages.length === 1 && <div className="ai-quick">{quickPrompts.map(({ label, prompt, icon: Icon }) => <button key={label} onClick={() => send(prompt)}><Icon size={14} /> {label}</button>)}</div>}
      <form className="ai-input" onSubmit={(event) => { event.preventDefault(); send() }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about gigs, skills, or applications…" aria-label="Message Loop AI" /><button disabled={!input.trim() || busy} aria-label="Send message"><Send /></button></form>
      <footer><ShieldCheck size={12} /> Uses your CampusLoop data only</footer>
    </section>}
  </>
}
