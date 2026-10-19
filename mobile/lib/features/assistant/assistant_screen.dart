import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/api/medscan_api.dart';
import '../../core/back_navigation.dart';
import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/ui_components.dart';

class AssistantScreen extends StatefulWidget {
  const AssistantScreen({super.key});

  @override
  State<AssistantScreen> createState() => _AssistantScreenState();
}

class _AssistantScreenState extends State<AssistantScreen> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  final _messages = <Map<String, dynamic>>[];
  bool _loading = false;

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _input.text.trim();
    if (text.isEmpty || _loading) return;
    setState(() {
      _messages.add({'role': 'user', 'text': text});
      _loading = true;
      _input.clear();
    });
    _scrollToBottom();
    try {
      final reply = await context.read<MedscanApi>().askAssistant(text);
      if (!mounted) return;
      setState(() {
        _messages.add({'role': 'assistant', 'text': reply['text']});
        _loading = false;
      });
      _scrollToBottom();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _messages.add({'role': 'assistant', 'text': e.toString()});
        _loading = false;
      });
    }
  }

  Future<void> _clearChat() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.cardDark,
        title: const Text('Clear chat?', style: TextStyle(color: Colors.white)),
        content: const Text('All messages in this session will be removed.', style: TextStyle(color: AppColors.textMuted)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Clear')),
        ],
      ),
    );
    if (confirm == true && mounted) {
      setState(() => _messages.clear());
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (!mounted || !_scroll.hasClients) return;
      _scroll.animateTo(
        _scroll.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final name = context.select<AuthProvider, String>(
      (a) => a.user?['name']?.toString().split(' ').first ?? 'there',
    );

    return DarkScaffold(
      appBar: DarkAppBar(
        title: 'AI Assistant',
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => navigateBack(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline, size: 22),
            tooltip: 'Clear chat',
            onPressed: _messages.isEmpty ? null : _clearChat,
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              controller: _scroll,
              padding: const EdgeInsets.all(16),
              children: [
                FadeSlideIn(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Hello $name! 👋', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white)),
                      const SizedBox(height: 4),
                      Text('How can I help you today?', style: TextStyle(color: Colors.white.withValues(alpha: 0.55))),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                ..._messages.asMap().entries.map((e) {
                  final m = e.value;
                  final isUser = m['role'] == 'user';
                  return FadeSlideIn(
                    delay: Duration(milliseconds: e.key * 30),
                    child: Align(
                      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(14),
                        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.82),
                        decoration: BoxDecoration(
                          gradient: isUser ? AppTheme.brandGradient : null,
                          color: isUser ? null : AppColors.cardDark,
                          borderRadius: BorderRadius.only(
                            topLeft: const Radius.circular(16),
                            topRight: const Radius.circular(16),
                            bottomLeft: Radius.circular(isUser ? 16 : 4),
                            bottomRight: Radius.circular(isUser ? 4 : 16),
                          ),
                          border: isUser ? null : Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              m['text']?.toString() ?? '',
                              style: TextStyle(color: isUser ? Colors.white : Colors.white70, height: 1.45),
                            ),
                            if (!isUser) ...[
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Icon(Icons.thumb_up_outlined, size: 16, color: Colors.white.withValues(alpha: 0.4)),
                                  const SizedBox(width: 12),
                                  Icon(Icons.thumb_down_outlined, size: 16, color: Colors.white.withValues(alpha: 0.4)),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  );
                }),
                if (_loading)
                  const Padding(
                    padding: EdgeInsets.all(8),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.teal),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _input,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'Ask anything health related…',
                        hintStyle: const TextStyle(color: AppColors.textMuted),
                        filled: true,
                        fillColor: AppColors.cardDark,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(28),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                      ),
                      onSubmitted: (_) => _send(),
                    ),
                  ),
                  const SizedBox(width: 10),
                  GestureDetector(
                    onTap: _send,
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        gradient: AppTheme.brandGradient,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(color: AppColors.teal.withValues(alpha: 0.4), blurRadius: 12),
                        ],
                      ),
                      child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
