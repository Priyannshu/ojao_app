import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ojao_app/core/router/app_router.dart';
import 'package:ojao_app/core/theme/app_colors.dart';
import 'package:ojao_app/core/theme/app_text_styles.dart';
import 'package:ojao_app/core/utils/formatters.dart';
import 'package:ojao_app/features/patient/application/patient_actions_controller.dart';
import 'package:ojao_app/features/patient/application/patient_providers.dart';
import 'package:ojao_app/shared/widgets/primary_button.dart';

class BookAppointmentScreen extends ConsumerStatefulWidget {
  final String departmentId;

  const BookAppointmentScreen({super.key, required this.departmentId});

  @override
  ConsumerState<BookAppointmentScreen> createState() =>
      _BookAppointmentScreenState();
}

class _BookAppointmentScreenState
    extends ConsumerState<BookAppointmentScreen> {
  final _notesCtrl = TextEditingController();
  DateTime? _slot;
  String? _doctorName;

  // In a fuller build these come from a doctors collection; for booking we
  // offer the department's on-duty doctors as simple named options.
  static const _doctorOptions = ['Dr. A. Sharma', 'Dr. R. Iyer', 'Next available'];

  @override
  void dispose() {
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickSlot() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      firstDate: now,
      lastDate: now.add(const Duration(days: 30)),
      initialDate: now,
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(now.add(const Duration(hours: 1))),
    );
    if (time == null) return;
    setState(() {
      _slot = DateTime(date.year, date.month, date.day, time.hour, time.minute);
    });
  }

  @override
  Widget build(BuildContext context) {
    final dept = ref.watch(departmentByIdProvider(widget.departmentId));
    final action = ref.watch(patientActionsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Book appointment')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          children: [
            if (dept != null) ...[
              Text(dept.name,
                  style: AppTextStyles.heading().copyWith(fontSize: 20)),
              Text(dept.description, style: AppTextStyles.caption()),
              const SizedBox(height: 24),
            ],
            Text('Choose a doctor', style: AppTextStyles.bodyBold()),
            const SizedBox(height: 8),
            RadioGroup<String>(
              groupValue: _doctorName,
              onChanged: (v) => setState(() => _doctorName = v),
              child: Column(
                children: [
                  for (final name in _doctorOptions)
                    RadioListTile<String>(
                      value: name,
                      title: Text(name),
                      contentPadding: EdgeInsets.zero,
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Text('Preferred time', style: AppTextStyles.bodyBold()),
            const SizedBox(height: 8),
            InkWell(
              onTap: _pickSlot,
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.lightBlueGray),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.calendar_month_rounded,
                        color: AppColors.medicalBlue),
                    const SizedBox(width: 12),
                    Text(
                      _slot == null
                          ? 'Select date & time'
                          : AppFormatters.dateTimeFmt.format(_slot!),
                      style: AppTextStyles.bodyMedium(),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text('Notes (optional)', style: AppTextStyles.bodyBold()),
            const SizedBox(height: 8),
            TextField(
              controller: _notesCtrl,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Reason for visit, symptoms, etc.',
              ),
            ),
            const SizedBox(height: 24),
            if (action.hasError) ...[
              Text(
                action.error.toString().replaceFirst('Exception: ', ''),
                style: const TextStyle(color: AppColors.danger),
              ),
              const SizedBox(height: 12),
            ],
            PrimaryButton(
              label: 'Confirm booking',
              isLoading: action.isLoading,
              onPressed: (_doctorName == null || _slot == null || dept == null)
                  ? null
                  : () async {
                      final appt = await ref
                          .read(patientActionsProvider.notifier)
                          .bookAppointment(
                            doctorId: _doctorName!
                                .toLowerCase()
                                .replaceAll(RegExp(r'[^a-z]'), ''),
                            doctorName: _doctorName!,
                            department: dept.name,
                            scheduledAt: _slot!,
                            notes: _notesCtrl.text.trim().isEmpty
                                ? null
                                : _notesCtrl.text.trim(),
                          );
                      if (appt != null && context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Appointment booked.')),
                        );
                        context.go(AppRoutes.patientAppointments);
                      }
                    },
            ),
          ],
        ),
      ),
    );
  }
}
