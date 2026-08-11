import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ojao_app/core/router/app_router.dart';
import 'package:ojao_app/features/auth/application/auth_controller.dart';
import 'package:ojao_app/features/staff/presentation/screens/staff_analytics_screen.dart';
import 'package:ojao_app/features/staff/presentation/screens/staff_dashboard_screen.dart';
import 'package:ojao_app/features/staff/presentation/screens/staff_queue_screen.dart';

enum StaffTab { dashboard, queue, analytics }

/// Bottom-nav container for the staff console.
class StaffShell extends ConsumerWidget {
  final StaffTab tab;

  const StaffShell({super.key, required this.tab});

  static const _titles = {
    StaffTab.dashboard: 'ojao • Staff',
    StaffTab.queue: 'Live queue',
    StaffTab.analytics: 'Analytics',
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final body = switch (tab) {
      StaffTab.dashboard => const StaffDashboardScreen(),
      StaffTab.queue => const StaffQueueScreen(),
      StaffTab.analytics => const StaffAnalyticsScreen(),
    };

    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[tab]!),
        centerTitle: false,
        actions: [
          IconButton(
            tooltip: 'Sign out',
            icon: const Icon(Icons.logout_rounded),
            onPressed: () async {
              await ref.read(authControllerProvider.notifier).signOut();
            },
          ),
        ],
      ),
      body: SafeArea(child: body),
      bottomNavigationBar: NavigationBar(
        selectedIndex: tab.index,
        onDestinationSelected: (i) {
          switch (StaffTab.values[i]) {
            case StaffTab.dashboard:
              context.go(AppRoutes.staffHome);
            case StaffTab.queue:
              context.go(AppRoutes.staffQueue);
            case StaffTab.analytics:
              context.go(AppRoutes.staffAnalytics);
          }
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard_rounded),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.list_alt_outlined),
            selectedIcon: Icon(Icons.list_alt_rounded),
            label: 'Queue',
          ),
          NavigationDestination(
            icon: Icon(Icons.bar_chart_outlined),
            selectedIcon: Icon(Icons.bar_chart_rounded),
            label: 'Analytics',
          ),
        ],
      ),
    );
  }
}
