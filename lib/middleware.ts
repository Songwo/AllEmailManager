import { NextResponse } from 'next/server'
import { getUserFromRequest } from './auth'

interface AuthenticatedUser {
    userId: string
    email: string
}

type AuthenticatedHandler = (
    request: Request,
    user: AuthenticatedUser,
    ...args: any[]
) => Promise<NextResponse>

/**
 * Wrap an API handler with authentication check.
 * Extracts and validates the JWT token, passes user info to the handler.
 */
export function withAuth(handler: AuthenticatedHandler) {
    return async (request: Request, ...args: any[]) => {
        const user = getUserFromRequest(request)

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized. Please login first.' },
                { status: 401 }
            )
        }

        return handler(request, user, ...args)
    }
}
