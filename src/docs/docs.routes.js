import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Serve the HTML documentation
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs.html'));
});

// Serve machine-readable API specs as JSON
router.get('/api-docs.json', (req, res) => {
  const apiSpecs = {
    title: 'E-commerce API',
    description: 'API documentation for the E-commerce platform',
    version: '1.0.0',
    endpoints: [
      {
        route: '/api/auth/register/send-otp',
        method: 'POST',
        description: 'Sends a one-time password (OTP) to the user for registration',
        parameters: {
          email: { type: 'string', required: true, description: 'The email address to send OTP to' },
          phone: { type: 'string', required: true, description: 'The phone number to send OTP to' }
        }
      },
      {
        route: '/api/auth/register/verify-otp',
        method: 'POST',
        description: 'Verifies the OTP and completes the registration process',
        parameters: {
          email: { type: 'string', required: true, description: 'The email address' },
          phone: { type: 'string', required: true, description: 'The phone number' },
          otp: { type: 'string', required: true, description: 'The OTP code' },
          password: { type: 'string', required: true, description: 'The user\'s password' }
        }
      },
      {
        route: '/api/auth/login',
        method: 'POST',
        description: 'Logs in a user and returns a JWT token',
        parameters: {
          email: { type: 'string', required: true, description: 'The user\'s email' },
          password: { type: 'string', required: true, description: 'The user\'s password' }
        },
        response: {
          token: 'jwt_token_here',
          user: {
            id: 'user_id',
            name: 'User Name',
            email: 'user@example.com'
          }
        }
      },
      {
        route: '/api/auth/logout',
        method: 'POST',
        description: 'Logs out the current user by invalidating the JWT token'
      },
      {
        route: '/api/auth/me',
        method: 'GET',
        description: 'Gets the current user\'s profile information',
        authentication: 'required'
      },
      {
        route: '/api/auth/forgot-password',
        method: 'POST',
        description: 'Sends a password reset link to the user\'s email',
        parameters: {
          email: { type: 'string', required: true, description: 'The user\'s email' }
        }
      },
      {
        route: '/api/auth/reset-password/:token',
        method: 'PUT',
        description: 'Resets the user\'s password using the provided token',
        parameters: {
          token: { type: 'string', required: true, description: 'The reset token' },
          password: { type: 'string', required: true, description: 'The new password' }
        }
      }
      // Additional endpoints would be listed here...
    ]
  };
  res.json(apiSpecs);
});

export default router;