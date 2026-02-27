import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_attendance_db',
  RABBITMQ_URI: process.env.RABBITMQ_URI || 'amqp://localhost:5672',
} as const;

export const IS_DEV = ENV.NODE_ENV === 'development';
export const IS_PROD = ENV.NODE_ENV === 'production';