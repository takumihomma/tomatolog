export interface SpeechServiceCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
  onStart: () => void;
}

export class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'ja-JP';
    }
  }

  public static isSupported(): boolean {
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public start(callbacks: SpeechServiceCallbacks): boolean {
    if (!this.recognition) {
      callbacks.onError('Web Speech API に未対応のブラウザです。');
      return false;
    }

    if (this.isListening) {
      this.stop();
    }

    let fullTranscript = '';

    this.recognition.onstart = () => {
      this.isListening = true;
      callbacks.onStart();
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        fullTranscript += (fullTranscript ? ' ' : '') + finalTranscript;
      }

      const currentDisplay = fullTranscript + (interimTranscript ? ` (${interimTranscript})` : '');
      callbacks.onResult(currentDisplay, false);
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      callbacks.onError(`音声認識エラー: ${event.error}`);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      callbacks.onEnd();
    };

    try {
      this.recognition.start();
      return true;
    } catch (err: any) {
      callbacks.onError(`音声入力の開始に失敗しました: ${err.message || err}`);
      return false;
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.error('Error stopping speech recognition:', err);
      }
      this.isListening = false;
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}
