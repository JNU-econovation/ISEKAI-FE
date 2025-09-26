/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { CubismVector2 } from './cubismvector2';

/**
 * 수치 계산 등에 사용하는 유틸리티 클래스
 */
export class CubismMath {
  static readonly Epsilon: number = 0.00001;

  /**
   * 첫 번째 인수의 값을 최소값과 최대값 범위로 제한한 값을 반환합니다.
   *
   * @param value 제한할 값
   * @param min   범위의 최소값
   * @param max   범위의 최대값
   * @return 최소값과 최대값 범위로 제한된 값
   */
  static range(value: number, min: number, max: number): number {
    if (value < min) {
      value = min;
    } else if (value > max) {
      value = max;
    }

    return value;
  }

  /**
   * 사인 함수 값을 구합니다.
   *
   * @param x 앵글 값 (라디안)
   * @return 사인 함수 sin(x)의 값
   */
  static sin(x: number): number {
    return Math.sin(x);
  }

  /**
   * 코사인 함수 값을 구합니다.
   *
   * @param x 앵글 값(라디안)
   * @return 코사인 함수 cos(x)의 값
   */
  static cos(x: number): number {
    return Math.cos(x);
  }

  /**
   * 값의 절대값을 구합니다.
   *
   * @param x 절대값을 구할 값
   * @return 값의 절대값
   */
  static abs(x: number): number {
    return Math.abs(x);
  }

  /**
   * 제곱근(루트)을 구합니다.
   * @param x -> 제곱근을 구할 값
   * @return 값의 제곱근
   */
  static sqrt(x: number): number {
    return Math.sqrt(x);
  }

  /**
   * 세제곱근을 구합니다.
   * @param x -> 세제곱근을 구할 값
   * @return 값의 세제곱근
   */
  static cbrt(x: number): number {
    if (x === 0) {
      return x;
    }

    let cx: number = x;
    const isNegativeNumber: boolean = cx < 0;

    if (isNegativeNumber) {
      cx = -cx;
    }

    let ret: number;
    if (cx === Infinity) {
      ret = Infinity;
    } else {
      ret = Math.exp(Math.log(cx) / 3);
      ret = (cx / (ret * ret) + 2 * ret) / 3;
    }
    return isNegativeNumber ? -ret : ret;
  }

  /**
   * 이징 처리된 사인을 구합니다.
   * 페이드인·아웃 시의 이징에 이용할 수 있습니다.
   *
   * @param value 이징을 수행할 값
   * @return 이징 처리된 사인 값
   */
  static getEasingSine(value: number): number {
    if (value < 0.0) {
      return 0.0;
    } else if (value > 1.0) {
      return 1.0;
    }

    return 0.5 - 0.5 * this.cos(value * Math.PI);
  }

  /**
   * 더 큰 값을 반환합니다.
   *
   * @param left 왼쪽 값
   * @param right 오른쪽 값
   * @return 더 큰 값
   */
  static max(left: number, right: number): number {
    return left > right ? left : right;
  }

  /**
   * 더 작은 값을 반환합니다.
   *
   * @param left  왼쪽 값
   * @param right 오른쪽 값
   * @return 더 작은 값
   */
  static min(left: number, right: number): number {
    return left > right ? right : left;
  }

  public static clamp(val: number, min: number, max: number): number {
    if (val < min) {
      return min;
    } else if (max < val) {
      return max;
    }
    return val;
  }

  /**
   * 각도 값을 라디안 값으로 변환합니다.
   *
   * @param degrees   각도 값
   * @return 각도 값에서 변환된 라디안 값
   */
  static degreesToRadian(degrees: number): number {
    return (degrees / 180.0) * Math.PI;
  }

  /**
   * 라디안 값을 각도 값으로 변환합니다.
   *
   * @param radian    라디안 값
   * @return 라디안 값에서 변환된 각도 값
   */
  static radianToDegrees(radian: number): number {
    return (radian * 180.0) / Math.PI;
  }

  /**
   * 두 벡터에서 라디안 값을 구합니다.
   *
   * @param from  시작 벡터
   * @param to    끝 벡터
   * @return 라디안 값에서 구한 방향 벡터
   */
  static directionToRadian(from: CubismVector2, to: CubismVector2): number {
    const q1: number = Math.atan2(to.y, to.x);
    const q2: number = Math.atan2(from.y, from.x);

    let ret: number = q1 - q2;

    while (ret < -Math.PI) {
      ret += Math.PI * 2.0;
    }

    while (ret > Math.PI) {
      ret -= Math.PI * 2.0;
    }

    return ret;
  }

  /**
   * 두 벡터에서 각도 값을 구합니다.
   *
   * @param from  시작 벡터
   * @param to    끝 벡터
   * @return 각도 값에서 구한 방향 벡터
   */
  static directionToDegrees(from: CubismVector2, to: CubismVector2): number {
    const radian: number = this.directionToRadian(from, to);
    let degree: number = this.radianToDegrees(radian);

    if (to.x - from.x > 0.0) {
      degree = -degree;
    }

    return degree;
  }

  /**
   * 라디안 값을 방향 벡터로 변환합니다.
   *
   * @param totalAngle    라디안 값
   * @return 라디안 값에서 변환된 방향 벡터
   */

  static radianToDirection(totalAngle: number): CubismVector2 {
    const ret: CubismVector2 = new CubismVector2();

    ret.x = this.sin(totalAngle);
    ret.y = this.cos(totalAngle);

    return ret;
  }

  /**
   * 삼차 방정식의 삼차항 계수가 0이 되었을 때 보조적으로 이차 방정식의 해를 구합니다.
   * a * x^2 + b * x + c = 0
   *
   * @param   a -> 이차항의 계수 값
   * @param   b -> 일차항의 계수 값
   * @param   c -> 상수항의 값
   * @return  이차 방정식의 해
   */
  static quadraticEquation(a: number, b: number, c: number): number {
    if (this.abs(a) < CubismMath.Epsilon) {
      if (this.abs(b) < CubismMath.Epsilon) {
        return -c;
      }
      return -c / b;
    }

    return -(b + this.sqrt(b * b - 4.0 * a * c)) / (2.0 * a);
  }

  /**
   * 카르다노의 공식으로 베지어의 t값에 해당하는 3차 방정식의 해를 구합니다.
   * 중근일 때는 0.0～1.0의 값이 되는 해를 반환합니다.
   *
   * a * x^3 + b * x^2 + c * x + d = 0
   *
   * @param   a -> 삼차항의 계수 값
   * @param   b -> 이차항의 계수 값
   * @param   c -> 일차항의 계수 값
   * @param   d -> 상수항의 값
   * @return  0.0～1.0 사이의 해
   */
  static cardanoAlgorithmForBezier(
    a: number,
    b: number,
    c: number,
    d: number
  ): number {
    if (this.abs(a) < CubismMath.Epsilon) {
      return this.range(this.quadraticEquation(b, c, d), 0.0, 1.0);
    }

    const ba: number = b / a;
    const ca: number = c / a;
    const da: number = d / a;

    const p: number = (3.0 * ca - ba * ba) / 3.0;
    const p3: number = p / 3.0;
    const q: number = (2.0 * ba * ba * ba - 9.0 * ba * ca + 27.0 * da) / 27.0;
    const q2: number = q / 2.0;
    const discriminant: number = q2 * q2 + p3 * p3 * p3;

    const center = 0.5;
    const threshold: number = center + 0.01;

    if (discriminant < 0.0) {
      const mp3: number = -p / 3.0;
      const mp33: number = mp3 * mp3 * mp3;
      const r: number = this.sqrt(mp33);
      const t: number = -q / (2.0 * r);
      const cosphi: number = this.range(t, -1.0, 1.0);
      const phi: number = Math.acos(cosphi);
      const crtr: number = this.cbrt(r);
      const t1: number = 2.0 * crtr;

      const root1: number = t1 * this.cos(phi / 3.0) - ba / 3.0;
      if (this.abs(root1 - center) < threshold) {
        return this.range(root1, 0.0, 1.0);
      }

      const root2: number =
        t1 * this.cos((phi + 2.0 * Math.PI) / 3.0) - ba / 3.0;
      if (this.abs(root2 - center) < threshold) {
        return this.range(root2, 0.0, 1.0);
      }

      const root3: number =
        t1 * this.cos((phi + 4.0 * Math.PI) / 3.0) - ba / 3.0;
      return this.range(root3, 0.0, 1.0);
    }

    if (discriminant == 0.0) {
      let u1: number;
      if (q2 < 0.0) {
        u1 = this.cbrt(-q2);
      } else {
        u1 = -this.cbrt(q2);
      }

      const root1: number = 2.0 * u1 - ba / 3.0;
      if (this.abs(root1 - center) < threshold) {
        return this.range(root1, 0.0, 1.0);
      }

      const root2: number = -u1 - ba / 3.0;
      return this.range(root2, 0.0, 1.0);
    }

    const sd: number = this.sqrt(discriminant);
    const u1: number = this.cbrt(sd - q2);
    const v1: number = this.cbrt(sd + q2);
    const root1: number = u1 - v1 - ba / 3.0;
    return this.range(root1, 0.0, 1.0);
  }

  /**
   * 부동 소수점의 나머지를 구합니다.
   *
   * @param dividend 피제수 (나누어지는 값)
   * @param divisor 제수 (나누는 값)
   * @returns 나머지
   */
  static mod(dividend: number, divisor: number): number {
    if (
      !isFinite(dividend) ||
      divisor === 0 ||
      isNaN(dividend) ||
      isNaN(divisor)
    ) {
      console.warn(
        `divided: ${dividend}, divisor: ${divisor} mod() returns 'NaN'.`
      );
      return NaN;
    }

    // 절대값으로 변환합니다.
    const absDividend = Math.abs(dividend);
    const absDivisor = Math.abs(divisor);

    // 절대값으로 나눕니다.
    let result =
      absDividend - Math.floor(absDividend / absDivisor) * absDivisor;

    // 부호를 피제수의 것으로 지정합니다.
    result *= Math.sign(dividend);
    return result;
  }

  /**
   * 생성자
   */
  private constructor() {}
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismmath';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismMath = $.CubismMath;
  export type CubismMath = $.CubismMath;
}