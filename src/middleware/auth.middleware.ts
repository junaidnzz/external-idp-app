import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import axios from 'axios';
import { config } from '../config/env.config';
import { logger } from '../utils/logger';

interface JWK {
  alg: string;
  e: string;
  kid: string;
  kty: string;
  n: string;
  use: string;
}

interface DecodedToken {
  sub: string;
  email: string;
  'cognito:username': string;
  exp: number;
  iat: number;
}

export interface AuthRequest extends Request {
  user?: DecodedToken;
  accessToken?: string;
}

class AuthMiddleware {
  private pems: { [key: string]: string } = {};
  private jwksUrl: string;

  constructor() {
    this.jwksUrl = `https://cognito-idp.${config.aws.region}.amazonaws.com/${config.cognito.userPoolId}/.well-known/jwks.json`;
    this.initializePems();
  }

  private async initializePems(): Promise<void> {
    try {
      const response = await axios.get(this.jwksUrl);
      const jwks = response.data.keys as JWK[];

      jwks.forEach((jwk) => {
        const pem = jwkToPem({
          kty: jwk.kty as 'RSA',
          n: jwk.n,
          e: jwk.e,
        });
        this.pems[jwk.kid] = pem;
      });

      logger.info('JWKS keys loaded successfully');
    } catch (error) {
      logger.error('Error loading JWKS keys:', error);
    }
  }

  public authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = this.extractToken(req);

      if (!token) {
        res.status(401).json({ error: 'No token provided' });
        return;
      }

      const decodedToken = jwt.decode(token, { complete: true });

      if (!decodedToken || typeof decodedToken === 'string') {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      const kid = decodedToken.header.kid;

      if (!kid || !this.pems[kid]) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      jwt.verify(token, this.pems[kid], (err, decoded) => {
        if (err) {
          logger.error('Token verification error:', err);
          res.status(401).json({ error: 'Token verification failed' });
          return;
        }

        req.user = decoded as DecodedToken;
        req.accessToken = token;
        next();
      });
    } catch (error) {
      logger.error('Authentication error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  };

  public optionalAuthenticate = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const token = this.extractToken(req);

      if (!token) {
        next();
        return;
      }

      const decodedToken = jwt.decode(token, { complete: true });

      if (!decodedToken || typeof decodedToken === 'string') {
        next();
        return;
      }

      const kid = decodedToken.header.kid;

      if (!kid || !this.pems[kid]) {
        next();
        return;
      }

      jwt.verify(token, this.pems[kid], (err, decoded) => {
        if (!err) {
          req.user = decoded as DecodedToken;
          req.accessToken = token;
        }
        next();
      });
    } catch (error) {
      logger.error('Optional authentication error:', error);
      next();
    }
  };

  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }
}

export const authMiddleware = new AuthMiddleware();