import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:go_router/go_router.dart';
import 'package:ojao_app/core/theme/app_colors.dart';
import 'package:ojao_app/core/theme/app_text_styles.dart';
import 'package:ojao_app/data/services/video_service.dart';

final _videoServiceProvider = Provider.autoDispose<VideoService>((ref) {
  final service = VideoService();
  ref.onDispose(service.leaveCall);
  return service;
});

class VideoConsultScreen extends ConsumerStatefulWidget {
  final String appointmentId;

  const VideoConsultScreen({super.key, required this.appointmentId});

  @override
  ConsumerState<VideoConsultScreen> createState() => _VideoConsultScreenState();
}

class _VideoConsultScreenState extends ConsumerState<VideoConsultScreen> {
  final _localRenderer = RTCVideoRenderer();
  bool _initializing = true;
  bool _micOn = true;
  bool _camOn = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _start();
  }

  Future<void> _start() async {
    try {
      await _localRenderer.initialize();
      final stream = await ref.read(_videoServiceProvider).getLocalStream();
      if (stream == null) {
        setState(() {
          _error = 'Camera/microphone permission is required for the consult.';
          _initializing = false;
        });
        return;
      }
      _localRenderer.srcObject = stream;
      setState(() => _initializing = false);
    } catch (e) {
      setState(() {
        _error = e.toString();
        _initializing = false;
      });
    }
  }

  void _toggleMic() {
    final tracks = _localRenderer.srcObject?.getAudioTracks() ?? [];
    for (final t in tracks) {
      t.enabled = !_micOn;
    }
    setState(() => _micOn = !_micOn);
  }

  void _toggleCam() {
    final tracks = _localRenderer.srcObject?.getVideoTracks() ?? [];
    for (final t in tracks) {
      t.enabled = !_camOn;
    }
    setState(() => _camOn = !_camOn);
  }

  Future<void> _end() async {
    await ref.read(_videoServiceProvider).leaveCall();
    if (mounted) context.pop();
  }

  @override
  void dispose() {
    _localRenderer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.charcoal,
      body: SafeArea(
        child: Stack(
          children: [
            Positioned.fill(
              child: _initializing
                  ? const Center(
                      child: CircularProgressIndicator(color: Colors.white))
                  : _error != null
                      ? _ErrorView(message: _error!)
                      : RTCVideoView(
                          _localRenderer,
                          mirror: true,
                          objectFit: RTCVideoViewObjectFit
                              .RTCVideoViewObjectFitCover,
                        ),
            ),
            Positioned(
              top: 12,
              left: 16,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.circle, color: AppColors.success, size: 10),
                    const SizedBox(width: 6),
                    Text('Consult • waiting for doctor',
                        style: AppTextStyles.caption()
                            .copyWith(color: Colors.white)),
                  ],
                ),
              ),
            ),
            Align(
              alignment: Alignment.bottomCenter,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 32),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _controlButton(
                      icon: _micOn ? Icons.mic_rounded : Icons.mic_off_rounded,
                      onTap: _toggleMic,
                    ),
                    const SizedBox(width: 20),
                    _controlButton(
                      icon: Icons.call_end_rounded,
                      background: AppColors.danger,
                      onTap: _end,
                    ),
                    const SizedBox(width: 20),
                    _controlButton(
                      icon: _camOn
                          ? Icons.videocam_rounded
                          : Icons.videocam_off_rounded,
                      onTap: _toggleCam,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _controlButton({
    required IconData icon,
    required VoidCallback onTap,
    Color background = Colors.white24,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 60,
        height: 60,
        decoration: BoxDecoration(color: background, shape: BoxShape.circle),
        child: Icon(icon, color: Colors.white, size: 26),
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  final String message;

  const _ErrorView({required this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.videocam_off_rounded,
                color: Colors.white54, size: 48),
            const SizedBox(height: 16),
            Text(message,
                textAlign: TextAlign.center,
                style: AppTextStyles.body().copyWith(color: Colors.white70)),
          ],
        ),
      ),
    );
  }
}
