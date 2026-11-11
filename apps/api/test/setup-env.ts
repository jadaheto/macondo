import { TEST_STORAGE_DIR, testDatabaseUrl } from './test-env';

process.env.DATABASE_URL = testDatabaseUrl();
process.env.STORAGE_DRIVER = 'local';
process.env.STORAGE_DIR = TEST_STORAGE_DIR;
process.env.LOGIN_THROTTLE_LIMIT = process.env.LOGIN_THROTTLE_LIMIT ?? '1000';
process.env.MAX_UPLOAD_MB = '2';
