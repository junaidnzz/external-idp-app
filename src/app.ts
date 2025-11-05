import express, { Application } from 'express';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config/env.config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import healthRoutes from './routes/health.routes';
import oauthRoutes from './routes/oauth.routes';

export class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(__dirname, 'views'));

    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
        },
      },
    }));

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    this.app.use(
      session({
        secret: config.session.secret,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: config.server.nodeEnv === 'production',
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000,
        },
      })
    );
    
    this.app.use(
      cors({
        origin: (origin, callback) => {
          // Allow requests with no origin (like mobile apps, Postman, or same-origin)
          if (!origin) return callback(null, true);
          
          // Allow localhost origins for development
          if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            return callback(null, true);
          }
          
          // Check against configured allowed origins
          if (config.cors.allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        credentials: true,
      })
    );

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests from this IP, please try again later.',
    });

    this.app.use('/api/', limiter);

    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: 'Too many authentication attempts, please try again later.',
      skipSuccessfulRequests: true,
    });

    const signupLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10000, // Allow more signups for bulk user creation
      message: 'Too many signup attempts, please try again later.',
      skipSuccessfulRequests: true,
    });

    this.app.use('/api/auth/signin', authLimiter);
    this.app.use('/api/auth/signup', signupLimiter);

    this.app.use((req, _res, next) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });
  }

  private initializeRoutes(): void {
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api', healthRoutes);
    this.app.use('/oauth', oauthRoutes);

    this.app.get('/', (_req, res) => {
      res.json({
        message: 'External IdP Service',
        version: '1.0.0',
        endpoints: {
          health: '/api/health',
          auth: '/api/auth',
          users: '/api/users',
          oauth: '/oauth',
        },
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  public listen(): void {
    const port = config.server.port;
    
    this.app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
      logger.info(`Environment: ${config.server.nodeEnv}`);
      logger.info(`Health check: http://localhost:${port}/api/health`);
      logger.info(`OAuth2/OIDC UI: http://localhost:${port}/oauth`);
    });
  }
}