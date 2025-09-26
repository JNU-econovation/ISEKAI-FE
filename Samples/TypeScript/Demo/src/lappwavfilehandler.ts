/**
 * 저작권 (c) Live2d Inc. 모든 권리 보유.
 *
 *이 소스 코드 사용은 Live2D Open 소프트웨어 라이센스에 의해 관리됩니다.
 * https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html에서 찾을 수 있습니다.
 */

/** @deprecated이 변수는 getInstance ()의 감가 상각으로 인해 더 이상 사용되지 않았습니다. */
export let s_instance: LAppWavFileHandler = null;

export class LAppWavFileHandler {
  /**
   * 클래스의 인스턴스 (싱글 톤)를 반환합니다.
   * 인스턴스가 생성되지 않으면 내부적으로 인스턴스를 만듭니다.
   *
   * @return 클래스 인스턴스
   * @deprecated이 클래스에서 싱글 톤 패턴의 사용은 더 이상 사용되지 않았습니다. 대신 새 LappwavfileHandler ()를 사용하십시오.
   */
  public static getInstance(): LAppWavFileHandler {
    if (s_instance == null) {
      s_instance = new LAppWavFileHandler();
    }

    return s_instance;
  }

  /**
   * 수업의 인스턴스 (싱글 톤)를 해방시킵니다.
   *
   * @deprecated이 기능은 getInstance ()의 감가 상각으로 인해 더 이상 사용되지 않았습니다.
   */
  public static releaseInstance(): void {
    if (s_instance != null) {
      s_instance = void 0;
    }

    s_instance = null;
  }

  public update(deltaTimeSeconds: number) {
    let goalOffset: number;
    let rms: number;

    // 데이터로드되기 전에/파일의 끝에 도달하면 업데이트하지 마십시오.
    if (
      this._pcmData == null ||
      this._sampleOffset >= this._wavFileInfo._samplesPerChannel
    ) {
      this._lastRms = 0.0;
      return false;
    }

    // 경과 시간 후에 상태를 유지하십시오
    this._userTimeSeconds += deltaTimeSeconds;
    goalOffset = Math.floor(
      this._userTimeSeconds * this._wavFileInfo._samplingRate
    );
    if (goalOffset > this._wavFileInfo._samplesPerChannel) {
      goalOffset = this._wavFileInfo._samplesPerChannel;
    }

    // rms 計測
    rms = 0.0;
    for (
      let channelCount = 0;
      channelCount < this._wavFileInfo._numberOfChannels;
      channelCount++
    ) {
      for (
        let sampleCount = this._sampleOffset;
        sampleCount < goalOffset;
        sampleCount++
      ) {
        const pcm = this._pcmData[channelCount][sampleCount];
        rms += pcm * pcm;
      }
    }
    rms = Math.sqrt(
      rms /
        (this._wavFileInfo._numberOfChannels *
          (goalOffset - this._sampleOffset))
    );

    this._lastRms = rms;
    this._sampleOffset = goalOffset;
    return true;
  }

  public start(filePath: string): void {
    // 샘플 위치를 초기화합니다. 참조 위치
    this._sampleOffset = 0;
    this._userTimeSeconds = 0.0;

    // rms 값을 재설정합니다
    this._lastRms = 0.0;

    this.loadWavFile(filePath);
  }

  public getRms(): number {
    return this._lastRms;
  }

  public loadWavFile(filePath: string): Promise<boolean> {
    return new Promise(resolveValue => {
      let ret = false;

      if (this._pcmData != null) {
        this.releasePcmData();
      }

      // 파일로드
      const asyncFileLoad = async () => {
        return fetch(filePath).then(responce => {
          return responce.arrayBuffer();
        });
      };

      const asyncWavFileManager = (async () => {
        this._byteReader._fileByte = await asyncFileLoad();
        this._byteReader._fileDataView = new DataView(
          this._byteReader._fileByte
        );
        this._byteReader._fileSize = this._byteReader._fileByte.byteLength;
        this._byteReader._readOffset = 0;

        // 파일로드가 실패했거나 첫 번째 서명 "리프"에 맞는 크기가없는 경우 실패
        if (
          this._byteReader._fileByte == null ||
          this._byteReader._fileSize < 4
        ) {
          resolveValue(false);
          return;
        }

        // 파일 이름
        this._wavFileInfo._fileName = filePath;

        try {
          // 서명 "리프"
          if (!this._byteReader.getCheckSignature('RIFF')) {
            ret = false;
            throw new Error('Cannot find Signeture "RIFF".');
          }
          // 파일 크기 -8 (건너 뛰기)
          this._byteReader.get32LittleEndian();
          // 서명 "웨이브"
          if (!this._byteReader.getCheckSignature('WAVE')) {
            ret = false;
            throw new Error('Cannot find Signeture "WAVE".');
          }
          // 서명 "FMT"
          if (!this._byteReader.getCheckSignature('fmt ')) {
            ret = false;
            throw new Error('Cannot find Signeture "fmt".');
          }
          // FMT 청크 크기
          const fmtChunkSize = this._byteReader.get32LittleEndian();
          // 1 (선형 PCM)을 제외한 형식 ID가 허용되지 않습니다.
          if (this._byteReader.get16LittleEndian() != 1) {
            ret = false;
            throw new Error('File is not linear PCM.');
          }
          // 채널 수
          this._wavFileInfo._numberOfChannels =
            this._byteReader.get16LittleEndian();
          // 샘플링 속도
          this._wavFileInfo._samplingRate =
            this._byteReader.get32LittleEndian();
          // 데이터 속도 [바이트/초] (건너 뛰기)
          this._byteReader.get32LittleEndian();
          // 블록 크기 (읽기 건너 뛰기)
          this._byteReader.get16LittleEndian();
          // 양자화 된 비트 수
          this._wavFileInfo._bitsPerSample =
            this._byteReader.get16LittleEndian();
          // FMT 청크의 확장 부분을 건너 뜁니다
          if (fmtChunkSize > 16) {
            this._byteReader._readOffset += fmtChunkSize - 16;
          }
          // "데이터"청크가 나타날 때까지 건너 뜁니다
          while (
            !this._byteReader.getCheckSignature('data') &&
            this._byteReader._readOffset < this._byteReader._fileSize
          ) {
            this._byteReader._readOffset +=
              this._byteReader.get32LittleEndian() + 4;
          }
          // 파일에 "Data"청크가 나타나지 않았습니다
          if (this._byteReader._readOffset >= this._byteReader._fileSize) {
            ret = false;
            throw new Error('Cannot find "data" Chunk.');
          }
          // 샘플 수
          {
            const dataChunkSize = this._byteReader.get32LittleEndian();
            this._wavFileInfo._samplesPerChannel =
              (dataChunkSize * 8) /
              (this._wavFileInfo._bitsPerSample *
                this._wavFileInfo._numberOfChannels);
          }
          // 領域確保
          this._pcmData = new Array(this._wavFileInfo._numberOfChannels);
          for (
            let channelCount = 0;
            channelCount < this._wavFileInfo._numberOfChannels;
            channelCount++
          ) {
            this._pcmData[channelCount] = new Float32Array(
              this._wavFileInfo._samplesPerChannel
            );
          }
          // 파형 데이터의 획득
          for (
            let sampleCount = 0;
            sampleCount < this._wavFileInfo._samplesPerChannel;
            sampleCount++
          ) {
            for (
              let channelCount = 0;
              channelCount < this._wavFileInfo._numberOfChannels;
              channelCount++
            ) {
              this._pcmData[channelCount][sampleCount] = this.getPcmSample();
            }
          }

          ret = true;

          resolveValue(ret);
        } catch (e) {
          console.log(e);
        }
      })().then(() => {
        resolveValue(ret);
      });
    });
  }

  public getPcmSample(): number {
    let pcm32;

    // 32 비트 너비로 확장 한 다음 -1에서 1 범위로 반올림합니다.
    switch (this._wavFileInfo._bitsPerSample) {
      case 8:
        pcm32 = this._byteReader.get8() - 128;
        pcm32 <<= 24;
        break;
      case 16:
        pcm32 = this._byteReader.get16LittleEndian() << 16;
        break;
      case 24:
        pcm32 = this._byteReader.get24LittleEndian() << 8;
        break;
      default:
        // 지원되지 않은 비트 너비
        pcm32 = 0;
        break;
    }

    return pcm32 / 2147483647; //Number.MAX_VALUE;
  }

  /**
   * 지정된 채널에서 오디오 샘플 배열 가져 오기
   *
   * @param usechannel 채널을 사용할 수 있습니다
   * 지정된 채널 용 오디오 샘플 배열 @returns 배열
   */
  public getPcmDataChannel(usechannel: number): Float32Array {
    // 지정된 채널 수가 데이터 배열의 길이보다 큰 경우 null을 반환합니다.
    if (!this._pcmData || !(usechannel < this._pcmData.length)) {
      return null;
    }

    // _PCMDATA에서 새로 지정된 채널에 대한 float32ARRAY를 만듭니다.
    return Float32Array.from(this._pcmData[usechannel]);
  }

  /**
   * 오디오 샘플링 주파수를 가져옵니다.
   *
   * @returns 오디오 샘플링 주파수
   */
  public getWavSamplingRate(): number {
    if (!this._wavFileInfo || this._wavFileInfo._samplingRate < 1) {
      return null;
    }

    return this._wavFileInfo._samplingRate;
  }

  public releasePcmData(): void {
    for (
      let channelCount = 0;
      channelCount < this._wavFileInfo._numberOfChannels;
      channelCount++
    ) {
      this._pcmData[channelCount] = null;
    }
    delete this._pcmData;
    this._pcmData = null;
  }

  constructor() {
    this._pcmData = null;
    this._userTimeSeconds = 0.0;
    this._lastRms = 0.0;
    this._sampleOffset = 0.0;
    this._wavFileInfo = new WavFileInfo();
    this._byteReader = new ByteReader();
  }

  _pcmData: Array<Float32Array>;
  _userTimeSeconds: number;
  _lastRms: number;
  _sampleOffset: number;
  _wavFileInfo: WavFileInfo;
  _byteReader: ByteReader;
  loadFiletoBytes = (arrayBuffer: ArrayBuffer, length: number): void => {
    this._byteReader._fileByte = arrayBuffer;
    this._byteReader._fileDataView = new DataView(this._byteReader._fileByte);
    this._byteReader._fileSize = length;
  };
}

export class WavFileInfo {
  constructor() {
    this._fileName = '';
    this._numberOfChannels = 0;
    this._bitsPerSample = 0;
    this._samplingRate = 0;
    this._samplesPerChannel = 0;
  }

  _fileName: string; ///< ファイル名
  _numberOfChannels: number; ///< チャンネル数
  _bitsPerSample: number; ///< サンプルあたりビット数
  _samplingRate: number; ///< サンプリングレート
  _samplesPerChannel: number; ///< 1チャンネルあたり総サンプル数
}

export class ByteReader {
  constructor() {
    this._fileByte = null;
    this._fileDataView = null;
    this._fileSize = 0;
    this._readOffset = 0;
  }

  /**
   * @brief 8 비트 읽기
   * @return csm :: csmuint8 8 비트 값을 읽습니다
   */
  public get8(): number {
    const ret = this._fileDataView.getUint8(this._readOffset);
    this._readOffset++;
    return ret;
  }

  /**
   * @Brief 16 비트 읽기 (Little-Endian)
   * @return csm :: csmuint16 16 비트 값을 읽습니다
   */
  public get16LittleEndian(): number {
    const ret =
      (this._fileDataView.getUint8(this._readOffset + 1) << 8) |
      this._fileDataView.getUint8(this._readOffset);
    this._readOffset += 2;
    return ret;
  }

  /**
   * @Brief 24 비트 읽기 (Little-Endian)
   * @return csm :: csmuint32 읽기 24 비트 값 (낮은 24 비트로 설정)
   */
  public get24LittleEndian(): number {
    const ret =
      (this._fileDataView.getUint8(this._readOffset + 2) << 16) |
      (this._fileDataView.getUint8(this._readOffset + 1) << 8) |
      this._fileDataView.getUint8(this._readOffset);
    this._readOffset += 3;
    return ret;
  }

  /**
   * @Brief 32 비트 읽기 (Little-Endian)
   * @return csm :: csmuint32 32 비트 값을 읽습니다
   */
  public get32LittleEndian(): number {
    const ret =
      (this._fileDataView.getUint8(this._readOffset + 3) << 24) |
      (this._fileDataView.getUint8(this._readOffset + 2) << 16) |
      (this._fileDataView.getUint8(this._readOffset + 1) << 8) |
      this._fileDataView.getUint8(this._readOffset);
    this._readOffset += 4;
    return ret;
  }

  /**
   * @brief 서명을 받고 참조 문자열 일치 확인
   * @param [in] 참조 서명 문자열을 확인합니다
   * @retval True 일치
   * @retval false는 일치하지 않습니다
   */
  public getCheckSignature(reference: string): boolean {
    const getSignature: Uint8Array = new Uint8Array(4);
    const referenceString: Uint8Array = new TextEncoder().encode(reference);
    if (reference.length != 4) {
      return false;
    }
    for (let signatureOffset = 0; signatureOffset < 4; signatureOffset++) {
      getSignature[signatureOffset] = this.get8();
    }
    return (
      getSignature[0] == referenceString[0] &&
      getSignature[1] == referenceString[1] &&
      getSignature[2] == referenceString[2] &&
      getSignature[3] == referenceString[3]
    );
  }

  _fileByte: ArrayBuffer; ///< ロードしたファイルのバイト列
  _fileDataView: DataView;
  _fileSize: number; ///< ファイルサイズ
  _readOffset: number; ///< ファイル参照位置
}
