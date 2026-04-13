<?php
/**
 * Royal Nepal - CSRF (Cross-Site Request Forgery) Protection Middleware
 *
 * This class provides a simple and effective way to protect against CSRF attacks
 * using the "Double Submit Cookie" pattern. A unique token is generated and stored
 * in the user's session. The frontend must fetch this token and include it in
 * all state-changing requests (POST, PUT, DELETE). The backend then validates
 * the submitted token against the one stored in the session.
 *
 * @package RoyalNepal
 * @author  Your Name
 */
class CSRFToken {

    /**
     * Lifetime of a generated CSRF token in seconds.
     */
    private const TOKEN_TTL = 3600;

    /**
     * Encodes binary data into URL-safe base64 without padding.
     *
     * @param string $data Raw binary input.
     * @return string URL-safe base64 encoded output.
     */
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Decodes URL-safe base64 into binary data.
     *
     * @param string $data URL-safe base64 input.
     * @return string|false Raw binary output or false on failure.
     */
    private static function base64UrlDecode($data) {
        $padding = strlen($data) % 4;
        if ($padding > 0) {
            $data .= str_repeat('=', 4 - $padding);
        }

        return base64_decode(strtr($data, '-_', '+/'), true);
    }

    /**
     * Generates a new CSRF token or retrieves the existing one from the session.
     *
     * This method ensures that a CSRF token is available for the current user session.
     * If a token does not already exist in the session, it creates a new, cryptographically
     * secure random token and stores it.
     *
     * @return string The CSRF token for the current session.
     */
    public static function generate() {
        // Keep session token behavior for backward compatibility.
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // Create a signed, expiring token so validation does not depend on session cookies.
        $random = random_bytes(32);
        $payload = self::base64UrlEncode($random);
        $expires = (string) (time() + self::TOKEN_TTL);
        $signature = hash_hmac('sha256', $payload . '.' . $expires, JWT_SECRET_KEY);
        $token = $payload . '.' . $expires . '.' . $signature;

        $_SESSION['csrf_token'] = $token;

        return $token;
    }

    /**
     * Validates a submitted token against the one stored in the session.
     *
     * This is the core of the CSRF protection. It checks if the token provided
     * by the client matches the one stored in the user's session. It uses a
     * timing-attack-safe comparison function (`hash_equals`) to prevent attackers
     * from guessing the token character by character.
     *
     * @param string $token The CSRF token submitted by the client.
     * @return bool Returns true if the token is valid, false otherwise.
     */
    public static function validate($token) {
        // Ensure the session is active.
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (empty($token)) {
            return false;
        }

        // Session match remains valid for compatibility with existing flows.
        if (!empty($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token)) {
            return true;
        }

        // Validate signed token format: payload.expires.signature
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }

        [$payload, $expires, $providedSignature] = $parts;

        if (!ctype_digit($expires) || (int) $expires < time()) {
            return false;
        }

        $decodedPayload = self::base64UrlDecode($payload);
        if ($decodedPayload === false) {
            return false;
        }

        $expectedSignature = hash_hmac('sha256', $payload . '.' . $expires, JWT_SECRET_KEY);

        return hash_equals($expectedSignature, $providedSignature);
    }

    /**
     * Retrieves the current CSRF token directly from the session.
     *
     * This can be useful for debugging or for cases where the token needs to be
     * accessed without necessarily generating a new one.
     *
     * @return string|null The CSRF token if it exists, otherwise null.
     */
    public static function getToken() {
        // Ensure the session is active.
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // Return the token from the session, or null if it's not set.
        return $_SESSION['csrf_token'] ?? null;
    }

    /**
     * Resets the CSRF token by removing it from the session.
     *
     * This can be called after a user logs out or when a new session is started
     * to ensure that old tokens are invalidated. A new token will be generated
     * on the next call to `generate()`.
     */
    public static function reset() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        unset($_SESSION['csrf_token']);
    }
}
?>
