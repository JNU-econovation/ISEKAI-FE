/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

/**
 * 문자열 클래스.
 */
export class csmString {
  /**
   * 문자열을 뒤에 추가합니다.
   *
   * @param c 추가할 문자열
   * @return 갱신된 문자열
   */
  public append(c: string, length?: number): csmString {
    this.s += length !== undefined ? c.substr(0, length) : c;

    return this;
  }

  /**
   * 문자 크기를 확장하고 문자로 채웁니다.
   * @param length    확장할 문자 수
   * @param v         채울 문자
   * @return 갱신된 문자열
   */
  public expansion(length: number, v: string): csmString {
    for (let i = 0; i < length; i++) {
      this.append(v);
    }

    return this;
  }

  /**
   * 문자열 길이를 바이트 수로 가져옵니다.
   */
  public getBytes(): number {
    return encodeURIComponent(this.s).replace(/%../g, 'x').length;
  }

  /**
   * 문자열 길이를 반환합니다.
   */
  public getLength(): number {
    return this.s.length;
  }

  /**
   * 문자열 비교 <
   * @param s 비교할 문자열
   * @return true:    비교할 문자열보다 작음
   * @return false:   비교할 문자열보다 큼
   */
  public isLess(s: csmString): boolean {
    return this.s < s.s;
  }

  /**
   * 문자열 비교 >
   * @param s 비교할 문자열
   * @return true:    비교할 문자열보다 큼
   * @return false:   비교할 문자열보다 작음
   */
  public isGreat(s: csmString): boolean {
    return this.s > s.s;
  }

  /**
   * 문자열 비교 ==
   * @param s 비교할 문자열
   * @return true:    비교할 문자열과 같음
   * @return false:   비교할 문자열과 다름
   */
  public isEqual(s: string): boolean {
    return this.s == s;
  }

  /**
   * 문자열이 비어 있는지 여부
   * @return true: 빈 문자열
   * @return false: 값이 설정되어 있음
   */
  public isEmpty(): boolean {
    return this.s.length == 0;
  }

  /**
   * 인자 있는 생성자
   */
  public constructor(s: string) {
    this.s = s;
  }

  s: string;
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './csmstring';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const csmString = $.csmString;
  export type csmString = $.csmString;
}