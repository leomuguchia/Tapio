import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import { Colors } from '@/constants/theme';
import { useThemeContext } from '@/constants/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

type Bubble = {
  id: number;
  x: number;
  y: number;
  scale: Animated.Value;
  opacity: Animated.Value;
};

type BreathPhase = 'inhale' | 'exhale';
type SoundPattern = 'breathing' | 'gentle' | 'bell' | 'nature';
type SoundStatus = 'idle' | 'playing' | 'completed';

export default function Index() {
  const { theme, toggleTheme, isDark } = useThemeContext();
  const currentTheme = Colors[theme];

  const [count, setCount] = useState<number>(0);
  const [soundPattern, setSoundPattern] = useState<SoundPattern>('breathing');
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('inhale');
  const [soundStatus, setSoundStatus] = useState<SoundStatus>('idle');
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  
  const scale = useRef(new Animated.Value(1)).current;
  const breathScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [sounds, setSounds] = useState<Record<string, Audio.Sound>>({});
  const [soundDurations, setSoundDurations] = useState<Record<string, number>>({});

  // Load your actual sound files and get their durations
  useEffect(() => {
    const loadSounds = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        // Replace these with your actual local sound files
        const soundConfigs = {
          breatheIn: require('@/assets/audio/breathe-in.mp3'),    // Your 3sec breathe in sound
          breatheOut: require('@/assets/audio/breathe-out.mp3'),  // Your 3sec breathe out sound
          pop: require('@/assets/audio/pop.mp3'),                 // Your 1sec pop sound
          bell: require('@/assets/audio/bell.mp3'),               // Optional alternative
          nature: require('@/assets/audio/bell.mp3')            // Optional alternative
        };

        const loadedSounds: Record<string, Audio.Sound> = {};
        const durations: Record<string, number> = {};

        for (const [soundName, source] of Object.entries(soundConfigs)) {
          try {
            const { sound, status } = await Audio.Sound.createAsync(
              source,
              { shouldPlay: false, volume: 0.4 }
            );
            loadedSounds[soundName] = sound;
            
            // Get duration from status (approximate - Expo doesn't always provide exact duration)
            // Cast to any because AVPlaybackStatus typing may not include durationMillis in all versions.
            durations[soundName] = (status as any)?.durationMillis ?? 3000; // Default to 3 seconds
          } catch (error) {
            console.log(`Error loading ${soundName} sound:`, error);
          }
        }

        setSounds(loadedSounds);
        setSoundDurations(durations);
      } catch (error) {
        console.log('Error setting up audio:', error);
      }
    };

    loadSounds();

    return () => {
      Object.values(sounds).forEach(sound => {
        if (sound) {
          sound.unloadAsync();
        }
      });
    };
  }, []);

  // Pulse animation for when sound is playing
  useEffect(() => {
    if (soundStatus === 'playing') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [soundStatus]);

  // Sound patterns with completion tracking
  const calmSounds = {
    // Breathing pattern - alternate between inhale/exhale
    breathing: async (): Promise<void> => {
      return new Promise(async (resolve) => {
        const soundToPlay = breathPhase === 'inhale' ? 'breatheIn' : 'breatheOut';
        if (sounds[soundToPlay]) {
          setSoundStatus('playing');
          
          // Set up completion listener
          sounds[soundToPlay].setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              setSoundStatus('completed');
              setIsButtonDisabled(false);
              resolve();
            }
          });
          
          await sounds[soundToPlay].replayAsync();
          
          // Estimate duration for button disabling
          const duration = soundDurations[soundToPlay] || 3000;
          setTimeout(() => {
            if (soundStatus === 'playing') {
              setSoundStatus('completed');
              setIsButtonDisabled(false);
            }
          }, duration);
        } else {
          resolve();
        }
      });
    },
    
    // Gentle pop sound
    gentle: async (): Promise<void> => {
      return new Promise(async (resolve) => {
        if (sounds.pop) {
          setSoundStatus('playing');
          
          sounds.pop.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              setSoundStatus('completed');
              setIsButtonDisabled(false);
              resolve();
            }
          });
          
          await sounds.pop.replayAsync();
          
          setTimeout(() => {
            if (soundStatus === 'playing') {
              setSoundStatus('completed');
              setIsButtonDisabled(false);
            }
          }, soundDurations.pop || 1000);
        } else {
          resolve();
        }
      });
    },
    
    // Bell sound alternative
    bell: async (): Promise<void> => {
      return new Promise(async (resolve) => {
        if (sounds.bell) {
          setSoundStatus('playing');
          
          sounds.bell.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              setSoundStatus('completed');
              setIsButtonDisabled(false);
              resolve();
            }
          });
          
          await sounds.bell.replayAsync();
          
          setTimeout(() => {
            if (soundStatus === 'playing') {
              setSoundStatus('completed');
              setIsButtonDisabled(false);
            }
          }, soundDurations.bell || 2000);
        } else {
          resolve();
        }
      });
    },
    
    // Nature sound alternative
    nature: async (): Promise<void> => {
      return new Promise(async (resolve) => {
        if (sounds.nature) {
          setSoundStatus('playing');
          
          sounds.nature.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              setSoundStatus('completed');
              setIsButtonDisabled(false);
              resolve();
            }
          });
          
          await sounds.nature.replayAsync();
          
          setTimeout(() => {
            if (soundStatus === 'playing') {
              setSoundStatus('completed');
              setIsButtonDisabled(false);
            }
          }, soundDurations.nature || 3000);
        } else {
          resolve();
        }
      });
    }
  };

  // Breathing animation - expands on inhale, contracts on exhale
  const playBreathAnimation = () => {
    const targetScale = breathPhase === 'inhale' ? 1.15 : 0.9;
    
    Animated.sequence([
      Animated.timing(breathScale, {
        toValue: targetScale,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(breathScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Gentle button press animation
  const playCalmAnimation = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const createBubble = () => {
    const id = Date.now();
    const bubble: Bubble = {
      id,
      x: Math.random() * (width - 50),
      y: Math.random() * (height - 150),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0.8),
    };
    setBubbles((prev) => [...prev, bubble]);

    Animated.parallel([
      Animated.timing(bubble.scale, {
        toValue: 2.5,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(bubble.opacity, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== id));
    });
  };

  const handleTap = async () => {
    if (isButtonDisabled || soundStatus === 'playing') return;
    
    setIsButtonDisabled(true);
    setSoundStatus('playing');
    
    // Play selected sound pattern and wait for completion
    await calmSounds[soundPattern]();
    
    // Update count and animations only after sound completes
    setCount(prev => prev + 1);
    
    // Play appropriate animation
    if (soundPattern === 'breathing') {
      playBreathAnimation();
      // Toggle breath phase for next tap AFTER sound completes
      setBreathPhase(prev => prev === 'inhale' ? 'exhale' : 'inhale');
    } else {
      playCalmAnimation();
    }
    
    createBubble();
    
    // Brief pause before allowing next tap
    setTimeout(() => {
      setSoundStatus('idle');
    }, 200);
  };

  const cycleSoundPattern = async () => {
    if (soundStatus === 'playing') return;
    
    const patterns: SoundPattern[] = ['breathing', 'gentle', 'bell', 'nature'];
    const currentIndex = patterns.indexOf(soundPattern);
    const nextIndex = (currentIndex + 1) % patterns.length;
    const newPattern = patterns[nextIndex];
    
    setSoundPattern(newPattern);
    
    // Reset to inhale when switching to breathing mode
    if (newPattern === 'breathing') {
      setBreathPhase('inhale');
    }
    
    // Play the new pattern sound when switching (loaded check is enough here)
    if (newPattern === 'gentle' && sounds.pop) {
      await calmSounds.gentle();
    }
  };

  const getPatternDescription = (pattern: SoundPattern) => {
    switch (pattern) {
      case 'breathing': return 'Breathe In/Out';
      case 'gentle': return 'Soft Pop';
      case 'bell': return 'Gentle Bell';
      case 'nature': return 'Nature Sound';
      default: return 'Breathe In/Out';
    }
  };

  const getPatternIcon = (pattern: SoundPattern) => {
    switch (pattern) {
      case 'breathing': return 'git-compare';
      case 'gentle': return 'hand-left';
      case 'bell': return 'notifications';
      case 'nature': return 'leaf';
      default: return 'git-compare';
    }
  };

  const getBreathInstruction = () => {
    if (soundPattern !== 'breathing') return null;
    
    return (
      <View style={styles.breathIndicator}>
        <Ionicons 
          name={breathPhase === 'inhale' ? 'arrow-down' : 'arrow-up'} 
          size={16} 
          color={currentTheme.tint} 
        />
        <Text style={[styles.breathText, { color: currentTheme.tint }]}>
          {soundStatus === 'playing' ? 
            `Breathing ${breathPhase === 'inhale' ? 'In' : 'Out'}...` : 
            `Ready to breathe ${breathPhase === 'inhale' ? 'in' : 'out'}`
          }
        </Text>
        {soundStatus === 'playing' && (
          <Animated.View style={[styles.playingDot, { transform: [{ scale: pulseAnim }] }]} />
        )}
      </View>
    );
  };

  const getButtonText = () => {
    if (soundStatus === 'playing') {
      return soundPattern === 'breathing' ? 
        `Breathing ${breathPhase === 'inhale' ? 'In' : 'Out'}...` : 
        'Playing Sound...';
    }
    
    return soundPattern === 'breathing' ? 
      `Breathe ${breathPhase === 'inhale' ? 'In' : 'Out'}` : 
      'Tap for Sound';
  };

  const calmColors = isDark
    ? ['#4DB6AC', '#81C784', '#64B5F6', '#BA68C8', '#4FC3F7']
    : ['#90CAF9', '#80CBC4', '#CE93D8', '#FFAB91', '#FFF59D'];

  const randomColor = (): string => {
    return calmColors[Math.floor(Math.random() * calmColors.length)];
  };

  const getButtonColor = () => {
    if (soundStatus === 'playing') {
      return '#94a3b8'; // Disabled color
    }
    if (soundPattern === 'breathing') {
      return breathPhase === 'inhale' ? '#4DB6AC' : '#64B5F6';
    }
    return randomColor();
  };

  const getButtonOpacity = () => {
    return isButtonDisabled || soundStatus === 'playing' ? 0.7 : 1;
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      
      {/* Theme Switcher */}
      <TouchableOpacity
        style={[
          styles.themeButton,
          {
            backgroundColor: currentTheme.tint + '20',
            borderColor: currentTheme.tint + '40',
          },
        ]}
        onPress={toggleTheme}
        disabled={soundStatus === 'playing'}
      >
        <Ionicons name={isDark ? 'sunny' : 'moon'} size={24} color={currentTheme.tint} />
      </TouchableOpacity>

      {/* Sound Pattern Switcher */}
      <TouchableOpacity
        style={[
          styles.patternButton,
          {
            backgroundColor: currentTheme.tint + '15',
            borderColor: currentTheme.tint + '30',
            opacity: soundStatus === 'playing' ? 0.6 : 1,
          },
        ]}
        onPress={cycleSoundPattern}
        disabled={soundStatus === 'playing'}
      >
        <Ionicons 
          name={getPatternIcon(soundPattern)} 
          size={20} 
          color={currentTheme.tint} 
        />
        <Text style={[styles.patternText, { color: currentTheme.tint }]}>
          {getPatternDescription(soundPattern)}
        </Text>
        <Ionicons name="volume-medium" size={16} color={currentTheme.tint + '80'} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: currentTheme.tint }]}>BreathTap</Text>
      <Text style={[styles.subtitle, { color: currentTheme.text }]}>
        Sync your taps with your breath
      </Text>

      {/* Breath Instruction */}
      {getBreathInstruction()}

      {/* Sound Status Indicator */}
      <View style={[styles.statusIndicator, { backgroundColor: currentTheme.tint + '10' }]}>
        <Ionicons 
          name={soundStatus === 'playing' ? 'musical-notes' : 'checkmark-circle'} 
          size={16} 
          color={currentTheme.tint} 
        />
        <Text style={[styles.statusText, { color: currentTheme.tint }]}>
          {soundStatus === 'playing' ? 'Sound playing...' : 'Ready for next tap'}
        </Text>
      </View>

      {/* Main Tap Area */}
      <Animated.View style={{ 
        transform: [
          { scale: soundPattern === 'breathing' ? breathScale : scale }
        ],
        opacity: getButtonOpacity(),
      }}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: getButtonColor() }]}
          onPress={handleTap}
          activeOpacity={0.9}
          disabled={isButtonDisabled || soundStatus === 'playing'}
        >
          <Ionicons 
            name={soundPattern === 'breathing' ? 
              (breathPhase === 'inhale' ? 'arrow-down' : 'arrow-up') : 'musical-notes'} 
            size={32} 
            color="white" 
            style={styles.buttonIcon} 
          />
          <Text style={styles.buttonText}>
            {getButtonText()}
          </Text>
          {soundStatus === 'playing' && (
            <View style={styles.loadingDots}>
              <Animated.View style={[styles.dot, { transform: [{ scale: pulseAnim }] }]} />
              <Animated.View style={[styles.dot, { transform: [{ scale: pulseAnim }] }]} />
              <Animated.View style={[styles.dot, { transform: [{ scale: pulseAnim }] }]} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Text style={[styles.counter, { color: currentTheme.text + '80' }]}>
        {count} mindful taps
      </Text>

      <Text style={[styles.instruction, { color: currentTheme.text + '60' }]}>
        {soundPattern === 'breathing' ? 
          'Wait for each breath to complete before next tap' : 
          'Let each sound finish before next tap'}
      </Text>

      {/* Sound Status */}
      <View style={[styles.soundStatus, { backgroundColor: currentTheme.tint + '10' }]}>
        <Ionicons name="volume-medium" size={16} color={currentTheme.tint} />
        <Text style={[styles.soundStatusText, { color: currentTheme.tint }]}>
          {sounds.breatheIn && sounds.breatheOut ? 'Breath sounds ready' : 'Loading sounds...'}
        </Text>
      </View>

      {/* Gentle Bubbles */}
      {bubbles.map((bubble) => (
        <Animated.View
          key={bubble.id}
          style={[
            styles.bubble,
            {
              left: bubble.x,
              top: bubble.y,
              transform: [{ scale: bubble.scale }],
              opacity: bubble.opacity,
              backgroundColor: randomColor(),
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  themeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  patternButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  patternText: {
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    fontSize: 36,
    fontWeight: '300',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    opacity: 0.7,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  breathIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(77, 182, 172, 0.1)',
    gap: 8,
  },
  breathText: {
    fontSize: 14,
    fontWeight: '500',
  },
  playingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4DB6AC',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  button: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  buttonIcon: {
    marginBottom: 8,
    opacity: 0.9,
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    opacity: 0.7,
  },
  counter: {
    marginTop: 30,
    fontSize: 24,
    fontWeight: '400',
  },
  instruction: {
    marginTop: 12,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
  },
  soundStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  soundStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bubble: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});