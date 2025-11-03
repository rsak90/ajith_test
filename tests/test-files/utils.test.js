// Utility functions tests
// This file contains tests for common utility functions

// Utility functions (copy from your main JS files)
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength) + '...';
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function generateRandomId() {
    return Math.random().toString(36).substr(2, 9);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Tests for utility functions
describe('Date Utilities', () => {
    test('should format date correctly', () => {
        // Act
        const formatted = formatDate('2025-11-03');
        
        // Assert
        expect(formatted).toContain('Nov');
        expect(formatted).toContain('3');
        expect(formatted).toContain('2025');
    });
});

describe('Text Utilities', () => {
    test('should truncate long text', () => {
        // Arrange
        const longText = "This is a very long text that should be truncated";
        
        // Act
        const truncated = truncateText(longText, 20);
        
        // Assert
        expect(truncated.length).toBe(23); // 20 + '...'
        expect(truncated).toContain('...');
    });

    test('should not truncate short text', () => {
        // Arrange
        const shortText = "Short text";
        
        // Act
        const result = truncateText(shortText, 20);
        
        // Assert
        expect(result).toBe(shortText);
        expect(result).not.toContain('...');
    });
});

describe('URL Validation', () => {
    test('should validate correct URLs', () => {
        // Act & Assert
        expect(isValidUrl('https://example.com')).toBe(true);
        expect(isValidUrl('http://localhost:3000')).toBe(true);
        expect(isValidUrl('ftp://files.example.com')).toBe(true);
    });

    test('should reject invalid URLs', () => {
        // Act & Assert
        expect(isValidUrl('not-a-url')).toBe(false);
        expect(isValidUrl('just-text')).toBe(false);
        expect(isValidUrl('')).toBe(false);
    });
});

describe('ID Generation', () => {
    test('should generate unique IDs', () => {
        // Act
        const id1 = generateRandomId();
        const id2 = generateRandomId();
        
        // Assert
        expect(id1).not.toBe(id2);
        expect(id1.length).toBeGreaterThan(5);
        expect(id2.length).toBeGreaterThan(5);
    });
});

describe('Function Utilities', () => {
    test('should create debounced function', () => {
        // Arrange
        let callCount = 0;
        const testFunction = () => callCount++;
        const debouncedFunction = debounce(testFunction, 100);
        
        // Act
        debouncedFunction();
        debouncedFunction();
        debouncedFunction();
        
        // Assert (immediate check - function shouldn't have been called yet)
        expect(callCount).toBe(0);
    });
});