/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { CubismMatrix44 } from '../math/cubismmatrix44';
import { CubismModel } from '../model/cubismmodel';
import { csmRect } from '../type/csmrectf';
import { ICubismClippingManager } from './cubismclippingmanager';

/**
 * 모델 그리기를 처리하는 렌더러
 *
 * 서브 클래스에 환경 종속적인 그리기 명령을 기술합니다.
 */
export abstract class CubismRenderer {
  /**
   * 렌더러 인스턴스를 생성하고 가져옵니다.
   *
   * @return 렌더러의 인스턴스
   */
  public static create(): CubismRenderer {
    return null;
  }

  /**
   * 렌더러 인스턴스를 해제합니다.
   */
  public static delete(renderer: CubismRenderer): void {
    renderer = null;
  }

  /**
   * 렌더러 초기화 처리를 실행합니다.
   * 인자로 전달된 모델에서 렌더러 초기화 처리에 필요한 정보를 가져올 수 있습니다.
   * @param model 모델의 인스턴스
   */
  public initialize(model: CubismModel): void {
    this._model = model;
  }

  /**
   * 모델을 그립니다.
   */
  public drawModel(): void {
    if (this.getModel() == null) return;

    this.saveProfile();

    this.doDrawModel();

    this.restoreProfile();
  }

  /**
   * Model-View-Projection 행렬을 설정합니다.
   * 배열은 복제되므로, 원본 배열은 외부에서 파기해도 괜찮습니다.
   * @param matrix44 Model-View-Projection 행렬
   */
  public setMvpMatrix(matrix44: CubismMatrix44): void {
    this._mvpMatrix4x4.setMatrix(matrix44.getArray());
  }

  /**
   * Model-View-Projection 행렬을 가져옵니다.
   * @return Model-View-Projection 행렬
   */
  public getMvpMatrix(): CubismMatrix44 {
    return this._mvpMatrix4x4;
  }

  /**
   * 모델 색상을 설정합니다.
   * 각 색상은 0.0~1.0 사이로 지정합니다 (1.0이 표준 상태).
   * @param red 빨강 채널 값
   * @param green 녹색 채널 값
   * @param blue 파랑 채널 값
   * @param alpha 알파 채널 값
   */
  public setModelColor(
    red: number,
    green: number,
    blue: number,
    alpha: number
  ): void {
    if (red < 0.0) {
      red = 0.0;
    } else if (red > 1.0) {
      red = 1.0;
    }

    if (green < 0.0) {
      green = 0.0;
    } else if (green > 1.0) {
      green = 1.0;
    }

    if (blue < 0.0) {
      blue = 0.0;
    } else if (blue > 1.0) {
      blue = 1.0;
    }

    if (alpha < 0.0) {
      alpha = 0.0;
    } else if (alpha > 1.0) {
      alpha = 1.0;
    }

    this._modelColor.r = red;
    this._modelColor.g = green;
    this._modelColor.b = blue;
    this._modelColor.a = alpha;
  }

  /**
   * 모델 색상을 가져옵니다.
   * 각 색상은 0.0~1.0 사이로 지정합니다 (1.0이 표준 상태).
   *
   * @return RGBA 색상 정보
   */
  public getModelColor(): CubismTextureColor {
    return JSON.parse(JSON.stringify(this._modelColor));
  }

  /**
   * 투명도를 고려한 모델 색상을 계산합니다.
   *
   * @param opacity 투명도
   *
   * @return RGBA 색상 정보
   */
  getModelColorWithOpacity(opacity: number): CubismTextureColor {
    const modelColorRGBA: CubismTextureColor = this.getModelColor();
    modelColorRGBA.a *= opacity;
    if (this.isPremultipliedAlpha()) {
      modelColorRGBA.r *= modelColorRGBA.a;
      modelColorRGBA.g *= modelColorRGBA.a;
      modelColorRGBA.b *= modelColorRGBA.a;
    }
    return modelColorRGBA;
  }

  /**
   * 곱하기 완료된 알파의 활성화/비활성화를 설정합니다.
   * 활성화하려면 true, 비활성화하려면 false를 설정합니다.
   */
  public setIsPremultipliedAlpha(enable: boolean): void {
    this._isPremultipliedAlpha = enable;
  }

  /**
   * 곱하기 완료된 알파의 활성화/비활성화를 가져옵니다.
   * @return true 곱하기 완료된 알파 활성화
   * @return false 곱하기 완료된 알파 비활성화
   */
  public isPremultipliedAlpha(): boolean {
    return this._isPremultipliedAlpha;
  }

  /**
   * 컬링(단면 그리기)의 활성화/비활성화를 설정합니다.
   * 활성화하려면 true, 비활성화하려면 false를 설정합니다.
   */
  public setIsCulling(culling: boolean): void {
    this._isCulling = culling;
  }

  /**
   * 컬링(단면 그리기)의 활성화/비활성화를 가져옵니다.
   * @return true 컬링 활성화
   * @return false 컬링 비활성화
   */
  public isCulling(): boolean {
    return this._isCulling;
  }

  /**
   * 텍스처의 비등방성 필터링 매개변수를 설정합니다.
   * 매개변수 값의 영향은 렌더러 구현에 따라 다릅니다.
   * @param n 매개변수 값
   */
  public setAnisotropy(n: number): void {
    this._anisotropy = n;
  }

  /**
   * 텍스처의 비등방성 필터링 매개변수를 가져옵니다.
   * @return 비등방성 필터링 매개변수
   */
  public getAnisotropy(): number {
    return this._anisotropy;
  }

  /**
   * 렌더링할 모델을 가져옵니다.
   * @return 렌더링할 모델
   */
  public getModel(): CubismModel {
    return this._model;
  }

  /**
   * 마스크 그리기 방식을 변경합니다.
   * false인 경우, 마스크를 하나의 텍스처로 분할하여 렌더링합니다 (기본값).
   * 빠르지만 마스크 개수 상한이 36개로 제한되고 품질이 저하됩니다.
   * true인 경우, 파츠를 그리기 전에 매번 필요한 마스크를 다시 그립니다.
   * 렌더링 품질은 높지만 그리기 처리 부하가 증가합니다.
   * @param high 고정밀 마스크로 전환할지 여부
   */
  public useHighPrecisionMask(high: boolean): void {
    this._useHighPrecisionMask = high;
  }

  /**
   * 마스크 그리기 방식을 가져옵니다.
   * @return true 고정밀 방식
   * @return false 기본값
   */
  public isUsingHighPrecisionMask(): boolean {
    return this._useHighPrecisionMask;
  }

  /**
   * 생성자
   */
  protected constructor() {
    this._isCulling = false;
    this._isPremultipliedAlpha = false;
    this._anisotropy = 0.0;
    this._model = null;
    this._modelColor = new CubismTextureColor();
    this._useHighPrecisionMask = false;

    // 단위 행렬로 초기화
    this._mvpMatrix4x4 = new CubismMatrix44();
    this._mvpMatrix4x4.loadIdentity();
  }

  /**
   * 모델 그리기 구현
   */
  public abstract doDrawModel(): void;

  /**
   * 모델 그리기 직전의 렌더러 상태를 유지합니다.
   */
  protected abstract saveProfile(): void;

  /**
   * 모델 그리기 직전의 렌더러 상태를 복원합니다.
   */
  protected abstract restoreProfile(): void;

  /**
   * 렌더러가 보유한 정적 리소스를 해제합니다.
   */
  public static staticRelease: any;

  protected _mvpMatrix4x4: CubismMatrix44; // Model-View-Projection 행렬
  protected _modelColor: CubismTextureColor; // 모델 자체의 색상 (RGBA)
  protected _isCulling: boolean; // 컬링이 활성화되어 있으면 true
  protected _isPremultipliedAlpha: boolean; // 곱하기 완료된 알파이면 true
  protected _anisotropy: any; // 텍스처의 비등방성 필터링 매개변수
  protected _model: CubismModel; // 렌더링 대상 모델
  protected _useHighPrecisionMask: boolean; // false인 경우 마스크를 한 번에 그리고, true인 경우 마스크는 파츠를 그릴 때마다 다시 씁니다.
}

export enum CubismBlendMode {
  CubismBlendMode_Normal = 0, // 일반
  CubismBlendMode_Additive = 1, // 덧셈
  CubismBlendMode_Multiplicative = 2 // 곱셈
}

/**
 * 텍스처 색상을 RGBA로 다루기 위한 클래스
 */
export class CubismTextureColor {
  /**
   * 생성자
   */
  constructor(r = 1.0, g = 1.0, b = 1.0, a = 1.0) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  r: number; // 빨강 채널
  g: number; // 녹색 채널
  b: number; // 파랑 채널
  a: number; // 알파 채널
}

/**
 * 클리핑 마스크 컨텍스트
 */
export abstract class CubismClippingContext {
  /**
   * 인자 있는 생성자
   */
  public constructor(clippingDrawableIndices: Int32Array, clipCount: number) {
    // 클리핑하는 (=마스크용) Drawable의 인덱스 목록
    this._clippingIdList = clippingDrawableIndices;

    // 마스크 수
    this._clippingIdCount = clipCount;

    this._allClippedDrawRect = new csmRect();
    this._layoutBounds = new csmRect();

    this._clippedDrawableIndexList = [];

    this._matrixForMask = new CubismMatrix44();
    this._matrixForDraw = new CubismMatrix44();

    this._bufferIndex = 0;
  }

  /**
   * 이 마스크를 관리하는 관리자 인스턴스를 가져옵니다.
   * @return 클리핑 매니저의 인스턴스
   */
  public abstract getClippingManager(): ICubismClippingManager;

  /**
   * 소멸자 해당 처리
   */
  public release(): void {
    if (this._layoutBounds != null) {
      this._layoutBounds = null;
    }

    if (this._allClippedDrawRect != null) {
      this._allClippedDrawRect = null;
    }

    if (this._clippedDrawableIndexList != null) {
      this._clippedDrawableIndexList = null;
    }
  }

  /**
   * 이 마스크로 클리핑될 그리기 개체를 추가합니다.
   *
   * @param drawableIndex 클리핑 대상에 추가할 그리기 개체의 인덱스
   */
  public addClippedDrawable(drawableIndex: number) {
    this._clippedDrawableIndexList.push(drawableIndex);
  }

  public _isUsing: boolean; // 현재 그리기 상태에서 마스크 준비가 필요하면 true
  public readonly _clippingIdList: Int32Array; // 클리핑 마스크의 ID 목록
  public _clippingIdCount: number; // 클리핑 마스크 수
  public _layoutChannelIndex: number; // RGBA 중 어느 채널에 이 클립을 배치할지 (0:R, 1:G, 2:B, 3:A)
  public _layoutBounds: csmRect; // 마스크용 채널의 어느 영역에 마스크를 넣을지 (View 좌표 -1~1, UV는 0~1로 수정)
  public _allClippedDrawRect: csmRect; // 이 클리핑으로 클리핑되는 모든 그리기 개체의 둘러싸는 사각형 (매번 업데이트)
  public _matrixForMask: CubismMatrix44; // 마스크 위치 계산 결과를 유지하는 행렬
  public _matrixForDraw: CubismMatrix44; // 그리기 개체 위치 계산 결과를 유지하는 행렬
  public _clippedDrawableIndexList: number[]; // 이 마스크로 클리핑되는 그리기 개체 목록
  public _bufferIndex: number; // 이 마스크가 할당될 렌더 텍스처(프레임 버퍼)나 컬러 버퍼의 인덱스
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismrenderer';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismBlendMode = $.CubismBlendMode;
  export type CubismBlendMode = $.CubismBlendMode;
  export const CubismRenderer = $.CubismRenderer;
  export type CubismRenderer = $.CubismRenderer;
  export const CubismTextureColor = $.CubismTextureColor;
  export type CubismTextureColor = $.CubismTextureColor;
}