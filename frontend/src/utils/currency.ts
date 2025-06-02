// Chuyển đổi VND sang USD, làm tròn 2 số thập phân
export function vndToUsd(vnd: number): number {
  return Math.round((vnd / 1) * 100) / 100;
}
