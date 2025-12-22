#!/usr/bin/env python3
"""
Audio Tour Generator
Generates MP3 audio files from tour.json scripts using Edge TTS (free, unlimited).

Usage:
    python generate_audio.py path/to/tour-folder
    python generate_audio.py path/to/tour-folder --voice en-GB-RyanNeural
    python generate_audio.py path/to/tour-folder --list-voices
    
Requirements:
    pip install edge-tts

Available voices (examples):
    en-GB-RyanNeural      - British male (warm, recommended)
    en-GB-SoniaNeural     - British female
    en-US-GuyNeural       - American male
    en-US-JennyNeural     - American female
    en-AU-WilliamNeural   - Australian male
    en-AU-NatashaNeural   - Australian female
"""

import asyncio
import json
import os
import sys
import argparse
from pathlib import Path

try:
    import edge_tts
except ImportError:
    print("Error: edge-tts not installed.")
    print("Install with: pip install edge-tts")
    sys.exit(1)


async def list_voices():
    """List all available voices."""
    voices = await edge_tts.list_voices()
    
    # Group by language
    by_language = {}
    for voice in voices:
        lang = voice['Locale'][:2]
        if lang not in by_language:
            by_language[lang] = []
        by_language[lang].append(voice)
    
    print("\nAvailable English voices:\n")
    for voice in voices:
        if voice['Locale'].startswith('en'):
            gender = voice['Gender']
            name = voice['ShortName']
            locale = voice['Locale']
            print(f"  {name:<30} {locale:<10} {gender}")
    
    print("\nRecommended voices:")
    print("  en-GB-RyanNeural     - Warm British male (best for tours)")
    print("  en-GB-SoniaNeural    - Clear British female")
    print("  en-US-GuyNeural      - Friendly American male")
    print("  en-AU-WilliamNeural  - Relaxed Australian male")


async def generate_audio(text: str, output_path: str, voice: str = "en-GB-RyanNeural"):
    """Generate audio file from text using Edge TTS."""
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)


async def process_tour(tour_folder: str, voice: str = "en-GB-RyanNeural", overwrite: bool = False):
    """Process a tour folder and generate audio for all stops."""
    tour_path = Path(tour_folder)
    tour_json_path = tour_path / "tour.json"
    
    if not tour_json_path.exists():
        print(f"Error: tour.json not found in {tour_folder}")
        return False
    
    # Load tour data
    with open(tour_json_path, 'r', encoding='utf-8') as f:
        tour = json.load(f)
    
    print(f"\nProcessing tour: {tour['name']}")
    print(f"Voice: {voice}")
    print(f"Stops: {len(tour['stops'])}\n")
    
    # Create audio directory
    audio_dir = tour_path / "audio"
    audio_dir.mkdir(exist_ok=True)
    
    # Process each stop
    for stop in tour['stops']:
        stop_id = stop['id']
        stop_name = stop['name']
        script = stop['script']
        audio_file = stop.get('audioFile', f"audio/{stop_id:02d}-stop.mp3")
        
        # Normalize audio file path
        if audio_file.startswith('audio/'):
            output_path = tour_path / audio_file
        else:
            output_path = tour_path / "audio" / audio_file
        
        # Check if file exists
        if output_path.exists() and not overwrite:
            print(f"  [{stop_id}] {stop_name} - Skipping (exists)")
            continue
        
        print(f"  [{stop_id}] {stop_name} - Generating...", end="", flush=True)
        
        try:
            await generate_audio(script, str(output_path), voice)
            
            # Get file size
            size_kb = output_path.stat().st_size / 1024
            print(f" Done ({size_kb:.1f} KB)")
            
        except Exception as e:
            print(f" Error: {e}")
            return False
    
    print(f"\n✓ Audio generation complete!")
    print(f"  Output: {audio_dir}")
    return True


def update_tour_durations(tour_folder: str):
    """Update tour.json with actual audio durations (requires mutagen)."""
    try:
        from mutagen.mp3 import MP3
    except ImportError:
        print("\nNote: Install mutagen to auto-update audio durations:")
        print("  pip install mutagen")
        return
    
    tour_path = Path(tour_folder)
    tour_json_path = tour_path / "tour.json"
    
    with open(tour_json_path, 'r', encoding='utf-8') as f:
        tour = json.load(f)
    
    updated = False
    for stop in tour['stops']:
        audio_file = stop.get('audioFile', f"audio/{stop['id']:02d}-stop.mp3")
        
        if audio_file.startswith('audio/'):
            audio_path = tour_path / audio_file
        else:
            audio_path = tour_path / "audio" / audio_file
        
        if audio_path.exists():
            try:
                audio = MP3(str(audio_path))
                duration = int(audio.info.length)
                if stop.get('audioDuration') != duration:
                    stop['audioDuration'] = duration
                    updated = True
            except Exception as e:
                print(f"  Warning: Could not read duration for {audio_file}: {e}")
    
    if updated:
        with open(tour_json_path, 'w', encoding='utf-8') as f:
            json.dump(tour, f, indent=2, ensure_ascii=False)
        print("\n✓ Updated audio durations in tour.json")


def main():
    parser = argparse.ArgumentParser(
        description="Generate audio files for walking tours using Edge TTS"
    )
    parser.add_argument(
        "tour_folder",
        nargs="?",
        help="Path to tour folder containing tour.json"
    )
    parser.add_argument(
        "--voice", "-v",
        default="en-GB-RyanNeural",
        help="Voice to use (default: en-GB-RyanNeural)"
    )
    parser.add_argument(
        "--overwrite", "-o",
        action="store_true",
        help="Overwrite existing audio files"
    )
    parser.add_argument(
        "--list-voices", "-l",
        action="store_true",
        help="List available voices"
    )
    parser.add_argument(
        "--update-durations", "-u",
        action="store_true",
        help="Update tour.json with actual audio durations"
    )
    
    args = parser.parse_args()
    
    if args.list_voices:
        asyncio.run(list_voices())
        return
    
    if not args.tour_folder:
        parser.print_help()
        print("\nExample:")
        print("  python generate_audio.py ./tours/my-city-tour")
        return
    
    # Generate audio
    success = asyncio.run(process_tour(
        args.tour_folder,
        voice=args.voice,
        overwrite=args.overwrite
    ))
    
    # Optionally update durations
    if success and args.update_durations:
        update_tour_durations(args.tour_folder)


if __name__ == "__main__":
    main()
