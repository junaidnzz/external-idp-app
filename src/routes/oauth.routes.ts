import { Router } from 'express';
import { OAuthController } from '../controllers/oauth.controller';

const router = Router();
const oauthController = new OAuthController();

oauthController.initialize().catch((error) => {
  console.error('Failed to initialize OAuth controller:', error);
});

const checkAuth = (req: any, _res: any, next: any) => {
  req.isAuthenticated = !!req.session?.oauth?.userInfo;
  next();
};

router.get('/', checkAuth, oauthController.home);
router.get('/login', oauthController.login);
router.get('/callback', oauthController.callback);
router.get('/logout', oauthController.logout);
router.get('/profile', oauthController.profile);

// Direct API form pages
router.get('/signup', (_req, res) => {
  res.render('signup');
});

router.get('/signin', (_req, res) => {
  res.render('signin');
});

export default router;