"""Audio processing: WAV stitching in Python, loudness and encoding with ffmpeg.

Loudness is measured with ffmpeg's EBU R128 / ITU BS.1770 ``ebur128`` filter and corrected with a
linear gain. ffmpeg ships in the backend image and the CI runner.
"""

import io
import re
import shutil
import subprocess
import tempfile
import wave
from dataclasses import dataclass
from pathlib import Path

SAMPLE_RATE = 24_000
SAMPLE_WIDTH = 2  # 16-bit
CHANNELS = 1


class AudioProcessingError(Exception):
    pass


@dataclass(frozen=True)
class Loudness:
    integrated_lufs: float
    true_peak_dbtp: float  # sample peak in dBFS (true-peak oversampling is skipped for speed)


def ffmpeg_available() -> bool:
    return shutil.which("ffmpeg") is not None


def _run(args: list[str], data: bytes | None = None) -> subprocess.CompletedProcess[bytes]:
    try:
        return subprocess.run(
            ["ffmpeg", "-hide_banner", "-nostats", "-y", *args],
            input=data,
            capture_output=True,
            check=True,
            timeout=600,
        )
    except FileNotFoundError as exc:
        raise AudioProcessingError("ffmpeg is not installed") from exc
    except subprocess.CalledProcessError as exc:
        raise AudioProcessingError(exc.stderr.decode(errors="replace")[-500:]) from exc


def to_standard_pcm(wav_bytes: bytes) -> bytes:
    """Returns raw PCM frames (mono, 16-bit, 24 kHz), converting with ffmpeg when needed."""
    with wave.open(io.BytesIO(wav_bytes)) as wav:
        if (wav.getnchannels(), wav.getsampwidth(), wav.getframerate()) == (
            CHANNELS,
            SAMPLE_WIDTH,
            SAMPLE_RATE,
        ):
            return wav.readframes(wav.getnframes())
    result = _run(
        ["-i", "pipe:0", "-ac", str(CHANNELS), "-ar", str(SAMPLE_RATE), "-f", "s16le", "pipe:1"],
        wav_bytes,
    )
    return result.stdout


def frames_to_wav(frames: bytes) -> bytes:
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav:
        wav.setnchannels(CHANNELS)
        wav.setsampwidth(SAMPLE_WIDTH)
        wav.setframerate(SAMPLE_RATE)
        wav.writeframes(frames)
    return buffer.getvalue()


def duration_ms(frames: bytes) -> int:
    return round(len(frames) / (SAMPLE_WIDTH * CHANNELS) / SAMPLE_RATE * 1000)


def silence(ms: int) -> bytes:
    return b"\x00" * (round(SAMPLE_RATE * ms / 1000) * SAMPLE_WIDTH * CHANNELS)


def stitch(segments: list[tuple[bytes, int]]) -> bytes:
    """Joins ``(pcm_frames, pause_after_ms)`` segments into one WAV."""
    return frames_to_wav(b"".join(frames + silence(pause) for frames, pause in segments))


_INTEGRATED = re.compile(r"Integrated loudness:\s+I:\s+(-?[\d.]+|-inf) LUFS")
_PEAK = re.compile(r"Sample peak:\s+Peak:\s+(-?[\d.]+|-inf) dBFS")


def measure(wav_bytes: bytes) -> Loudness:
    """Integrated loudness (EBU R128 / BS.1770) and sample peak, via ffmpeg's ebur128 filter."""
    result = _run(["-i", "pipe:0", "-af", "ebur128=peak=sample", "-f", "null", "-"], wav_bytes)
    log = result.stderr.decode(errors="replace")
    summary = log[log.rfind("Summary:") :]
    integrated, peak = _INTEGRATED.search(summary), _PEAK.search(summary)
    if not integrated or not peak:
        raise AudioProcessingError("Could not read loudness measurement")

    def value(text: str) -> float:
        return -120.0 if text == "-inf" else float(text)

    return Loudness(value(integrated.group(1)), value(peak.group(1)))


def normalize(
    wav_bytes: bytes, target_lufs: float = -16.0, peak_limit: float = -1.5
) -> tuple[bytes, Loudness]:
    """Linear gain to the loudness target, reduced if it would push peaks above the limit.
    Returns the normalised WAV and its measured loudness."""
    before = measure(wav_bytes)
    gain = target_lufs - before.integrated_lufs
    gain = min(gain, peak_limit - before.true_peak_dbtp)
    result = _run(
        [
            "-i",
            "pipe:0",
            "-af",
            f"volume={gain:.2f}dB",
            "-ar",
            str(SAMPLE_RATE),
            "-ac",
            str(CHANNELS),
            "-c:a",
            "pcm_s16le",
            "-f",
            "wav",
            "pipe:1",
        ],
        wav_bytes,
    )
    return result.stdout, measure(result.stdout)


def encode_mp3(wav_bytes: bytes, bitrate: str = "96k") -> bytes:
    # ffmpeg cannot seek in pipes when writing MP3 headers reliably; use temp files.
    with tempfile.TemporaryDirectory() as tmp:
        src, dst = Path(tmp, "in.wav"), Path(tmp, "out.mp3")
        src.write_bytes(wav_bytes)
        _run(["-i", str(src), "-codec:a", "libmp3lame", "-b:a", bitrate, str(dst)])
        return dst.read_bytes()


def cut(wav_bytes: bytes, seconds: float, fade_seconds: float = 2.0) -> bytes:
    """The first ``seconds`` of a WAV with a fade-out (used for web samples)."""
    frames = to_standard_pcm(wav_bytes)
    keep = frames[: round(seconds * SAMPLE_RATE) * SAMPLE_WIDTH]
    result = _run(
        [
            "-i",
            "pipe:0",
            "-af",
            f"afade=t=out:st={max(0.0, seconds - fade_seconds)}:d={fade_seconds}",
            "-f",
            "wav",
            "pipe:1",
        ],
        frames_to_wav(keep),
    )
    return result.stdout
