import math
import struct
import wave

# Audio parameters: 44.1 kHz, 16-bit mono WAV
sample_rate = 44100
duration = 16.0  # 16-second loop
num_samples = int(sample_rate * duration)

# Soft acoustic guitar & piano chord frequencies (C - G - Am - F)
chords = [
    [130.81, 196.00, 261.63, 329.63], # C Major
    [98.00, 146.83, 196.00, 246.94],  # G Major
    [110.00, 164.81, 220.00, 261.63], # A Minor
    [87.31, 130.81, 174.61, 220.00]   # F Major
]

frames = bytearray()

for i in range(num_samples):
    t = i / sample_rate
    chord_idx = int(t / 4.0) % 4
    chord = chords[chord_idx]
    chord_t = t % 4.0
    
    sample_val = 0.0
    
    # 1. Soft Piano Background Pad (Warm sine waves)
    for freq in chord[:3]:
        # Piano envelope
        piano_env = math.exp(-chord_t * 0.4) * min(chord_t * 2.0, 1.0)
        sample_val += 0.15 * piano_env * math.sin(2 * math.pi * freq * t)
        
    # 2. Soft Acoustic Guitar Pluck (Arpeggiated notes with harmonics)
    for idx, freq in enumerate(chord):
        note_delay = idx * 0.35
        if chord_t >= note_delay:
            note_t = chord_t - note_delay
            guitar_env = math.exp(-note_t * 2.5) * min(note_t * 50.0, 1.0)
            # Fundamental + 2nd harmonic for acoustic timbre
            guitar_wave = math.sin(2 * math.pi * freq * t) + 0.3 * math.sin(4 * math.pi * freq * t)
            sample_val += 0.25 * guitar_env * guitar_wave

    # Clamp audio
    sample_val = max(-0.9, min(0.9, sample_val))
    int_sample = int(sample_val * 32767)
    frames.extend(struct.pack('<h', int_sample))

# Save to local WAV file
wav_path = r'C:\Users\User\.gemini\antigravity\scratch\transform_life_app\acoustic_guitar_piano.wav'
with wave.open(wav_path, 'wb') as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(sample_rate)
    wf.writeframes(frames)

print("SUCCESS: acoustic_guitar_piano.wav generated successfully!")
