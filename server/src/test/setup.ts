import "dotenv/config";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL ??= "postgresql://hostin:hostin_local_password@localhost:5432/hostin_test?schema=public";
process.env.JWT_SECRET ??= "test_jwt_secret_that_is_longer_than_32_characters";
process.env.CLIENT_ORIGIN ??= "http://localhost:3000";
process.env.LOG_LEVEL ??= "silent";
