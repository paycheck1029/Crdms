import authService from '../services/authService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

const getCookie = (req, name) => {
  if (!req.headers.cookie) return null;
  const value = `; ${req.headers.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await authService.login(email, password);

    // Set refresh token in secure HttpOnly cookie
    res.cookie('refreshToken', data.refreshToken, {
      httpOnly: true,
      secure: process.env.APP_ENV === 'production',
      sameSite: 'Strict',
      path: '/auth', // Scope to auth routes
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days matching token
    });

    return sendSuccess(res, {
      accessToken: data.accessToken,
      user: data.user
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    // Attempt to read from HttpOnly cookies first, fallback to body
    const token = getCookie(req, 'refreshToken') || req.body.refreshToken;
    
    if (!token) {
      return sendError(res, 'Refresh token is missing', {}, 401);
    }

    const data = await authService.refresh(token);

    // Rotate refresh token in cookie
    res.cookie('refreshToken', data.refreshToken, {
      httpOnly: true,
      secure: process.env.APP_ENV === 'production',
      sameSite: 'Strict',
      path: '/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return sendSuccess(res, {
      accessToken: data.accessToken
    }, 'Token refreshed successfully');
  } catch (error) {
    return sendError(res, error.message, {}, 401);
  }
};

export const logout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await authService.logout(userId);

    // Clear secure cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.APP_ENV === 'production',
      sameSite: 'Strict',
      path: '/auth'
    });

    return sendSuccess(res, {}, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

export const linkedinLogin = (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${req.protocol}://${req.get('host')}/auth/linkedin/callback`;

  if (!clientId || clientId === 'mock' || clientId === 'sandbox') {
    return res.redirect(`/auth/linkedin/callback?code=mock_linkedin_code_123`);
  }

  const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email`;
  return res.redirect(linkedinAuthUrl);
};

export const linkedinCallback = async (req, res) => {
  const { code, error: reqError } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'https://crdms-frontend-922971997014.us-central1.run.app';

  if (reqError) {
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(reqError)}`);
  }

  if (!code) {
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('No authorization code provided')}`);
  }

  try {
    let linkedinId = '';
    let email = '';
    let name = '';
    let profilePicUrl = '';

    const isMock = !process.env.LINKEDIN_CLIENT_ID || 
                   process.env.LINKEDIN_CLIENT_ID === 'mock' || 
                   process.env.LINKEDIN_CLIENT_ID === 'sandbox' || 
                   code === 'mock_linkedin_code_123';

    if (isMock) {
      linkedinId = 'mock_li_user_999';
      email = 'recruiter.linkedin@crdms.com';
      name = 'LinkedIn Recruiter';
      profilePicUrl = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2';
    } else {
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
      const redirectUri = process.env.LINKEDIN_REDIRECT_URI || `${req.protocol}://${req.get('host')}/auth/linkedin/callback`;

      const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret
        })
      });

      if (!tokenRes.ok) {
        const errorData = await tokenRes.json();
        throw new Error(errorData.error_description || 'Failed to exchange LinkedIn access token');
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!userRes.ok) {
        throw new Error('Failed to retrieve LinkedIn user details');
      }

      const userData = await userRes.json();
      linkedinId = userData.sub;
      email = userData.email;
      name = userData.name || `${userData.given_name} ${userData.family_name}`;
      profilePicUrl = userData.picture || '';
    }

    const authData = await authService.loginOrRegisterLinkedIn({
      linkedinId,
      email,
      name,
      profilePicUrl
    });

    res.cookie('refreshToken', authData.refreshToken, {
      httpOnly: true,
      secure: process.env.APP_ENV === 'production',
      sameSite: 'Strict',
      path: '/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.redirect(`${frontendUrl}/login?token=${authData.accessToken}&user=${encodeURIComponent(JSON.stringify(authData.user))}`);

  } catch (err) {
    console.error('LinkedIn OAuth Error:', err.message);
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(err.message || 'LinkedIn Authentication failed')}`);
  }
};

export default {
  login,
  refresh,
  logout,
  linkedinLogin,
  linkedinCallback
};
