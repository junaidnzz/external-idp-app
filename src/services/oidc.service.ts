import { Issuer, Client, generators } from 'openid-client';
import { config } from '../config/env.config';
import { logger } from '../utils/logger';

export class OIDCService {
  private client: Client | null = null;
  private issuerUrl: string;

  constructor() {
    this.issuerUrl = `https://cognito-idp.${config.aws.region}.amazonaws.com/${config.cognito.userPoolId}`;
  }

  async initialize(): Promise<void> {
    try {
      const issuer = await Issuer.discover(this.issuerUrl);
      
      this.client = new issuer.Client({
        client_id: config.cognito.clientId,
        client_secret: config.cognito.clientSecret,
        redirect_uris: [config.oauth.callbackUrl],
        response_types: ['code'],
      });

      logger.info('OIDC client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize OIDC client:', error);
      throw error;
    }
  }

  getClient(): Client {
    if (!this.client) {
      throw new Error('OIDC client not initialized');
    }
    return this.client;
  }

  generateNonce(): string {
    return generators.nonce();
  }

  generateState(): string {
    return generators.state();
  }

  getAuthorizationUrl(state: string, nonce: string): string {
    if (!this.client) {
      throw new Error('OIDC client not initialized');
    }

    return this.client.authorizationUrl({
      scope: 'email openid phone profile',
      state,
      nonce,
    });
  }

  async callback(
    params: any,
    state: string,
    nonce: string
  ): Promise<any> {
    if (!this.client) {
      throw new Error('OIDC client not initialized');
    }

    try {
      const tokenSet = await this.client.callback(
        config.oauth.callbackUrl,
        params,
        {
          nonce,
          state,
        }
      );

      return tokenSet;
    } catch (error) {
      logger.error('OIDC callback error:', error);
      throw error;
    }
  }

  async getUserInfo(accessToken: string): Promise<any> {
    if (!this.client) {
      throw new Error('OIDC client not initialized');
    }

    try {
      const userInfo = await this.client.userinfo(accessToken);
      return userInfo;
    } catch (error) {
      logger.error('Failed to get user info:', error);
      throw error;
    }
  }

  getLogoutUrl(clientId: string): string {
    const cognitoDomain = config.oauth.cognitoDomain;
    const logoutUri = encodeURIComponent(config.oauth.logoutUrl);
    
    return `https://${cognitoDomain}.auth.${config.aws.region}.amazoncognito.com/logout?client_id=${clientId}&logout_uri=${logoutUri}`;
  }
}