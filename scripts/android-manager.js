const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const task = process.argv[2];
if (!task) {
  console.error('Please specify a gradle task (e.g., clean, assembleRelease)');
  process.exit(1);
}

// Determine Gradle executable based on OS
const isWindows = os.platform() === 'win32';
const gradlew = isWindows ? 'gradlew.bat' : './gradlew';
const androidDir = path.join(__dirname, '..', 'android');

console.log(`Running Gradle task: ${task} in ${androidDir}`);

const child = spawn(gradlew, [task], {
  cwd: androidDir,
  stdio: 'inherit',
  shell: true,
});

child.on('error', err => {
  console.error('Failed to start gradle task:', err);
  process.exit(1);
});

child.on('close', code => {
  if (code !== 0) {
    console.error(`Gradle task exited with code ${code}`);
    process.exit(code);
  }
  console.log('Gradle task completed successfully');
});
