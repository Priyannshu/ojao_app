import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ojao_app/core/router/app_router.dart';
import 'package:ojao_app/features/patient/presentation/screens/patient_appointments_screen.dart';
import 'package:ojao_app/features/patient/presentation/screens/patient_home_screen.dart';
import 'package:ojao_app/features/patient/presentation/screens/patient_profile_screen.dart';

enum PatientTab { home, appointments, profile }

/// Bottom-nav container for the three top-level patient tabs.
class PatientShell extends ConsumerWidget {
  final PatientTab tab;

  const PatientShell({super.key, required this.tab});

  static const _titles = {
    PatientTab.home: 'ojao',
    PatientTab.appointments: 'Appointments',
    PatientTab.profile: 'Profile',
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final body = switch (tab) {
      PatientTab.home => const PatientHomeScreen(),
      PatientTab.appointments => const PatientAppointmentsScreen(),
      PatientTab.profile => const PatientProfileScreen(),
    };

    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[tab]!),
        centerTitle: false,
      ),
      body: SafeArea(child: body),
      bottomNavigationBar: NavigationBar(
        selectedIndex: tab.index,
        onDestinationSelected: (i) {
          switch (PatientTab.values[i]) {
            case PatientTab.home:
              context.go(AppRoutes.patientHome);
            case PatientTab.appointments:
              context.go(AppRoutes.patientAppointments);
            case PatientTab.profile:
              context.go(AppRoutes.patientProfile);
          }
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.event_outlined),
            selectedIcon: Icon(Icons.event_rounded),
            label: 'Visits',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline_rounded),
            selectedIcon: Icon(Icons.person_rounded),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
