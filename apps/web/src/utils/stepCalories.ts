export function stepCalories(steps: number, weightKg = 70) {
  return steps * 0.04 * (weightKg / 70);
}
