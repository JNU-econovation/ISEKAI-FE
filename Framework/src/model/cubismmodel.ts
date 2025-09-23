/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { CubismIdHandle } from '../id/cubismid';
import { CubismFramework } from '../live2dcubismframework';
import { CubismMath } from '../math/cubismmath';
import {
  CubismBlendMode,
  CubismTextureColor
} from '../rendering/cubismrenderer';
import { csmMap } from '../type/csmmap';
import { csmVector } from '../type/csmvector';
import { CSM_ASSERT, CubismLogWarning } from '../utils/cubismdebug';

/**
 * 파라미터 반복 설정의 덮어쓰기를 관리하기 위한 구조체
 */
export class ParameterRepeatData {
  /**
   * 생성자
   *
   * @param isOverridden 덮어쓸지 여부
   * @param isParameterRepeated 설정 덮어쓰기 플래그
   */
  public constructor(
    isOverridden: boolean = false,
    isParameterRepeated: boolean = false
  ) {
    this.isOverridden = isOverridden;
    this.isParameterRepeated = isParameterRepeated;
  }

  /**
   * 덮어쓸지 여부
   */
  public isOverridden: boolean;

  /**
   * 설정 덮어쓰기 플래그
   */
  public isParameterRepeated: boolean;
}

/**
 * SDK에서 주어진 Drawable의 곱셈색·스크린색 덮어쓰기 플래그와
 * 그 색을 유지하는 구조체
 */
export class DrawableColorData {
  constructor(
    isOverridden = false,
    color: CubismTextureColor = new CubismTextureColor()
  ) {
    this.isOverridden = isOverridden;
    this.color = color;
  }

  public isOverridden: boolean;
  public color: CubismTextureColor;

  get isOverwritten(): boolean {
    return this.isOverridden;
  }
}
/**
 * @brief 텍스처 색상을 RGBA로 다루기 위한 구조체
 */
export class PartColorData {
  constructor(
    isOverridden = false,
    color: CubismTextureColor = new CubismTextureColor()
  ) {
    this.isOverridden = isOverridden;
    this.color = color;
  }

  public isOverridden: boolean;
  public color: CubismTextureColor;

  get isOverwritten(): boolean {
    return this.isOverridden;
  }
}

/**
 * 텍스처의 컬링 설정을 관리하기 위한 구조체
 */
export class DrawableCullingData {
  /**
   * 생성자
   *
   * @param isOverridden
   * @param isCulling
   */
  public constructor(isOverridden = false, isCulling = false) {
    this.isOverridden = isOverridden;
    this.isCulling = isCulling;
  }

  public isOverridden: boolean;
  public isCulling: boolean;

  get isOverwritten(): boolean {
    return this.isOverridden;
  }
}

/**
 * 모델
 *
 * Moc 데이터에서 생성되는 모델 클래스.
 */
export class CubismModel {
  /**
   * 모델 파라미터 업데이트
   */
  public update(): void {
    // Update model
    this._model.update();

    this._model.drawables.resetDynamicFlags();
  }

  /**
   * PixelsPerUnit 가져오기
   * @returns PixelsPerUnit
   */
  public getPixelsPerUnit(): number {
    if (this._model == null) {
      return 0.0;
    }

    return this._model.canvasinfo.PixelsPerUnit;
  }

  /**
   * 캔버스 너비 가져오기
   */
  public getCanvasWidth(): number {
    if (this._model == null) {
      return 0.0;
    }

    return (
      this._model.canvasinfo.CanvasWidth / this._model.canvasinfo.PixelsPerUnit
    );
  }

  /**
   * 캔버스 높이 가져오기
   */
  public getCanvasHeight(): number {
    if (this._model == null) {
      return 0.0;
    }

    return (
      this._model.canvasinfo.CanvasHeight / this._model.canvasinfo.PixelsPerUnit
    );
  }

  /**
   * 파라미터 저장
   */
  public saveParameters(): void {
    const parameterCount: number = this._model.parameters.count;
    const savedParameterCount: number = this._savedParameters.getSize();

    for (let i = 0; i < parameterCount; ++i) {
      if (i < savedParameterCount) {
        this._savedParameters.set(i, this._parameterValues[i]);
      } else {
        this._savedParameters.pushBack(this._parameterValues[i]);
      }
    }
  }

  /**
   * 곱셈색 가져오기
   * @param index Drawables의 인덱스
   * @returns 지정한 drawable의 곱셈색(RGBA)
   */
  public getMultiplyColor(index: number): CubismTextureColor {
    // Drawable과 모델 전체의 곱셈색 덮어쓰기 플래그가 모두 true인 경우, 모델 전체의 덮어쓰기 플래그가 우선됩니다.
    if (
      this.getOverrideFlagForModelMultiplyColors() ||
      this.getOverrideFlagForDrawableMultiplyColors(index)
    ) {
      return this._userMultiplyColors.at(index).color;
    }

    const color = this.getDrawableMultiplyColor(index);
    return color;
  }

  /**
   * 스크린색 가져오기
   * @param index Drawables의 인덱스
   * @returns 지정한 drawable의 스크린색(RGBA)
   */
  public getScreenColor(index: number): CubismTextureColor {
    // Drawable과 모델 전체의 스크린색 덮어쓰기 플래그가 모두 true인 경우, 모델 전체의 덮어쓰기 플래그가 우선됩니다.
    if (
      this.getOverrideFlagForModelScreenColors() ||
      this.getOverrideFlagForDrawableScreenColors(index)
    ) {
      return this._userScreenColors.at(index).color;
    }

    const color = this.getDrawableScreenColor(index);
    return color;
  }

  /**
   * 곱셈색 설정
   * @param index Drawables의 인덱스
   * @param color 설정할 곱셈색(CubismTextureColor)
   */
  public setMultiplyColorByTextureColor(
    index: number,
    color: CubismTextureColor
  ) {
    this.setMultiplyColorByRGBA(index, color.r, color.g, color.b, color.a);
  }

  /**
   * 곱셈색 설정
   * @param index Drawables의 인덱스
   * @param r 설정할 곱셈색의 R값
   * @param g 설정할 곱셈색의 G값
   * @param b 설정할 곱셈색의 B값
   * @param a 설정할 곱셈색의 A값
   */
  public setMultiplyColorByRGBA(
    index: number,
    r: number,
    g: number,
    b: number,
    a = 1.0
  ) {
    this._userMultiplyColors.at(index).color.r = r;
    this._userMultiplyColors.at(index).color.g = g;
    this._userMultiplyColors.at(index).color.b = b;
    this._userMultiplyColors.at(index).color.a = a;
  }

  /**
   * 스크린색 설정
   * @param index Drawables의 인덱스
   * @param color 설정할 스크린색(CubismTextureColor)
   */
  public setScreenColorByTextureColor(
    index: number,
    color: CubismTextureColor
  ) {
    this.setScreenColorByRGBA(index, color.r, color.g, color.b, color.a);
  }

  /**
   * 스크린색 설정
   * @param index Drawables의 인덱스
   * @param r 설정할 스크린색의 R값
   * @param g 설정할 스크린색의 G값
   * @param b 설정할 스크린색의 B값
   * @param a 설정할 스크린색의 A값
   */
  public setScreenColorByRGBA(
    index: number,
    r: number,
    g: number,
    b: number,
    a = 1.0
  ) {
    this._userScreenColors.at(index).color.r = r;
    this._userScreenColors.at(index).color.g = g;
    this._userScreenColors.at(index).color.b = b;
    this._userScreenColors.at(index).color.a = a;
  }
  /**
   * part의 곱셈색 가져오기
   * @param partIndex part의 인덱스
   * @returns 지정한 part의 곱셈색
   */
  public getPartMultiplyColor(partIndex: number): CubismTextureColor {
    return this._userPartMultiplyColors.at(partIndex).color;
  }

  /**
   * part의 스크린색 가져오기
   * @param partIndex part의 인덱스
   * @returns 지정한 part의 스크린색
   */
  public getPartScreenColor(partIndex: number): CubismTextureColor {
    return this._userPartScreenColors.at(partIndex).color;
  }

  /**
   * part의 OverrideColor setter 함수
   * @param partIndex part의 인덱스
   * @param r 설정할 색의 R값
   * @param g 설정할 색의 G값
   * @param b 설정할 색의 B값
   * @param a 설정할 색의 A값
   * @param partColors 설정할 part의 컬러 데이터 배열
   * @param drawableColors part에 관련된 Drawable의 컬러 데이터 배열
   */
  public setPartColor(
    partIndex: number,
    r: number,
    g: number,
    b: number,
    a: number,
    partColors: csmVector<PartColorData>,
    drawableColors: csmVector<DrawableColorData>
  ) {
    partColors.at(partIndex).color.r = r;
    partColors.at(partIndex).color.g = g;
    partColors.at(partIndex).color.b = b;
    partColors.at(partIndex).color.a = a;

    if (partColors.at(partIndex).isOverridden) {
      for (
        let i = 0;
        i < this._partChildDrawables.at(partIndex).getSize();
        ++i
      ) {
        const drawableIndex = this._partChildDrawables.at(partIndex).at(i);
        drawableColors.at(drawableIndex).color.r = r;
        drawableColors.at(drawableIndex).color.g = g;
        drawableColors.at(drawableIndex).color.b = b;
        drawableColors.at(drawableIndex).color.a = a;
      }
    }
  }

  /**
   * 곱셈색 설정
   * @param partIndex part의 인덱스
   * @param color 설정할 곱셈색(CubismTextureColor)
   */
  public setPartMultiplyColorByTextureColor(
    partIndex: number,
    color: CubismTextureColor
  ) {
    this.setPartMultiplyColorByRGBA(
      partIndex,
      color.r,
      color.g,
      color.b,
      color.a
    );
  }

  /**
   * 곱셈색 설정
   * @param partIndex part의 인덱스
   * @param r 설정할 곱셈색의 R값
   * @param g 설정할 곱셈색의 G값
   * @param b 설정할 곱셈색의 B값
   * @param a 설정할 곱셈색의 A값
   */
  public setPartMultiplyColorByRGBA(
    partIndex: number,
    r: number,
    g: number,
    b: number,
    a: number
  ) {
    this.setPartColor(
      partIndex,
      r,
      g,
      b,
      a,
      this._userPartMultiplyColors,
      this._userMultiplyColors
    );
  }

  /**
   * 스크린색 설정
   * @param partIndex part의 인덱스
   * @param color 설정할 스크린색(CubismTextureColor)
   */
  public setPartScreenColorByTextureColor(
    partIndex: number,
    color: CubismTextureColor
  ) {
    this.setPartScreenColorByRGBA(
      partIndex,
      color.r,
      color.g,
      color.b,
      color.a
    );
  }

  /**
   * 스크린색 설정
   * @param partIndex part의 인덱스
   * @param r 설정할 스크린색의 R값
   * @param g 설정할 스크린색의 G값
   * @param b 설정할 스크린색의 B값
   * @param a 설정할 스크린색의 A값
   */
  public setPartScreenColorByRGBA(
    partIndex: number,
    r: number,
    g: number,
    b: number,
    a: number
  ) {
    this.setPartColor(
      partIndex,
      r,
      g,
      b,
      a,
      this._userPartScreenColors,
      this._userScreenColors
    );
  }

  /**
   * 모델 전체에 대해 파라미터 반복이 수행되는지 확인합니다.
   *
   * @return true인 경우 모델 전체에 대해 파라미터 반복이 수행되고, 그렇지 않으면 false를 반환합니다.
   */
  public getOverrideFlagForModelParameterRepeat(): boolean {
    return this._isOverriddenParameterRepeat;
  }

  /**
   * 모델 전체에 대해 파라미터 반복을 수행할지 설정합니다.
   * 모델 전체에 대해 파라미터 반복을 수행하려면 true, 그렇지 않으면 false를 사용합니다.
   */
  public setOverrideFlagForModelParameterRepeat(isRepeat: boolean): void {
    this._isOverriddenParameterRepeat = isRepeat;
  }

  /**
   * 파라미터 반복을 덮어쓸지 여부를 나타내는 플래그를 반환합니다.
   *
   * @param parameterIndex 파라미터 인덱스
   *
   * @return true인 경우 파라미터 반복이 덮어쓰기되고, 그렇지 않으면 false를 반환합니다.
   */
  public getOverrideFlagForParameterRepeat(parameterIndex: number): boolean {
    return this._userParameterRepeatDataList.at(parameterIndex).isOverridden;
  }

  /**
   * 파라미터 반복을 덮어쓸지 여부를 나타내는 플래그를 설정합니다.
   *
   * @param parameterIndex 파라미터 인덱스
   * @param value 덮어쓸 경우 true, 그렇지 않으면 false.
   */
  public setOverrideFlagForParameterRepeat(
    parameterIndex: number,
    value: boolean
  ): void {
    this._userParameterRepeatDataList.at(parameterIndex).isOverridden = value;
  }

  /**
   * 반복 플래그를 반환합니다.
   *
   * @param parameterIndex 파라미터 인덱스
   *
   * @return 반복하는 경우 true, 그렇지 않으면 false.
   */
  public getRepeatFlagForParameterRepeat(parameterIndex: number): boolean {
    return this._userParameterRepeatDataList.at(parameterIndex)
      .isParameterRepeated;
  }

  /**
   * 반복 플래그를 설정합니다.
   *
   * @param parameterIndex 파라미터 인덱스
   * @param value 반복을 활성화하려면 true, 그렇지 않으면 false.
   */
  public setRepeatFlagForParameterRepeat(
    parameterIndex: number,
    value: boolean
  ): void {
    this._userParameterRepeatDataList.at(parameterIndex).isParameterRepeated =
      value;
  }

  /**
   * SDK에서 지정한 모델의 곱셈색을 덮어쓸지 여부
   *
   * @deprecated 이름 변경으로 인해 더 이상 사용되지 않음 getOverrideFlagForModelMultiplyColors()로 대체
   *
   * @returns true -> SDK의 정보를 우선함
   *          false -> 모델에 설정된 색상 정보 사용
   */
  public getOverwriteFlagForModelMultiplyColors(): boolean {
    CubismLogWarning(
      'getOverwriteFlagForModelMultiplyColors() is a deprecated function. Please use getOverrideFlagForModelMultiplyColors().'
    );
    return this.getOverrideFlagForModelMultiplyColors();
  }

  /**
   * SDK에서 지정한 모델의 곱셈색을 덮어쓸지 여부
   * @returns true -> SDK의 정보를 우선함
   *          false -> 모델에 설정된 색상 정보 사용
   */
  public getOverrideFlagForModelMultiplyColors(): boolean {
    return this._isOverriddenModelMultiplyColors;
  }

  /**
   * SDK에서 지정한 모델의 스크린색을 덮어쓸지 여부
   *
   * @deprecated 이름 변경으로 인해 더 이상 사용되지 않음 getOverrideFlagForModelScreenColors()로 대체
   *
   * @returns true -> SDK의 정보를 우선함
   *          false -> 모델에 설정된 색상 정보 사용
   */
  public getOverwriteFlagForModelScreenColors(): boolean {
    CubismLogWarning(
      'getOverwriteFlagForModelScreenColors() is a deprecated function. Please use getOverrideFlagForModelScreenColors().'
    );
    return this.getOverrideFlagForModelScreenColors();
  }

  /**
   * SDK에서 지정한 모델의 스크린색을 덮어쓸지 여부
   * @returns true -> SDK의 정보를 우선함
   *          false -> 모델에 설정된 색상 정보 사용
   */
  public getOverrideFlagForModelScreenColors(): boolean {
    return this._isOverriddenModelScreenColors;
  }

  /**
   * SDK에서 지정한 모델의 곱셈색을 덮어쓸지 설정합니다.
   *
   * @deprecated 이름 변경으로 인해 더 이상 사용되지 않음 setOverrideFlagForModelMultiplyColors(value: boolean)로 대체
   *
   * @param value true -> SDK의 정보를 우선함
   *              false -> 모델에 설정된 색상 정보 사용
   */
  public setOverwriteFlagForModelMultiplyColors(value: boolean) {
    CubismLogWarning(
      'setOverwriteFlagForModelMultiplyColors(value: boolean) is a deprecated function. Please use setOverrideFlagForModelMultiplyColors(value: boolean).'
    );
    this.setOverrideFlagForModelMultiplyColors(value);
  }

  /**
   * SDK에서 지정한 모델의 곱셈색을 덮어쓸지 설정합니다.
   * @param value true -> SDK의 정보를 우선함
   *              false -> 모델에 설정된 색상 정보 사용
   */
  public setOverrideFlagForModelMultiplyColors(value: boolean) {
    this._isOverriddenModelMultiplyColors = value;
  }

  /**
   * SDK에서 지정한 모델의 스크린색을 덮어쓸지 설정합니다.
   *
   * @deprecated 이름 변경으로 인해 더 이상 사용되지 않음 setOverrideFlagForModelScreenColors(value: boolean)로 대체
   *
   * @param value true -> SDK의 정보를 우선함
   *              false -> 모델에 설정된 색상 정보 사용
   */
  public setOverwriteFlagForModelScreenColors(value: boolean) {
    CubismLogWarning(
      'setOverwriteFlagForModelScreenColors(value: boolean) is a deprecated function. Please use setOverrideFlagForModelScreenColors(value: boolean).'
    );
    this.setOverrideFlagForModelScreenColors(value);
  }

  /**
   * SDK에서 지정한 모델의 스크린색을 덮어쓸지 설정합니다.
   * @param value true -> SDK의 정보를 우선함
   *              false -> 모델에 설정된 색상 정보 사용
   */
  public setOverrideFlagForModelScreenColors(value: boolean) {
    this._isOverriddenModelScreenColors = value;
  }

  /**
   * SDK에서 지정한 DrawableIndex의 곱셈색을 덮어쓸지 여부
   *
   * @deprecated 이름 변경으로 인해 더 이상 사용되지 않음 getOverrideFlagForDrawableMultiplyColors(drawableindex: number)로 대체
   *
   * @returns true -> SDK의 정보를 우선함
   *          false -> 모델에 설정된 색상 정보 사용
   */
  public getOverwriteFlagForDrawableMultiplyColors(
    drawableindex: number
  ): boolean {
    CubismLogWarning(
      'getOverwriteFlagForDrawableMultiplyColors(drawableindex: number) is a deprecated function. Please use getOverrideFlagForDrawableMultiplyColors(drawableindex: number).'
    );
    return this.getOverrideFlagForDrawableMultiplyColors(drawableindex);
  }

  /**
   * SDK에서 지정한 DrawableIndex의 곱셈색을 덮어쓸지 여부
   * @returns true -> SDK의 정보를 우선함
   *          false -> 모델에 설정된 색상 정보 사용
   */
  public getOverrideFlagForDrawableMultiplyColors(
    drawableindex: number
  ): boolean {
    return this._userMultiplyColors.at(drawableindex).isOverridden;
  }

  /**
   * SDK에서 지정한 DrawableIndex의 스크린색을 덮어쓸지 여부
   *
   * @deprecated 이름 변경으로 인해 더 이상 사용되지 않음 getOverrideFlagForDrawableScreenColors(drawableindex: number)로 대체
   *
   * @returns true -> SDK의 정보를 우선함
   *          false -> 모델에 설정된 색상 정보 사용
   */
  public getOverwriteFlagForDrawableScreenColors(
    drawableindex: number
  ): boolean {
    CubismLogWarning(
      'getOverwriteFlagForDrawableScreenColors(drawableindex: number) is a deprecated function. Please use getOverrideFlagForDrawableScreenColors(drawableindex: number).'
    );
    return this.getOverrideFlagForDrawableScreenColors(drawableindex);
  }

  /**
   * SDK에서 지정한 DrawableIndex의 스크린색을 덮어쓸지 여부
   * @returns true -> SDK의 정보를 우선함
   *          false -> 모델에 설정된 색상 정보 사용
   */
  public getOverrideFlagForDrawableScreenColors(
    drawableindex: number
  ): boolean {
    return this._userScreenColors.at(drawableindex).isOverridden;
  }

  /**
   * SDK에서 지정한 DrawableIndex의 곱셈색을 덮어쓸지 설정합니다.
   *
   * @deprecated 이름 변경으로 인해 더 이상 사용되지 않음 setOverrideFlagForDrawableMultiplyColors(drawableindex: number, value: boolean)로 대체
   *
   * @param value true -> SDK의 정보를 우선함
   *              false -> 모델에 설정된 색상 정보 사용
   */
  public setOverwriteFlagForDrawableMultiplyColors(
    drawableindex: number,
    value: boolean
  ) {
    CubismLogWarning(
      'setOverwriteFlagForDrawableMultiplyColors(drawableindex: number, value: boolean) is a deprecated function. Please use setOverrideFlagForDrawableMultiplyColors(drawableindex: number, value: boolean).'
    );
    this.setOverrideFlagForDrawableMultiplyColors(drawableindex, value);
  }

  /**
   * SDK에서 지정한 DrawableIndex의 곱셈색을 덮어쓸지 설정합니다.
   * @param value true -> SDK의 정보를 우선함
   *              false -> 모델에 설정된 색상 정보 사용
   */
  public setOverrideFlagForDrawableMultiplyColors(
    drawableindex: number,
    value: boolean
  ) {
    this._userMultiplyColors.at(drawableindex).isOverridden = value;
  }

  /**
   * SDK에서 지정한 DrawableIndex의 스크린색을 덮어쓸지 설정합니다.
   *
   * @deprecated 이름 변경으로 인해 더 이상 사용되지 않음 setOverrideFlagForDrawableScreenColors(drawableindex: number, value: boolean)로 대체
   *
   * @param value true -> SDK의 정보를 우선함
   *              false -> 모델에 설정된 색상 정보 사용
   */
  public setOverwriteFlagForDrawableScreenColors(
    drawableindex: number,
    value: boolean
  ) {
    CubismLogWarning(
      'setOverwriteFlagForDrawableScreenColors(drawableindex: number, value: boolean) is a deprecated function. Please use setOverrideFlagForDrawableScreenColors(drawableindex: number, value: boolean).'
    );
    this.setOverrideFlagForDrawableScreenColors(drawableindex, value);
  }

  /**
   * SDK에서 지정한 DrawableIndex의 스크린색을 덮어쓸지 설정합니다.
   * @param value true -> SDK의 정보를 우선함
   *              false -> 모델에 설정된 색상 정보 사용
   */
  public setOverrideFlagForDrawableScreenColors(
    drawableindex: number,
    value: boolean
  ) {
    this._userScreenColors.at(drawableindex).isOverridden = value;
  }

  /**
   * SDK에서 part의 곱셈색을 덮어쓸지 여부
   *
   * @deprecated 이름 변경으로 인해 더 이상 사용되지 않음 getOverrideColorForPartMultiplyColors(partIndex: number)로 대체
   *
   * @param partIndex part의 인덱스
   * @returns true    ->  SDK의 정보를 우선함
   *          false   ->  모델에 설정된 색상 정보 사용
   */
  public getOverwriteColorForPartMultiplyColors(partIndex: number) {
    CubismLogWarning(
      'getOverwriteColorForPartMultiplyColors(partIndex: number) is a deprecated function. Please use getOverrideColorForPartMultiplyColors(partIndex: number).'
    );
    return this.getOverrideColorForPartMultiplyColors(partIndex);
  }

  /**
   * SDK에서 part의 곱셈색을 덮어쓸지 여부
   * @param partIndex part의 인덱스
   * @returns true    ->  SDK의 정보를 우선함
   *          false   ->  모델에 설정된 색상 정보 사용
   */
  public getOverrideColorForPartMultiplyColors(partIndex: number) {
    return this._userPartMultiplyColors.at(partIndex).isOverridden;
  }

  /**
   * SDK에서 part의 스크린색을 덮어쓸지 여부
   *
   * @deprecated 이름 변경으로 인해 더 이상 사용되지 않음 getOverrideColorForPartScreenColors(partIndex: number)로 대체
   *
   * @param partIndex part의 인덱스
   * @returns true    ->  SDK의 정보를 우선함
   *          false   ->  모델에 설정된 색상 정보 사용
   */
  public getOverwriteColorForPartScreenColors(partIndex: number) {
    CubismLogWarning(
      'getOverwriteColorForPartScreenColors(partIndex: number) is a deprecated function. Please use getOverrideColorForPartScreenColors(partIndex: number).'
    );
    return this.getOverrideColorForPartScreenColors(partIndex);
  }

  /**
   * SDK에서 part의 스크린색을 덮어쓸지 여부
   * @param partIndex part의 인덱스
   * @returns true    ->  SDK의 정보를 우선함
   *          false   ->  모델에 설정된 색상 정보 사용
   */
  public getOverrideColorForPartScreenColors(partIndex: number) {
    return this._userPartScreenColors.at(partIndex).isOverridden;
  }

  /**
   * part의 OverrideFlag setter 함수
   *
   * @deprecated 이름 변경으로 인해 더 이상 사용되지 않음 setOverrideColorForPartColors(
   * partIndex: number,
   * value: boolean,
   * partColors: csmVector<PartColorData>,
   * drawableColors: csmVector<DrawableColorData>)로 대체
   *
   * @param partIndex part의 인덱스
   * @param value true -> SDK의 정보를 우선함
   *              false -> 모델에 설정된 색상 정보 사용
   * @param partColors 설정할 part의 컬러 데이터 배열
   * @param drawableColors part에 관련된 Drawable의 컬러 데이터 배열
   */
  public setOverwriteColorForPartColors(
    partIndex: number,
    value: boolean,
    partColors: csmVector<PartColorData>,
    drawableColors: csmVector<DrawableColorData>
  ) {
    CubismLogWarning(
      'setOverwriteColorForPartColors(partIndex: number, value: boolean, partColors: csmVector<PartColorData>, drawableColors: csmVector<DrawableColorData>) is a deprecated function. Please use setOverrideColorForPartColors(partIndex: number, value: boolean, partColors: csmVector<PartColorData>, drawableColors: csmVector<DrawableColorData>).'
    );
    this.setOverrideColorForPartColors(
      partIndex,
      value,
      partColors,
      drawableColors
    );
  }

  /**
   * part의 OverrideFlag setter 함수
   * @param partIndex part의 인덱스
   * @param value true -> SDK의 정보를 우선함
   *              false -> 모델에 설정된 색상 정보 사용
   * @param partColors 설정할 part의 컬러 데이터 배열
   * @param drawableColors part에 관련된 Drawable의 컬러 데이터 배열
   */
  public setOverrideColorForPartColors(
    partIndex: number,
    value: boolean,
    partColors: csmVector<PartColorData>,
    drawableColors: csmVector<DrawableColorData>
  ) {
    partColors.at(partIndex).isOverridden = value;

    for (let i = 0; i < this._partChildDrawables.at(partIndex).getSize(); ++i) {
      const drawableIndex = this._partChildDrawables.at(partIndex).at(i);
      drawableColors.at(drawableIndex).isOverridden = value;

      if (value) {
        drawableColors.at(drawableIndex).color.r =
          partColors.at(partIndex).color.r;
        drawableColors.at(drawableIndex).color.g =
          partColors.at(partIndex).color.g;
        drawableColors.at(drawableIndex).color.b =
          partColors.at(partIndex).color.b;
        drawableColors.at(drawableIndex).color.a =
          partColors.at(partIndex).color.a;
      }
    }
  }

  /**
   * SDK에서 part의 스크린색을 덮어쓸지 설정합니다.
   *
   * @deprecated 이름 변경으로 인해 더 이상 사용되지 않음 setOverrideColorForPartMultiplyColors(partIndex: number, value: boolean)로 대체
   *
   * @param partIndex part의 인덱스
   * @param value true -> SDK의 정보를 우선함
   *              false -> 모델에 설정된 색상 정보 사용
   */
  public setOverwriteColorForPartMultiplyColors(
    partIndex: number,
    value: boolean
  ) {
    CubismLogWarning(
      'setOverwriteColorForPartMultiplyColors(partIndex: number, value: boolean) is a deprecated function. Please use setOverrideColorForPartMultiplyColors(partIndex: number, value: boolean).'
    );
    this.setOverrideColorForPartMultiplyColors(partIndex, value);
  }

  /**
   * SDK에서 part의 스크린색을 덮어쓸지 설정합니다.
   * @param partIndex part의 인덱스
   * @param value true -> SDK의 정보를 우선함
   *              false -> 모델에 설정된 색상 정보 사용
   */
  public setOverrideColorForPartMultiplyColors(
    partIndex: number,
    value: boolean
  ) {
    this._userPartMultiplyColors.at(partIndex).isOverridden = value;
    this.setOverrideColorForPartColors(
      partIndex,
      value,
      this._userPartMultiplyColors,
      this._userMultiplyColors
    );
  }

  /**
   * SDK에서 part의 스크린색을 덮어쓸지 설정합니다.
   *
   * @deprecated 이름 변경으로 인해 더 이상 사용되지 않음 setOverrideColorForPartScreenColors(partIndex: number, value: boolean)로 대체
   *
   * @param partIndex part의 인덱스
   * @param value true -> SDK의 정보를 우선함
   *              false -> 모델에 설정된 색상 정보 사용
   */
  public setOverwriteColorForPartScreenColors(
    partIndex: number,
    value: boolean
  ) {
    CubismLogWarning(
      'setOverwriteColorForPartScreenColors(partIndex: number, value: boolean) is a deprecated function. Please use setOverrideColorForPartScreenColors(partIndex: number, value: boolean).'
    );
    this.setOverrideColorForPartScreenColors(partIndex, value);
  }

  /**
   * SDK에서 part의 스크린색을 덮어쓸지 설정합니다.
   * @param partIndex part의 인덱스
   * @param value true -> SDK의 정보를 우선함
   *              false -> 모델에 설정된 색상 정보 사용
   */
  public setOverrideColorForPartScreenColors(
    partIndex: number,
    value: boolean
  ) {
    this._userPartScreenColors.at(partIndex).isOverridden = value;
    this.setOverrideColorForPartColors(
      partIndex,
      value,
      this._userPartScreenColors,
      this._userScreenColors
    );
  }

  /**
   * Drawable의 컬링 정보를 가져옵니다.
   *
   * @param   drawableIndex   Drawable의 인덱스
   * @return  Drawable의 컬링 정보
   */
  public getDrawableCulling(drawableIndex: number): boolean {
    if (
      this.getOverrideFlagForModelCullings() ||
      this.getOverrideFlagForDrawableCullings(drawableIndex)
    ) {
      return this._userCullings.at(drawableIndex).isCulling;
    }

    const constantFlags = this._model.drawables.constantFlags;
    return !Live2DCubismCore.Utils.hasIsDoubleSidedBit(
      constantFlags[drawableIndex]
    );
  }

  /**
   * Drawable의 컬링 정보를 설정합니다.
   *
   * @param drawableIndex Drawable의 인덱스
   * @param isCulling 컬링 정보
   */
  public setDrawableCulling(drawableIndex: number, isCulling: boolean): void {
    this._userCullings.at(drawableIndex).isCulling = isCulling;
  }

  /**
   * SDK에서 모델 전체의 컬링 설정을 덮어쓸지 여부.
   *
   * @deprecated 이름 변경으로 인해 더 이상 사용되지 않음 getOverrideFlagForModelCullings()로 대체
   *
   * @retval  true    ->  SDK상의 컬링 설정 사용
   * @retval  false   ->  모델의 컬링 설정 사용
   */
  public getOverwriteFlagForModelCullings(): boolean {
    CubismLogWarning(
      'getOverwriteFlagForModelCullings() is a deprecated function. Please use getOverrideFlagForModelCullings().'
    );
    return this.getOverrideFlagForModelCullings();
  }

  /**
   * SDK에서 모델 전체의 컬링 설정을 덮어쓸지 여부.
   *
   * @retval  true    ->  SDK상의 컬링 설정 사용
   * @retval  false   ->  모델의 컬링 설정 사용
   */
  public getOverrideFlagForModelCullings(): boolean {
    return this._isOverriddenCullings;
  }

  /**
   * SDK에서 모델 전체의 컬링 설정을 덮어쓸지 설정합니다.
   *
   * @deprecated 이름 변경으로 인해 더 이상 사용되지 않음 setOverrideFlagForModelCullings(isOverriddenCullings: boolean)로 대체
   *
   * @param isOveriddenCullings SDK상의 컬링 설정을 사용하려면 true, 모델의 컬링 설정을 사용하려면 false
   */
  public setOverwriteFlagForModelCullings(isOverriddenCullings: boolean): void {
    CubismLogWarning(
      'setOverwriteFlagForModelCullings(isOverriddenCullings: boolean) is a deprecated function. Please use setOverrideFlagForModelCullings(isOverriddenCullings: boolean).'
    );
    this.setOverrideFlagForModelCullings(isOverriddenCullings);
  }

  /**
   * SDK에서 모델 전체의 컬링 설정을 덮어쓸지 설정합니다.
   *
   * @param isOverriddenCullings SDK상의 컬링 설정을 사용하려면 true, 모델의 컬링 설정을 사용하려면 false
   */
  public setOverrideFlagForModelCullings(isOverriddenCullings: boolean): void {
    this._isOverriddenCullings = isOverriddenCullings;
  }

  /**
   *
   * @deprecated 이름 변경으로 인해 더 이상 사용되지 않음 getOverrideFlagForDrawableCullings(drawableIndex: number)로 대체
   *
   * @param drawableIndex Drawable의 인덱스
   * @retval  true    ->  SDK상의 컬링 설정 사용
   * @retval  false   ->  모델의 컬링 설정 사용
   */
  public getOverwriteFlagForDrawableCullings(drawableIndex: number): boolean {
    CubismLogWarning(
      'getOverwriteFlagForDrawableCullings(drawableIndex: number) is a deprecated function. Please use getOverrideFlagForDrawableCullings(drawableIndex: number).'
    );
    return this.getOverrideFlagForDrawableCullings(drawableIndex);
  }

  /**
   *
   * @param drawableIndex Drawable의 인덱스
   * @retval  true    ->  SDK상의 컬링 설정 사용
   * @retval  false   ->  모델의 컬링 설정 사용
   */
  public getOverrideFlagForDrawableCullings(drawableIndex: number): boolean {
    return this._userCullings.at(drawableIndex).isOverridden;
  }

  /**
   *
   * @deprecated 이름 변경으로 인해 더 이상 사용되지 않음 setOverrideFlagForDrawableCullings(drawableIndex: number, isOverriddenCullings: bolean)로 대체
   *
   * @param drawableIndex Drawable의 인덱스
   * @param isOverriddenCullings SDK상의 컬링 설정을 사용하려면 true, 모델의 컬링 설정을 사용하려면 false
   */
  public setOverwriteFlagForDrawableCullings(
    drawableIndex: number,
    isOverriddenCullings: boolean
  ): void {
    CubismLogWarning(
      'setOverwriteFlagForDrawableCullings(drawableIndex: number, isOverriddenCullings: boolean) is a deprecated function. Please use setOverrideFlagForDrawableCullings(drawableIndex: number, isOverriddenCullings: boolean).'
    );
    this.setOverrideFlagForDrawableCullings(
      drawableIndex,
      isOverriddenCullings
    );
  }

  /**
   *
   * @param drawableIndex Drawable의 인덱스
   * @param isOverriddenCullings SDK상의 컬링 설정을 사용하려면 true, 모델의 컬링 설정을 사용하려면 false
   */
  public setOverrideFlagForDrawableCullings(
    drawableIndex: number,
    isOverriddenCullings: boolean
  ): void {
    this._userCullings.at(drawableIndex).isOverridden = isOverriddenCullings;
  }

  /**
   * 모델 불투명도 가져오기
   *
   * @returns 불투명도 값
   */
  public getModelOapcity(): number {
    return this._modelOpacity;
  }

  /**
   * 모델 불투명도 설정
   *
   * @param value 불투명도 값
   */
  public setModelOapcity(value: number) {
    this._modelOpacity = value;
  }

  /**
   * 모델 가져오기
   */
  public getModel(): Live2DCubismCore.Model {
    return this._model;
  }

  /**
   * 파츠 인덱스 가져오기
   * @param partId 파츠의 ID
   * @return 파츠의 인덱스
   */
  public getPartIndex(partId: CubismIdHandle): number {
    let partIndex: number;
    const partCount: number = this._model.parts.count;

    for (partIndex = 0; partIndex < partCount; ++partIndex) {
      if (partId == this._partIds.at(partIndex)) {
        return partIndex;
      }
    }

    // 모델에 존재하지 않는 경우, 비존재 파츠 ID 목록에 있는지 검색하여 해당 인덱스를 반환
    if (this._notExistPartId.isExist(partId)) {
      return this._notExistPartId.getValue(partId);
    }

    // 비존재 파츠 ID 목록에 없는 경우, 새 요소를 추가
    partIndex = partCount + this._notExistPartId.getSize();
    this._notExistPartId.setValue(partId, partIndex);
    this._notExistPartOpacities.appendKey(partIndex);

    return partIndex;
  }

  /**
   * 파츠 ID를 가져옵니다.
   *
   * @param partIndex 가져올 파츠의 인덱스
   * @return 파츠의 ID
   */
  public getPartId(partIndex: number): CubismIdHandle {
    const partId = this._model.parts.ids[partIndex];
    return CubismFramework.getIdManager().getId(partId);
  }

  /**
   * 파츠 개수 가져오기
   * @return 파츠 개수
   */
  public getPartCount(): number {
    const partCount: number = this._model.parts.count;
    return partCount;
  }

  /**
   * 파츠의 부모 파츠 인덱스 목록 가져오기
   *
   * @returns 파츠의 부모 파츠 인덱스 목록
   */
  public getPartParentPartIndices(): Int32Array {
    const parentIndices = this._model.parts.parentIndices;
    return parentIndices;
  }

  /**
   * 파츠 불투명도 설정(Index)
   * @param partIndex 파츠의 인덱스
   * @param opacity 불투명도
   */
  public setPartOpacityByIndex(partIndex: number, opacity: number): void {
    if (this._notExistPartOpacities.isExist(partIndex)) {
      this._notExistPartOpacities.setValue(partIndex, opacity);
      return;
    }

    // 인덱스 범위 내 감지
    CSM_ASSERT(0 <= partIndex && partIndex < this.getPartCount());

    this._partOpacities[partIndex] = opacity;
  }

  /**
   * 파츠 불투명도 설정(Id)
   * @param partId 파츠의 ID
   * @param opacity 파츠의 불투명도
   */
  public setPartOpacityById(partId: CubismIdHandle, opacity: number): void {
    // 고속화를 위해 PartIndex를 가져올 수 있는 구조이지만, 외부에서 설정할 때는 호출 빈도가 낮으므로 불필요
    const index: number = this.getPartIndex(partId);

    if (index < 0) {
      return; // 파츠가 없으므로 건너뛰기
    }

    this.setPartOpacityByIndex(index, opacity);
  }

  /**
   * 파츠 불투명도 가져오기(index)
   * @param partIndex 파츠의 인덱스
   * @return 파츠의 불투명도
   */
  public getPartOpacityByIndex(partIndex: number): number {
    if (this._notExistPartOpacities.isExist(partIndex)) {
      // 모델에 존재하지 않는 파츠 ID인 경우, 비존재 파츠 목록에서 불투명도를 반환합니다.
      return this._notExistPartOpacities.getValue(partIndex);
    }

    // 인덱스 범위 내 감지
    CSM_ASSERT(0 <= partIndex && partIndex < this.getPartCount());

    return this._partOpacities[partIndex];
  }

  /**
   * 파츠 불투명도 가져오기(id)
   * @param partId 파츠의 ID
   * @return 파츠의 불투명도
   */
  public getPartOpacityById(partId: CubismIdHandle): number {
    // 고속화를 위해 PartIndex를 가져올 수 있는 구조이지만, 외부에서 설정할 때는 호출 빈도가 낮으므로 불필요
    const index: number = this.getPartIndex(partId);

    if (index < 0) {
      return 0; // 파츠가 없으므로 건너뛰기
    }

    return this.getPartOpacityByIndex(index);
  }

  /**
   * 파라미터 인덱스 가져오기
   * @param 파라미터 ID
   * @return 파라미터의 인덱스
   */
  public getParameterIndex(parameterId: CubismIdHandle): number {
    let parameterIndex: number;
    const idCount: number = this._model.parameters.count;

    for (parameterIndex = 0; parameterIndex < idCount; ++parameterIndex) {
      if (parameterId != this._parameterIds.at(parameterIndex)) {
        continue;
      }

      return parameterIndex;
    }

    // 모델에 존재하지 않는 경우, 비존재 파라미터 ID 목록에서 검색하여 해당 인덱스를 반환
    if (this._notExistParameterId.isExist(parameterId)) {
      return this._notExistParameterId.getValue(parameterId);
    }

    // 비존재 파라미터 ID 목록에 없는 경우 새 요소를 추가
    parameterIndex =
      this._model.parameters.count + this._notExistParameterId.getSize();

    this._notExistParameterId.setValue(parameterId, parameterIndex);
    this._notExistParameterValues.appendKey(parameterIndex);

    return parameterIndex;
  }

  /**
   * 파라미터 개수 가져오기
   * @return 파라미터 개수
   */
  public getParameterCount(): number {
    return this._model.parameters.count;
  }

  /**
   * 파라미터 종류 가져오기
   * @param parameterIndex 파라미터의 인덱스
   * @return csmParameterType_Normal -> 일반 파라미터
   *          csmParameterType_BlendShape -> 블렌드 셰이프 파라미터
   */
  public getParameterType(
    parameterIndex: number
  ): Live2DCubismCore.csmParameterType {
    return this._model.parameters.types[parameterIndex];
  }

  /**
   * 파라미터 최대값 가져오기
   * @param parameterIndex 파라미터의 인덱스
   * @return 파라미터의 최대값
   */
  public getParameterMaximumValue(parameterIndex: number): number {
    return this._model.parameters.maximumValues[parameterIndex];
  }

  /**
   * 파라미터 최소값 가져오기
   * @param parameterIndex 파라미터의 인덱스
   * @return 파라미터의 최소값
   */
  public getParameterMinimumValue(parameterIndex: number): number {
    return this._model.parameters.minimumValues[parameterIndex];
  }

  /**
   * 파라미터 기본값 가져오기
   * @param parameterIndex 파라미터의 인덱스
   * @return 파라미터의 기본값
   */
  public getParameterDefaultValue(parameterIndex: number): number {
    return this._model.parameters.defaultValues[parameterIndex];
  }

  /**
   * 지정한 파라미터 index의 ID 가져오기
   *
   * @param parameterIndex 파라미터의 인덱스
   * @returns 파라미터 ID
   */
  public getParameterId(parameterIndex: number): CubismIdHandle {
    return CubismFramework.getIdManager().getId(
      this._model.parameters.ids[parameterIndex]
    );
  }

  /**
   * 파라미터 값 가져오기
   * @param parameterIndex    파라미터의 인덱스
   * @return 파라미터 값
   */
  public getParameterValueByIndex(parameterIndex: number): number {
    if (this._notExistParameterValues.isExist(parameterIndex)) {
      return this._notExistParameterValues.getValue(parameterIndex);
    }

    // 인덱스 범위 내 감지
    CSM_ASSERT(
      0 <= parameterIndex && parameterIndex < this.getParameterCount()
    );

    return this._parameterValues[parameterIndex];
  }

  /**
   * 파라미터 값 가져오기
   * @param parameterId    파라미터의 ID
   * @return 파라미터 값
   */
  public getParameterValueById(parameterId: CubismIdHandle): number {
    // 고속화를 위해 parameterIndex를 가져올 수 있는 구조이지만, 외부에서 설정할 때는 호출 빈도가 낮으므로 불필요
    const parameterIndex: number = this.getParameterIndex(parameterId);
    return this.getParameterValueByIndex(parameterIndex);
  }

  /**
   * 파라미터 값 설정
   * @param parameterIndex 파라미터의 인덱스
   * @param value 파라미터 값
   * @param weight 가중치
   */
  public setParameterValueByIndex(
    parameterIndex: number,
    value: number,
    weight = 1.0
  ): void {
    if (this._notExistParameterValues.isExist(parameterIndex)) {
      this._notExistParameterValues.setValue(
        parameterIndex,
        weight == 1
          ? value
          : this._notExistParameterValues.getValue(parameterIndex) *
              (1 - weight) +
              value * weight
      );

      return;
    }

    // 인덱스 범위 내 감지
    CSM_ASSERT(
      0 <= parameterIndex && parameterIndex < this.getParameterCount()
    );

    if (this.isRepeat(parameterIndex)) {
      value = this.getParameterRepeatValue(parameterIndex, value);
    } else {
      value = this.getParameterClampValue(parameterIndex, value);
    }

    this._parameterValues[parameterIndex] =
      weight == 1
        ? value
        : (this._parameterValues[parameterIndex] =
            this._parameterValues[parameterIndex] * (1 - weight) +
            value * weight);
  }

  /**
   * 파라미터 값 설정
   * @param parameterId 파라미터의 ID
   * @param value 파라미터 값
   * @param weight 가중치
   */
  public setParameterValueById(
    parameterId: CubismIdHandle,
    value: number,
    weight = 1.0
  ): void {
    const index: number = this.getParameterIndex(parameterId);
    this.setParameterValueByIndex(index, value, weight);
  }

  /**
   * 파라미터 값 덧셈(index)
   * @param parameterIndex 파라미터 인덱스
   * @param value 덧셈할 값
   * @param weight 가중치
   */
  public addParameterValueByIndex(
    parameterIndex: number,
    value: number,
    weight = 1.0
  ): void {
    this.setParameterValueByIndex(
      parameterIndex,
      this.getParameterValueByIndex(parameterIndex) + value * weight
    );
  }

  /**
   * 파라미터 값 덧셈(id)
   * @param parameterId 파라미터 ID
   * @param value 덧셈할 값
   * @param weight 가중치
   */
  public addParameterValueById(
    parameterId: any,
    value: number,
    weight = 1.0
  ): void {
    const index: number = this.getParameterIndex(parameterId);
    this.addParameterValueByIndex(index, value, weight);
  }

  /**
   * 파라미터에 반복 설정이 있는지 가져옵니다.
   *
   * @param parameterIndex 파라미터 인덱스
   *
   * @return true인 경우 설정되어 있고, 그렇지 않으면 false를 반환합니다.
   */
  public isRepeat(parameterIndex: number): boolean {
    if (this._notExistParameterValues.isExist(parameterIndex)) {
      return false;
    }

    // In-index range detection
    CSM_ASSERT(
      0 <= parameterIndex && parameterIndex < this.getParameterCount()
    );

    let isRepeat: boolean;

    // Determines whether to perform parameter repeat processing
    if (
      this._isOverriddenParameterRepeat ||
      this._userParameterRepeatDataList.at(parameterIndex).isOverridden
    ) {
      // Use repeat information set on the SDK side
      isRepeat =
        this._userParameterRepeatDataList.at(
          parameterIndex
        ).isParameterRepeated;
    } else {
      // Use repeat information set in Editor
      isRepeat = this._model.parameters.repeats[parameterIndex] != 0;
    }

    return isRepeat;
  }

  /**
   * 값이 파라미터 범위 내에 있도록 계산된 결과를 반환합니다.
   *
   * @param parameterIndex 파라미터 인덱스
   * @param value 파라미터 값
   *
   * @return 파라미터 범위 내에 있는 값. 파라미터가 없으면 그대로 반환합니다.
   */
  public getParameterRepeatValue(
    parameterIndex: number,
    value: number
  ): number {
    if (this._notExistParameterValues.isExist(parameterIndex)) {
      return value;
    }

    // In-index range detection
    CSM_ASSERT(
      0 <= parameterIndex && parameterIndex < this.getParameterCount()
    );

    const maxValue: number =
      this._model.parameters.maximumValues[parameterIndex];
    const minValue: number =
      this._model.parameters.minimumValues[parameterIndex];
    const valueSize: number = maxValue - minValue;

    if (maxValue < value) {
      const overValue: number = CubismMath.mod(value - maxValue, valueSize);
      if (!Number.isNaN(overValue)) {
        value = minValue + overValue;
      } else {
        value = maxValue;
      }
    }
    if (value < minValue) {
      const overValue: number = CubismMath.mod(minValue - value, valueSize);
      if (!Number.isNaN(overValue)) {
        value = maxValue - overValue;
      } else {
        value = minValue;
      }
    }

    return value;
  }

  /**
   * 값이 파라미터 범위 내에 있도록 클램핑된 결과를 반환합니다.
   *
   * @param parameterIndex 파라미터 인덱스
   * @param value 파라미터 값
   *
   * @return 클램핑된 값. 파라미터가 없으면 그대로 반환합니다.
   */
  public getParameterClampValue(parameterIndex: number, value: number): number {
    if (this._notExistParameterValues.isExist(parameterIndex)) {
      return value;
    }

    // In-index range detection
    CSM_ASSERT(
      0 <= parameterIndex && parameterIndex < this.getParameterCount()
    );

    const maxValue: number =
      this._model.parameters.maximumValues[parameterIndex];
    const minValue: number =
      this._model.parameters.minimumValues[parameterIndex];

    return CubismMath.clamp(value, minValue, maxValue);
  }

  /**
   * 파라미터의 반복을 반환합니다.
   *
   * @param parameterIndex 파라미터 인덱스
   *
   * @return Cubism Core의 원시 데이터 파라미터 반복.
   */
  public getParameterRepeats(parameterIndex: number): boolean {
    return this._model.parameters.repeats[parameterIndex] != 0;
  }

  /**
   * 파라미터 값 곱셈
   * @param parameterId 파라미터의 ID
   * @param value 곱셈할 값
   * @param weight 가중치
   */
  public multiplyParameterValueById(
    parameterId: CubismIdHandle,
    value: number,
    weight = 1.0
  ): void {
    const index: number = this.getParameterIndex(parameterId);
    this.multiplyParameterValueByIndex(index, value, weight);
  }

  /**
   * 파라미터 값 곱셈
   * @param parameterIndex 파라미터의 인덱스
   * @param value 곱셈할 값
   * @param weight 가중치
   */
  public multiplyParameterValueByIndex(
    parameterIndex: number,
    value: number,
    weight = 1.0
  ): void {
    this.setParameterValueByIndex(
      parameterIndex,
      this.getParameterValueByIndex(parameterIndex) *
        (1.0 + (value - 1.0) * weight)
    );
  }

  /**
   * Drawable 인덱스 가져오기
   * @param drawableId Drawable의 ID
   * @return Drawable의 인덱스
   */
  public getDrawableIndex(drawableId: CubismIdHandle): number {
    const drawableCount = this._model.drawables.count;

    for (
      let drawableIndex = 0;
      drawableIndex < drawableCount;
      ++drawableIndex
    ) {
      if (this._drawableIds.at(drawableIndex) == drawableId) {
        return drawableIndex;
      }
    }

    return -1;
  }

  /**
   * Drawable 개수 가져오기
   * @return drawable의 개수
   */
  public getDrawableCount(): number {
    const drawableCount = this._model.drawables.count;
    return drawableCount;
  }

  /**
   * Drawable ID 가져오기
   * @param drawableIndex Drawable의 인덱스
   * @return drawable의 ID
   */
  public getDrawableId(drawableIndex: number): CubismIdHandle {
    const parameterIds: string[] = this._model.drawables.ids;
    return CubismFramework.getIdManager().getId(parameterIds[drawableIndex]);
  }

  /**
   * Drawable 그리기 순서 목록 가져오기
   * @return Drawable의 그리기 순서 목록
   */
  public getDrawableRenderOrders(): Int32Array {
    const renderOrders: Int32Array = this._model.drawables.renderOrders;
    return renderOrders;
  }

  /**
   * @deprecated
   * 함수명이 잘못되어 대체 함수인 getDrawableTextureIndex를 추가하고 이 함수는 더 이상 사용되지 않습니다.
   *
   * Drawable의 텍스처 인덱스 목록 가져오기
   * @param drawableIndex Drawable의 인덱스
   * @return drawable의 텍스처 인덱스 목록
   */
  public getDrawableTextureIndices(drawableIndex: number): number {
    return this.getDrawableTextureIndex(drawableIndex);
  }

  /**
   * Drawable 텍스처 인덱스 가져오기
   * @param drawableIndex Drawable의 인덱스
   * @return drawable의 텍스처 인덱스
   */
  public getDrawableTextureIndex(drawableIndex: number): number {
    const textureIndices: Int32Array = this._model.drawables.textureIndices;
    return textureIndices[drawableIndex];
  }

  /**
   * Drawable의 VertexPositions 변경 정보 가져오기
   *
   * 최근 CubismModel.update 함수에서 Drawable의 정점 정보가 변경되었는지 가져옵니다.
   *
   * @param   drawableIndex   Drawable의 인덱스
   * @retval  true    Drawable의 정점 정보가 최근 CubismModel.update 함수에서 변경됨
   * @retval  false   Drawable의 정점 정보가 최근 CubismModel.update 함수에서 변경되지 않음
   */
  public getDrawableDynamicFlagVertexPositionsDidChange(
    drawableIndex: number
  ): boolean {
    const dynamicFlags: Uint8Array = this._model.drawables.dynamicFlags;
    return Live2DCubismCore.Utils.hasVertexPositionsDidChangeBit(
      dynamicFlags[drawableIndex]
    );
  }

  /**
   * Drawable의 정점 인덱스 개수 가져오기
   * @param drawableIndex Drawable의 인덱스
   * @return drawable의 정점 인덱스 개수
   */
  public getDrawableVertexIndexCount(drawableIndex: number): number {
    const indexCounts: Int32Array = this._model.drawables.indexCounts;
    return indexCounts[drawableIndex];
  }

  /**
   * Drawable의 정점 개수 가져오기
   * @param drawableIndex Drawable의 인덱스
   * @return drawable의 정점 개수
   */
  public getDrawableVertexCount(drawableIndex: number): number {
    const vertexCounts = this._model.drawables.vertexCounts;
    return vertexCounts[drawableIndex];
  }

  /**
   * Drawable의 정점 목록 가져오기
   * @param drawableIndex drawable의 인덱스
   * @return drawable의 정점 목록
   */
  public getDrawableVertices(drawableIndex: number): Float32Array {
    return this.getDrawableVertexPositions(drawableIndex);
  }

  /**
   * Drawable의 정점 인덱스 목록 가져오기
   * @param drawableIndex Drawable의 인덱스
   * @return drawable의 정점 인덱스 목록
   */
  public getDrawableVertexIndices(drawableIndex: number): Uint16Array {
    const indicesArray: Uint16Array[] = this._model.drawables.indices;
    return indicesArray[drawableIndex];
  }

  /**
   * Drawable의 정점 목록 가져오기
   * @param drawableIndex Drawable의 인덱스
   * @return drawable의 정점 목록
   */
  public getDrawableVertexPositions(drawableIndex: number): Float32Array {
    const verticesArray: Float32Array[] = this._model.drawables.vertexPositions;
    return verticesArray[drawableIndex];
  }

  /**
   * Drawable의 정점 UV 목록 가져오기
   * @param drawableIndex Drawable의 인덱스
   * @return drawable의 정점 UV 목록
   */
  public getDrawableVertexUvs(drawableIndex: number): Float32Array {
    const uvsArray: Float32Array[] = this._model.drawables.vertexUvs;
    return uvsArray[drawableIndex];
  }

  /**
   * Drawable의 불투명도 가져오기
   * @param drawableIndex Drawable의 인덱스
   * @return drawable의 불투명도
   */
  public getDrawableOpacity(drawableIndex: number): number {
    const opacities: Float32Array = this._model.drawables.opacities;
    return opacities[drawableIndex];
  }

  /**
   * Drawable의 곱셈색 가져오기
   * @param drawableIndex Drawable의 인덱스
   * @return drawable의 곱셈색(RGBA)
   * 스크린색은 RGBA로 가져오지만, A는 항상 0
   */
  public getDrawableMultiplyColor(drawableIndex: number): CubismTextureColor {
    const multiplyColors: Float32Array = this._model.drawables.multiplyColors;
    const index = drawableIndex * 4;
    const multiplyColor: CubismTextureColor = new CubismTextureColor();
    multiplyColor.r = multiplyColors[index];
    multiplyColor.g = multiplyColors[index + 1];
    multiplyColor.b = multiplyColors[index + 2];
    multiplyColor.a = multiplyColors[index + 3];
    return multiplyColor;
  }

  /**
   * Drawable의 스크린색 가져오기
   * @param drawableIndex Drawable의 인덱스
   * @return drawable의 스크린색(RGBA)
   * 스크린색은 RGBA로 가져오지만, A는 항상 0
   */
  public getDrawableScreenColor(drawableIndex: number): CubismTextureColor {
    const screenColors: Float32Array = this._model.drawables.screenColors;
    const index = drawableIndex * 4;
    const screenColor: CubismTextureColor = new CubismTextureColor();
    screenColor.r = screenColors[index];
    screenColor.g = screenColors[index + 1];
    screenColor.b = screenColors[index + 2];
    screenColor.a = screenColors[index + 3];
    return screenColor;
  }

  /**
   * Drawable의 부모 파츠 인덱스 가져오기
   * @param drawableIndex Drawable의 인덱스
   * @return drawable의 부모 파츠 인덱스
   */
  public getDrawableParentPartIndex(drawableIndex: number): number {
    return this._model.drawables.parentPartIndices[drawableIndex];
  }

  /**
   * Drawable의 블렌드 모드 가져오기
   * @param drawableIndex Drawable의 인덱스
   * @return drawable의 블렌드 모드
   */
  public getDrawableBlendMode(drawableIndex: number): CubismBlendMode {
    const constantFlags = this._model.drawables.constantFlags;

    return Live2DCubismCore.Utils.hasBlendAdditiveBit(
      constantFlags[drawableIndex]
    )
      ? CubismBlendMode.CubismBlendMode_Additive
      : Live2DCubismCore.Utils.hasBlendMultiplicativeBit(
            constantFlags[drawableIndex]
          )
        ? CubismBlendMode.CubismBlendMode_Multiplicative
        : CubismBlendMode.CubismBlendMode_Normal;
  }

  /**
   * Drawable의 마스크 반전 사용 가져오기
   *
   * Drawable의 마스크 사용 시 반전 설정을 가져옵니다.
   * 마스크를 사용하지 않으면 무시됩니다.
   *
   * @param drawableIndex Drawable의 인덱스
   * @return Drawable의 반전 설정
   */
  public getDrawableInvertedMaskBit(drawableIndex: number): boolean {
    const constantFlags: Uint8Array = this._model.drawables.constantFlags;

    return Live2DCubismCore.Utils.hasIsInvertedMaskBit(
      constantFlags[drawableIndex]
    );
  }

  /**
   * Drawable의 클리핑 마스크 목록 가져오기
   * @return Drawable의 클리핑 마스크 목록
   */
  public getDrawableMasks(): Int32Array[] {
    const masks: Int32Array[] = this._model.drawables.masks;
    return masks;
  }

  /**
   * Drawable의 클리핑 마스크 개수 목록 가져오기
   * @return Drawable의 클리핑 마스크 개수 목록
   */
  public getDrawableMaskCounts(): Int32Array {
    const maskCounts: Int32Array = this._model.drawables.maskCounts;
    return maskCounts;
  }

  /**
   * 클리핑 마스크 사용 상태
   *
   * @return true 클리핑 마스크 사용 중
   * @return false 클리핑 마스크 사용 안 함
   */
  public isUsingMasking(): boolean {
    for (let d = 0; d < this._model.drawables.count; ++d) {
      if (this._model.drawables.maskCounts[d] <= 0) {
        continue;
      }
      return true;
    }
    return false;
  }

  /**
   * Drawable의 표시 정보 가져오기
   *
   * @param drawableIndex Drawable의 인덱스
   * @return true Drawable이 표시됨
   * @return false Drawable이 숨겨짐
   */
  public getDrawableDynamicFlagIsVisible(drawableIndex: number): boolean {
    const dynamicFlags: Uint8Array = this._model.drawables.dynamicFlags;
    return Live2DCubismCore.Utils.hasIsVisibleBit(dynamicFlags[drawableIndex]);
  }

  /**
   * Drawable의 DrawOrder 변경 정보 가져오기
   *
   * 최근 CubismModel.update 함수에서 drawable의 drawOrder가 변경되었는지 가져옵니다.
   * drawOrder는 artMesh에서 지정하는 0에서 1000까지의 정보
   * @param drawableIndex drawable의 인덱스
   * @return true drawable의 불투명도가 최근 CubismModel.update 함수에서 변경됨
   * @return false drawable의 불투명도가 최근 CubismModel.update 함수에서 변경되지 않음
   */
  public getDrawableDynamicFlagVisibilityDidChange(
    drawableIndex: number
  ): boolean {
    const dynamicFlags: Uint8Array = this._model.drawables.dynamicFlags;
    return Live2DCubismCore.Utils.hasVisibilityDidChangeBit(
      dynamicFlags[drawableIndex]
    );
  }

  /**
   * Drawable의 불투명도 변경 정보 가져오기
   *
   * 최근 CubismModel.update 함수에서 drawable의 불투명도가 변경되었는지 가져옵니다.
   *
   * @param drawableIndex drawable의 인덱스
   * @return true Drawable의 불투명도가 최근 CubismModel.update 함수에서 변경됨
   * @return false Drawable의 불투명도가 최근 CubismModel.update 함수에서 변경되지 않음
   */
  public getDrawableDynamicFlagOpacityDidChange(
    drawableIndex: number
  ): boolean {
    const dynamicFlags: Uint8Array = this._model.drawables.dynamicFlags;
    return Live2DCubismCore.Utils.hasOpacityDidChangeBit(
      dynamicFlags[drawableIndex]
    );
  }

  /**
   * Drawable의 그리기 순서 변경 정보 가져오기
   *
   * 최근 CubismModel.update 함수에서 Drawable의 그리기 순서가 변경되었는지 가져옵니다.
   *
   * @param drawableIndex Drawable의 인덱스
   * @return true Drawable의 그리기 순서가 최근 CubismModel.update 함수에서 변경됨
   * @return false Drawable의 그리기 순서가 최근 CubismModel.update 함수에서 변경되지 않음
   */
  public getDrawableDynamicFlagRenderOrderDidChange(
    drawableIndex: number
  ): boolean {
    const dynamicFlags: Uint8Array = this._model.drawables.dynamicFlags;
    return Live2DCubismCore.Utils.hasRenderOrderDidChangeBit(
      dynamicFlags[drawableIndex]
    );
  }

  /**
   * Drawable의 곱셈색·스크린색 변경 정보 가져오기
   *
   * 최근 CubismModel.update 함수에서 Drawable의 곱셈색·스크린색이 변경되었는지 가져옵니다.
   *
   * @param drawableIndex Drawable의 인덱스
   * @return true Drawable의 곱셈색·스크린색이 최근 CubismModel.update 함수에서 변경됨
   * @return false Drawable의 곱셈색·스크린색이 최근 CubismModel.update 함수에서 변경되지 않음
   */
  public getDrawableDynamicFlagBlendColorDidChange(
    drawableIndex: number
  ): boolean {
    const dynamicFlags: Uint8Array = this._model.drawables.dynamicFlags;
    return Live2DCubismCore.Utils.hasBlendColorDidChangeBit(
      dynamicFlags[drawableIndex]
    );
  }

  /**
   * 저장된 파라미터 로드
   */
  public loadParameters(): void {
    let parameterCount: number = this._model.parameters.count;
    const savedParameterCount: number = this._savedParameters.getSize();

    if (parameterCount > savedParameterCount) {
      parameterCount = savedParameterCount;
    }

    for (let i = 0; i < parameterCount; ++i) {
      this._parameterValues[i] = this._savedParameters.at(i);
    }
  }

  /**
   * 초기화합니다.
   */
  public initialize(): void {
    CSM_ASSERT(this._model);

    this._parameterValues = this._model.parameters.values;
    this._partOpacities = this._model.parts.opacities;
    this._parameterMaximumValues = this._model.parameters.maximumValues;
    this._parameterMinimumValues = this._model.parameters.minimumValues;

    {
      const parameterIds: string[] = this._model.parameters.ids;
      const parameterCount: number = this._model.parameters.count;

      this._parameterIds.prepareCapacity(parameterCount);
      this._userParameterRepeatDataList.prepareCapacity(parameterCount);
      for (let i = 0; i < parameterCount; ++i) {
        this._parameterIds.pushBack(
          CubismFramework.getIdManager().getId(parameterIds[i])
        );
        this._userParameterRepeatDataList.pushBack(
          new ParameterRepeatData(false, false)
        );
      }
    }

    const partCount: number = this._model.parts.count;
    {
      const partIds: string[] = this._model.parts.ids;

      this._partIds.prepareCapacity(partCount);
      for (let i = 0; i < partCount; ++i) {
        this._partIds.pushBack(
          CubismFramework.getIdManager().getId(partIds[i])
        );
      }

      this._userPartMultiplyColors.prepareCapacity(partCount);
      this._userPartScreenColors.prepareCapacity(partCount);

      this._partChildDrawables.prepareCapacity(partCount);
    }

    {
      const drawableIds: string[] = this._model.drawables.ids;
      const drawableCount: number = this._model.drawables.count;

      this._userMultiplyColors.prepareCapacity(drawableCount);
      this._userScreenColors.prepareCapacity(drawableCount);

      // 컬링 설정
      this._userCullings.prepareCapacity(drawableCount);
      const userCulling: DrawableCullingData = new DrawableCullingData(
        false,
        false
      );

      // Part
      {
        for (let i = 0; i < partCount; ++i) {
          const multiplyColor: CubismTextureColor = new CubismTextureColor(
            1.0,
            1.0,
            1.0,
            1.0
          );
          const screenColor: CubismTextureColor = new CubismTextureColor(
            0.0,
            0.0,
            0.0,
            1.0
          );

          const userMultiplyColor: PartColorData = new PartColorData(
            false,
            multiplyColor
          );
          const userScreenColor: PartColorData = new PartColorData(
            false,
            screenColor
          );

          this._userPartMultiplyColors.pushBack(userMultiplyColor);
          this._userPartScreenColors.pushBack(userScreenColor);
          this._partChildDrawables.pushBack(new csmVector<number>());
          this._partChildDrawables.at(i).prepareCapacity(drawableCount);
        }
      }

      // Drawables
      {
        for (let i = 0; i < drawableCount; ++i) {
          const multiplyColor: CubismTextureColor = new CubismTextureColor(
            1.0,
            1.0,
            1.0,
            1.0
          );
          const screenColor: CubismTextureColor = new CubismTextureColor(
            0.0,
            0.0,
            0.0,
            1.0
          );

          const userMultiplyColor: DrawableColorData = new DrawableColorData(
            false,
            multiplyColor
          );
          const userScreenColor: DrawableColorData = new DrawableColorData(
            false,
            screenColor
          );

          this._drawableIds.pushBack(
            CubismFramework.getIdManager().getId(drawableIds[i])
          );

          this._userMultiplyColors.pushBack(userMultiplyColor);
          this._userScreenColors.pushBack(userScreenColor);

          this._userCullings.pushBack(userCulling);

          const parentIndex = this.getDrawableParentPartIndex(i);
          if (parentIndex >= 0) {
            this._partChildDrawables.at(parentIndex).pushBack(i);
          }
        }
      }
    }
  }

  /**
   * 생성자
   * @param model 모델
   */
  public constructor(model: Live2DCubismCore.Model) {
    this._model = model;
    this._parameterValues = null;
    this._parameterMaximumValues = null;
    this._parameterMinimumValues = null;
    this._partOpacities = null;
    this._savedParameters = new csmVector<number>();
    this._parameterIds = new csmVector<CubismIdHandle>();
    this._drawableIds = new csmVector<CubismIdHandle>();
    this._partIds = new csmVector<CubismIdHandle>();
    this._isOverriddenParameterRepeat = true;
    this._isOverriddenModelMultiplyColors = false;
    this._isOverriddenModelScreenColors = false;
    this._isOverriddenCullings = false;
    this._modelOpacity = 1.0;

    this._userParameterRepeatDataList = new csmVector<ParameterRepeatData>();
    this._userMultiplyColors = new csmVector<DrawableColorData>();
    this._userScreenColors = new csmVector<DrawableColorData>();
    this._userCullings = new csmVector<DrawableCullingData>();
    this._userPartMultiplyColors = new csmVector<PartColorData>();
    this._userPartScreenColors = new csmVector<PartColorData>();
    this._partChildDrawables = new csmVector<csmVector<number>>();

    this._notExistPartId = new csmMap<CubismIdHandle, number>();
    this._notExistParameterId = new csmMap<CubismIdHandle, number>();
    this._notExistParameterValues = new csmMap<number, number>();
    this._notExistPartOpacities = new csmMap<number, number>();
  }

  /**
   * 소멸자 해당 처리
   */
  public release(): void {
    this._model.release();
    this._model = null;
  }

  private _notExistPartOpacities: csmMap<number, number>; // 존재하지 않는 파츠의 불투명도 목록
  private _notExistPartId: csmMap<CubismIdHandle, number>; // 존재하지 않는 파츠 ID 목록

  private _notExistParameterValues: csmMap<number, number>; // 존재하지 않는 파라미터 값 목록
  private _notExistParameterId: csmMap<CubismIdHandle, number>; // 존재하지 않는 파라미터 ID 목록

  private _savedParameters: csmVector<number>; // 저장된 파라미터

  /**
   * SDK에서 모델 전체 파라미터 반복을 덮어쓸지 결정하는 플래그
   */
  private _isOverriddenParameterRepeat: boolean;

  private _isOverriddenModelMultiplyColors: boolean; // SDK에서 모델 전체의 곱셈색을 덮어쓸지 판정하는 플래그
  private _isOverriddenModelScreenColors: boolean; // SDK에서 모델 전체의 스크린색을 덮어쓸지 판정하는 플래그

  /**
   * 각 파라미터에 설정할 ParameterRepeat 및 Override 플래그를 관리하는 목록
   */
  private _userParameterRepeatDataList: csmVector<ParameterRepeatData>;

  private _userMultiplyColors: csmVector<DrawableColorData>; // Drawable별로 설정하는 곱셈색과 덮어쓰기 플래그를 관리하는 목록
  private _userScreenColors: csmVector<DrawableColorData>; // Drawable별로 설정하는 스크린색과 덮어쓰기 플래그를 관리하는 목록
  private _userPartScreenColors: csmVector<PartColorData>; // Part 곱셈색 배열
  private _userPartMultiplyColors: csmVector<PartColorData>; // Part 스크린색 배열
  private _partChildDrawables: csmVector<csmVector<number>>; // Part의 자식 DrawableIndex 배열

  private _model: Live2DCubismCore.Model; // 모델

  private _parameterValues: Float32Array; // 파라미터 값 목록
  private _parameterMaximumValues: Float32Array; // 파라미터 최대값 목록
  private _parameterMinimumValues: Float32Array; // 파라미터 최소값 목록

  private _partOpacities: Float32Array; // 파츠 불투명도 목록

  private _modelOpacity: number; // 모델 불투명도

  private _parameterIds: csmVector<CubismIdHandle>;
  private _partIds: csmVector<CubismIdHandle>;
  private _drawableIds: csmVector<CubismIdHandle>;

  private _isOverriddenCullings: boolean; // 모델의 컬링 설정을 모두 덮어쓸까?
  private _userCullings: csmVector<DrawableCullingData>; // 컬링 설정 배열
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismmodel';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismModel = $.CubismModel;
  export type CubismModel = $.CubismModel;
}