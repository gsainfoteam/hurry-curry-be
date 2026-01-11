module.exports = {
  displayName: 'worker',
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.(t|j)s', '../../libs/**/*.(t|j)s'],
  coverageDirectory: '../../coverage/worker',
  moduleNameMapper: {
    '^@app/api/(.*)$': '<rootDir>/../../apps/api/src/$1',
    '^@lib/common$': '<rootDir>/../../libs/common/src/index.ts',
    '^@lib/common/(.*)$': '<rootDir>/../../libs/common/src/$1',
    '^@lib/orders$': '<rootDir>/../../libs/orders/src/index.ts',
    '^@lib/orders/(.*)$': '<rootDir>/../../libs/orders/src/$1',
    '^@lib/prisma$': '<rootDir>/../../libs/prisma/src/index.ts',
    '^@lib/prisma/(.*)$': '<rootDir>/../../libs/prisma/src/$1',
    '^@lib/custom-config$': '<rootDir>/../../libs/custom-config/src/index.ts',
    '^@lib/custom-config/(.*)$': '<rootDir>/../../libs/custom-config/src/$1',
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.app.json',
    },
  },
};
