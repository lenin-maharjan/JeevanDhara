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
import 'package:easy_localization/easy_localization.dart';
import 'package:jeevandhara/core/localization_helper.dart';

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

// 1. ENTRY POINT
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await EasyLocalization.ensureInitialized();

  try {
    // Initialize Firebase
    await FirebaseAuthService.initialize();

    // Initialize Local Notifications
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const InitializationSettings initializationSettings =
        InitializationSettings(android: initializationSettingsAndroid);
    await flutterLocalNotificationsPlugin.initialize(initializationSettings);
  } catch (e) {
    print("Initialization Error: $e");
    // Continue running app even if init fails, AuthWrapper will handle login state
  }

  runApp(
    EasyLocalization(
      supportedLocales: const [Locale('en'), Locale('ne')],
      path: 'assets/i18n', // Resource path
      fallbackLocale: const Locale('en'),
      child: const MyApp(),
    ),
  );
}

// 2. The Real App
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

// 3. Initial Splash Screen (No logic, just UI)
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

// 4. AuthWrapper: Handles Auto-Login Logic with Splash Screen
class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool _isLoading = true;
  bool _authChecked = false;

  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    try {
      // Show splash screen for at least 2 seconds for better UX
      await Future.wait([
        Provider.of<AuthProvider>(context, listen: false).tryAutoLogin(),
        Future.delayed(const Duration(seconds: 2)),
      ]);
    } catch (e) {
      print("Auto-login error: $e");
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _authChecked = true;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Show splash screen while loading
    if (_isLoading || !_authChecked) {
      return const InitialSplashScreen();
    }

    // Once loaded, show the appropriate screen based on auth state
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        if (auth.isAuthenticated) {
          final user = auth.user;
          switch (user?.userType) {
            case 'requester':
              return const MainScreen();
            case 'donor':
              return const DonorMainScreen();
            case 'hospital':
              return const HospitalMainScreen();
            case 'blood_bank':
              return const BloodBankMainScreen();
            default:
              return const LoginScreen();
          }
        } else {
          return const LoginScreen();
        }
      },
    );
  }
}
