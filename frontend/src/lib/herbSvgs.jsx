// src/lib/herbSvgs.jsx
export const HERB_SVGS = {
  ashwagandha: (w = "100%", h = "100%") => (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ width: w, height: h }}>
      <defs>
        <radialGradient id="abg" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#d4a853"/><stop offset="100%" stopColor="#2d5a1b"/></radialGradient>
        <radialGradient id="ab2" cx="35%" cy="30%" r="60%"><stop offset="0%" stopColor="#ff6b35"/><stop offset="100%" stopColor="#cc3300"/></radialGradient>
      </defs>
      <rect width="200" height="200" fill="url(#abg)"/>
      <rect width="200" height="200" fill="#1a3a0a" opacity="0.6"/>
      <path d="M100 175 Q95 140 90 110 Q85 80 100 60" stroke="#5a8a30" strokeWidth="3" fill="none"/>
      <path d="M95 130 Q75 115 60 105" stroke="#5a8a30" strokeWidth="2" fill="none"/>
      <path d="M92 110 Q110 90 125 82" stroke="#5a8a30" strokeWidth="2" fill="none"/>
      <ellipse cx="55" cy="103" rx="16" ry="8" fill="#4a7a25" transform="rotate(-20,55,103)"/>
      <ellipse cx="128" cy="80" rx="15" ry="7" fill="#4a7a25" transform="rotate(15,128,80)"/>
      <ellipse cx="100" cy="58" rx="10" ry="14" fill="#4a7a25"/>
      <circle cx="58" cy="100" r="5" fill="url(#ab2)"/>
      <circle cx="130" cy="77" r="5" fill="url(#ab2)"/>
      <circle cx="100" cy="55" r="4" fill="url(#ab2)"/>
    </svg>
  ),
  tulsi: (w = "100%", h = "100%") => (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ width: w, height: h }}>
      <defs><linearGradient id="tbg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1a4a1a"/><stop offset="100%" stopColor="#0d2b0d"/></linearGradient></defs>
      <rect width="200" height="200" fill="url(#tbg)"/>
      <line x1="100" y1="152" x2="100" y2="90" stroke="#2d7a1f" strokeWidth="3"/>
      {[[75,97],[125,92],[84,77],[116,75],[100,87]].map(([cx,cy],i)=>(
        <ellipse key={i} cx={cx} cy={cy} rx="11" ry="16" fill={i%2===0?"#2ecc40":"#27ae35"} transform={`rotate(${(i-2)*15},${cx},${cy})`} opacity="0.9"/>
      ))}
      <rect x="98" y="55" width="4" height="30" rx="2" fill="#9b59b6" opacity="0.8"/>
    </svg>
  ),
  neem: (w = "100%", h = "100%") => (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ width: w, height: h }}>
      <defs><linearGradient id="nbg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#87CEEB"/><stop offset="60%" stopColor="#228B22"/><stop offset="100%" stopColor="#3d2006"/></linearGradient></defs>
      <rect width="200" height="200" fill="url(#nbg)"/>
      <path d="M95 200 Q92 160 90 130 Q88 100 100 80" stroke="#5C3317" strokeWidth="14" fill="none" strokeLinecap="round"/>
      {[[100,80,-60],[100,80,60],[85,105,-50],[115,100,50],[80,125,-40],[120,120,40]].map(([x,y,angle],i)=>(
        <g key={i} transform={`translate(${x},${y}) rotate(${angle})`}>
          <line x1="0" y1="0" x2="0" y2="-40" stroke="#2d6e1a" strokeWidth="1.5"/>
          {[0,1,2,3,4,5,6].map(j=>(
            <ellipse key={j} cx={j%2===0?-8:8} cy={-8-j*5} rx="7" ry="4" fill={i%2===0?"#2ecc40":"#27ae35"} transform={`rotate(${j%2===0?-30:30})`} opacity="0.85"/>
          ))}
        </g>
      ))}
    </svg>
  ),
  haritaki: (w = "100%", h = "100%") => (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ width: w, height: h }}>
      <defs>
        <radialGradient id="hbg" cx="50%" cy="30%" r="60%"><stop offset="0%" stopColor="#6a9e4a"/><stop offset="100%" stopColor="#1a3a0a"/></radialGradient>
        <radialGradient id="hfr" cx="35%" cy="30%" r="60%"><stop offset="0%" stopColor="#c8a03a"/><stop offset="100%" stopColor="#7a5010"/></radialGradient>
      </defs>
      <rect width="200" height="200" fill="url(#hbg)"/>
      <path d="M20 150 Q60 130 100 100 Q140 70 180 50" stroke="#5a3010" strokeWidth="6" fill="none"/>
      {[[65,125],[100,95],[140,68]].map(([cx,cy],i)=>(
        <g key={i} transform={`translate(${cx},${cy}) rotate(${i*5-10})`}>
          <ellipse cx="0" cy="0" rx="10" ry="15" fill="url(#hfr)"/>
        </g>
      ))}
    </svg>
  ),
  brahmi: (w = "100%", h = "100%") => (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ width: w, height: h }}>
      <defs><linearGradient id="bbg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#b8e4f9"/><stop offset="40%" stopColor="#7acfe8"/><stop offset="100%" stopColor="#2a7a3a"/></linearGradient></defs>
      <rect width="200" height="200" fill="url(#bbg)"/>
      {[[88,88],[64,95],[126,82]].map(([cx,cy],i)=>(
        <ellipse key={i} cx={cx} cy={cy} rx="13" ry="9" fill={["#4a9e2a","#3a8e1a","#5aae3a"][i%3]} opacity="0.9"/>
      ))}
      {[[90,85],[65,92],[127,79]].map(([cx,cy],i)=>(
        <g key={i}>{[0,72,144,216,288].map(a=>(
          <ellipse key={a} cx={cx+8*Math.cos(a*Math.PI/180)} cy={cy+8*Math.sin(a*Math.PI/180)} rx="4" ry="3" fill="white" opacity="0.9"/>
        ))}<circle cx={cx} cy={cy} r="3" fill="#ffd700"/></g>
      ))}
    </svg>
  ),
  amla: (w = "100%", h = "100%") => (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ width: w, height: h }}>
      <defs>
        <linearGradient id="ambg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#87CEEB"/><stop offset="100%" stopColor="#228B22"/></linearGradient>
        <radialGradient id="amfr" cx="35%" cy="30%" r="60%"><stop offset="0%" stopColor="#a8d050"/><stop offset="100%" stopColor="#4a7a10"/></radialGradient>
      </defs>
      <rect width="200" height="200" fill="url(#ambg)"/>
      {[[100,108],[125,85],[80,130],[148,65],[60,150]].map(([cx,cy],i)=>(
        <g key={i}>
          <circle cx={cx} cy={cy} r="9" fill="url(#amfr)"/>
          <circle cx={cx-2} cy={cy-2} r="2.5" fill="#c8f060" opacity="0.6"/>
        </g>
      ))}
    </svg>
  ),
  giloy: (w = "100%", h = "100%") => (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ width: w, height: h }}>
      <defs><linearGradient id="gbg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#1a3a1a"/><stop offset="100%" stopColor="#0d1a0d"/></linearGradient></defs>
      <rect width="200" height="200" fill="url(#gbg)"/>
      <path d="M100 200 Q85 170 75 140 Q65 110 80 85 Q90 65 100 50" stroke="#3a7a1a" strokeWidth="3" fill="none"/>
      {[[45,122],[115,92],[54,68],[132,49],[95,44]].map(([cx,cy],i)=>(
        <g key={i} transform={`translate(${cx},${cy})`}>
          <path d="M0,-14 C-14,-14 -14,0 0,14 C14,0 14,-14 0,-14 Z" fill={["#2ecc40","#27ae35","#3adc50"][i%3]} transform={`rotate(${i*30}) scale(0.85)`} opacity="0.9"/>
        </g>
      ))}
    </svg>
  ),
  shatavari: (w = "100%", h = "100%") => (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ width: w, height: h }}>
      <defs>
        <linearGradient id="sbg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#2a1a4a"/><stop offset="100%" stopColor="#1a3a2a"/></linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#sbg)"/>
      <line x1="100" y1="175" x2="100" y2="60" stroke="#4a7a30" strokeWidth="3"/>
      {[[100,150,-50],[100,120,-45],[100,90,-40]].map(([x,y,angle],i)=>(
        <g key={i} transform={`translate(${x},${y}) rotate(${angle})`}>
          <line x1="0" y1="0" x2="45" y2="0" stroke="#4a7a30" strokeWidth="1.5"/>
          {[0,1,2,3,4,5,6,7,8].map(j=>(
            <line key={j} x1={5+j*5} y1="0" x2={5+j*5} y2={j%2===0?-8:8} stroke="#5a9a40" strokeWidth="0.8" strokeLinecap="round"/>
          ))}
        </g>
      ))}
      {[[68,115],[130,105]].map(([cx,cy])=>(
        <g key={cx}><circle cx={cx} cy={cy} r="4" fill="#ff9eb5" opacity="0.9"/></g>
      ))}
    </svg>
  ),
};

export function HerbImg({ svgKey, imageUrl, w = "100%", h = "100%", className }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={svgKey || "product"}
        style={{ width: w, height: h, objectFit: "cover" }}
        className={className}
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />
    );
  }
  const render = HERB_SVGS[svgKey] || HERB_SVGS.ashwagandha;
  return render(w, h);
}