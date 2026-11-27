const base = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }

export const Check = (p) => (<svg {...base} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>)
export const Cross = (p) => (<svg {...base} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>)
export const Alert = (p) => (<svg {...base} {...p}><path d="M12 3l9.5 17h-19z" /><path d="M12 10v4.5M12 17.5v.01" /></svg>)
export const Info = (p) => (<svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.5v.01" /></svg>)
export const Lock = (p) => (<svg {...base} width={22} height={22} {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>)
export const Upload = (p) => (<svg {...base} {...p}><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></svg>)
export const Sun = (p) => (<svg {...base} width={18} height={18} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>)
export const Moon = (p) => (<svg {...base} width={18} height={18} {...p}><path d="M20 14.5A8 8 0 119.5 4a6.5 6.5 0 0010.5 10.5z" /></svg>)
