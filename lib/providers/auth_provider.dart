import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart' as fb;
import 'package:jeevandhara/models/user_model.dart';
import 'package:jeevandhara/services/api_service.dart';
import 'package:jeevandhara/services/firebase_auth_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  User? _user;
  bool _isLoading = false;
  String? _errorMessage;

  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _user != null && FirebaseAuthService.isSignedIn;

  /// Login with Firebase Authentication and fetch the user profile from the backend.
  Future<bool> login(String email, String password) async {
    _setLoading(true);
    try {
      // 1. Sign in with Firebase
      await FirebaseAuthService.signIn(
        email: email,
        password: password,
      );

      // 2. Fetch user profile from MongoDB via API
      await _refreshUserProfile();

      // 3. Sync FCM token
      await _syncFCMToken();

      _setLoading(false);
      return true;
    } on fb.FirebaseAuthException catch (e) {
      _errorMessage = FirebaseAuthService.getErrorMessage(e.code);
      _setLoading(false);
      return false;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _setLoading(false);
      return false;
    }
  }

  /// Register a user with Firebase and create a corresponding profile in the backend.
  /// Implements cleanup logic to prevent orphaned Firebase users.
  Future<bool> register(Map<String, dynamic> userData) async {
    _setLoading(true);
    fb.User? firebaseUser; // Keep a reference to the created user for potential cleanup

    try {
      final email = userData['email'] as String;
      final password = userData['password'] as String;

      // 1. Create Firebase user
      final userCredential = await FirebaseAuthService.signUp(
        email: email,
        password: password,
      );
      firebaseUser = userCredential.user;

      if (firebaseUser == null) {
        throw Exception('Firebase signup failed unexpectedly.');
      }

      // 2. Remove password from data before sending to backend
      userData.remove('password');

      // 3. Create MongoDB user profile via API
      final response = await _apiService.createUserProfile(userData);
      _user = User.fromJson(response['user']);

      // 4. Cache user data
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user', jsonEncode(response['user']));

      // 5. Sync FCM token
      await _syncFCMToken();

      _setLoading(false);
      return true;
    } on fb.FirebaseAuthException catch (e) {
      // Firebase signup failed, no cleanup needed as no user was created.
      _errorMessage = FirebaseAuthService.getErrorMessage(e.code);
      _setLoading(false);
      return false;
    } catch (e) {
      // Backend profile creation failed. Clean up the orphaned Firebase user.
      if (firebaseUser != null) {
        await firebaseUser.delete();
        print('CLEANUP: Deleted orphaned Firebase user due to backend profile creation failure.');
      }
      _errorMessage = 'Failed to create profile: ${e.toString()}';
      _setLoading(false);
      return false;
    }
  }

  /// Update user profile in the backend and optimistically update local state.
  Future<bool> updateProfile(Map<String, dynamic> updates) async {
    if (_user == null || _user!.id == null) return false;
    _setLoading(true);
    try {
      final data = await _apiService.put('auth/profile', updates);

      final userResponseData = data['user'];
      if (userResponseData != null) {
        // Best case: API returns the full updated user object
        _user = User.fromJson(userResponseData);
      } else {
        // Fallback: Optimistically update the local user object with the changes sent.
        // This requires your User model to have `toJson()` and `fromJson()` methods.
        final currentUserData = _user!.toJson();
        currentUserData.addAll(updates);
        _user = User.fromJson(currentUserData);
      }

      // Persist the updated user to local storage
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user', jsonEncode(_user!.toJson()));

      // Notify listeners to update the UI with the new data
      notifyListeners();
      _setLoading(false);
      return true;

    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _setLoading(false);
      return false;
    }
  }

  /// Logout from both Firebase and clear local cache.
  Future<void> logout() async {
    await FirebaseAuthService.signOut();
    _user = null;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user'); // Use remove instead of clear to preserve other potential keys

    notifyListeners();
  }

  /// Tries to automatically log in the user by checking Firebase and local cache.
  /// This should be called once at app startup.
  Future<void> tryAutoLogin() async {
    // Explicitly wait for Firebase to be ready instead of using a fixed delay.
    await FirebaseAuthService.initialize();

    if (!FirebaseAuthService.isSignedIn) {
      // No authenticated Firebase user, so we consider them logged out.
      return;
    }

    // Firebase user is signed in, proceed to load their profile.
    final prefs = await SharedPreferences.getInstance();
    final userDataString = prefs.getString('user');

    if (userDataString != null) {
      // Load cached user data immediately for a fast UI response.
      _user = User.fromJson(jsonDecode(userDataString));
      notifyListeners();
      // Refresh user data from backend in the background to get latest info.
      _refreshUserProfile();
    } else {
      // No cached data, must fetch from backend to complete login.
      await _refreshUserProfile();
    }
  }

  /// Send password reset email via Firebase.
  Future<bool> sendPasswordResetEmail(String email) async {
    _setLoading(true);
    try {
      await FirebaseAuthService.sendPasswordResetEmail(email);
      _setLoading(false);
      return true;
    } on fb.FirebaseAuthException catch (e) {
      _errorMessage = FirebaseAuthService.getErrorMessage(e.code);
      _setLoading(false);
      return false;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _setLoading(false);
      return false;
    }
  }

  /// Sync the device's FCM token with the backend.
  Future<void> _syncFCMToken() async {
    try {
      final fcmToken = await FirebaseAuthService.getFCMToken();
      if (fcmToken != null) {
        await _apiService.updateFCMToken(fcmToken);
        print('FCM Token synced successfully.');
      }
    } catch (e) {
      // Don't block login/startup if this fails. Log the error for debugging.
      print('Error syncing FCM token: $e');
    }
  }

  /// Fetches the latest user profile from the backend and updates the state.
  Future<void> _refreshUserProfile() async {
    try {
      final userData = await _apiService.getCurrentUser();
      _user = User.fromJson(userData);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user', jsonEncode(userData));
      notifyListeners();
    } catch (e) {
      // If the refresh fails, we don't want to log the user out.
      // The existing cached data (if any) is still considered valid.
      print('Silent failure refreshing user profile: $e');
    }
  }

  /// Public method to allow UI to trigger a user profile refresh.
  Future<void> refreshUserProfile() async {
    await _refreshUserProfile();
  }

  /// Internal helper to manage loading state and clear errors.
  void _setLoading(bool value) {
    _isLoading = value;
    if (value) _errorMessage = null; // Clear previous errors when a new action starts
    notifyListeners();
  }
}





