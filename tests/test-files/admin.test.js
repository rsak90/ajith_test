// Admin functionality tests
// This file contains all tests related to admin panel functionality

// Application functions (copy from your main JS files)
function validateUserData(userData) {
    const errors = [];
    
    if (!userData.name || userData.name.trim() === "") {
        errors.push("Name is required");
    }
    
    if (!userData.email || !userData.email.includes("@")) {
        errors.push("Valid email is required");
    }
    
    if (!userData.role || userData.role === "") {
        errors.push("Role is required");
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

function formatUserRole(role) {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

function getUserStatusBadge(status) {
    const badges = {
        'active': '<span class="badge badge-success">Active</span>',
        'inactive': '<span class="badge badge-secondary">Inactive</span>',
        'suspended': '<span class="badge badge-warning">Suspended</span>'
    };
    return badges[status.toLowerCase()] || '<span class="badge badge-light">Unknown</span>';
}

// Tests for admin functionality
describe('Admin User Validation', () => {
    test('should validate complete user data', () => {
        // Arrange
        const validUser = {
            name: "John Doe",
            email: "john@example.com",
            role: "admin"
        };
        
        // Act
        const result = validateUserData(validUser);
        
        // Assert
        expect(result.isValid).toBe(true);
        expect(result.errors.length).toBe(0);
    });

    test('should reject user with missing name', () => {
        // Arrange
        const invalidUser = {
            name: "",
            email: "john@example.com",
            role: "admin"
        };
        
        // Act
        const result = validateUserData(invalidUser);
        
        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Name is required");
    });

    test('should reject user with invalid email', () => {
        // Arrange
        const invalidUser = {
            name: "John Doe",
            email: "invalid-email",
            role: "admin"
        };
        
        // Act
        const result = validateUserData(invalidUser);
        
        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Valid email is required");
    });

    test('should reject user with missing role', () => {
        // Arrange
        const invalidUser = {
            name: "John Doe",
            email: "john@example.com",
            role: ""
        };
        
        // Act
        const result = validateUserData(invalidUser);
        
        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Role is required");
    });
});

describe('Admin Utilities', () => {
    test('should format user roles correctly', () => {
        // Act & Assert
        expect(formatUserRole('admin')).toBe('Admin');
        expect(formatUserRole('USER')).toBe('User');
        expect(formatUserRole('mOdErAtOr')).toBe('Moderator');
    });

    test('should generate correct status badges', () => {
        // Act & Assert
        expect(getUserStatusBadge('active')).toContain('badge-success');
        expect(getUserStatusBadge('INACTIVE')).toContain('badge-secondary');
        expect(getUserStatusBadge('suspended')).toContain('badge-warning');
        expect(getUserStatusBadge('unknown')).toContain('badge-light');
    });
});