import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated, ScrollView, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Target } from 'lucide-react-native';

// Game constants
const TANK_WIDTH = 40;
const TANK_HEIGHT = 40;
const CANNON_WIDTH = 15;
const CANNON_HEIGHT = 8;
const CANNON_OFFSET_X = 6; // Increased from 4 to 6 for better positioning
const CANNON_OFFSET_Y = 19; // Adjusted from 17 to 19 (moved down 2 more pixels)
const GROUND_HEIGHT = 100;
const GRAVITY = 0.2;
const MAX_POWER = 15;
const TERRAIN_SEGMENTS = 30;
const MAP_SCALE = 3.0; // Enlarged map for horizontal scrolling

// Asset URLs
const TANK_IMAGE_URL = 'https://storage.googleapis.com/vossauto/tank.png';
const CANNON_IMAGE_URL = 'https://storage.googleapis.com/vossauto/cannon.png';

export default function GameScreen() {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
  const MAP_WIDTH = SCREEN_WIDTH * MAP_SCALE;
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Game types
  type Player = {
    id: number;
    position: number;
    angle: number;
    power: number;
    health: number;
    color: string;
  };

  type Projectile = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    active: boolean;
  };

  type Terrain = {
    points: { x: number; y: number }[];
  };
  
  // Game state
  const [currentPlayer, setCurrentPlayer] = useState<number>(1);
  const [players, setPlayers] = useState<Player[]>([
    { id: 1, position: MAP_WIDTH * 0.2, angle: 45, power: 8, health: 100, color: '#e94560' },
    { id: 2, position: MAP_WIDTH * 0.8, angle: 135, power: 8, health: 100, color: '#0f3460' }
  ]);
  const [projectile, setProjectile] = useState<Projectile | null>(null);
  const [terrain, setTerrain] = useState<Terrain>({ points: [] });
  const [gameStatus, setGameStatus] = useState<'waiting' | 'firing' | 'hit' | 'gameover'>('waiting');
  const [winner, setWinner] = useState<number | null>(null);
  const [explosionLocation, setExplosionLocation] = useState<{ x: number; y: number } | null>(null);
  
  // Animation values
  const explosionAnim = useRef(new Animated.Value(0)).current;
  
  // Generate terrain on mount
  useEffect(() => {
    generateTerrain();
  }, []);
  
  // Handle projectile movement
  useEffect(() => {
    if (projectile && projectile.active) {
      const timer = setInterval(() => {
        moveProjectile();
      }, 16);
      
      return () => clearInterval(timer);
    }
  }, [projectile]);

  // Scroll to current player
  useEffect(() => {
    if (scrollViewRef.current && gameStatus === 'waiting') {
      const currentPlayerObj = players.find(p => p.id === currentPlayer);
      if (currentPlayerObj) {
        scrollViewRef.current.scrollTo({
          x: currentPlayerObj.position - SCREEN_WIDTH / 2,
          animated: true
        });
      }
    }
  }, [currentPlayer, gameStatus]);
  
  // Generate random terrain based on MAP_WIDTH
  const generateTerrain = () => {
    const points = [];
    const segmentWidth = MAP_WIDTH / TERRAIN_SEGMENTS;
    
    for (let i = 0; i <= TERRAIN_SEGMENTS; i++) {
      const x = i * segmentWidth;
      const heightVariation = Math.random() * 70;
      const y = SCREEN_HEIGHT - GROUND_HEIGHT - heightVariation;
      points.push({ x, y });
    }
    
    setTerrain({ points });
    
    // Position tanks with increased distance between them
    setPlayers(prev => {
      const newPlayers = [...prev];
      newPlayers[0].position = MAP_WIDTH * 0.2;
      newPlayers[1].position = MAP_WIDTH * 0.8;
      return newPlayers;
    });
  };
  
  // Get Y position on terrain at given X
  const getTerrainYAtPosition = (x: number): number => {
    if (terrain.points.length === 0) return SCREEN_HEIGHT - GROUND_HEIGHT;
    
    for (let i = 0; i < terrain.points.length - 1; i++) {
      const p1 = terrain.points[i];
      const p2 = terrain.points[i + 1];
      
      if (x >= p1.x && x <= p2.x) {
        const ratio = (x - p1.x) / (p2.x - p1.x);
        return p1.y + ratio * (p2.y - p1.y);
      }
    }
    
    return SCREEN_HEIGHT - GROUND_HEIGHT;
  };
  
  // Fire projectile
  const fireProjectile = () => {
    if (gameStatus !== 'waiting') return;
    
    const player = players.find(p => p.id === currentPlayer);
    if (!player) return;
    
    const angle = player.angle * (Math.PI / 180);
    const power = player.power;
    
    const tankTopX = player.position;
    const tankTopY = getTerrainYAtPosition(player.position) - TANK_HEIGHT - 5;
    
    // Calculate projectile velocity based on player
    let vx, vy;
    
    if (player.id === 1) {
      // Player 1 fires right
      vx = Math.cos(angle) * power;
      vy = -Math.sin(angle) * power;
    } else {
      // Player 2 fires left
      vx = -Math.cos(Math.PI - angle) * power;
      vy = -Math.sin(Math.PI - angle) * power;
    }
    
    setProjectile({
      x: tankTopX,
      y: tankTopY,
      vx: vx,
      vy: vy,
      active: true
    });
    
    setGameStatus('firing');
  };
  
  // Move projectile
  const moveProjectile = () => {
    if (!projectile) return;
    
    const newX = projectile.x + projectile.vx;
    const newY = projectile.y + projectile.vy;
    const newVy = projectile.vy + GRAVITY;
    
    // Scroll to follow projectile
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: newX - SCREEN_WIDTH / 2,
        animated: false
      });
    }
    
    const terrainY = getTerrainYAtPosition(newX);
    if (newY >= terrainY) {
      handleExplosion(newX, terrainY);
      return;
    }
    
    players.forEach(player => {
      if (
        newX >= player.position - TANK_WIDTH / 2 &&
        newX <= player.position + TANK_WIDTH / 2 &&
        newY >= getTerrainYAtPosition(player.position) - TANK_HEIGHT - 5 &&
        newY <= getTerrainYAtPosition(player.position)
      ) {
        handleTankHit(player.id, newX, newY);
        return;
      }
    });
    
    if (newX < 0 || newX > MAP_WIDTH || newY > SCREEN_HEIGHT) {
      setProjectile(null);
      setGameStatus('waiting');
      switchPlayer();
      return;
    }
    
    setProjectile({
      ...projectile,
      x: newX,
      y: newY,
      vy: newVy
    });
  };
  
  // Handle explosion
  const handleExplosion = (x: number, y: number) => {
    setProjectile(null);
    setExplosionLocation({ x, y });
    setGameStatus('hit');
    
    explosionAnim.setValue(0);
    Animated.timing(explosionAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start(() => {
      setExplosionLocation(null);
      setGameStatus('waiting');
      switchPlayer();
    });
  };
  
  // Handle tank hit
  const handleTankHit = (playerId: number, x: number, y: number) => {
    setProjectile(null);
    setExplosionLocation({ x, y });
    
    const hitPlayer = players.find(p => p.id === playerId);
    if (!hitPlayer) return;
    
    const distanceFromCenter = Math.abs(x - hitPlayer.position);
    const damageMultiplier = 1 - (distanceFromCenter / (TANK_WIDTH / 2));
    const damage = Math.floor(30 * damageMultiplier);
    
    setPlayers(prev => {
      const newPlayers = [...prev];
      const playerIndex = newPlayers.findIndex(p => p.id === playerId);
      
      if (playerIndex !== -1) {
        newPlayers[playerIndex].health = Math.max(0, newPlayers[playerIndex].health - damage);
        if (newPlayers[playerIndex].health <= 0) {
          const winnerId = playerId === 1 ? 2 : 1;
          setWinner(winnerId);
          setGameStatus('gameover');
        }
      }
      
      return newPlayers;
    });
    
    explosionAnim.setValue(0);
    Animated.timing(explosionAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start(() => {
      if (gameStatus !== 'gameover') {
        setExplosionLocation(null);
        setGameStatus('waiting');
        switchPlayer();
      }
    });
  };
  
  // Switch player
  const switchPlayer = () => {
    setCurrentPlayer(prev => (prev === 1 ? 2 : 1));
  };
  
  // Adjust angle
  const adjustAngle = (amount: number) => {
    if (gameStatus !== 'waiting') return;
    
    setPlayers(prev => {
      const newPlayers = [...prev];
      const playerIndex = newPlayers.findIndex(p => p.id === currentPlayer);
      
      if (playerIndex !== -1) {
        let newAngle = newPlayers[playerIndex].angle + amount;
        if (currentPlayer === 1) {
          newAngle = Math.max(0, Math.min(90, newAngle));
        } else {
          newAngle = Math.max(90, Math.min(180, newAngle));
        }
        newPlayers[playerIndex].angle = newAngle;
      }
      
      return newPlayers;
    });
  };
  
  // Adjust power
  const adjustPower = (amount: number) => {
    if (gameStatus !== 'waiting') return;
    
    setPlayers(prev => {
      const newPlayers = [...prev];
      const playerIndex = newPlayers.findIndex(p => p.id === currentPlayer);
      
      if (playerIndex !== -1) {
        newPlayers[playerIndex].power = Math.max(1, Math.min(MAX_POWER, newPlayers[playerIndex].power + amount));
      }
      
      return newPlayers;
    });
  };
  
  // Move tank
  const moveTank = (direction: 'left' | 'right') => {
    if (gameStatus !== 'waiting') return;
    
    setPlayers(prev => {
      const newPlayers = [...prev];
      const playerIndex = newPlayers.findIndex(p => p.id === currentPlayer);
      
      if (playerIndex !== -1) {
        const moveAmount = direction === 'left' ? -15 : 15;
        let newPosition = newPlayers[playerIndex].position + moveAmount;
        
        newPosition = Math.max(TANK_WIDTH / 2, Math.min(MAP_WIDTH - TANK_WIDTH / 2, newPosition));
        
        if (currentPlayer === 1) {
          newPosition = Math.min(MAP_WIDTH / 2 - TANK_WIDTH, newPosition);
        } else {
          newPosition = Math.max(MAP_WIDTH / 2 + TANK_WIDTH, newPosition);
        }
        
        newPlayers[playerIndex].position = newPosition;
      }
      
      return newPlayers;
    });
  };
  
  // Reset game
  const resetGame = () => {
    setCurrentPlayer(1);
    setPlayers([
      { id: 1, position: MAP_WIDTH * 0.2, angle: 45, power: 8, health: 100, color: '#e94560' },
      { id: 2, position: MAP_WIDTH * 0.8, angle: 135, power: 8, health: 100, color: '#0f3460' }
    ]);
    setProjectile(null);
    generateTerrain();
    setGameStatus('waiting');
    setWinner(null);
  };
  
  // Get current player
  const getCurrentPlayer = () => players.find(p => p.id === currentPlayer);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Game header */}
      <View style={styles.header}>
        <View style={styles.healthContainer}>
          <Text style={styles.playerLabel}>P1</Text>
          <View style={styles.healthBarContainer}>
            <View 
              style={[
                styles.healthBar, 
                { width: `${players[0].health}%`, backgroundColor: players[0].color }
              ]} 
            />
          </View>
          <Text style={styles.healthText}>{players[0].health}</Text>
        </View>
        
        <View style={styles.turnIndicator}>
          <Text style={styles.turnText}>
            {gameStatus === 'gameover' 
              ? `Player ${winner} Wins!` 
              : `Player ${currentPlayer}'s Turn`}
          </Text>
        </View>
        
        <View style={styles.healthContainer}>
          <Text style={styles.playerLabel}>P2</Text>
          <View style={styles.healthBarContainer}>
            <View 
              style={[
                styles.healthBar, 
                { width: `${players[1].health}%`, backgroundColor: players[1].color }
              ]} 
            />
          </View>
          <Text style={styles.healthText}>{players[1].health}</Text>
        </View>
      </View>
      
      <View style={styles.gameWrapper}>
        <ScrollView 
          ref={scrollViewRef}
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ width: MAP_WIDTH, height: '100%' }}
        >
          <View style={[styles.gameCanvas, { width: MAP_WIDTH }]}>
            {terrain.points.map((point, index) => {
              if (index === terrain.points.length - 1) return null;
              const nextPoint = terrain.points[index + 1];
              return (
                <View 
                  key={index}
                  style={{
                    position: 'absolute',
                    left: point.x,
                    top: point.y,
                    width: nextPoint.x - point.x,
                    height: SCREEN_HEIGHT - point.y,
                    backgroundColor: '#4a4e69',
                  }}
                />
              );
            })}
            
            {players.map(player => {
              const tankTopX = player.position - TANK_WIDTH / 2;
              const tankTopY = getTerrainYAtPosition(player.position) - TANK_HEIGHT;
              
              return (
                <View
                  key={player.id}
                  style={{
                    position: 'absolute',
                    left: tankTopX,
                    top: tankTopY,
                    width: TANK_WIDTH,
                    height: TANK_HEIGHT,
                  }}
                >
                  {/* Tank Image */}
                  <Image
                    source={{ uri: TANK_IMAGE_URL }}
                    style={{
                      width: '100%',
                      height: '100%',
                      transform: [{ scaleX: player.id === 1 ? -1 : 1 }] // Flips Player 1 to face right
                    }}
                    resizeMode="contain"
                  />
                  
                  {/* Cannon Positioned with Offset */}
                  <View
                    style={{
                      position: 'absolute',
                      // Adjust cannon position based on player
                      left: player.id === 1 
                        ? TANK_WIDTH - CANNON_OFFSET_X - CANNON_WIDTH 
                        : CANNON_OFFSET_X,
                      top: CANNON_OFFSET_Y,
                      width: CANNON_WIDTH,
                      height: CANNON_HEIGHT,
                    }}
                  >
                    <Image
                      source={{ uri: CANNON_IMAGE_URL }}
                      style={{
                        width: '100%',
                        height: '100%',
                        transform: [
                          {
                            // Adjust rotation based on player
                            rotate: player.id === 1
                              ? `${-player.angle}deg`
                              : `${180 - player.angle}deg` // Fixed rotation for player 2
                          },
                        ],
                        transformOrigin: player.id === 1 ? 'right center' : 'left center',
                      }}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              );
            })}
            
            {projectile && (
              <View
                style={{
                  position: 'absolute',
                  left: projectile.x - 4,
                  top: projectile.y - 4,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#fff',
                }}
              />
            )}
            
            {gameStatus === 'hit' && explosionLocation && (
              <Animated.View
                style={{
                  position: 'absolute',
                  left: explosionLocation.x - 25,
                  top: explosionLocation.y - 25,
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: '#ff9e00',
                  opacity: explosionAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 0.5, 0],
                  }),
                  transform: [
                    {
                      scale: explosionAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 2],
                      }),
                    },
                  ],
                }}
              />
            )}
          </View>
        </ScrollView>
        
        {/* Only show controls when not firing */}
        {gameStatus !== 'firing' && (
          <View style={styles.controls}>
            <View style={styles.controlRow}>
              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>MOVE</Text>
                <View style={styles.controlButtons}>
                  <TouchableOpacity 
                    style={styles.controlButton}
                    onPress={() => moveTank('left')}
                    disabled={gameStatus !== 'waiting'}
                  >
                    <ChevronLeft size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.controlButton}
                    onPress={() => moveTank('right')}
                    disabled={gameStatus !== 'waiting'}
                  >
                    <ChevronRight size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>ANGLE: {getCurrentPlayer()?.angle || 0}°</Text>
                <View style={styles.controlButtons}>
                  <TouchableOpacity 
                    style={styles.controlButton}
                    onPress={() => adjustAngle(5)}
                    disabled={gameStatus !== 'waiting'}
                  >
                    <ChevronUp size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.controlButton}
                    onPress={() => adjustAngle(-5)}
                    disabled={gameStatus !== 'waiting'}
                  >
                    <ChevronDown size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={styles.controlRow}>
              <View style={styles.controlGroup}>
                <Text style={styles.controlLabel}>POWER: {getCurrentPlayer()?.power || 0}/{MAX_POWER}</Text>
                <View style={styles.controlButtons}>
                  <TouchableOpacity 
                    style={styles.controlButton}
                    onPress={() => adjustPower(-1)}
                    disabled={gameStatus !== 'waiting'}
                  >
                    <Text style={styles.powerButtonText}>-</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.controlButton}
                    onPress={() => adjustPower(1)}
                    disabled={gameStatus !== 'waiting'}
                  >
                    <Text style={styles.powerButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <TouchableOpacity 
                style={[styles.fireButton, gameStatus !== 'waiting' && styles.disabledButton]}
                onPress={fireProjectile}
                disabled={gameStatus !== 'waiting'}
              >
                <Target size={18} color="#fff" />
                <Text style={styles.fireText}>FIRE</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={resetGame}
            >
              <Text style={styles.resetText}>NEW GAME</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {gameStatus === 'gameover' && (
        <View style={styles.gameOverOverlay}>
          <Text style={styles.gameOverText}>Player {winner} Wins!</Text>
          <TouchableOpacity style={styles.playAgainButton} onPress={resetGame}>
            <Text style={styles.playAgainText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#22223b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#1a1a2e',
  },
  healthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    maxWidth: 140,
  },
  playerLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 5,
  },
  healthBarContainer: {
    flex: 1,
    height: 10,
    backgroundColor: '#444',
    borderRadius: 5,
    overflow: 'hidden',
  },
  healthBar: {
    height: '100%',
  },
  healthText: {
    color: '#fff',
    marginLeft: 5,
    width: 30,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: 'bold',
  },
  turnIndicator: {
    paddingHorizontal: 10,
    backgroundColor: '#333',
    paddingVertical: 4,
    borderRadius: 12,
  },
  turnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  gameWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  gameCanvas: {
    height: '100%',
    backgroundColor: '#9a8c98',
    position: 'relative',
  },
  controls: {
    width: 140,
    backgroundColor: '#1a1a2e',
    padding: 8,
    justifyContent: 'space-between',
  },
  controlRow: {
    marginBottom: 10,
  },
  controlGroup: {
    marginBottom: 10,
    alignItems: 'center',
  },
  controlLabel: {
    color: '#ddd',
    fontSize: 12,
    marginBottom: 3,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  controlButton: {
    width: 40,
    height: 40,
    backgroundColor: '#4a4e69',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  powerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fireButton: {
    flexDirection: 'row',
    backgroundColor: '#e94560',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  fireText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 5,
  },
  resetButton: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 5,
    alignItems: 'center',
  },
  resetText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  playAgainButton: {
    backgroundColor: '#e94560',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 6,
  },
  playAgainText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});