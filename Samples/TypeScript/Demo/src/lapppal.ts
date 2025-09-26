/**
 * 저작권 (c) Live2d Inc. 모든 권리 보유.
 *
 *이 소스 코드 사용은 Live2D Open 소프트웨어 라이센스에 의해 관리됩니다.
 * https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html에서 찾을 수 있습니다.
 */

/**
 * Cubism 플랫폼 추상화 계층은 플랫폼 의존적 기능을 추상화합니다.
 *
 * 파일로드 및 시간 획득과 같은 플랫폼 의존적 기능 요약.
 */
export class LAppPal {
  /**
   * 파일을 바이트 데이터로 읽으십시오
   *
   * @param filepath로드 할 파일의 경로
   * @반품
   * {
   * 버퍼, 바이트 데이터를 읽으십시오
   * 크기 파일 크기
   *}
   */
  public static loadFileAsBytes(
    filePath: string,
    callback: (arrayBuffer: ArrayBuffer, size: number) => void
  ): void {
    fetch(filePath)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => callback(arrayBuffer, arrayBuffer.byteLength));
  }

  /**
   * 델타 시간 얻기 (이전 프레임과의 차이)
   * @return 델타 시간 [MS]
   */
  public static getDeltaTime(): number {
    return this.deltaTime;
  }

  public static updateTime(): void {
    this.currentFrame = Date.now();
    this.deltaTime = (this.currentFrame - this.lastFrame) / 1000;
    this.lastFrame = this.currentFrame;
  }

  /**
   * 메시지를 출력하십시오
   * @param 메시지 문자열
   */
  public static printMessage(message: string): void {
    console.log(message);
  }

  static lastUpdate = Date.now();

  static currentFrame = 0.0;
  static lastFrame = 0.0;
  static deltaTime = 0.0;
}
