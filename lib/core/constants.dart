/// API Constants for the Jeevan Dhara app
/// 
/// Environment-based URL configuration for different deployment scenarios
class ApiConstants {
  // =====================================================
  // PRODUCTION - Render Hosted Backend
  // =====================================================
  static const String baseUrl = 'https://jeevan-dhara-s7wo.onrender.com/api/v1';
  
  // =====================================================
  // DEVELOPMENT URLs (uncomment as needed)
  // =====================================================
  // Android Emulator:
  // static const String baseUrl = 'http://10.0.2.2:3002/api/v1';
  
  // iOS Simulator:
  // static const String baseUrl = 'http://localhost:3002/api/v1';
  
  // Physical Device (replace with your machine's IP):
  // static const String baseUrl = 'http://192.168.x.x:3002/api/v1';
  
  // =====================================================
  // API Endpoints (derived from baseUrl)
  // =====================================================
  static const String registerUrl = '$baseUrl/auth/register';
  static const String loginUrl = '$baseUrl/auth/login';
}





