/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

/**
 * 4x4 행렬
 *
 * 4x4 행렬의 편리한 클래스.
 */
export class CubismMatrix44 {
  /**
   * 생성자
   */
  public constructor() {
    this._tr = new Float32Array(16); // 4 * 4 크기
    this.loadIdentity();
  }

  /**
   * 받은 두 행렬의 곱셈을 수행합니다.
   *
   * @param a 행렬 a
   * @param b 행렬 b
   * @return 곱셈 결과 행렬
   */
  public static multiply(
    a: Float32Array,
    b: Float32Array,
    dst: Float32Array
  ): void {
    const c: Float32Array = new Float32Array([
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
      0.0
    ]);

    const n = 4;

    for (let i = 0; i < n; ++i) {
      for (let j = 0; j < n; ++j) {
        for (let k = 0; k < n; ++k) {
          c[j + i * 4] += a[k + i * 4] * b[j + k * 4];
        }
      }
    }

    for (let i = 0; i < 16; ++i) {
      dst[i] = c[i];
    }
  }

  /**
   * 단위 행렬로 초기화합니다.
   */
  public loadIdentity(): void {
    const c: Float32Array = new Float32Array([
      1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0,
      1.0
    ]);

    this.setMatrix(c);
  }

  /**
   * 행렬 설정
   *
   * @param tr 16개의 부동 소수점 수로 표현되는 4x4 행렬
   */
  public setMatrix(tr: Float32Array): void {
    for (let i = 0; i < 16; ++i) {
      this._tr[i] = tr[i];
    }
  }

  /**
   * 행렬을 부동 소수점 수 배열로 가져옵니다.
   *
   * @return 16개의 부동 소수점 수로 표현되는 4x4 행렬
   */
  public getArray(): Float32Array {
    return this._tr;
  }

  /**
   * X축 확대율 가져오기
   * @return X축 확대율
   */
  public getScaleX(): number {
    return this._tr[0];
  }

  /**
   * Y축 확대율 가져오기
   *
   * @return Y축 확대율
   */
  public getScaleY(): number {
    return this._tr[5];
  }

  /**
   * X축 이동량 가져오기
   * @return X축 이동량
   */
  public getTranslateX(): number {
    return this._tr[12];
  }

  /**
   * Y축 이동량 가져오기
   * @return Y축 이동량
   */
  public getTranslateY(): number {
    return this._tr[13];
  }

  /**
   * X축 값을 현재 행렬로 계산
   *
   * @param src X축 값
   * @return 현재 행렬로 계산된 X축 값
   */
  public transformX(src: number): number {
    return this._tr[0] * src + this._tr[12];
  }

  /**
   * Y축 값을 현재 행렬로 계산
   *
   * @param src Y축 값
   * @return 현재 행렬로 계산된 Y축 값
   */
  public transformY(src: number): number {
    return this._tr[5] * src + this._tr[13];
  }

  /**
   * X축 값을 현재 행렬로 역계산
   */
  public invertTransformX(src: number): number {
    return (src - this._tr[12]) / this._tr[0];
  }

  /**
   * Y축 값을 현재 행렬로 역계산
   */
  public invertTransformY(src: number): number {
    return (src - this._tr[13]) / this._tr[5];
  }

  /**
   * 현재 행렬 위치를 기준으로 이동
   *
   * 현재 행렬 위치를 기준으로 상대적으로 이동합니다.
   *
   * @param x X축 이동량
   * @param y Y축 이동량
   */
  public translateRelative(x: number, y: number): void {
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
   * 현재 행렬 위치 이동
   *
   * 현재 행렬 위치를 지정한 위치로 이동합니다.
   *
   * @param x X축 이동량
   * @param y y축 이동량
   */
  public translate(x: number, y: number): void {
    this._tr[12] = x;
    this._tr[13] = y;
  }

  /**
   * 현재 행렬의 X축 위치를 지정한 위치로 이동합니다.
   *
   * @param x X축 이동량
   */
  public translateX(x: number): void {
    this._tr[12] = x;
  }

  /**
   * 현재 행렬의 Y축 위치를 지정한 위치로 이동합니다.
   *
   * @param y Y축 이동량
   */
  public translateY(y: number): void {
    this._tr[13] = y;
  }

  /**
   * 현재 행렬의 확대율을 상대적으로 설정합니다.
   *
   * @param x X축 확대율
   * @param y Y축 확대율
   */
  public scaleRelative(x: number, y: number): void {
    const tr1: Float32Array = new Float32Array([
      x,
      0.0,
      0.0,
      0.0,
      0.0,
      y,
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

    CubismMatrix44.multiply(tr1, this._tr, this._tr);
  }

  /**
   * 현재 행렬의 확대율을 지정한 배율로 설정합니다.
   *
   * @param x X축 확대율
   * @param y Y축 확대율
   */
  public scale(x: number, y: number): void {
    this._tr[0] = x;
    this._tr[5] = y;
  }

  /**
   * 인수로 주어진 행렬에 이 행렬을 곱합니다。
   * (인수로 주어진 행렬) * (이 행렬)
   *
   * @note 함수 이름과 실제 계산 내용에 차이가 있으므로 앞으로 계산 순서가 수정될 수 있습니다.
   * @param m 행렬
   */
  public multiplyByMatrix(m: CubismMatrix44): void {
    CubismMatrix44.multiply(m.getArray(), this._tr, this._tr);
  }

  /**
   * 객체 복사본 생성
   */
  public clone(): CubismMatrix44 {
    const cloneMatrix: CubismMatrix44 = new CubismMatrix44();

    for (let i = 0; i < this._tr.length; i++) {
      cloneMatrix._tr[i] = this._tr[i];
    }

    return cloneMatrix;
  }

  protected _tr: Float32Array; // 4x4 행렬 데이터
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismmatrix44';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismMatrix44 = $.CubismMatrix44;
  export type CubismMatrix44 = $.CubismMatrix44;
}