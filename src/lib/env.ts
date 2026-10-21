import "server-only";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getServerEnv() {
  return {
    apiUrl: required("CLEAR_API_URL"),
    ledKey: required("LED_KEY"),
  } as const;
}
