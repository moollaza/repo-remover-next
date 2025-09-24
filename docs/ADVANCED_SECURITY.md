# Advanced Security: Post-Launch Token Storage Options

## Current Implementation

The repo-remover application currently uses `sessionStorage` for GitHub Personal Access Token (PAT) storage:

```typescript
// Current approach (production-ready)
sessionStorage.setItem('github_token', token);
```

**Benefits:**
- ✅ Cleared automatically on tab close
- ✅ Not accessible to other tabs/windows  
- ✅ Simple implementation
- ✅ No persistence across sessions (security by design)

**Limitations:**
- ❌ User must re-authenticate on every browser restart
- ❌ Token lost if tab accidentally closed
- ❌ No protection against malicious browser extensions

## Advanced Post-Launch Options

### Option 1: Web Crypto API + IndexedDB Encryption

**Implementation Strategy:**
```typescript
// Derive encryption key from user password/PIN
const keyMaterial = await crypto.subtle.importKey(
  'raw',
  new TextEncoder().encode(userPin),
  { name: 'PBKDF2' },
  false,
  ['deriveKey']
);

const cryptoKey = await crypto.subtle.deriveKey(
  {
    name: 'PBKDF2',
    salt: new Uint8Array(16), // Use random salt per user
    iterations: 100000,
    hash: 'SHA-256'
  },
  keyMaterial,
  { name: 'AES-GCM', length: 256 },
  false, // non-extractable
  ['encrypt', 'decrypt']
);

// Encrypt token before storing
const encrypted = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv: crypto.getRandomValues(new Uint8Array(12)) },
  cryptoKey,
  new TextEncoder().encode(token)
);

// Store in IndexedDB
await indexedDB.put('encrypted_tokens', { id: 'github_pat', data: encrypted });
```

**Security Benefits:**
- ✅ Military-grade AES-256 encryption
- ✅ Keys stored as non-extractable CryptoKey objects
- ✅ PBKDF2 key derivation (100k+ iterations)
- ✅ Random initialization vectors per encryption
- ✅ Zero-knowledge: encryption happens client-side only

**Considerations:**
- ⚠️ Requires user to set/remember PIN/password
- ⚠️ Complex implementation and error handling
- ⚠️ Browser extensions can still access IndexedDB
- ⚠️ Data can be lost if browser storage is cleared

### Option 2: WebAuthn with Large Blob Extension

**Implementation Strategy:**
```typescript
// Create credential with largeBlob extension
const credential = await navigator.credentials.create({
  publicKey: {
    challenge: new Uint8Array(32),
    rp: { name: "Repo Remover", id: "repo-remover.com" },
    user: { id: userId, name: username, displayName: username },
    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
    extensions: {
      largeBlob: { support: "required" }
    }
  }
});

// Store encrypted token in largeBlob
const assertion = await navigator.credentials.get({
  publicKey: {
    challenge: new Uint8Array(32),
    extensions: {
      largeBlob: { 
        write: await encryptToken(token) // Up to 2KB storage
      }
    }
  }
});
```

**Security Benefits:**
- ✅ Hardware-backed security (if available)
- ✅ Biometric authentication
- ✅ Not cleared with browser data
- ✅ Protected against extension access
- ✅ Industry standard for secure authentication

**Considerations:**
- ⚠️ Requires WebAuthn-compatible device
- ⚠️ Limited browser support for largeBlob
- ⚠️ Only 2KB storage limit
- ⚠️ More complex user onboarding

### Option 3: Hybrid Approach (Recommended)

**Implementation Strategy:**
```typescript
class TokenStorage {
  async storeToken(token: string, options: StorageOptions) {
    // Priority order based on security preferences
    if (options.webauthn && this.supportsWebAuthn()) {
      return this.storeWithWebAuthn(token);
    }
    
    if (options.encrypted && this.supportsWebCrypto()) {
      return this.storeWithEncryption(token, options.userPin);
    }
    
    // Fallback to current sessionStorage
    return this.storeInSession(token);
  }
  
  async retrieveToken(): Promise<string | null> {
    // Try each method in order of preference
    return (
      await this.tryWebAuthn() ||
      await this.tryEncrypted() ||
      this.trySession()
    );
  }
}
```

**Benefits:**
- ✅ Progressive enhancement based on user device capabilities
- ✅ Graceful fallback to current secure sessionStorage
- ✅ User choice in security vs. convenience tradeoff
- ✅ Future-proof as WebAuthn adoption increases

## Recommendations

### Immediate Post-Launch (Month 1-3)
1. **Keep current sessionStorage implementation** - it's secure and works universally
2. **Add user education** about creating app-specific PATs with minimal scopes
3. **Monitor user feedback** for authentication friction

### Medium Term (Month 3-6)
1. **Implement Option 3 (Hybrid Approach)** as an opt-in feature
2. **Add encrypted storage** for users who want longer sessions
3. **Add WebAuthn support** for high-security users

### Long Term (6+ months)
1. **Evaluate WebAuthn adoption** in user base
2. **Consider making encrypted storage default** (with sessionStorage fallback)
3. **Research emerging standards** like FedCM or Credential Management API

## Security Analysis (2025)

Based on current research, the Web Crypto API + IndexedDB approach provides:

**Strengths:**
- Non-extractable keys bound to browser environment
- AES-256-GCM encryption with PBKDF2 key derivation
- Zero-knowledge architecture maintains privacy principles
- Supported across all modern browsers

**Weaknesses:**
- Browser extensions can access IndexedDB data
- Users can clear browser data, losing encrypted tokens
- Requires additional user authentication (PIN/password)
- Complex error handling for crypto operations

**Verdict:** The current sessionStorage approach is production-ready and secure. Advanced options should be implemented as progressive enhancements rather than replacements, giving users choice between security and convenience.

## Implementation Priority

1. **Current (Production):** sessionStorage ✅
2. **Phase 1:** User education and PAT best practices
3. **Phase 2:** Encrypted IndexedDB storage (opt-in)
4. **Phase 3:** WebAuthn integration (for supported devices)
5. **Phase 4:** Hybrid storage manager with intelligent fallbacks

The zero-knowledge architecture remains intact with all approaches, ensuring no sensitive data ever leaves the user's browser.