import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

/// Compatibility shim to migrate from flutter_translate to easy_localization
/// consistently across the app without rewriting every call site.
String translate(String key, {Map<String, dynamic>? args}) {
  if (args != null) {
    // Convert args to Map<String, String> as expected by tr() namedArgs
    // tr() expects namedArgs to be Map<String, String>?
    final stringArgs = args.map((k, v) => MapEntry(k, v.toString()));
    return key.tr(namedArgs: stringArgs);
  }
  return key.tr();
}

/// Helper to change language
Future<void> changeLocale(BuildContext context, String languageCode) async {
  await context.setLocale(Locale(languageCode));
}

/// Helper to get current locale
Locale getCurrentLocale(BuildContext context) {
  return context.locale;
}





