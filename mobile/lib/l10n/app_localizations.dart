import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_hi.dart';
import 'app_localizations_kn.dart';
import 'app_localizations_mr.dart';
import 'app_localizations_ta.dart';
import 'app_localizations_te.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('hi'),
    Locale('kn'),
    Locale('mr'),
    Locale('ta'),
    Locale('te'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'MedMx LABS'**
  String get appTitle;

  /// No description provided for @navHome.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get navHome;

  /// No description provided for @navMedicines.
  ///
  /// In en, this message translates to:
  /// **'Medicines'**
  String get navMedicines;

  /// No description provided for @navReports.
  ///
  /// In en, this message translates to:
  /// **'Reports'**
  String get navReports;

  /// No description provided for @navProfile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get navProfile;

  /// No description provided for @drawerOverview.
  ///
  /// In en, this message translates to:
  /// **'Overview'**
  String get drawerOverview;

  /// No description provided for @drawerSearch.
  ///
  /// In en, this message translates to:
  /// **'Search Medicine'**
  String get drawerSearch;

  /// No description provided for @drawerUpload.
  ///
  /// In en, this message translates to:
  /// **'Upload Prescription'**
  String get drawerUpload;

  /// No description provided for @drawerHistory.
  ///
  /// In en, this message translates to:
  /// **'Medicine History'**
  String get drawerHistory;

  /// No description provided for @drawerReminders.
  ///
  /// In en, this message translates to:
  /// **'Reminders'**
  String get drawerReminders;

  /// No description provided for @drawerAdherence.
  ///
  /// In en, this message translates to:
  /// **'Adherence'**
  String get drawerAdherence;

  /// No description provided for @drawerLabReports.
  ///
  /// In en, this message translates to:
  /// **'Lab Reports'**
  String get drawerLabReports;

  /// No description provided for @drawerPharmacies.
  ///
  /// In en, this message translates to:
  /// **'Nearby Pharmacies'**
  String get drawerPharmacies;

  /// No description provided for @drawerAssistant.
  ///
  /// In en, this message translates to:
  /// **'AI Assistant'**
  String get drawerAssistant;

  /// No description provided for @settings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settings;

  /// No description provided for @settingsAppearance.
  ///
  /// In en, this message translates to:
  /// **'Appearance'**
  String get settingsAppearance;

  /// No description provided for @settingsLanguage.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get settingsLanguage;

  /// No description provided for @themeLight.
  ///
  /// In en, this message translates to:
  /// **'Light'**
  String get themeLight;

  /// No description provided for @themeDark.
  ///
  /// In en, this message translates to:
  /// **'Dark'**
  String get themeDark;

  /// No description provided for @themeSystem.
  ///
  /// In en, this message translates to:
  /// **'System default'**
  String get themeSystem;

  /// No description provided for @langEnglish.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get langEnglish;

  /// No description provided for @langHindi.
  ///
  /// In en, this message translates to:
  /// **'Hindi'**
  String get langHindi;

  /// No description provided for @langTamil.
  ///
  /// In en, this message translates to:
  /// **'Tamil'**
  String get langTamil;

  /// No description provided for @langTelugu.
  ///
  /// In en, this message translates to:
  /// **'Telugu'**
  String get langTelugu;

  /// No description provided for @langKannada.
  ///
  /// In en, this message translates to:
  /// **'Kannada'**
  String get langKannada;

  /// No description provided for @langMarathi.
  ///
  /// In en, this message translates to:
  /// **'Marathi'**
  String get langMarathi;

  /// No description provided for @greetingMorning.
  ///
  /// In en, this message translates to:
  /// **'Good morning'**
  String get greetingMorning;

  /// No description provided for @greetingAfternoon.
  ///
  /// In en, this message translates to:
  /// **'Good afternoon'**
  String get greetingAfternoon;

  /// No description provided for @greetingEvening.
  ///
  /// In en, this message translates to:
  /// **'Good evening'**
  String get greetingEvening;

  /// No description provided for @searchHint.
  ///
  /// In en, this message translates to:
  /// **'Find medicine prices…'**
  String get searchHint;

  /// No description provided for @statDosesToday.
  ///
  /// In en, this message translates to:
  /// **'Doses today'**
  String get statDosesToday;

  /// No description provided for @statActiveMeds.
  ///
  /// In en, this message translates to:
  /// **'Active meds'**
  String get statActiveMeds;

  /// No description provided for @statAdherence.
  ///
  /// In en, this message translates to:
  /// **'Adherence'**
  String get statAdherence;

  /// No description provided for @upNext.
  ///
  /// In en, this message translates to:
  /// **'Up next'**
  String get upNext;

  /// No description provided for @noRemindersYet.
  ///
  /// In en, this message translates to:
  /// **'No reminders yet'**
  String get noRemindersYet;

  /// No description provided for @addMedicineSchedule.
  ///
  /// In en, this message translates to:
  /// **'Add a medicine schedule'**
  String get addMedicineSchedule;

  /// No description provided for @add.
  ///
  /// In en, this message translates to:
  /// **'Add'**
  String get add;

  /// No description provided for @recentSearches.
  ///
  /// In en, this message translates to:
  /// **'Recent searches'**
  String get recentSearches;

  /// No description provided for @history.
  ///
  /// In en, this message translates to:
  /// **'History'**
  String get history;

  /// No description provided for @quickSearch.
  ///
  /// In en, this message translates to:
  /// **'Search'**
  String get quickSearch;

  /// No description provided for @quickUpload.
  ///
  /// In en, this message translates to:
  /// **'Upload Rx'**
  String get quickUpload;

  /// No description provided for @quickReminders.
  ///
  /// In en, this message translates to:
  /// **'Reminders'**
  String get quickReminders;

  /// No description provided for @quickAdherence.
  ///
  /// In en, this message translates to:
  /// **'Adherence'**
  String get quickAdherence;

  /// No description provided for @loading.
  ///
  /// In en, this message translates to:
  /// **'Loading…'**
  String get loading;

  /// No description provided for @profilePersonalInfo.
  ///
  /// In en, this message translates to:
  /// **'Personal Information'**
  String get profilePersonalInfo;

  /// No description provided for @profileMedicalRecords.
  ///
  /// In en, this message translates to:
  /// **'Medical Records'**
  String get profileMedicalRecords;

  /// No description provided for @profilePrescriptions.
  ///
  /// In en, this message translates to:
  /// **'Prescriptions'**
  String get profilePrescriptions;

  /// No description provided for @profileReminders.
  ///
  /// In en, this message translates to:
  /// **'Reminders'**
  String get profileReminders;

  /// No description provided for @profileUpload.
  ///
  /// In en, this message translates to:
  /// **'Upload Prescription'**
  String get profileUpload;

  /// No description provided for @profileAssistant.
  ///
  /// In en, this message translates to:
  /// **'AI Assistant'**
  String get profileAssistant;

  /// No description provided for @profilePharmacies.
  ///
  /// In en, this message translates to:
  /// **'Nearby Pharmacies'**
  String get profilePharmacies;

  /// No description provided for @profileHelp.
  ///
  /// In en, this message translates to:
  /// **'Help & Support'**
  String get profileHelp;

  /// No description provided for @profileResetData.
  ///
  /// In en, this message translates to:
  /// **'Reset activity data'**
  String get profileResetData;

  /// No description provided for @profileLogout.
  ///
  /// In en, this message translates to:
  /// **'Logout'**
  String get profileLogout;

  /// No description provided for @profileUpdated.
  ///
  /// In en, this message translates to:
  /// **'Profile updated'**
  String get profileUpdated;

  /// No description provided for @profileSave.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get profileSave;

  /// No description provided for @profileName.
  ///
  /// In en, this message translates to:
  /// **'Name'**
  String get profileName;

  /// No description provided for @profilePhone.
  ///
  /// In en, this message translates to:
  /// **'Phone'**
  String get profilePhone;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @reset.
  ///
  /// In en, this message translates to:
  /// **'Reset'**
  String get reset;

  /// No description provided for @resetDataTitle.
  ///
  /// In en, this message translates to:
  /// **'Reset activity data?'**
  String get resetDataTitle;

  /// No description provided for @resetDataBody.
  ///
  /// In en, this message translates to:
  /// **'This clears your search history, prescriptions, reminders, and adherence logs. Your account stays active.'**
  String get resetDataBody;

  /// No description provided for @activityReset.
  ///
  /// In en, this message translates to:
  /// **'Activity data reset'**
  String get activityReset;

  /// No description provided for @loginWelcome.
  ///
  /// In en, this message translates to:
  /// **'Welcome Back'**
  String get loginWelcome;

  /// No description provided for @loginSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Glad to see you again!'**
  String get loginSubtitle;

  /// No description provided for @loginEmail.
  ///
  /// In en, this message translates to:
  /// **'Email or Phone Number'**
  String get loginEmail;

  /// No description provided for @loginPassword.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get loginPassword;

  /// No description provided for @loginButton.
  ///
  /// In en, this message translates to:
  /// **'Login'**
  String get loginButton;

  /// No description provided for @signupPrompt.
  ///
  /// In en, this message translates to:
  /// **'Don\'t have an account? '**
  String get signupPrompt;

  /// No description provided for @signupLink.
  ///
  /// In en, this message translates to:
  /// **'Sign Up'**
  String get signupLink;

  /// No description provided for @landingGetStarted.
  ///
  /// In en, this message translates to:
  /// **'Get Started'**
  String get landingGetStarted;

  /// No description provided for @landingLogin.
  ///
  /// In en, this message translates to:
  /// **'Login'**
  String get landingLogin;

  /// No description provided for @landingTagline.
  ///
  /// In en, this message translates to:
  /// **'Compare medicine prices across India'**
  String get landingTagline;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) => <String>[
    'en',
    'hi',
    'kn',
    'mr',
    'ta',
    'te',
  ].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'hi':
      return AppLocalizationsHi();
    case 'kn':
      return AppLocalizationsKn();
    case 'mr':
      return AppLocalizationsMr();
    case 'ta':
      return AppLocalizationsTa();
    case 'te':
      return AppLocalizationsTe();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
