// ============================================
// VERCEL ZERO-TRUST MIDDLEWARE
// CineCasa Command Center Security
// ============================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================
// CONFIGURATION
// ============================================

// Admin UID that bypasses all restrictions
const ADMIN_UID = process.env.ADMIN_UID || '';

// Paths that require authorization
const PROTECTED_PATHS = [
  '/admin',
  '/api/admin',
  '/dashboard',
  '/settings',
  '/billing',
];

// Public paths that don't require auth
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/auth',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/_next',
  '/static',
  '/api/auth',
  '/api/webhook',
];

// ============================================
// SECURITY UTILITIES
// ============================================

interface SecurityContext {
  userId: string | null;
  isAuthorized: boolean;
  isAdmin: boolean;
  sessionId: string | null;
  deviceId: string | null;
  ipAddress: string;
  userAgent: string;
}

// Extract bearer token from request
function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Also check cookies for session
  const sessionCookie = req.cookies.get('sb-session')?.value;
  if (sessionCookie) {
    return sessionCookie;
  }
  
  return null;
}

// Generate device fingerprint
function generateDeviceFingerprint(req: NextRequest): string {
  const userAgent = req.headers.get('user-agent') || '';
  const acceptLanguage = req.headers.get('accept-language') || '';
  const acceptEncoding = req.headers.get('accept-encoding') || '';
  
  // Simple fingerprint based on browser characteristics
  const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  return btoa(fingerprint).slice(0, 32);
}

// Get client IP address
function getClientIp(req: NextRequest): string {
  // Check for forwarded IP (behind proxy/CDN)
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Check for Vercel's IP header
  const vercelForwarded = req.headers.get('x-vercel-forwarded-for');
  if (vercelForwarded) {
    return vercelForwarded;
  }
  
  // Real IP header (from nginx/apache)
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

// Check if path is protected
function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(path => pathname.startsWith(path));
}

// Check if path is public
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path));
}

// ============================================
// SUPABASE CLIENT
// ============================================

function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================
// AUTHENTICATION & AUTHORIZATION
// ============================================

async function verifyUserAuthorization(
  token: string,
  deviceId: string,
  ipAddress: string
): Promise<SecurityContext> {
  const supabase = createSupabaseClient();
  
  try {
    // Verify JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return {
        userId: null,
        isAuthorized: false,
        isAdmin: false,
        sessionId: null,
        deviceId,
        ipAddress,
        userAgent: '',
      };
    }
    
    // Admin bypass
    if (user.id === ADMIN_UID) {
      return {
        userId: user.id,
        isAuthorized: true,
        isAdmin: true,
        sessionId: null,
        deviceId,
        ipAddress,
        userAgent: '',
      };
    }
    
    // Check user profile for authorization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('approved, is_admin, status')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      return {
        userId: user.id,
        isAuthorized: false,
        isAdmin: false,
        sessionId: null,
        deviceId,
        ipAddress,
        userAgent: '',
      };
    }
    
    // Check if user is blocked
    if (profile.status === 'blocked') {
      // Log blocked access attempt
      await supabase.from('audit_logs').insert({
        action: 'BLOCKED_USER_ACCESS_ATTEMPT',
        action_category: 'security',
        user_id: user.id,
        severity: 'warning',
        details: {
          ip_address: ipAddress,
          device_id: deviceId,
          reason: 'User is blocked',
        },
      });
      
      return {
        userId: user.id,
        isAuthorized: false,
        isAdmin: false,
        sessionId: null,
        deviceId,
        ipAddress,
        userAgent: '',
      };
    }
    
    // Check if user is approved
    if (!profile.approved) {
      return {
        userId: user.id,
        isAuthorized: false,
        isAdmin: false,
        sessionId: null,
        deviceId,
        ipAddress,
        userAgent: '',
      };
    }
    
    // Check for concurrent session (multi-access blocking)
    const { data: existingSessions, error: sessionError } = await supabase
      .from('user_sessions')
      .select('id, device_id, is_blocked')
      .eq('user_id', user.id)
      .eq('is_active', true);
    
    if (!sessionError && existingSessions && existingSessions.length > 0) {
      // Check if current device is already in a session
      const currentSession = existingSessions.find(s => s.device_id === deviceId);
      
      if (!currentSession) {
        // This is a new device - check if we should block
        // Allow if less than 1 active session (configurable)
        if (existingSessions.length >= 1) {
          // Log multi-access attempt
          await supabase.from('audit_logs').insert({
            action: 'MULTI_ACCESS_ATTEMPT_BLOCKED',
            action_category: 'security',
            user_id: user.id,
            severity: 'warning',
            details: {
              ip_address: ipAddress,
              device_id: deviceId,
              existing_sessions: existingSessions.length,
            },
          });
          
          // Create blocked session record
          await supabase.from('user_sessions').insert({
            user_id: user.id,
            device_id: deviceId,
            device_type: 'web',
            device_name: 'Unknown Device',
            ip_address: ipAddress,
            is_active: false,
            is_blocked: true,
            block_reason: 'Multi-access detected: Another active session exists',
          });
          
          return {
            userId: user.id,
            isAuthorized: false,
            isAdmin: false,
            sessionId: null,
            deviceId,
            ipAddress,
            userAgent: '',
          };
        }
      }
    }
    
    return {
      userId: user.id,
      isAuthorized: true,
      isAdmin: profile.is_admin || false,
      sessionId: currentSession?.id || null,
      deviceId,
      ipAddress,
      userAgent: '',
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    
    return {
      userId: null,
      isAuthorized: false,
      isAdmin: false,
      sessionId: null,
      deviceId,
      ipAddress,
      userAgent: '',
    };
  }
}

// ============================================
// MIDDLEWARE MAIN FUNCTION
// ============================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // CRITICAL: Skip middleware for ALL API routes and Supabase requests
  // This prevents 504 timeout errors on auth token refresh
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth/') ||
    pathname.includes('supabase') ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|json)$/)
  ) {
    return NextResponse.next();
  }
  
  // Get security context
  const deviceId = generateDeviceFingerprint(request);
  const ipAddress = getClientIp(request);
  
  // Extract auth token
  const token = extractToken(request);
  
  // Check if this is a protected route
  const protectedRoute = isProtectedPath(pathname);
  const publicRoute = isPublicPath(pathname);
  
  // If it's a public route, allow access with security headers only
  if (publicRoute && !protectedRoute) {
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  }
  
  // If no token and route is protected, redirect to login
  if (!token && protectedRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If no token on non-protected route, allow
  if (!token) {
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  }
  
  // For protected routes, verify authorization (with timeout protection)
  let securityContext: SecurityContext = {
    userId: null,
    isAuthorized: false,
    isAdmin: false,
    sessionId: null,
    deviceId,
    ipAddress,
    userAgent: '',
  };
  
  if (protectedRoute) {
    try {
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Auth verification timeout')), 5000)
      );
      
      securityContext = await Promise.race([
        verifyUserAuthorization(token, deviceId, ipAddress),
        timeoutPromise
      ]);
    } catch (err) {
      console.error('Auth verification error:', err);
      // Allow request to proceed rather than hang - client-side auth will catch issues
      securityContext = { ...securityContext, isAuthorized: true };
    }
  }
  
  // If not authorized and trying to access protected route
  if (!securityContext.isAuthorized && protectedRoute) {
    // Check if user exists but is not approved
    if (securityContext.userId) {
      const pendingUrl = new URL('/pending-approval', request.url);
      return NextResponse.redirect(pendingUrl);
    }
    
    // Redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If user is blocked
  if (securityContext.userId && !securityContext.isAuthorized && !protectedRoute) {
    const blockedUrl = new URL('/account-blocked', request.url);
    return NextResponse.redirect(blockedUrl);
  }
  
  // Add security headers to response
  const response = NextResponse.next();
  addSecurityHeaders(response);
  
  return response;
}

// Helper function to add security headers
function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.supabase.co; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' blob: data: https://*.tmdb.org https://*.themoviedb.org https://image.tmdb.org; " +
    "font-src 'self'; " +
    "connect-src 'self' https://*.supabase.co https://api.themoviedb.org wss://*.supabase.co; " +
    "frame-ancestors 'none';"
  );
}

// ============================================
// CONFIG
// ============================================

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
