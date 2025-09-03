import { volumeService } from './volumeService';

class MetronomeService {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private isEnabled: boolean = false;
  private scheduledBeats = new Set<string>(); // Para evitar beats duplicados
  private lastScheduledTime: number = 0;
  private manualOffset: number = 0; // Offset manual en segundos
  
  constructor() {
    this.initializeAudioContext();
    this.loadOffsetFromStorage();
  }

  private loadOffsetFromStorage() {
    try {
      const savedOffset = localStorage.getItem('daw-metronomeOffset');
      if (savedOffset !== null) {
        this.manualOffset = parseFloat(savedOffset) || 0;
      }
    } catch (error) {
      console.warn('Error loading metronome offset:', error);
    }
  }

  private saveOffsetToStorage() {
    try {
      localStorage.setItem('daw-metronomeOffset', this.manualOffset.toString());
    } catch (error) {
      console.warn('Error saving metronome offset:', error);
    }
  }

  private initializeAudioContext() {
    try {
      // Crear AudioContext
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Crear nodo de ganancia para controlar volumen
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.updateVolume();
      
    } catch (error) {
      console.error('Error initializing AudioContext:', error);
    }
  }

  // Generar sonido de beat 1 (más agudo y fuerte) con timing preciso
  private createBeat1Sound(startTime?: number): void {
    if (!this.audioContext || !this.gainNode || !this.isEnabled) return;

    // Actualizar volumen antes de crear el sonido
    this.updateVolume();

    try {
      let currentTime = startTime || this.audioContext.currentTime;
      
      // Validar que el tiempo sea válido
      if (!isFinite(currentTime) || currentTime < 0) {
        currentTime = this.audioContext.currentTime;
      }
      
      // Oscilador principal (tono agudo)
      const oscillator = this.audioContext.createOscillator();
      const oscillatorGain = this.audioContext.createGain();
      
      oscillator.connect(oscillatorGain);
      oscillatorGain.connect(this.gainNode);
      
      // Configurar frecuencia más aguda para beat 1
      oscillator.frequency.setValueAtTime(1200, currentTime);
      oscillator.type = 'sine';
      
      // Envelope de ganancia (ataque rápido, decay rápido)
      oscillatorGain.gain.setValueAtTime(0, currentTime);
      oscillatorGain.gain.linearRampToValueAtTime(0.8, currentTime + 0.003); // Ataque rápido
      oscillatorGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.1); // Decay
      
      // Agregar un click percusivo
      const noiseBuffer = this.createNoiseBuffer();
      const noiseSource = this.audioContext.createBufferSource();
      const noiseGain = this.audioContext.createGain();
      const noiseFilter = this.audioContext.createBiquadFilter();
      
      noiseSource.buffer = noiseBuffer;
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.gainNode);
      
      // Configurar filtro para click
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(2000, currentTime);
      
      // Envelope para el ruido (muy corto)
      noiseGain.gain.setValueAtTime(0, currentTime);
      noiseGain.gain.linearRampToValueAtTime(0.3, currentTime + 0.001);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.02);
      
      // Iniciar sonidos
      oscillator.start(currentTime);
      oscillator.stop(currentTime + 0.1);
      
      noiseSource.start(currentTime);
      noiseSource.stop(currentTime + 0.02);
      
    } catch (error) {
      console.error('Error creating beat 1 sound:', error);
    }
  }

  // Generar sonido de otros beats (más grave y suave) con timing preciso
  private createOtherBeatSound(startTime?: number): void {
    if (!this.audioContext || !this.gainNode || !this.isEnabled) return;

    // Actualizar volumen antes de crear el sonido
    this.updateVolume();

    try {
      let currentTime = startTime || this.audioContext.currentTime;
      
      // Validar que el tiempo sea válido
      if (!isFinite(currentTime) || currentTime < 0) {
        currentTime = this.audioContext.currentTime;
      }
      
      // Oscilador principal (tono más grave)
      const oscillator = this.audioContext.createOscillator();
      const oscillatorGain = this.audioContext.createGain();
      
      oscillator.connect(oscillatorGain);
      oscillatorGain.connect(this.gainNode);
      
      // Configurar frecuencia más grave para otros beats
      oscillator.frequency.setValueAtTime(800, currentTime);
      oscillator.type = 'sine';
      
      // Envelope más suave
      oscillatorGain.gain.setValueAtTime(0, currentTime);
      oscillatorGain.gain.linearRampToValueAtTime(0.4, currentTime + 0.005); // Ataque suave
      oscillatorGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.08); // Decay
      
      // Click más suave
      const noiseBuffer = this.createNoiseBuffer();
      const noiseSource = this.audioContext.createBufferSource();
      const noiseGain = this.audioContext.createGain();
      const noiseFilter = this.audioContext.createBiquadFilter();
      
      noiseSource.buffer = noiseBuffer;
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.gainNode);
      
      // Configurar filtro más suave
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(1000, currentTime);
      
      // Envelope más suave para el ruido
      noiseGain.gain.setValueAtTime(0, currentTime);
      noiseGain.gain.linearRampToValueAtTime(0.15, currentTime + 0.002);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.015);
      
      // Iniciar sonidos
      oscillator.start(currentTime);
      oscillator.stop(currentTime + 0.08);
      
      noiseSource.start(currentTime);
      noiseSource.stop(currentTime + 0.015);
      
    } catch (error) {
      console.error('Error creating other beat sound:', error);
    }
  }

  // Crear buffer de ruido para el click percusivo
  private createNoiseBuffer(): AudioBuffer {
    const bufferSize = this.audioContext!.sampleRate * 0.02; // 20ms de ruido
    const buffer = this.audioContext!.createBuffer(1, bufferSize, this.audioContext!.sampleRate);
    const output = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    return buffer;
  }

  // API pública
  playBeat1(startTime?: number): void {
    this.createBeat1Sound(startTime);
  }

  playOtherBeat(startTime?: number): void {
    this.createOtherBeatSound(startTime);
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      // Limpiar beats programados cuando se desactiva
      this.scheduledBeats.clear();
    }
  }

  isMetronomeEnabled(): boolean {
    return this.isEnabled;
  }

  // Actualizar volumen usando el volumeService
  private updateVolume(): void {
    if (this.gainNode && this.audioContext) {
      const finalVolume = volumeService.getFinalClickVolume();
      this.gainNode.gain.setValueAtTime(finalVolume, this.audioContext.currentTime);
    }
  }

  // Método público para forzar actualización de volumen
  refreshVolume(): void {
    this.updateVolume();
  }

  // Métodos para controlar el offset manual
  setManualOffset(offsetMs: number): void {
    this.manualOffset = offsetMs / 1000; // Convertir ms a segundos
    this.saveOffsetToStorage();
  }

  getManualOffset(): number {
    return this.manualOffset * 1000; // Devolver en ms
  }

  adjustOffset(deltaMs: number): void {
    const newOffsetMs = (this.manualOffset * 1000) + deltaMs;
    // Limitar el offset a ±500ms para pruebas más exageradas
    const clampedOffset = Math.max(-500, Math.min(500, newOffsetMs));
    this.setManualOffset(clampedOffset);
  }

  // Método para reproducir beat basado en posición con timing ultra-preciso
  playBeatAtPosition(beatNumber: number, totalBeats: number, exactTime?: number): void {
    if (!this.isEnabled || !this.audioContext) return;
    
    // Crear ID único para este beat
    const beatId = `${beatNumber}-${totalBeats}`;
    
    // Evitar duplicados usando un Set
    if (this.scheduledBeats.has(beatId)) {
      return;
    }
    
    // Calcular timing con offset manual
    const audioContextTime = this.audioContext.currentTime;
    
    // Aplicar offset directamente - siempre hacia el futuro para evitar problemas
    const baseDelay = 0.01; // 10ms base para asegurar reproducción
    let startTime = audioContextTime + baseDelay + this.manualOffset;
    
    // Asegurar que nunca programamos sonidos en el pasado
    if (startTime < audioContextTime) {
      startTime = audioContextTime + 0.001; // Mínimo 1ms en el futuro
    }
    
    // Agregar al set de beats programados
    this.scheduledBeats.add(beatId);
    
    // Remover del set después de un tiempo para evitar que crezca indefinidamente
    setTimeout(() => {
      this.scheduledBeats.delete(beatId);
    }, 500);
    
    // Beat 1 es especial (más agudo), otros beats son más suaves
    if (beatNumber === 1) {
      this.playBeat1(startTime);
    } else {
      this.playOtherBeat(startTime);
    }
  }

  // Cleanup
  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.gainNode = null;
    }
  }
}

export const metronomeService = new MetronomeService();