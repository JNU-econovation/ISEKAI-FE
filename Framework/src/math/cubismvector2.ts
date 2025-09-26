/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

/**
 * 2차원 벡터형
 *
 * 2차원 벡터형의 기능을 제공합니다.
 */
export class CubismVector2 {
  /**
   * 생성자
   */
  public constructor(
    public x?: number,
    public y?: number
  ) {
    this.x = x == undefined ? 0.0 : x;

    this.y = y == undefined ? 0.0 : y;
  }

  /**
   * 벡터 덧셈
   *
   * @param vector2 덧셈할 벡터 값
   * @return 덧셈 결과 벡터 값
   */
  public add(vector2: CubismVector2): CubismVector2 {
    const ret: CubismVector2 = new CubismVector2(0.0, 0.0);
    ret.x = this.x + vector2.x;
    ret.y = this.y + vector2.y;
    return ret;
  }

  /**
   * 벡터 뺄셈
   *
   * @param vector2 뺄셈할 벡터 값
   * @return 뺄셈 결과 벡터 값
   */
  public substract(vector2: CubismVector2): CubismVector2 {
    const ret: CubismVector2 = new CubismVector2(0.0, 0.0);
    ret.x = this.x - vector2.x;
    ret.y = this.y - vector2.y;
    return ret;
  }

  /**
   * 벡터 곱셈
   *
   * @param vector2 곱셈할 벡터 값
   * @return 곱셈 결과 벡터 값
   */
  public multiply(vector2: CubismVector2): CubismVector2 {
    const ret: CubismVector2 = new CubismVector2(0.0, 0.0);
    ret.x = this.x * vector2.x;
    ret.y = this.y * vector2.y;
    return ret;
  }

  /**
   * 벡터 곱셈(스칼라)
   *
   * @param scalar 곱셈할 스칼라 값
   * @return 곱셈 결과 벡터 값
   */
  public multiplyByScaler(scalar: number): CubismVector2 {
    return this.multiply(new CubismVector2(scalar, scalar));
  }

  /**
   * 벡터 나눗셈
   *
   * @param vector2 나눗셈할 벡터 값
   * @return 나눗셈 결과 벡터 값
   */
  public division(vector2: CubismVector2): CubismVector2 {
    const ret: CubismVector2 = new CubismVector2(0.0, 0.0);
    ret.x = this.x / vector2.x;
    ret.y = this.y / vector2.y;
    return ret;
  }

  /**
   * 벡터 나눗셈(스칼라)
   *
   * @param scalar 나눗셈할 스칼라 값
   * @return 나눗셈 결과 벡터 값
   */
  public divisionByScalar(scalar: number): CubismVector2 {
    return this.division(new CubismVector2(scalar, scalar));
  }

  /**
   * 벡터 길이 가져오기
   *
   * @return 벡터의 길이
   */
  public getLength(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * 벡터 거리 가져오기
   *
   * @param a 점
   * @return 벡터의 거리
   */
  public getDistanceWith(a: CubismVector2): number {
    return Math.sqrt(
      (this.x - a.x) * (this.x - a.x) + (this.y - a.y) * (this.y - a.y)
    );
  }

  /**
   * 내적 계산
   *
   * @param a 값
   * @return 결과
   */
  public dot(a: CubismVector2): number {
    return this.x * a.x + this.y * a.y;
  }

  /**
   * 정규화 적용
   */
  public normalize(): void {
    const length: number = Math.pow(this.x * this.x + this.y * this.y, 0.5);

    this.x = this.x / length;
    this.y = this.y / length;
  }

  /**
   * 동일성 확인 (동일한가?)
   *
   * 값이 동일한가?
   *
   * @param rhs 확인할 값
   * @return true 값이 동일함
   * @return false 값이 동일하지 않음
   */
  public isEqual(rhs: CubismVector2): boolean {
    return this.x == rhs.x && this.y == rhs.y;
  }

  /**
   * 동일성 확인 (동일하지 않은가?)
   *
   * 값이 동일하지 않은가?
   *
   * @param rhs 확인할 값
   * @return true 값이 동일하지 않음
   * @return false 값이 동일함
   */
  public isNotEqual(rhs: CubismVector2): boolean {
    return !this.isEqual(rhs);
  }
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismvector2';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismVector2 = $.CubismVector2;
  export type CubismVector2 = $.CubismVector2;
}