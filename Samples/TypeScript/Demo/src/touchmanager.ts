/**
 * 저작권 (c) Live2d Inc. 모든 권리 보유.
 *
 *이 소스 코드 사용은 Live2D Open 소프트웨어 라이센스에 의해 관리됩니다.
 * https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html에서 찾을 수 있습니다.
 */

export class TouchManager {
  /**
   * 생성자
   */
  constructor() {
    this._startX = 0.0;
    this._startY = 0.0;
    this._lastX = 0.0;
    this._lastY = 0.0;
    this._lastX1 = 0.0;
    this._lastY1 = 0.0;
    this._lastX2 = 0.0;
    this._lastY2 = 0.0;
    this._lastTouchDistance = 0.0;
    this._deltaX = 0.0;
    this._deltaY = 0.0;
    this._scale = 1.0;
    this._touchSingle = false;
    this._flipAvailable = false;
  }

  public getCenterX(): number {
    return this._lastX;
  }

  public getCenterY(): number {
    return this._lastY;
  }

  public getDeltaX(): number {
    return this._deltaX;
  }

  public getDeltaY(): number {
    return this._deltaY;
  }

  public getStartX(): number {
    return this._startX;
  }

  public getStartY(): number {
    return this._startY;
  }

  public getScale(): number {
    return this._scale;
  }

  public getX(): number {
    return this._lastX;
  }

  public getY(): number {
    return this._lastY;
  }

  public getX1(): number {
    return this._lastX1;
  }

  public getY1(): number {
    return this._lastY1;
  }

  public getX2(): number {
    return this._lastX2;
  }

  public getY2(): number {
    return this._lastY2;
  }

  public isSingleTouch(): boolean {
    return this._touchSingle;
  }

  public isFlickAvailable(): boolean {
    return this._flipAvailable;
  }

  public disableFlick(): void {
    this._flipAvailable = false;
  }

  /**
   * 터치 스타트 이벤트
   * @param devicex x 값을 터치 한 화면의 값
   * @param devicy y a 값이 터치 한 화면에 값
   */
  public touchesBegan(deviceX: number, deviceY: number): void {
    this._lastX = deviceX;
    this._lastY = deviceY;
    this._startX = deviceX;
    this._startY = deviceY;
    this._lastTouchDistance = -1.0;
    this._flipAvailable = true;
    this._touchSingle = true;
  }

  /**
   * 드래그 이벤트
   * @param devicex x 값을 터치 한 화면의 값
   * @param devicy y a 값이 터치 한 화면에 값
   */
  public touchesMoved(deviceX: number, deviceY: number): void {
    this._lastX = deviceX;
    this._lastY = deviceY;
    this._lastTouchDistance = -1.0;
    this._touchSingle = true;
  }

  /**
   * 도발 거리 측정
   * @return Flick 거리
   */
  public getFlickDistance(): number {
    return this.calculateDistance(
      this._startX,
      this._startY,
      this._lastX,
      this._lastY
    );
  }

  /**
   * 지점 1에서 2 점까지의 거리를 찾으십시오.
   *
   * @param x1 첫 번째 터치 된 화면에서 x 값
   * @param y1 첫 번째 터치 된 화면에서 Y의 값
   * @param x2 두 번째 터치 된 화면에서 x 값
   * @param y2 두 번째 터치 된 화면에서 Y의 값
   */
  public calculateDistance(
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
  }

  /**
   * 두 번째 값에서 움직임의 양을 찾으십시오.
   * 다른 방향 인 경우 이동량은 0입니다. 동일한 방향 인 경우 절대 값이 낮은 값을 참조하십시오.
   *
   * @param v1 첫 번째 움직임 금액
   * @param v2 두 번째 이동 금액
   *
   * @작은 움직임 금액
   */
  public calculateMovingAmount(v1: number, v2: number): number {
    if (v1 > 0.0 != v2 > 0.0) {
      return 0.0;
    }

    const sign: number = v1 > 0.0 ? 1.0 : -1.0;
    const absoluteValue1 = Math.abs(v1);
    const absoluteValue2 = Math.abs(v2);
    return (
      sign * (absoluteValue1 < absoluteValue2 ? absoluteValue1 : absoluteValue2)
    );
  }

  _startY: number; // タッチを開始した時のxの値
  _startX: number; // タッチを開始した時のyの値
  _lastX: number; // シングルタッチ時のxの値
  _lastY: number; // シングルタッチ時のyの値
  _lastX1: number; // ダブルタッチ時の一つ目のxの値
  _lastY1: number; // ダブルタッチ時の一つ目のyの値
  _lastX2: number; // ダブルタッチ時の二つ目のxの値
  _lastY2: number; // ダブルタッチ時の二つ目のyの値
  _lastTouchDistance: number; // 2本以上でタッチしたときの指の距離
  _deltaX: number; // 前回の値から今回の値へのxの移動距離。
  _deltaY: number; // 前回の値から今回の値へのyの移動距離。
  _scale: number; // このフレームで掛け合わせる拡大率。拡大操作中以外は1。
  _touchSingle: boolean; // シングルタッチ時はtrue
  _flipAvailable: boolean; // フリップが有効かどうか
}
