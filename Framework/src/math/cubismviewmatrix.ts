/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { CubismMatrix44 } from './cubismmatrix44';

/**
 * 카메라 위치 변경에 사용하면 편리한 4x4 행렬
 *
 * 카메라 위치 변경에 사용하면 편리한 4x4 행렬 클래스.
 */
export class CubismViewMatrix extends CubismMatrix44 {
  /**
   * 생성자
   */
  public constructor() {
    super();
    this._screenLeft = 0.0;
    this._screenRight = 0.0;
    this._screenTop = 0.0;
    this._screenBottom = 0.0;
    this._maxLeft = 0.0;
    this._maxRight = 0.0;
    this._maxTop = 0.0;
    this._maxBottom = 0.0;
    this._maxScale = 0.0;
    this._minScale = 0.0;
  }

  /**
   * 이동 조정
   *
   * @param x X축 이동량
   * @param y Y축 이동량
   */
  public adjustTranslate(x: number, y: number): void {
    if (this._tr[0] * this._maxLeft + (this._tr[12] + x) > this._screenLeft) {
      x = this._screenLeft - this._tr[0] * this._maxLeft - this._tr[12];
    }

    if (this._tr[0] * this._maxRight + (this._tr[12] + x) < this._screenRight) {
      x = this._screenRight - this._tr[0] * this._maxRight - this._tr[12];
    }

    if (this._tr[5] * this._maxTop + (this._tr[13] + y) < this._screenTop) {
      y = this._screenTop - this._tr[5] * this._maxTop - this._tr[13];
    }

    if (
      this._tr[5] * this._maxBottom + (this._tr[13] + y) >
      this._screenBottom
    ) {
      y = this._screenBottom - this._tr[5] * this._maxBottom - this._tr[13];
    }

    const tr1: Float32Array = new Float32Array([
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      x,
      y,
      0.0,
      1.0
    ]);

    CubismMatrix44.multiply(tr1, this._tr, this._tr);
  }

  /**
   * 확대율 조정
   *
   * @param cx 확대할 X축 중심 위치
   * @param cy 확대할 Y축 중심 위치
   * @param scale 확대율
   */
  public adjustScale(cx: number, cy: number, scale: number): void {
    const maxScale: number = this.getMaxScale();
    const minScale: number = this.getMinScale();

    const targetScale = scale * this._tr[0];

    if (targetScale < minScale) {
      if (this._tr[0] > 0.0) {
        scale = minScale / this._tr[0];
      }
    } else if (targetScale > maxScale) {
      if (this._tr[0] > 0.0) {
        scale = maxScale / this._tr[0];
      }
    }

    const tr1: Float32Array = new Float32Array([
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      cx,
      cy,
      0.0,
      1.0
    ]);

    const tr2: Float32Array = new Float32Array([
      scale,
      0.0,
      0.0,
      0.0,
      0.0,
      scale,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0
    ]);

    const tr3: Float32Array = new Float32Array([
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      -cx,
      -cy,
      0.0,
      1.0
    ]);

    CubismMatrix44.multiply(tr3, this._tr, this._tr);
    CubismMatrix44.multiply(tr2, this._tr, this._tr);
    CubismMatrix44.multiply(tr1, this._tr, this._tr);
  }

  /**
   * 디바이스에 대응하는 논리 좌표상의 범위 설정
   *
   * @param left      왼쪽 X축 위치
   * @param right     오른쪽 X축 위치
   * @param bottom    아래쪽 Y축 위치
   * @param top       위쪽 Y축 위치
   */
  public setScreenRect(
    left: number,
    right: number,
    bottom: number,
    top: number
  ): void {
    this._screenLeft = left;
    this._screenRight = right;
    this._screenBottom = bottom;
    this._screenTop = top;
  }

  /**
   * 디바이스에 대응하는 논리 좌표상의 이동 가능 범위 설정
   * @param left      왼쪽 X축 위치
   * @param right     오른쪽 X축 위치
   * @param bottom    아래쪽 Y축 위치
   * @param top       위쪽 Y축 위치
   */
  public setMaxScreenRect(
    left: number,
    right: number,
    bottom: number,
    top: number
  ): void {
    this._maxLeft = left;
    this._maxRight = right;
    this._maxTop = top;
    this._maxBottom = bottom;
  }

  /**
   * 최대 확대율 설정
   * @param maxScale 최대 확대율
   */
  public setMaxScale(maxScale: number): void {
    this._maxScale = maxScale;
  }

  /**
   * 최소 확대율 설정
   * @param minScale 최소 확대율
   */
  public setMinScale(minScale: number): void {
    this._minScale = minScale;
  }

  /**
   * 최대 확대율 가져오기
   * @return 최대 확대율
   */
  public getMaxScale(): number {
    return this._maxScale;
  }

  /**
   * 최소 확대율 가져오기
   * @return 최소 확대율
   */
  public getMinScale(): number {
    return this._minScale;
  }

  /**
   * 확대율이 최대인지 확인합니다.
   *
   * @return true 확대율이 최대임
   * @return false 확대율이 최대가 아님
   */
  public isMaxScale(): boolean {
    return this.getScaleX() >= this._maxScale;
  }

  /**
   * 확대율이 최소인지 확인합니다.
   *
   * @return true 확대율이 최소임
   * @return false 확대율이 최소가 아님
   */
  public isMinScale(): boolean {
    return this.getScaleX() <= this._minScale;
  }

  /**
   * 디바이스에 대응하는 논리 좌표의 왼쪽 X축 위치를 가져옵니다.
   * @return 디바이스에 대응하는 논리 좌표의 왼쪽 X축 위치
   */
  public getScreenLeft(): number {
    return this._screenLeft;
  }

  /**
   * 디바이스에 대응하는 논리 좌표의 오른쪽 X축 위치를 가져옵니다.
   * @return 디바이스에 대응하는 논리 좌표의 오른쪽 X축 위치
   */
  public getScreenRight(): number {
    return this._screenRight;
  }

  /**
   * 디바이스에 대응하는 논리 좌표의 아래쪽 Y축 위치를 가져옵니다.
   * @return 디바이스에 대응하는 논리 좌표의 아래쪽 Y축 위치
   */
  public getScreenBottom(): number {
    return this._screenBottom;
  }

  /**
   * 디바이스에 대응하는 논리 좌표의 위쪽 Y축 위치를 가져옵니다.
   * @return 디바이스에 대응하는 논리 좌표의 위쪽 Y축 위치
   */
  public getScreenTop(): number {
    return this._screenTop;
  }

  /**
   * 왼쪽 X축 위치의 최대값 가져오기
   * @return 왼쪽 X축 위치의 최대값
   */
  public getMaxLeft(): number {
    return this._maxLeft;
  }

  /**
   * 오른쪽 X축 위치의 최대값 가져오기
   * @return 오른쪽 X축 위치의 최대값
   */
  public getMaxRight(): number {
    return this._maxRight;
  }

  /**
   * 아래쪽 Y축 위치의 최대값 가져오기
   * @return 아래쪽 Y축 위치의 최대값
   */
  public getMaxBottom(): number {
    return this._maxBottom;
  }

  /**
   * 위쪽 Y축 위치의 최대값 가져오기
   * @return 위쪽 Y축 위치의 최대값
   */
  public getMaxTop(): number {
    return this._maxTop;
  }

  private _screenLeft: number; // 디바이스에 대응하는 논리 좌표상의 범위 (왼쪽 X축 위치)
  private _screenRight: number; // 디바이스에 대응하는 논리 좌표상의 범위 (오른쪽 X축 위치)
  private _screenTop: number; // 디바이스에 대응하는 논리 좌표상의 범위 (위쪽 Y축 위치)
  private _screenBottom: number; // 디바이스에 대응하는 논리 좌표상의 범위 (아래쪽 Y축 위치)
  private _maxLeft: number; // 논리 좌표상의 이동 가능 범위 (왼쪽 X축 위치)
  private _maxRight: number; // 논리 좌표상의 이동 가능 범위 (오른쪽 X축 위치)
  private _maxTop: number; // 논리 좌표상의 이동 가능 범위 (위쪽 Y축 위치)
  private _maxBottom: number; // 논리 좌표상의 이동 가능 범위 (아래쪽 Y축 위치)
  private _maxScale: number; // 확대율의 최대값
  private _minScale: number; // 확대율의 최소값
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismviewmatrix';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismViewMatrix = $.CubismViewMatrix;
  export type CubismViewMatrix = $.CubismViewMatrix;
}