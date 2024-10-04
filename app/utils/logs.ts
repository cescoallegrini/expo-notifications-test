export const log = (...args: any[]) => {
  console.log(...args.map(arg => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : arg)))
}
