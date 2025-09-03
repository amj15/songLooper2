class VolumeService {
  private trackVolume: number = 1.0; // Volumen del audio principal
  private clickVolume: number = 0.3;  // Volumen de la claqueta
  private masterVolume: number = 1.0; // Volumen master
  
  // Referencias a elementos de audio
  private audioElement: HTMLAudioElement | null = null;
  
  constructor() {
    // Cargar volúmenes guardados de localStorage
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const savedTrackVolume = localStorage.getItem('daw-trackVolume');
      const savedClickVolume = localStorage.getItem('daw-clickVolume');
      const savedMasterVolume = localStorage.getItem('daw-masterVolume');
      
      if (savedTrackVolume !== null) {
        this.trackVolume = Math.max(0, Math.min(1, parseFloat(savedTrackVolume)));
      }
      if (savedClickVolume !== null) {
        this.clickVolume = Math.max(0, Math.min(1, parseFloat(savedClickVolume)));
      }
      if (savedMasterVolume !== null) {
        this.masterVolume = Math.max(0, Math.min(1, parseFloat(savedMasterVolume)));
      }
    } catch (error) {
      console.warn('Error loading volume settings:', error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('daw-trackVolume', this.trackVolume.toString());
      localStorage.setItem('daw-clickVolume', this.clickVolume.toString());
      localStorage.setItem('daw-masterVolume', this.masterVolume.toString());
    } catch (error) {
      console.warn('Error saving volume settings:', error);
    }
  }

  // Registrar el elemento de audio principal
  setAudioElement(audio: HTMLAudioElement | null) {
    this.audioElement = audio;
    this.updateTrackVolume();
  }

  // Volumen del track (audio principal)
  setTrackVolume(volume: number) {
    this.trackVolume = Math.max(0, Math.min(1, volume));
    this.updateTrackVolume();
    this.saveToStorage();
  }

  getTrackVolume(): number {
    return this.trackVolume;
  }

  private updateTrackVolume() {
    if (this.audioElement) {
      // El volumen final del track es: trackVolume * masterVolume
      this.audioElement.volume = this.trackVolume * this.masterVolume;
    }
  }

  // Volumen de la claqueta
  setClickVolume(volume: number) {
    this.clickVolume = Math.max(0, Math.min(1, volume));
    this.saveToStorage();
  }

  getClickVolume(): number {
    return this.clickVolume;
  }

  // Obtener el volumen final de la claqueta (click * master)
  getFinalClickVolume(): number {
    return this.clickVolume * this.masterVolume;
  }

  // Volumen master
  setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    // Actualizar ambos canales
    this.updateTrackVolume();
    this.saveToStorage();
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  // Obtener todos los volúmenes para debug
  getAllVolumes() {
    return {
      track: this.trackVolume,
      click: this.clickVolume,
      master: this.masterVolume,
      finalTrack: this.trackVolume * this.masterVolume,
      finalClick: this.clickVolume * this.masterVolume
    };
  }

  // Método para silenciar todo (emergencia)
  muteAll() {
    this.setMasterVolume(0);
  }

  // Método para restaurar volumen master
  unmuteAll() {
    this.setMasterVolume(1.0);
  }
}

export const volumeService = new VolumeService();