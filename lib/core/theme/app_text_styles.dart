import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:ojao_app/core/theme/app_colors.dart';

class AppTextStyles {
  const AppTextStyles._();

  static TextStyle display() => GoogleFonts.manrope(
        fontWeight: FontWeight.w800,
        letterSpacing: -0.5,
        color: AppColors.charcoal,
      );

  static TextStyle heading() => GoogleFonts.manrope(
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
        color: AppColors.charcoal,
      );

  static TextStyle body() => GoogleFonts.inter(
        fontWeight: FontWeight.w400,
        color: AppColors.charcoal,
      );

  static TextStyle bodyMedium() => GoogleFonts.inter(
        fontWeight: FontWeight.w500,
        color: AppColors.charcoal,
      );

  static TextStyle bodyBold() => GoogleFonts.inter(
        fontWeight: FontWeight.w700,
        color: AppColors.charcoal,
      );

  static TextStyle caption() => GoogleFonts.inter(
        fontWeight: FontWeight.w500,
        color: AppColors.slateGray,
      );

  static TextStyle mono() => GoogleFonts.jetBrainsMono(
        fontWeight: FontWeight.w500,
        color: AppColors.slateGray,
      );
}
