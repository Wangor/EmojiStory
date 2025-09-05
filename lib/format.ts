export function formatCount(count: number): string {
  if (count < 1000) return count.toString();
  const k = count / 1000;
  const decimals = k < 10 ? 1 : 0;
  return `${parseFloat(k.toFixed(decimals))}k`;
}
