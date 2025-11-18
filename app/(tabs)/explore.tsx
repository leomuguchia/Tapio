import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Colors } from '@/constants/theme';
import { useThemeContext } from '@/constants/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type Exercise = {
  id: number;
  title: string;
  description: string;
  icon: IoniconsName;
  duration: number; // seconds
  category: string;
};

const exercises: Exercise[] = [
  { id: 1, title: 'Deep Breathing', description: 'Inhale slowly for 4 seconds, hold for 2, exhale for 6. Repeat.', icon: 'water', duration: 120, category: 'Breathing' },
  { id: 2, title: 'Calm Tap', description: 'Tap the button rhythmically to release tension.', icon: 'hand-left', duration: 60, category: 'Physical' },
  { id: 3, title: 'Mindful Meditation', description: 'Close your eyes and focus on your breath.', icon: 'leaf', duration: 180, category: 'Meditation' },
  { id: 4, title: 'Body Scan', description: 'Scan your body slowly, noticing sensations.', icon: 'body', duration: 240, category: 'Awareness' },
  { id: 5, title: 'Box Breathing', description: 'Inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat 4 times.', icon: 'square-outline', duration: 150, category: 'Breathing' },
  { id: 6, title: 'Progressive Muscle Relaxation', description: 'Tense and release each muscle group, from toes to head.', icon: 'fitness', duration: 300, category: 'Physical' },
  { id: 7, title: 'Visualization', description: 'Imagine a peaceful place and immerse yourself in it for 3 minutes.', icon: 'eye', duration: 180, category: 'Meditation' },
  { id: 8, title: 'Mindful Walking', description: 'Walk slowly, focusing on each step and your surroundings.', icon: 'walk', duration: 180, category: 'Awareness' },
  { id: 9, title: 'Alternate Nostril Breathing', description: 'Close one nostril and breathe through the other, alternating sides.', icon: 'swap-horizontal', duration: 120, category: 'Breathing' },
  { id: 10, title: 'Gratitude Reflection', description: 'Think of three things you are grateful for, silently reflecting.', icon: 'heart', duration: 180, category: 'Meditation' },
];

// Audio file configuration
const BACKGROUND_AUDIO = require('@/assets/audio/audio.mp3');

export default function Explore() {
  const { theme } = useThemeContext();
  const currentTheme = Colors[theme];

  const [expanded, setExpanded] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<number[]>([1, 3]);
  const [timers, setTimers] = useState<Record<number, number>>({});
  const [activeExercise, setActiveExercise] = useState<number | null>(null);
  const [sound, setSound] = useState<Audio.Sound>();
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);

  // Load audio on component mount
  useEffect(() => {
    let isMounted = true;

    const loadAudio = async () => {
      try {
        // Request audio permissions
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        // Load the sound
        const { sound } = await Audio.Sound.createAsync(
          BACKGROUND_AUDIO,
          {
            shouldPlay: false,
            isLooping: true, // Enable looping
            volume: 0.6, // Comfortable volume level
          }
        );

        if (isMounted) {
          setSound(sound);
          setIsAudioLoaded(true);
        }
      } catch (error) {
        console.log('Error loading audio:', error);
        if (isMounted) {
          setIsAudioLoaded(false);
        }
      }
    };

    loadAudio();

    return () => {
      isMounted = false;
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // Timer effect with audio management
  useEffect(() => {
    if (activeExercise !== null && timers[activeExercise] > 0) {
      const interval = setInterval(() => {
        setTimers(prev => ({
          ...prev,
          [activeExercise]: prev[activeExercise] - 1,
        }));
      }, 1000);
      return () => clearInterval(interval);
    } else if (activeExercise !== null && timers[activeExercise] === 0) {
      // Exercise completed - stop audio
      stopAudio();
      setActiveExercise(null);
      Alert.alert('Exercise Complete', 'Great job! You completed your practice.');
    }
  }, [activeExercise, timers]);

  // Audio control functions
  const playAudio = async () => {
    if (sound && isAudioLoaded) {
      try {
        await sound.playAsync();
      } catch (error) {
        console.log('Error playing audio:', error);
      }
    }
  };

  const stopAudio = async () => {
    if (sound && isAudioLoaded) {
      try {
        await sound.stopAsync();
        await sound.setPositionAsync(0); // Reset to beginning
      } catch (error) {
        console.log('Error stopping audio:', error);
      }
    }
  };

  const pauseAudio = async () => {
    if (sound && isAudioLoaded) {
      try {
        await sound.pauseAsync();
      } catch (error) {
        console.log('Error pausing audio:', error);
      }
    }
  };

  const toggleExpand = (id: number) => setExpanded(expanded === id ? null : id);
  
  const toggleFavorite = (id: number) => setFavorites(prev => 
    prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
  );

  const toggleExercise = async (exercise: Exercise) => {
    if (activeExercise === exercise.id) {
      // Stop exercise and audio
      await stopAudio();
      setActiveExercise(null);
    } else {
      // Start exercise
      setTimers(prev => ({ 
        ...prev, 
        [exercise.id]: prev[exercise.id] || exercise.duration 
      }));
      setActiveExercise(exercise.id);
      
      // Start audio for exercises longer than 30 seconds
      if (exercise.duration > 30) {
        await playAudio();
      }
    }
  };

  const formatTime = (sec: number) => {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const getExerciseStatus = (exerciseId: number) => {
    if (activeExercise === exerciseId) {
      return 'active';
    } else if (timers[exerciseId] && timers[exerciseId] < exercises.find(e => e.id === exerciseId)?.duration!) {
      return 'paused';
    }
    return 'idle';
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: currentTheme.tint }]}>Calm Exercises</Text>
            <Text style={[styles.subtitle, { color: currentTheme.text }]}>
              {activeExercise ? 'Session in progress...' : 'Quick techniques for anxiety relief'}
            </Text>
          </View>
          <TouchableOpacity style={[styles.statsButton, { backgroundColor: currentTheme.tint + '15' }]}>
            <Ionicons name="stats-chart" size={20} color={currentTheme.tint} />
          </TouchableOpacity>
        </View>

        {/* Active Exercise Banner */}
        {activeExercise && (
          <View style={[styles.activeBanner, { backgroundColor: currentTheme.tint + '20', borderColor: currentTheme.tint }]}>
            <Ionicons name="musical-notes" size={20} color={currentTheme.tint} />
            <Text style={[styles.activeBannerText, { color: currentTheme.tint }]}>
              Background audio playing • {formatTime(timers[activeExercise])} remaining
            </Text>
          </View>
        )}

        <View style={[styles.featuredCard, { backgroundColor: currentTheme.tint}]}>
          <View style={styles.featuredContent}>
            <Text style={styles.featuredTitle}>Daily Calm</Text>
            <Text style={styles.featuredText}>5-minute guided session with calming audio</Text>
            <TouchableOpacity 
              style={styles.featuredButton}
              onPress={() => {
                const exercise = exercises[0];
                toggleExpand(exercise.id);
                toggleExercise(exercise);
              }}
            >
              <Text style={styles.featuredButtonText}>
                {activeExercise === 1 ? 'Stop Session' : 'Start Now'}
              </Text>
            </TouchableOpacity>
          </View>
          <Ionicons name="sparkles" size={60} color="white" style={styles.featuredIcon} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
            Quick Exercises {isAudioLoaded ? '🎵' : ''}
          </Text>
          
          {exercises.map(exercise => {
            const status = getExerciseStatus(exercise.id);
            const isActive = status === 'active';
            
            return (
              <View key={exercise.id} style={[
                styles.card,
                {
                  backgroundColor: currentTheme.background,
                  borderColor: isActive ? currentTheme.tint : (expanded === exercise.id ? currentTheme.tint : 'transparent'),
                  borderWidth: isActive ? 2 : (expanded === exercise.id ? 1 : 0),
                }
              ]}>
                <TouchableOpacity onPress={() => toggleExpand(exercise.id)} activeOpacity={0.8}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardMain}>
                      <View style={[
                        styles.iconContainer, 
                        { 
                          backgroundColor: isActive ? currentTheme.tint : currentTheme.tint + '20',
                        }
                      ]}>
                        <Ionicons 
                          name={exercise.icon} 
                          size={20} 
                          color={isActive ? 'white' : currentTheme.tint} 
                        />
                        {isActive && (
                          <View style={styles.audioIndicator}>
                            <Ionicons name="musical-note" size={8} color="white" />
                          </View>
                        )}
                      </View>
                      <View style={styles.cardTextContent}>
                        <Text style={[
                          styles.cardTitle, 
                          { color: isActive ? currentTheme.tint : currentTheme.tint }
                        ]}>
                          {exercise.title}
                        </Text>
                        <View style={styles.metaInfo}>
                          <Text style={[styles.duration, { color: currentTheme.text + '80' }]}>
                            {timers[exercise.id] ? formatTime(timers[exercise.id]) : `${Math.ceil(exercise.duration / 60)} min`}
                            {isActive && ' • Audio'}
                          </Text>
                          <Text style={[styles.category, { color: currentTheme.text + '60' }]}>
                            • {exercise.category}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.cardActions}>
                      <TouchableOpacity onPress={(e) => { e.stopPropagation(); toggleFavorite(exercise.id); }} style={styles.favoriteButton}>
                        <Ionicons 
                          name={favorites.includes(exercise.id) ? 'heart' : 'heart-outline'} 
                          size={20} 
                          color={favorites.includes(exercise.id) ? '#FF6B6B' : currentTheme.text + '60'} 
                        />
                      </TouchableOpacity>
                      <Ionicons 
                        name={expanded === exercise.id ? 'chevron-up' : 'chevron-down'} 
                        size={20} 
                        color={currentTheme.text + '60'} 
                      />
                    </View>
                  </View>
                </TouchableOpacity>

                {expanded === exercise.id && (
                  <View style={styles.expandedContent}>
                    <Text style={[styles.cardText, { color: currentTheme.text }]}>
                      {exercise.description}
                      {exercise.duration > 30 && (
                        <Text style={{ fontStyle: 'italic' }}>
                          {'\n\n'}Includes calming background audio
                        </Text>
                      )}
                    </Text>
                    <TouchableOpacity 
                      style={[
                        styles.startButton, 
                        { 
                          backgroundColor: isActive ? '#FF6B6B' : currentTheme.tint,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                        }
                      ]} 
                      onPress={() => toggleExercise(exercise)}
                    >
                      <Ionicons 
                        name={isActive ? 'stop' : (timers[exercise.id] ? 'play' : 'play')} 
                        size={16} 
                        color="white" 
                      />
                      <Text style={styles.startButtonText}>
                        {isActive ? 'Stop Exercise' : (timers[exercise.id] ? 'Resume' : 'Start Exercise')}
                      </Text>
                      {exercise.duration > 30 && !isActive && (
                        <Ionicons name="musical-notes" size={14} color="white" />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingVertical: 20 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 16, opacity: 0.7 },
  statsButton: { padding: 12, borderRadius: 12 },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  activeBannerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  featuredCard: { 
    borderRadius: 20, 
    padding: 24, 
    marginBottom: 32, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  featuredContent: { flex: 1 },
  featuredTitle: { fontSize: 24, fontWeight: '700', color: 'white', marginBottom: 4 },
  featuredText: { fontSize: 16, color: 'white', opacity: 0.9, marginBottom: 16 },
  featuredButton: { backgroundColor: 'white', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, alignSelf: 'flex-start' },
  featuredButtonText: { fontWeight: '600', fontSize: 14 },
  featuredIcon: { opacity: 0.8 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  card: { 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 12, 
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 2 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMain: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: { 
    width: 44, 
    height: 44, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12,
    position: 'relative',
  },
  audioIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF6B6B',
    borderRadius: 6,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextContent: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '600', marginBottom: 2 },
  metaInfo: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  duration: { fontSize: 13, fontWeight: '500' },
  category: { fontSize: 13 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  favoriteButton: { padding: 4 },
  expandedContent: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  cardText: { fontSize: 15, lineHeight: 22, marginBottom: 16, opacity: 0.8 },
  startButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderRadius: 12, 
    gap: 6 
  },
  startButtonText: { color: 'white', fontWeight: '600', fontSize: 15 },
});