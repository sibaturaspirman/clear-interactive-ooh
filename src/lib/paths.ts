export function locationListPath(): string {
  return "/list";
}

export function micrositePath(code: string): string {
  return `/microsite/${code}`;
}

export function micrositeTestPath(code: string): string {
  return `${micrositePath(code)}?test`;
}

export function micrositeOverlayPreviewPath(code: string): string {
  return `${micrositePath(code)}?overlay`;
}

export function micrositeFotoDebugPath(code: string): string {
  return `${micrositePath(code)}?foto`;
}

export function ledPath(code: string): string {
  return `/led/${code}`;
}

export function ledBroadsignPath(code: string): string {
  return `/led/${code}/broadsign`;
}

export function ledBroadsignAutoplayPath(code: string): string {
  return `${ledBroadsignPath(code)}?autoplay=1`;
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
