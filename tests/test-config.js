// Test configuration file
// Add or remove test files here to control which tests are loaded

const TEST_CONFIG = {
    // Test files to load (in order)
    testFiles: [
        'login.test.js',        // Login functionality tests
        'dashboard.test.js',    // Dashboard functionality tests  
        'admin.test.js',        // Admin panel tests
        'utils.test.js'         // Utility function tests
        // Add more test files here as your app grows:
        // 'reports.test.js',
        // 'settings.test.js',
        // 'api.test.js'
    ],
    
    // Test runner settings
    settings: {
        autoRun: true,          // Run tests automatically on page load
        showFileStatus: true,   // Show which files are loaded
        stopOnFirstFailure: false  // Continue running tests even if one fails
    },
    
    // Test categories (for organizing tests)
    categories: {
        'Authentication': ['login.test.js'],
        'User Interface': ['dashboard.test.js', 'admin.test.js'],
        'Utilities': ['utils.test.js']
    }
};