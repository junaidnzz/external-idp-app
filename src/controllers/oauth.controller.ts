import { Request, Response } from 'express';
import { OIDCService } from '../services/oidc.service';
import { logger } from '../utils/logger';
import { config } from '../config/env.config';

export interface OAuthSession {
  nonce?: string;
  state?: string;
  userInfo?: any;
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
}

declare module 'express-session' {
  interface SessionData {
    oauth: OAuthSession;
  }
}

export class OAuthController {
  private oidcService: OIDCService;

  constructor() {
    this.oidcService = new OIDCService();
  }

  async initialize(): Promise<void> {
    await this.oidcService.initialize();
  }

  home = (req: Request, res: Response): void => {
    const isAuthenticated = !!req.session.oauth?.userInfo;
    
    res.render('home', {
      isAuthenticated,
      userInfo: req.session.oauth?.userInfo || null,
    });
  };

  login = (req: Request, res: Response): void => {
    try {
      const nonce = this.oidcService.generateNonce();
      const state = this.oidcService.generateState();

      req.session.oauth = {
        nonce,
        state,
      };

      const authUrl = this.oidcService.getAuthorizationUrl(state, nonce);
      res.redirect(authUrl);
    } catch (error) {
      logger.error('OAuth login error:', error);
      res.status(500).render('error', { 
        message: 'Failed to initiate login',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  callback = async (req: Request, res: Response): Promise<void> => {
    try {
      const client = this.oidcService.getClient();
      const params = client.callbackParams(req);
      
      if (!req.session.oauth?.nonce || !req.session.oauth?.state) {
        throw new Error('Session state missing');
      }

      const tokenSet = await this.oidcService.callback(
        params,
        req.session.oauth.state,
        req.session.oauth.nonce
      );

      const userInfo = await this.oidcService.getUserInfo(tokenSet.access_token as string);

      req.session.oauth = {
        ...req.session.oauth,
        userInfo,
        accessToken: tokenSet.access_token as string,
        idToken: tokenSet.id_token as string,
        refreshToken: tokenSet.refresh_token as string,
      };

      res.redirect('/oauth');
    } catch (error) {
      logger.error('OAuth callback error:', error);
      res.status(500).render('error', { 
        message: 'Authentication failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  logout = (req: Request, res: Response): void => {
    req.session.destroy((err) => {
      if (err) {
        logger.error('Session destroy error:', err);
      }
    });

    const logoutUrl = this.oidcService.getLogoutUrl(config.cognito.clientId);
    res.redirect(logoutUrl);
  };

  profile = (req: Request, res: Response): void => {
    if (!req.session.oauth?.userInfo) {
      res.redirect('/oauth/login');
      return;
    }

    res.render('profile', {
      userInfo: req.session.oauth.userInfo,
      tokens: {
        accessToken: req.session.oauth.accessToken,
        idToken: req.session.oauth.idToken,
      },
    });
  };
}