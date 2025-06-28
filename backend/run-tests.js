#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command) {
  try {
    log(`\n🔄 Running: ${command}`, 'cyan');
    const output = execSync(command, { encoding: 'utf8', stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`❌ Command failed: ${command}`, 'red');
    return false;
  }
}

function checkFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  return fs.existsSync(fullPath);
}

function main() {
  log('🧪 Unit Test Runner for Payment & Refund Use Cases', 'bright');
  log('====================================================', 'bright');

  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    log(
      '❌ Error: package.json not found. Please run this from the backend directory.',
      'red',
    );
    process.exit(1);
  }

  // Check if test files exist
  const testFiles = [
    'src/payments/payments-usecase.test.ts',
    'src/orders/orders-usecase.test.ts',
  ];

  log('\n📋 Checking test files...', 'yellow');
  let allFilesExist = true;
  for (const file of testFiles) {
    if (checkFile(file)) {
      log(`✅ ${file}`, 'green');
    } else {
      log(`❌ ${file} not found`, 'red');
      allFilesExist = false;
    }
  }

  if (!allFilesExist) {
    log('\n❌ Some test files are missing. Please create them first.', 'red');
    process.exit(1);
  }

  // Install dependencies if needed
  log('\n📦 Checking dependencies...', 'yellow');
  if (!fs.existsSync('node_modules')) {
    log('Installing dependencies...', 'yellow');
    if (!runCommand('npm install')) {
      process.exit(1);
    }
  }

  // Run tests
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Default: run all use case tests
    log('\n🚀 Running all use case tests...', 'green');

    // Run payment tests
    log('\n1️⃣ Payment Use Case Tests', 'magenta');
    runCommand('npm test -- payments-usecase.test.ts');

    // Run order tests
    log('\n2️⃣ Order Use Case Tests', 'magenta');
    runCommand('npm test -- orders-usecase.test.ts');

    // Run coverage
    log('\n📊 Generating coverage report...', 'magenta');
    runCommand('npm run test:cov -- ".*usecase.test.ts"');
  } else if (args[0] === 'payment') {
    log('\n💳 Running Payment Use Case Tests...', 'green');
    runCommand('npm test -- payments-usecase.test.ts --verbose');
  } else if (args[0] === 'order') {
    log('\n📦 Running Order Use Case Tests...', 'green');
    runCommand('npm test -- orders-usecase.test.ts --verbose');
  } else if (args[0] === 'refund') {
    log('\n💰 Running Refund-related Tests...', 'green');
    runCommand('npm test -- --testNamePattern="Refund|Cancel"');
  } else if (args[0] === 'integration') {
    log('\n🔗 Running Integration Tests...', 'green');
    runCommand('npm test -- --testNamePattern="Integration"');
  } else if (args[0] === 'watch') {
    log('\n👀 Running tests in watch mode...', 'green');
    runCommand('npm test -- usecase.test.ts --watch');
  } else if (args[0] === 'debug') {
    log('\n🐛 Running tests in debug mode...', 'green');
    runCommand('npm run test:debug -- usecase.test.ts');
  } else if (args[0] === 'coverage') {
    log('\n📊 Running tests with coverage...', 'green');
    runCommand('npm run test:cov -- usecase.test.ts');
  } else {
    // Show help
    showHelp();
  }
}

function showHelp() {
  log('\n📖 Usage:', 'bright');
  log('  node run-tests.js [command]', 'cyan');
  log('\n🎯 Commands:', 'bright');
  log('  (no args)     Run all use case tests', 'cyan');
  log('  payment       Run payment use case tests only', 'cyan');
  log('  order         Run order use case tests only', 'cyan');
  log('  refund        Run refund-related tests', 'cyan');
  log('  integration   Run integration tests', 'cyan');
  log('  watch         Run tests in watch mode', 'cyan');
  log('  debug         Run tests in debug mode', 'cyan');
  log('  coverage      Run tests with coverage report', 'cyan');
  log('  help          Show this help message', 'cyan');
  log('\n💡 Examples:', 'bright');
  log('  node run-tests.js', 'yellow');
  log('  node run-tests.js payment', 'yellow');
  log('  node run-tests.js coverage', 'yellow');
  log('  node run-tests.js watch', 'yellow');
}

// Check if help was requested
if (
  process.argv.includes('help') ||
  process.argv.includes('-h') ||
  process.argv.includes('--help')
) {
  showHelp();
  process.exit(0);
}

// Run main function
main();
