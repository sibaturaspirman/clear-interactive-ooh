export function micrositePath(code: string): string {
  return `/microsite/${code}`;
}

export function micrositeTestPath(code: string): string {
  return `${micrositePath(code)}?test`;
}

export function ledPath(code: string): string {
  return `/led/${code}`;
}

export function ledDebugPath(code: string): string {
  return `${ledPath(code)}?debug`;
}

export function ledStaticDebugPath(code: string): string {
  return `${ledPath(code)}?debug=static`;
}

export function ledLiveLayoutDebugPath(code: string): string {
  return `${ledPath(code)}?debug=live`;
}
