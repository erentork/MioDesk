export function Mascot({ compact = false }: { compact?: boolean }) {
  return (
    <svg className={compact ? "mascot mascot-compact" : "mascot"} viewBox="0 0 220 190" role="img" aria-label="MioDesk kedi maskotu">
      <ellipse cx="110" cy="169" rx="78" ry="13" fill="#f4c9cf" opacity=".55"/>
      <path d="M60 82 44 40l38 20M160 82l16-42-38 20" fill="#fffaf8" stroke="#5c4038" strokeWidth="5" strokeLinejoin="round"/>
      <path d="M52 48 63 70 76 61M168 48 157 70 144 61" fill="#ffd3dc"/>
      <path d="M53 102c0-42 25-66 57-66s57 24 57 66v28c0 29-24 48-57 48s-57-19-57-48Z" fill="#fffdfb" stroke="#5c4038" strokeWidth="5"/>
      <ellipse cx="87" cy="111" rx="6" ry="8" fill="#4d332e"/><ellipse cx="133" cy="111" rx="6" ry="8" fill="#4d332e"/>
      <path d="M104 126c4 4 8 4 12 0M110 121v5" fill="none" stroke="#5c4038" strokeWidth="4" strokeLinecap="round"/>
      <ellipse cx="73" cy="128" rx="13" ry="7" fill="#ffc3cf" opacity=".65"/><ellipse cx="147" cy="128" rx="13" ry="7" fill="#ffc3cf" opacity=".65"/>
      <path d="M62 116 25 110M63 126l-38 4M158 116l37-6M157 126l38 4" stroke="#5c4038" strokeWidth="3" strokeLinecap="round"/>
      <path d="M132 56c5-14 21-17 29-7 10-9 25-1 22 12-2 10-15 18-29 26-13-9-24-18-22-31Z" fill="#f58da8" stroke="#6e3a43" strokeWidth="4"/>
      <circle cx="157" cy="61" r="8" fill="#ffd1dc" stroke="#6e3a43" strokeWidth="3"/>
    </svg>
  );
}
