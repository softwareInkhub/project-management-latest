import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/roles?userId=xxx
 * Fetches user role from brmh.in/namespace-roles/:userId/projectmanagement
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://brmh.in/namespace-roles/${userId}/projectmanagement`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      // If user has no role assigned, return default 'user' role
      if (response.status === 404) {
        return NextResponse.json({
          success: true,
          role: 'user',
          permissions: ['read:all'],
          isDefault: true,
        });
      }

      throw new Error(`Failed to fetch role: ${response.status}`);
    }

    const data = await response.json();

    // Extract role and permissions from response
    const role = data.role || 'user';
    const permissions = data.permissions || ['read:all'];

    return NextResponse.json({
      success: true,
      userId: data.userId,
      namespace: data.namespace,
      role,
      permissions,
      assignedAt: data.assignedAt,
      updatedAt: data.updatedAt,
      assignedBy: data.assignedBy,
    });
  } catch (error) {
    console.error('[API /api/roles] Error fetching role:', error);
    
    // Return default user role on error
    return NextResponse.json({
      success: true,
      role: 'user',
      permissions: ['read:all'],
      isDefault: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

