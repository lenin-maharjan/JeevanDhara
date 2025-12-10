import 'dart:async';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:jeevandhara/screens/blood_bank/blood_bank_main_screen.dart';
import 'package:jeevandhara/screens/hospital/hospital_main_screen.dart';
import 'package:provider/provider.dart';
import 'package:jeevandhara/providers/auth_provider.dart';
import 'package:jeevandhara/services/firebase_auth_service.dart';

import 'package:flutter/material.dart';
import 'package:jeevandhara/screens/auth/login_screen.dart';
import 'package:jeevandhara/screens/main_screen.dart';
import 'package:jeevandhara/screens/donor/donor_main_screen.dart';
import 'package:easy_localization/easy_localization.dart'; // [New]
import 'package:jeevandhara/core/localization_helper.dart'; // [New] Shim

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

// 1. ENTRY POINT
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await EasyLocalization.ensureInitialized();

  runApp(
    EasyLocalization(
      supportedLocales: const [Locale('en'), Locale('ne')],
      path: 'assets/i18n', // Resource path
      fallbackLocale: const Locale('en'),
      child: const StartUpApp(),
    ),
  );
}

// 2. StartUpApp: Shows splash screen immediately & runs initialization logic
class StartUpApp extends StatefulWidget {
  const StartUpApp({super.key});

  @override
  State<StartUpApp> createState() => _StartUpAppState();
}

class _StartUpAppState extends State<StartUpApp> {
  // State variables for initialization
  bool _firebaseInitialized = false;
  bool _isInitError = false;
  String _errorMessage = '';
  // Removed _localizationDelegate since EasyLocalization handles itself

  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    // Artificial delay to ensure splash is seen
    final splashMinDuration = Future.delayed(const Duration(seconds: 3));

    try {
      // A. Initialize Firebase
      await FirebaseAuthService.initialize();
      _firebaseInitialized = true;

      // B. Initialize Local Notifications
      const AndroidInitializationSettings initializationSettingsAndroid =
          AndroidInitializationSettings('@mipmap/ic_launcher');
      const InitializationSettings initializationSettings =
          InitializationSettings(android: initializationSettingsAndroid);
      await flutterLocalNotificationsPlugin.initialize(initializationSettings);

      // C. Localization is already handled by EasyLocalization wrapper in main()
      
      // Wait for the minimum splash duration
      await splashMinDuration;
      
      if (mounted) {
        setState(() {}); // Rebuild to switch to MyApp
      }
    } catch (e) {
      print("CRITICAL INIT ERROR: $e");
      if (mounted) {
        setState(() {
          _isInitError = true;
          _errorMessage = e.toString();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // If we have an error
    if (_isInitError) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(
          backgroundColor: Colors.red[50],
          body: Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  const Text(
                    'App Initialization Failed',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _errorMessage,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.red),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      setState(() {
                        _isInitError = false;
                        _errorMessage = '';
                      });
                      _initializeApp();
                    },
                    child: const Text('Retry'),
                  )
                ],
              ),
            ),
          ),
        ),
      );
    }

    // If initialization is incomplete, show Splash Screen
    if (!_firebaseInitialized) {
      return const MaterialApp(
        debugShowCheckedModeBanner: false,
        home: InitialSplashScreen(),
      );
    }

    // Initialization Complete: Launch Real App
    // Note: EasyLocalization widget is above StartUpApp, so context here has localization
    return const MyApp();
  }
}

// 3. The Real App
class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: MaterialApp(
        title: 'Jeevan Dhara',
        // EasyLocalization configuration
        localizationsDelegates: context.localizationDelegates,
        supportedLocales: context.supportedLocales,
        locale: context.locale,
        theme: ThemeData(
          primarySwatch: Colors.red,
          visualDensity: VisualDensity.adaptivePlatformDensity,
        ),
        home: const AuthWrapper(),
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}

// 4. Initial Splash Screen (No logic, just UI)
class InitialSplashScreen extends StatelessWidget {
  const InitialSplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Image.asset(
              'assets/images/jeevan_dhara_logo.png',
              height: 150.0,
            ),
            const SizedBox(height: 24.0),
            const Text(
              "Jeevan Dhara", 
              style: TextStyle(
                fontSize: 40.0,
                fontWeight: FontWeight.bold,
                color: Colors.red,
              ),
            ),
            const SizedBox(height: 12.0),
            const Text(
              "Saving Lives, One Drop at a Time",
              style: TextStyle(
                fontSize: 16.0,
                color: Colors.black54,
              ),
            ),
            const SizedBox(height: 24.0),
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.red),
            ),
          ],
        ),
      ),
    );
  }
}

// 5. AuthWrapper: Handles Auto-Login Logic AFTER UI is ready
class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool _isCheckingAuth = true;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    try {
      await authProvider.tryAutoLogin().timeout(
        const Duration(seconds: 15), 
        onTimeout: () {
          print('Auto-login timeout in AuthWrapper');
        },
      );
    } catch (e) {
      print('Auto-login error: $e');
    }

    if (mounted) {
      setState(() {
        _isCheckingAuth = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isCheckingAuth) {
      return const InitialSplashScreen();
    }

    final authProvider = Provider.of<AuthProvider>(context);

    if (authProvider.isAuthenticated) {
      final user = authProvider.user;
      switch (user?.userType) {
        case 'requester': return const MainScreen();
        case 'donor': return const DonorMainScreen();
        case 'hospital': return const HospitalMainScreen();
        case 'blood_bank': return const BloodBankMainScreen();
        default: return const LoginScreen();
      }
    }

    return const LoginScreen();
  }
}





