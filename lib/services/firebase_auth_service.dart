import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

/// Firebase Authentication Service
/// Handles all Firebase Auth operations and FCM token management.
/// Methods that interact with Firebase Auth will re-throw [FirebaseAuthException]
/// on failure, which should be caught in the UI/Provider layer.
class FirebaseAuthService {
  static final FirebaseAuth _auth = FirebaseAuth.instance;
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  /// Initializes Firebase and sets up messaging.
  /// Must be called once at app startup.
  static Future<void> initialize() async {
    // Use the official check to see if Firebase is already initialized.
    if (Firebase.apps.isNotEmpty) {
      print('Firebase has already been initialized.');
      return;
    }

    await Firebase.initializeApp();
    print('Firebase initialized.');

    // Request notification permission for iOS and web.
    await _messaging.requestPermission(
      alert: true,
      sound: true,
      badge: true,
    );

    // Handle FCM token refresh events.
    _messaging.onTokenRefresh.listen((token) {
      // Add null and length check for safety.
      if (token.isNotEmpty) {
        final preview = token.length > 20 ? '${token.substring(0, 20)}...' : token;
        print('FCM Token refreshed: $preview');
      }
      // The new token should be synced to your backend by the AuthProvider after login.
    });
  }

  /// Gets the current authenticated Firebase user, if any.
  static User? get currentUser => _auth.currentUser;

  /// Checks if a user is currently signed in.
  static bool get isSignedIn => currentUser != null;

  /// Gets the Firebase ID token for the current user for API calls.
  /// Returns null if not authenticated or if an error occurs.
  static Future<String?> getIdToken({bool forceRefresh = false}) async {
    if (currentUser == null) return null;
    try {
      return await currentUser!.getIdToken(forceRefresh);
    } catch (e) {
      print('Error getting ID token: $e');
      return null;
    }
  }

  /// Signs up a new user with email and password.
  /// Throws [FirebaseAuthException] on failure.
  static Future<UserCredential> signUp({
    required String email,
    required String password,
  }) async {
    try {
      return await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
    } on FirebaseAuthException {
      // Re-throw the specific Firebase exception to be handled by the caller.
      rethrow;
    } catch (e) {
      // Catch any other unexpected errors.
      print('An unexpected error occurred during sign up: $e');
      throw Exception('An unexpected error occurred.');
    }
  }

  /// Signs in a user with email and password.
  /// Throws [FirebaseAuthException] on failure.
  static Future<UserCredential> signIn({
    required String email,
    required String password,
  }) async {
    try {
      return await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
    } on FirebaseAuthException {
      rethrow;
    } catch (e) {
      print('An unexpected error occurred during sign in: $e');
      throw Exception('An unexpected error occurred.');
    }
  }

  /// Signs out the current user.
  static Future<void> signOut() async {
    await _auth.signOut();
  }

  /// Sends a password reset email to the given email address.
  /// Throws [FirebaseAuthException] on failure.
  static Future<void> sendPasswordResetEmail(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
    } on FirebaseAuthException {
      rethrow;
    } catch (e) {
      print('An unexpected error occurred sending password reset email: $e');
      throw Exception('An unexpected error occurred.');
    }
  }

  /// Sends an email verification link to the current user.
  static Future<void> sendEmailVerification() async {
    if (currentUser == null) return;
    try {
      await currentUser!.sendEmailVerification();
    } catch (e) {
      print('Error sending email verification: $e');
    }
  }

  /// Checks if the current user's email is verified.
  /// Returns false if no user is signed in.
  static bool get isEmailVerified => currentUser?.emailVerified ?? false;

  /// A stream that emits the [User] object on auth state changes (login/logout).
  static Stream<User?> get authStateChanges => _auth.authStateChanges();

  /// A stream that emits the [User] object on ID token changes.
  static Stream<User?> get idTokenChanges => _auth.idTokenChanges();

  /// Gets the current FCM token for push notifications.
  /// Returns null if an error occurs.
  static Future<String?> getFCMToken() async {
    try {
      return await _messaging.getToken();
    } catch (e) {
      print('Error getting FCM token: $e');
      return null;
    }
  }

  /// Deletes the current user's account. This is irreversible.
  /// Throws [FirebaseAuthException] on failure (e.g., requires recent login).
  static Future<void> deleteAccount() async {
    if (currentUser == null) return;
    try {
      await currentUser!.delete();
    } on FirebaseAuthException {
      rethrow;
    } catch (e) {
      print('An unexpected error occurred while deleting account: $e');
      throw Exception('An unexpected error occurred.');
    }
  }

  /// Maps Firebase Auth error codes to user-friendly messages.
  static String getErrorMessage(String code) {
    switch (code) {
      case 'user-not-found':
        return 'No user found with this email.';
      case 'wrong-password':
        return 'Incorrect password. Please try again.';
      case 'email-already-in-use':
        return 'This email address is already registered.';
      case 'weak-password':
        return 'The password is too weak (must be at least 6 characters).';
      case 'invalid-email':
        return 'The email address is not valid.';
      case 'too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'user-disabled':
        return 'This account has been disabled.';
      case 'operation-not-allowed':
        return 'Email/password sign-in is currently disabled.';
      case 'network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'invalid-credential':
        return 'Invalid credentials. Please check your email and password.';
      case 'requires-recent-login':
        return 'This action requires you to have recently signed in. Please sign out and sign in again.';
      default:
        return 'An authentication error occurred. It might be due to a missing SHA-1 key in your Firebase project settings. Code: $code';
    }
  }
}
