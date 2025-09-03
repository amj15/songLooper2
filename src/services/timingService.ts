class TimingService {
  private beatTimings: Array<{
    time: number;
    beatNumber: number;
    barIndex: number;
    isFirstBeat: boolean;
  }> = [];
  
  private firstBarStart: number = 0;
  private beatDuration: number = 0;
  private beatsPerMeasure: number = 4;
  private isInitialized: boolean = false;

  // Inicializar el servicio con los datos de compases
  initialize(barsData: any[], bpm: number, timeSignature: string) {
    if (!barsData || barsData.length === 0) {
      this.isInitialized = false;
      return;
    }

    const [beatsPerMeasure] = timeSignature.split('/').map(Number);
    const beatDuration = 60 / bpm;
    
    // Solo recalcular si han cambiado los parámetros fundamentales
    if (this.firstBarStart === barsData[0].start && 
        this.beatDuration === beatDuration && 
        this.beatsPerMeasure === beatsPerMeasure && 
        this.isInitialized) {
      return; // Ya está inicializado con los mismos datos
    }

    this.firstBarStart = barsData[0].start;
    this.beatDuration = beatDuration;
    this.beatsPerMeasure = beatsPerMeasure;
    
    // Precalcular TODOS los tiempos de beat
    this.beatTimings = [];
    const startTime = this.firstBarStart;
    
    barsData.forEach((bar, barIndex) => {
      for (let beat = 0; beat < beatsPerMeasure; beat++) {
        const beatTime = startTime + (barIndex * beatsPerMeasure * beatDuration) + (beat * beatDuration);
        this.beatTimings.push({
          time: beatTime,
          beatNumber: beat + 1,
          barIndex: barIndex,
          isFirstBeat: beat === 0
        });
      }
    });
    
    this.isInitialized = true;
  }

  // Obtener el beat exacto para un tiempo dado
  getBeatAtTime(currentTime: number): {
    beatNumber: number;
    barIndex: number;
    measure: number;
    totalBeats: number;
    exactTime: number;
    isOnBeat: boolean;
  } | null {
    if (!this.isInitialized || this.beatTimings.length === 0) {
      return null;
    }

    // Búsqueda binaria para encontrar el beat más cercano (más eficiente)
    let left = 0;
    let right = this.beatTimings.length - 1;
    let currentBeatIndex = -1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const timing = this.beatTimings[mid];
      
      if (currentTime >= timing.time && 
          (mid === this.beatTimings.length - 1 || currentTime < this.beatTimings[mid + 1].time)) {
        currentBeatIndex = mid;
        break;
      } else if (currentTime < timing.time) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    if (currentBeatIndex >= 0) {
      const timing = this.beatTimings[currentBeatIndex];
      const nextTiming = this.beatTimings[currentBeatIndex + 1];
      
      // Determinar si estamos "en el beat" con tolerancia ultra-estricta
      const tolerance = Math.min(0.005, this.beatDuration * 0.01); // Max 5ms o 1% del beat
      const isOnBeat = Math.abs(currentTime - timing.time) < tolerance;
      
      return {
        beatNumber: timing.beatNumber,
        barIndex: timing.barIndex,
        measure: timing.barIndex + 1,
        totalBeats: currentBeatIndex,
        exactTime: timing.time,
        isOnBeat
      };
    }

    return null;
  }

  // Obtener el próximo beat después del tiempo actual
  getNextBeat(currentTime: number): { time: number; beatNumber: number; isFirstBeat: boolean } | null {
    if (!this.isInitialized) return null;

    for (let i = 0; i < this.beatTimings.length; i++) {
      if (this.beatTimings[i].time > currentTime) {
        const timing = this.beatTimings[i];
        return {
          time: timing.time,
          beatNumber: timing.beatNumber,
          isFirstBeat: timing.isFirstBeat
        };
      }
    }

    return null;
  }

  // Verificar si el tiempo actual está dentro del rango de compases
  isInValidRange(currentTime: number, barsData: any[]): boolean {
    if (!barsData || barsData.length === 0) return true;
    return currentTime >= this.firstBarStart && currentTime <= barsData[barsData.length - 1].end;
  }

  // Obtener estadísticas para debug
  getStats() {
    return {
      isInitialized: this.isInitialized,
      firstBarStart: this.firstBarStart,
      beatDuration: this.beatDuration,
      beatsPerMeasure: this.beatsPerMeasure,
      totalBeats: this.beatTimings.length
    };
  }
}

export const timingService = new TimingService();