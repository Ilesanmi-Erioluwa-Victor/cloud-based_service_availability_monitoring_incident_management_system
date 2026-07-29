import dotenv from 'dotenv';
dotenv.config();

const env = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/uptimeguard',
  JWT_SECRET: process.env.JWT_SECRET || 'change-this-in-production',
  BREVO_API_KEY: process.env.BREVO_API_KEY || '',
  SMS_API_KEY: process.env.SMS_API_KEY || '',
  SMS_PROVIDER: process.env.SMS_PROVIDER || 'mysmsgate',
  FIELD_ENCRYPTION_KEY: process.env.FIELD_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef',
  PORT: parseInt(process.env.PORT || '4000', 10),
};

export default env;