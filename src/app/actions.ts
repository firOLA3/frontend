'use server'

import { cookies } from 'next/headers'

export async function setAuthCookie(token: string) {
  cookies().set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 // 24 hours
  })
}

export async function clearAuthCookie() {
  cookies().delete('auth_token')
}
