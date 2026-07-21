import 'package:flutter_webrtc/flutter_webrtc.dart';

class VideoService {
  MediaStream? _localStream;
  RTCPeerConnection? _peer;

  Future<MediaStream?> getLocalStream() async {
    try {
      _localStream = await navigator.mediaDevices.getUserMedia(<String, dynamic>{
        'audio': true,
        'video': <String, dynamic>{'facingMode': 'user'},
      });
      return _localStream;
    } catch (_) {
      return null;
    }
  }

  Future<void> leaveCall() async {
    await _localStream?.dispose();
    await _peer?.close();
    _localStream = null;
    _peer = null;
  }

  Future<RTCSessionDescription> createOffer() async {
    _peer = await createPeerConnection(<String, dynamic>{
      'iceServers': <Map<String, dynamic>>[
        <String, dynamic>{'urls': 'stun:stun.l.google.com:19302'},
      ],
    });
    final offer = await _peer!.createOffer();
    await _peer!.setLocalDescription(offer);
    return offer;
  }
}
