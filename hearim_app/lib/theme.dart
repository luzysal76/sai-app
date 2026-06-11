import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// ── 헤아림 브랜드 컬러 ──────────────────────────────────────
const kPink = Color(0xFFFF6B9D);
const kPurple = Color(0xFF6B4EAA);
const kPurpleSoft = Color(0xFFEDE8F7);
const kPurpleDeep = Color(0xFF4A3080);
const kBg = Color(0xFFF8F4FF);
const kCard = Color(0xFFFFFFFF);
const kText = Color(0xFF2D1B69);
const kTextSub = Color(0xFF7B6EA6);
const kDivider = Color(0xFFEDE8F7);

// ── 그라데이션 ──────────────────────────────────────────────
const kGradient = LinearGradient(
  colors: [kPink, kPurple],
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
);

const kGradientCard = LinearGradient(
  colors: [Color(0xFFFF8FB0), Color(0xFF8B6ECC)],
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
);

// ── ThemeData ───────────────────────────────────────────────
ThemeData buildTheme() {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: kPurple,
      primary: kPurple,
      secondary: kPink,
      surface: kCard,
      surfaceContainerHighest: kBg,
    ),
    scaffoldBackgroundColor: kBg,
    cardColor: kCard,
    dividerColor: kDivider,
  );
  return base.copyWith(
    textTheme: GoogleFonts.notoSansKrTextTheme(base.textTheme).copyWith(
      headlineLarge: GoogleFonts.notoSansKr(
        fontSize: 24, fontWeight: FontWeight.w700, color: kText,
      ),
      headlineMedium: GoogleFonts.notoSansKr(
        fontSize: 20, fontWeight: FontWeight.w700, color: kText,
      ),
      titleLarge: GoogleFonts.notoSansKr(
        fontSize: 17, fontWeight: FontWeight.w600, color: kText,
      ),
      titleMedium: GoogleFonts.notoSansKr(
        fontSize: 15, fontWeight: FontWeight.w600, color: kText,
      ),
      bodyLarge: GoogleFonts.notoSansKr(
        fontSize: 15, color: kText,
      ),
      bodyMedium: GoogleFonts.notoSansKr(
        fontSize: 13, color: kTextSub,
      ),
      labelSmall: GoogleFonts.notoSansKr(
        fontSize: 11, color: kTextSub,
      ),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: kCard,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: GoogleFonts.notoSansKr(
        fontSize: 17, fontWeight: FontWeight.w600, color: kText,
      ),
      iconTheme: const IconThemeData(color: kPurple),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: kPurple,
        foregroundColor: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        textStyle: GoogleFonts.notoSansKr(
          fontSize: 15, fontWeight: FontWeight.w600,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: kPurpleSoft,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: kPurple, width: 1.5),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      hintStyle: GoogleFonts.notoSansKr(color: kTextSub, fontSize: 14),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: kCard,
      selectedItemColor: kPurple,
      unselectedItemColor: kTextSub,
      type: BottomNavigationBarType.fixed,
      elevation: 8,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: kPurpleSoft,
      labelStyle: GoogleFonts.notoSansKr(fontSize: 12, color: kPurple),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ),
  );
}

// ── 편의 확장 ────────────────────────────────────────────────
extension ContextExt on BuildContext {
  ThemeData get theme => Theme.of(this);
  TextTheme get tt => Theme.of(this).textTheme;
  double get width => MediaQuery.of(this).size.width;
}
