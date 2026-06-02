import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:provider/provider.dart';

import '../../core/back_navigation.dart';
import '../../core/config.dart';
import '../../core/l10n_ext.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/ui_components.dart';
import '../landing/medmx_logo.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final auth = context.read<AuthProvider>();
    final ok = await auth.login(_email.text, _password.text);
    if (!mounted) return;
    if (ok) {
      context.go('/home');
    } else {
      final msg = auth.error ?? 'Login failed';
      final friendly = msg.toLowerCase().contains('invalid credentials')
          ? 'Invalid email or password. Create an account if you are new.'
          : msg;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(friendly)));
    }
  }

  Future<void> _googleSignIn() async {
    if (AppConfig.googleClientId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Google sign-in not configured (set GOOGLE_CLIENT_ID at build time).')),
      );
      return;
    }
    final auth = context.read<AuthProvider>();
    try {
      final google = GoogleSignIn(serverClientId: AppConfig.googleClientId, scopes: ['email']);
      final account = await google.signIn();
      final authData = await account?.authentication;
      final idToken = authData?.idToken;
      if (idToken == null) return;
      final ok = await auth.loginWithGoogle(idToken);
      if (!mounted) return;
      if (ok) context.go('/home');
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final l10n = context.l10n;

    return DarkScaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => navigateBack(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            children: [
              const FadeSlideIn(child: MedMxLogo(height: 52)),
              const SizedBox(height: 32),
              FadeSlideIn(
                delay: const Duration(milliseconds: 100),
                child: Column(
                  children: [
                    Text(
                      l10n.loginWelcome,
                      style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      l10n.loginSubtitle,
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.6), fontSize: 15),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              FadeSlideIn(
                delay: const Duration(milliseconds: 200),
                child: Column(
                  children: [
                    DarkTextField(
                      controller: _email,
                      hint: l10n.loginEmail,
                      prefixIcon: Icons.mail_outline,
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: 14),
                    DarkTextField(
                      controller: _password,
                      hint: l10n.loginPassword,
                      prefixIcon: Icons.lock_outline,
                      obscureText: _obscure,
                      suffixIcon: IconButton(
                        icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                            color: AppColors.textMuted, size: 20),
                        onPressed: () => setState(() => _obscure = !_obscure),
                      ),
                    ),
                    const SizedBox(height: 16),
                    GradientButton(label: l10n.loginButton, onPressed: _submit, loading: auth.loading),
                    if (AppConfig.googleClientId.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      OutlinedButton(
                        onPressed: auth.loading ? null : _googleSignIn,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: BorderSide(color: Colors.white.withValues(alpha: 0.25)),
                          minimumSize: const Size(double.infinity, 48),
                        ),
                        child: const Text('Continue with Google'),
                      ),
                    ],
                    const SizedBox(height: 28),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(l10n.signupPrompt, style: TextStyle(color: Colors.white.withValues(alpha: 0.6))),
                        GestureDetector(
                          onTap: () => context.go('/signup'),
                          child: Text(l10n.signupLink, style: const TextStyle(color: AppColors.lime, fontWeight: FontWeight.w700)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
