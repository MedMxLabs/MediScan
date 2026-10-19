import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/back_navigation.dart';
import '../../core/l10n_ext.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/ui_components.dart';
import '../landing/medmx_logo.dart';
import 'google_sign_in_button.dart';

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
    final auth = context.read<AuthProvider>();
    if (!auth.supabaseActive) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.supabaseNotConfigured)),
      );
      return;
    }
    final ok = await auth.loginWithGoogle();
    if (!mounted) return;
    if (ok) {
      context.go('/home');
    } else if (auth.error != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(auth.error!)));
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
                    if (auth.supabaseActive) ...[
                      GoogleSignInButton(onPressed: _googleSignIn, loading: auth.loading),
                      const SizedBox(height: 16),
                      OrDivider(label: l10n.orDivider),
                      const SizedBox(height: 16),
                    ],
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
