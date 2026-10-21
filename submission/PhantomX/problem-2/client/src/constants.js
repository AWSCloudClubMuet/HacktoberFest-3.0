export const CATEGORIES = ['Programming', 'Design', 'Writing', 'Tutoring'];
export const GIG_TYPES = ['Offering', 'Requesting'];
export const PAYMENTS = [
  { value: 'Paid', label: 'Paid' },
  { value: 'SkillSwap', label: 'Skill Swap' },
  { value: 'Free', label: 'Free' },
];

export function paymentLabel(value) {
  return PAYMENTS.find((item) => item.value === value)?.label || value;
}
