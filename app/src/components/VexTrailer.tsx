import { useEffect, useState } from 'react'

/** A short looping preview of Vex, shown before sign-in. Decorative: the loop is driven by data-scene 1 to 4. */
export function VexTrailer() {
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const [scene, setScene] = useState(reduce ? 3 : 1)
  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => {
      if (!document.hidden) setScene((s) => (s % 4) + 1)
    }, 4600)
    return () => window.clearInterval(id)
  }, [reduce])
  return (
    <div className="vt" data-scene={scene} role="img" aria-label="A short preview of Vex: your Classroom assignments appear, you tap one and ask for help, Vex answers step by step, then builds a small game that runs in the chat.">
      <div className="vt-bar">
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="7" fill="#111111" stroke="#2a2a2a" />
          <path d="M10 7v18" stroke="#ffd500" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M14 11h9M14 16h9M14 21h6" stroke="#a8a8a8" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Vex
        <span className="vt-dots"><i /><i /><i /><i /></span>
      </div>
      <div className="vt-scene vt-s1">
        <div className="vt-lbl">Due soon</div>
        <div className="vt-tag t1"><b>ALG-04</b><span>Worksheet 4</span><em>1</em></div>
        <div className="vt-tag t2"><b>ENG-11</b><span>Gatsby essay draft</span><em>3</em></div>
        <div className="vt-tag t3"><b>BIO-07</b><span>Osmosis lab report</span><em>6</em></div>
      </div>
      <div className="vt-scene vt-s2">
        <div className="vt-chip"><i />ALG-04 Worksheet 4</div>
        <div className="vt-comp"><span className="vt-type">help me with problem 3</span><u /></div>
      </div>
      <div className="vt-scene vt-s3">
        <div className="vt-say">help me with problem 3</div>
        <div className="vt-step"><s>01</s><div><b>Divide everything by 2</b><code>x² − 4x − 5 = 0</code></div></div>
        <div className="vt-step"><s>02</s><div><b>Factor it</b><code>(x − 5)(x + 1) = 0</code></div></div>
        <div className="vt-step"><s>03</s><div><b>Set each part to zero</b><code>x = 5 or x = −1</code></div></div>
        <div className="vt-ok">Check: 2(25) − 40 − 10 = 0</div>
      </div>
      <div className="vt-scene vt-s4">
        <div className="vt-say">make me snake</div>
        <div className="vt-code">
          {[78, 54, 66, 40, 72].map((w) => (
            <i key={w} style={{ '--w': `${w}%` } as React.CSSProperties} />
          ))}
        </div>
        <div className="vt-game">
          <p>apples <b>3</b></p>
          <div className="vt-field">
            <span className="vt-food" />
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="vt-sn" style={{ '--i': i } as React.CSSProperties} />
            ))}
          </div>
        </div>
      </div>
      <div className="vt-cap">
        <span className="c1">Your assignments, already here</span>
        <span className="c2">Tap one. Ask anything.</span>
        <span className="c3">Steps you can follow</span>
        <span className="c4">Games that run in the chat</span>
      </div>
    </div>
  )
}
