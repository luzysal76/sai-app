import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'theme.dart';
import 'providers/app_provider.dart';
import 'screens/home_screen.dart';
import 'screens/relmap_screen.dart';
import 'screens/tools_screen.dart';
import 'screens/diary_screen.dart';
import 'screens/tools/translator_screen.dart';
import 'screens/tools/kakao_screen.dart';
import 'screens/tools/diagnosis_screen.dart';
import 'screens/tools/readcheck_screen.dart';
import 'screens/tools/reply_screen.dart';
import 'screens/tools/coach_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    ChangeNotifierProvider(
      create: (_) => AppProvider()..init(),
      child: const HearimApp(),
    ),
  );
}

class HearimApp extends StatelessWidget {
  const HearimApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '헤아림',
      theme: buildTheme(),
      debugShowCheckedModeBanner: false,
      home: const MainShell(),
      routes: {
        '/translator': (_) => const TranslatorScreen(),
        '/kakao': (_) => const KakaoScreen(),
        '/diagnosis': (_) => const DiagnosisScreen(),
        '/readcheck': (_) => const ReadCheckScreen(),
        '/reply': (_) => const ReplyScreen(),
        '/coach': (_) => const CoachScreen(),
        '/aidiag': (_) => const AiDiagPlaceholder(),
        '/capture': (_) => const CapturePlaceholder(),
      },
    );
  }
}

// ── 메인 셸 (바텀 탭 네비게이션) ─────────────────────────────
class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  static const _screens = [
    HomeScreen(),
    RelMapScreen(),
    ToolsScreen(),
    DiaryScreen(),
  ];

  static const _navItems = [
    BottomNavigationBarItem(
      icon: Icon(Icons.home_outlined),
      activeIcon: Icon(Icons.home),
      label: '홈',
    ),
    BottomNavigationBarItem(
      icon: Icon(Icons.hub_outlined),
      activeIcon: Icon(Icons.hub),
      label: '관계지도',
    ),
    BottomNavigationBarItem(
      icon: Icon(Icons.apps_outlined),
      activeIcon: Icon(Icons.apps),
      label: '도구',
    ),
    BottomNavigationBarItem(
      icon: Icon(Icons.book_outlined),
      activeIcon: Icon(Icons.book),
      label: '일기',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 16,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (i) => setState(() => _currentIndex = i),
          items: _navItems,
          selectedItemColor: kPurple,
          unselectedItemColor: kTextSub,
          backgroundColor: kCard,
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          selectedFontSize: 11,
          unselectedFontSize: 11,
        ),
      ),
    );
  }
}

// ── 임시 플레이스홀더 화면들 ─────────────────────────────────
class AiDiagPlaceholder extends StatelessWidget {
  const AiDiagPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('AI 관계 진단')),
      body: const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('🤖', style: TextStyle(fontSize: 64)),
            SizedBox(height: 16),
            Text('AI 관계 진단',
                style: TextStyle(
                    fontSize: 18, fontWeight: FontWeight.w600)),
            SizedBox(height: 8),
            Text(
              '4가지 지표 심층 분석\n친밀도·신뢰도·감정안정성·소통만족도',
              style: TextStyle(fontSize: 13, color: kTextSub),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 12),
            Text('곧 업데이트 예정이에요 🚧',
                style: TextStyle(fontSize: 12, color: kTextSub)),
          ],
        ),
      ),
    );
  }
}

class CapturePlaceholder extends StatelessWidget {
  const CapturePlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('대화 캡처 분석')),
      body: const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('📸', style: TextStyle(fontSize: 64)),
            SizedBox(height: 16),
            Text('대화 캡처 분석',
                style: TextStyle(
                    fontSize: 18, fontWeight: FontWeight.w600)),
            SizedBox(height: 8),
            Text(
              '이미지 업로드 → 감정분포 + 위험신호 분석',
              style: TextStyle(fontSize: 13, color: kTextSub),
            ),
            SizedBox(height: 12),
            Text('OCR 연동 후 업데이트 예정 🚧',
                style: TextStyle(fontSize: 12, color: kTextSub)),
          ],
        ),
      ),
    );
  }
}
