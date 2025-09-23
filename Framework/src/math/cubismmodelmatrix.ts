/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { csmMap, iterator } from '../type/csmmap';
import { CubismMatrix44 } from './cubismmatrix44';

/**
 * 모델 좌표 설정용 4x4 행렬
 *
 * 모델 좌표 설정용 4x4 행렬 클래스
 */
export class CubismModelMatrix extends CubismMatrix44 {
  /**
   * 생성자
   *
   * @param w 너비
   * @param h 높이
   */
  constructor(w?: number, h?: number) {
    super();

    this._width = w !== undefined ? w : 0.0;
    this._height = h !== undefined ? h : 0.0;

    this.setHeight(2.0);
  }

  /**
   * 너비 설정
   *
   * @param w 너비
   */
  public setWidth(w: number): void {
    const scaleX: number = w / this._width;
    const scaleY: number = scaleX;
    this.scale(scaleX, scaleY);
  }

  /**
   * 높이 설정
   * @param h 높이
   */
  public setHeight(h: number): void {
    const scaleX: number = h / this._height;
    const scaleY: number = scaleX;
    this.scale(scaleX, scaleY);
  }

  /**
   * 위치 설정
   *
   * @param x X축 위치
   * @param y Y축 위치
   */
  public setPosition(x: number, y: number): void {
    this.translate(x, y);
  }

  /**
   * 중심 위치 설정
   *
   * @param x X축 중심 위치
   * @param y Y축 중심 위치
   *
   * @note 너비 또는 높이를 설정한 후가 아니면 확대율을 올바르게 가져올 수 없어 어긋납니다.
   */
  public setCenterPosition(x: number, y: number) {
    this.centerX(x);
    this.centerY(y);
  }

  /**
   * 윗변 위치 설정
   *
   * @param y 윗변의 Y축 위치
   */
  public top(y: number): void {
    this.setY(y);
  }

  /**
   * 아랫변 위치 설정
   *
   * @param y 아랫변의 Y축 위치
   */
  public bottom(y: number) {
    const h: number = this._height * this.getScaleY();

    this.translateY(y - h);
  }

  /**
   * 왼쪽 변 위치 설정
   *
   * @param x 왼쪽 변의 X축 위치
   */
  public left(x: number): void {
    this.setX(x);
  }

  /**
   * 오른쪽 변 위치 설정
   *
   * @param x 오른쪽 변의 X축 위치
   */
  public right(x: number): void {
    const w = this._width * this.getScaleX();

    this.translateX(x - w);
  }

  /**
   * X축 중심 위치 설정
   *
   * @param x X축 중심 위치
   */
  public centerX(x: number): void {
    const w = this._width * this.getScaleX();

    this.translateX(x - w / 2.0);
  }

  /**
   * X축 위치 설정
   *
   * @param x X축 위치
   */
  public setX(x: number): void {
    this.translateX(x);
  }

  /**
   * Y축 중심 위치 설정
   *
   * @param y Y축 중심 위치
   */
  public centerY(y: number): void {
    const h: number = this._height * this.getScaleY();

    this.translateY(y - h / 2.0);
  }

  /**
   * Y축 위치 설정
   *
   * @param y Y축 위치
   */
  public setY(y: number): void {
    this.translateY(y);
  }

  /**
   * 레이아웃 정보에서 위치 설정
   *
   * @param layout 레이아웃 정보
   */
  public setupFromLayout(layout: csmMap<string, number>): void {
    const keyWidth = 'width';
    const keyHeight = 'height';
    const keyX = 'x';
    const keyY = 'y';
    const keyCenterX = 'center_x';
    const keyCenterY = 'center_y';
    const keyTop = 'top';
    const keyBottom = 'bottom';
    const keyLeft = 'left';
    const keyRight = 'right';

    for (
      const ite: iterator<string, number> = layout.begin();
      ite.notEqual(layout.end());
      ite.preIncrement()
    ) {
      const key: string = ite.ptr().first;
      const value: number = ite.ptr().second;

      if (key == keyWidth) {
        this.setWidth(value);
      } else if (key == keyHeight) {
        this.setHeight(value);
      }
    }

    for (
      const ite: iterator<string, number> = layout.begin();
      ite.notEqual(layout.end());
      ite.preIncrement()
    ) {
      const key: string = ite.ptr().first;
      const value: number = ite.ptr().second;

      if (key == keyX) {
        this.setX(value);
      } else if (key == keyY) {
        this.setY(value);
      } else if (key == keyCenterX) {
        this.centerX(value);
      } else if (key == keyCenterY) {
        this.centerY(value);
      } else if (key == keyTop) {
        this.top(value);
      } else if (key == keyBottom) {
        this.bottom(value);
      } else if (key == keyLeft) {
        this.left(value);
      } else if (key == keyRight) {
        this.right(value);
      }
    }
  }

  private _width: number; // 너비
  private _height: number; // 높이
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismmodelmatrix';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismModelMatrix = $.CubismModelMatrix;
  export type CubismModelMatrix = $.CubismModelMatrix;
}