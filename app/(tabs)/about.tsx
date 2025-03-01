import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Artillery Game</Text>
        
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1599409636295-e3cf3538f212?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80' }} 
          style={styles.image}
          resizeMode="cover"
        />
        
        <View style={styles.twoColumnLayout}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>How to Play</Text>
            <Text style={styles.paragraph}>
              Artillery Game is a turn-based strategy game where two players take turns firing artillery shells at each other.
              The last tank standing wins!
            </Text>
            
            <Text style={styles.sectionTitle}>Strategy Tips</Text>
            <Text style={styles.paragraph}>
              • Pay attention to the terrain - hills and valleys affect your shots.
            </Text>
            <Text style={styles.paragraph}>
              • Adjust your angle and power carefully for precision shots.
            </Text>
            <Text style={styles.paragraph}>
              • Direct hits cause more damage than near misses.
            </Text>
            <Text style={styles.paragraph}>
              • Use your turns wisely - sometimes it's better to reposition than to take a risky shot.
            </Text>
          </View>
          
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Controls</Text>
            <View style={styles.controlsContainer}>
              <View style={styles.controlItem}>
                <Text style={styles.controlTitle}>Movement</Text>
                <Text style={styles.controlDescription}>Use the left and right arrows to move your tank along the terrain.</Text>
              </View>
              
              <View style={styles.controlItem}>
                <Text style={styles.controlTitle}>Angle</Text>
                <Text style={styles.controlDescription}>Use the up and down arrows to adjust your firing angle.</Text>
              </View>
              
              <View style={styles.controlItem}>
                <Text style={styles.controlTitle}>Power</Text>
                <Text style={styles.controlDescription}>Use the + and - buttons to adjust your firing power.</Text>
              </View>
              
              <View style={styles.controlItem}>
                <Text style={styles.controlTitle}>Fire</Text>
                <Text style={styles.controlDescription}>Tap the FIRE button to launch your projectile.</Text>
              </View>
            </View>
          </View>
        </View>
        
        <Text style={styles.sectionTitle}>About the Developer</Text>
        <Text style={styles.paragraph}>
          This game was created as a demonstration of React Native and Expo capabilities.
          It showcases touch controls, animation, and game physics in a mobile-friendly format.
        </Text>
        
        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#22223b',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e94560',
  },
  twoColumnLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  column: {
    width: '48%',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e94560',
    marginTop: 15,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    color: '#ddd',
    marginBottom: 10,
    lineHeight: 22,
  },
  controlsContainer: {
    marginTop: 8,
    marginBottom: 15,
  },
  controlItem: {
    marginBottom: 15,
  },
  controlTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  controlDescription: {
    fontSize: 16,
    color: '#ddd',
    lineHeight: 20,
  },
  version: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 15,
  },
});
