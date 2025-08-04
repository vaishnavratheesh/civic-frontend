import { decodeGoogleCredential } from '../googleAuth';

describe('Google Auth Utils', () => {
  describe('decodeGoogleCredential', () => {
    it('should return null for invalid JWT format', () => {
      const invalidJWT = 'invalid.jwt';
      const result = decodeGoogleCredential(invalidJWT);
      expect(result).toBeNull();
    });

    it('should return null for malformed JWT', () => {
      const malformedJWT = 'header.invalid-payload.signature';
      const result = decodeGoogleCredential(malformedJWT);
      expect(result).toBeNull();
    });

    it('should decode a valid JWT payload', () => {
      // Create a mock JWT with a valid payload
      const mockPayload = {
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/picture.jpg',
        given_name: 'Test',
        family_name: 'User',
        sub: '123456789'
      };

      // Base64 encode the payload
      const encodedPayload = btoa(JSON.stringify(mockPayload));
      const mockJWT = `header.${encodedPayload}.signature`;

      const result = decodeGoogleCredential(mockJWT);
      
      expect(result).toEqual({
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/picture.jpg',
        given_name: 'Test',
        family_name: 'User',
        sub: '123456789'
      });
    });
  });
});
