/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

export class CubismString {
  /**
   * 표준 출력 서식을 적용한 문자열을 가져옵니다.
   * @param format    표준 출력 서식 지정 문자열
   * @param ...args   서식 지정 문자열에 전달할 문자열
   * @return 서식을 적용한 문자열
   */
  public static getFormatedString(format: string, ...args: any[]): string {
    const ret: string = format;
    return ret.replace(
      /\{(\d+)\}/g,
      (
        m,
        k // m="{0}", k="0"
      ) => {
        return args[k];
      }
    );
  }

  /**
   * text가 startWord로 시작하는지 여부를 반환합니다.
   * @param text      검사할 문자열
   * @param startWord 비교할 문자열
   * @return true     text가 startWord로 시작하는 경우
   * @return false    text가 startWord로 시작하지 않는 경우
   */
  public static isStartWith(text: string, startWord: string): boolean {
    let textIndex = 0;
    let startWordIndex = 0;
    while (startWord[startWordIndex] != '\0') {
      if (
        text[textIndex] == '\0' ||
        text[textIndex++] != startWord[startWordIndex++]
      ) {
        return false;
      }
    }
    return false;
  }

  /**
   * position 위치의 문자부터 숫자를 분석합니다.
   *
   * @param string    문자열
   * @param length    문자열 길이
   * @param position  분석하려는 문자의 위치
   * @param outEndPos 한 글자도 읽지 않은 경우 오류 값(-1)이 들어갑니다.
   * @return          분석 결과 숫자
   */
  public static stringToFloat(
    string: string,
    length: number,
    position: number,
    outEndPos: number[]
  ): number {
    let i: number = position;
    let minus = false; // 마이너스 플래그
    let period = false;
    let v1 = 0;

    // 음수 부호 확인
    let c: number = parseInt(string[i]);
    if (c < 0) {
      minus = true;
      i++;
    }

    // 정수 부분 확인
    for (; i < length; i++) {
      const c = string[i];
      if (0 <= parseInt(c) && parseInt(c) <= 9) {
        v1 = v1 * 10 + (parseInt(c) - 0);
      } else if (c == '.') {
        period = true;
        i++;
        break;
      } else {
        break;
      }
    }

    // 소수 부분 확인
    if (period) {
      let mul = 0.1;
      for (; i < length; i++) {
        c = parseFloat(string[i]) & 0xff;
        if (0 <= c && c <= 9) {
          v1 += mul * (c - 0);
        } else {
          break;
        }
        mul *= 0.1; // 한 자릿수 내림
        if (!c) break;
      }
    }

    if (i == position) {
      // 한 글자도 읽지 않은 경우
      outEndPos[0] = -1; // 오류 값이 들어가므로 호출 측에서 적절한 처리를 수행해야 합니다.
      return 0;
    }

    if (minus) v1 = -v1;

    outEndPos[0] = i;
    return v1;
  }

  /**
   * 생성자 호출이 불가능한 정적 클래스로 만듭니다.
   */
  private constructor() {}
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismstring';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismString = $.CubismString;
  export type CubismString = $.CubismString;
}