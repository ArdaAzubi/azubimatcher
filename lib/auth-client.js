export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3001';
export const authTokenKey = 'azubimatch_token';

export function getDashboardPath(role) {
  return role === 'firm' ? '/dashboard/firm' : '/dashboard/student';
}