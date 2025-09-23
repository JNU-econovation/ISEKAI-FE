/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

/**
 * 사각형 모양(좌표, 길이는 float 값)을 정의하는 클래스
 */
export class csmRect {
  /**
   * 생성자
   * @param x 왼쪽 끝 X좌표
   * @param y 위쪽 끝 Y좌표
   * @param w 너비
   * @param h 높이
   */
  public constructor(x?: number, y?: number, w?: number, h?: number) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }

  /**
   * 사각형 중앙의 X좌표를 가져옵니다.
   */
  public getCenterX(): number {
    return this.x + 0.5 * this.width;
  }

  /**
   * 사각형 중앙의 Y좌표를 가져옵니다.
   */
  public getCenterY(): number {
    return this.y + 0.5 * this.height;
  }

  /**
   * 오른쪽 X좌표를 가져옵니다.
   */
  public getRight(): number {
    return this.x + this.width;
  }

  /**
   * 아래쪽 끝의 Y좌표를 가져옵니다.
   */
  public getBottom(): number {
    return this.y + this.height;
  }

  /**
   * 사각형에 값을 설정합니다.
   * @param r 사각형의 인스턴스
   */
  public setRect(r: csmRect): void {
    this.x = r.x;
    this.y = r.y;
    this.width = r.width;
    this.height = r.height;
  }

  /**
   * 사각형 중앙을 축으로 가로, 세로를 확대/축소합니다.
   * @param w 너비 방향으로 확대/축소할 양
   * @param h 높이 방향으로 확대/축소할 양
   */
  public expand(w: number, h: number) {
    this.x -= w;
    this.y -= h;
    this.width += w * 2.0;
    this.height += h * 2.0;
  }

  public x: number; // 왼쪽 끝 X좌표
  public y: number; // 위쪽 끝 Y좌표
  public width: number; // 너비
  public height: number; // 높이
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './csmrectf';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const csmRect = $.csmRect;
  export type csmRect = $.csmRect;
}