import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Slider } from '@/components/ui/slider.jsx';
import { Play, Pause, Square, Volume2, Download, Mic, Settings } from 'lucide-react';
import { apiClient } from '../lib/api';

export function AudioNarration({ story, onAudioGenerated }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([80]);
  const [playbackSpeed, setPlaybackSpeed] = useState([1]);
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [availableVoices, setAvailableVoices] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  
  const audioRef = useRef(null);

  useEffect(() => {
    loadVoices();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
      audioRef.current.playbackRate = playbackSpeed[0];
    }
  }, [volume, playbackSpeed]);

  const loadVoices = async () => {
    try {
      const response = await apiClient.request('/voices');
      setAvailableVoices(response.voices);
    } catch (error) {
      console.error('Error loading voices:', error);
    }
  };

  const generateAudio = async () => {
    setIsGenerating(true);
    try {
      const response = await apiClient.request('/generate-narration', {
        method: 'POST',
        body: {
          story_id: story.id,
          voice_type: selectedVoice,
          speed: playbackSpeed[0]
        }
      });

      if (response.success) {
        onAudioGenerated(response.audio_url);
        // Load the new audio
        if (audioRef.current) {
          audioRef.current.src = response.audio_url;
          audioRef.current.load();
        }
      }
    } catch (error) {
      console.error('Error generating audio:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const stopAudio = () => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (newTime) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime[0];
      setCurrentTime(newTime[0]);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const downloadAudio = () => {
    if (story.audio_url) {
      const link = document.createElement('a');
      link.href = story.audio_url;
      link.download = `${story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_narration.mp3`;
      link.click();
    }
  };

  return (
    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Volume2 className="h-5 w-5 text-green-600" />
            <span>Audio Narration</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Settings Panel */}
        {showSettings && (
          <div className="p-4 bg-white rounded-lg border border-green-200 space-y-4">
            <h4 className="font-medium text-green-800">Narration Settings</h4>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Voice Character
              </label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableVoices.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{voice.name}</span>
                        <span className="text-xs text-gray-500">
                          {voice.description} • {voice.recommended_for}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Playback Speed: {playbackSpeed[0]}x
              </label>
              <Slider
                value={playbackSpeed}
                onValueChange={setPlaybackSpeed}
                min={0.5}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>

            <Button
              onClick={generateAudio}
              disabled={isGenerating}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isGenerating ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Audio...
                </div>
              ) : (
                <div className="flex items-center">
                  <Mic className="h-4 w-4 mr-2" />
                  Generate New Narration
                </div>
              )}
            </Button>
          </div>
        )}

        {/* Audio Player */}
        {story.audio_url && (
          <div className="space-y-4">
            <audio
              ref={audioRef}
              src={story.audio_url}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              preload="metadata"
            />

            {/* Progress Bar */}
            <div className="space-y-2">
              <Slider
                value={[currentTime]}
                onValueChange={handleSeek}
                min={0}
                max={duration || 100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={stopAudio}
                disabled={!isPlaying && currentTime === 0}
              >
                <Square className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={togglePlayPause}
                disabled={!story.audio_url}
                className="bg-green-600 hover:bg-green-700 px-6"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={downloadAudio}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-3">
              <Volume2 className="h-4 w-4 text-gray-500" />
              <Slider
                value={volume}
                onValueChange={setVolume}
                min={0}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-gray-500 w-8">{volume[0]}%</span>
            </div>
          </div>
        )}

        {/* Generate Audio Button (if no audio exists) */}
        {!story.audio_url && (
          <div className="text-center py-6">
            <div className="mb-4">
              <Mic className="h-12 w-12 mx-auto text-green-400 mb-2" />
              <p className="text-gray-600 mb-2">No audio narration yet</p>
              <p className="text-sm text-gray-500">
                Generate a professional voice narration for this story
              </p>
            </div>
            
            <Button
              onClick={generateAudio}
              disabled={isGenerating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isGenerating ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Audio...
                </div>
              ) : (
                <div className="flex items-center">
                  <Mic className="h-4 w-4 mr-2" />
                  Generate Audio Narration
                </div>
              )}
            </Button>
          </div>
        )}

        {/* Audio Tips */}
        <div className="text-xs text-gray-600 bg-green-50 p-3 rounded-lg">
          <p className="font-medium mb-1">Audio Tips:</p>
          <ul className="space-y-1">
            <li>• Use headphones for the best listening experience</li>
            <li>• Adjust playback speed for your child's preference</li>
            <li>• Download audio for offline listening</li>
            <li>• Try different voices to find your child's favorite</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

