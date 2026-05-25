import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/back_navigation.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/ui_components.dart';
import '../landing/medmx_logo.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
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
    if (_password.text.length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password must be at least 8 characters')),
      );
      return;
    }
    final auth = context.read<AuthProvider>();
    final ok = await auth.register(_email.text, _password.text);
    if (!mounted) return;
    if (ok) {
      context.go('/home');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.error ?? 'Signup failed')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

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
              const FadeSlideIn(
                child: Text(
                  'Create Account',
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Join MedMx for smarter healthcare',
                style: TextStyle(color: Colors.white.withValues(alpha: 0.6)),
              ),
              const SizedBox(height: 32),
              DarkTextField(
                controller: _email,
                hint: 'Email',
                prefixIcon: Icons.mail_outline,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 14),
              DarkTextField(
                controller: _password,
                hint: 'Password (8+ chars)',
                prefixIcon: Icons.lock_outline,
                obscureText: _obscure,
                suffixIcon: IconButton(
                  icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                      color: AppColors.textMuted, size: 20),
                  onPressed: () => setState(() => _obscure = !_obscure),
                ),
              ),
              const SizedBox(height: 28),
              GradientButton(label: 'Get Started', onPressed: _submit, loading: auth.loading),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Already have an account? ', style: TextStyle(color: Colors.white.withValues(alpha: 0.6))),
                  GestureDetector(
                    onTap: () => context.go('/login'),
                    child: const Text('Login', style: TextStyle(color: AppColors.lime, fontWeight: FontWeight.w700)),
                  ),
                ],
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
