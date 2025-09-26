/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { CubismIdHandle } from '../id/cubismid';
import { CubismFramework } from '../live2dcubismframework';
import { CubismModel } from '../model/cubismmodel';
import { csmVector } from '../type/csmvector';
import { CubismJson, Value } from '../utils/cubismjson';
import { ACubismMotion } from './acubismmotion';
import { CubismMotionQueueEntry } from './cubismmotionqueueentry';

// exp3.json의 키와 기본값
const ExpressionKeyFadeIn = 'FadeInTime';
const ExpressionKeyFadeOut = 'FadeOutTime';
const ExpressionKeyParameters = 'Parameters';
const ExpressionKeyId = 'Id';
const ExpressionKeyValue = 'Value';
const ExpressionKeyBlend = 'Blend';
const BlendValueAdd = 'Add';
const BlendValueMultiply = 'Multiply';
const BlendValueOverwrite = 'Overwrite';
const DefaultFadeTime = 1.0;

/**
 * 표정 모션
 *
 * 표정의 모션 클래스.
 */
export class CubismExpressionMotion extends ACubismMotion {
  static readonly DefaultAdditiveValue = 0.0; // 덧셈 적용의 초기값
  static readonly DefaultMultiplyValue = 1.0; // 곱셈 적용의 초기값

  /**
   * 인스턴스를 생성합니다.
   * @param buffer exp 파일이 로드된 버퍼
   * @param size 버퍼의 크기
   * @return 생성된 인스턴스
   */
  public static create(
    buffer: ArrayBuffer,
    size: number
  ): CubismExpressionMotion {
    const expression: CubismExpressionMotion = new CubismExpressionMotion();
    expression.parse(buffer, size);
    return expression;
  }

  /**
   * 모델 파라미터 업데이트 실행
   * @param model 대상 모델
   * @param userTimeSeconds 델타 시간의 누적 값 [초]
   * @param weight 모션 가중치
   * @param motionQueueEntry CubismMotionQueueManager에서 관리하는 모션
   */
  public doUpdateParameters(
    model: CubismModel,
    userTimeSeconds: number,
    weight: number,
    motionQueueEntry: CubismMotionQueueEntry
  ): void {
    for (let i = 0; i < this._parameters.getSize(); ++i) {
      const parameter: ExpressionParameter = this._parameters.at(i);

      switch (parameter.blendType) {
        case ExpressionBlendType.Additive: {
          model.addParameterValueById(
            parameter.parameterId,
            parameter.value,
            weight
          );
          break;
        }
        case ExpressionBlendType.Multiply: {
          model.multiplyParameterValueById(
            parameter.parameterId,
            parameter.value,
            weight
          );
          break;
        }
        case ExpressionBlendType.Overwrite: {
          model.setParameterValueById(
            parameter.parameterId,
            parameter.value,
            weight
          );
          break;
        }
        default:
          // 사양에 없는 값을 설정했을 때는 이미 덧셈 모드로 되어 있음
          break;
      }
    }
  }

  /**
   * @brief 표정에 의한 모델 파라미터 계산
   *
   * 모델의 표정에 관한 파라미터를 계산합니다.
   *
   * @param[in]   model                        대상 모델
   * @param[in]   userTimeSeconds              델타 시간의 누적 값 [초]
   * @param[in]   motionQueueEntry             CubismMotionQueueManager에서 관리하는 모션
   * @param[in]   expressionParameterValues    모델에 적용할 각 파라미터 값
   * @param[in]   expressionIndex              표정의 인덱스
   * @param[in]   fadeWeight                   표정의 가중치
   */
  public calculateExpressionParameters(
    model: CubismModel,
    userTimeSeconds: number,
    motionQueueEntry: CubismMotionQueueEntry,
    expressionParameterValues: csmVector<ExpressionParameterValue>,
    expressionIndex: number,
    fadeWeight: number
  ) {
    if (motionQueueEntry == null || expressionParameterValues == null) {
      return;
    }

    if (!motionQueueEntry.isAvailable()) {
      return;
    }

    // CubismExpressionMotion._fadeWeight는 폐지될 예정입니다.
    // 호환성을 위해 처리는 남아 있지만 실제로는 사용하지 않습니다.
    this._fadeWeight = this.updateFadeWeight(motionQueueEntry, userTimeSeconds);

    // 모델에 적용할 값 계산
    for (let i = 0; i < expressionParameterValues.getSize(); ++i) {
      const expressionParameterValue = expressionParameterValues.at(i);

      if (expressionParameterValue.parameterId == null) {
        continue;
      }

      const currentParameterValue = (expressionParameterValue.overwriteValue =
        model.getParameterValueById(expressionParameterValue.parameterId));

      const expressionParameters = this.getExpressionParameters();
      let parameterIndex = -1;
      for (let j = 0; j < expressionParameters.getSize(); ++j) {
        if (
          expressionParameterValue.parameterId !=
          expressionParameters.at(j).parameterId
        ) {
          continue;
        }

        parameterIndex = j;

        break;
      }

      // 재생 중인 Expression이 참조하지 않는 파라미터는 초기값을 적용
      if (parameterIndex < 0) {
        if (expressionIndex == 0) {
          expressionParameterValue.additiveValue =
            CubismExpressionMotion.DefaultAdditiveValue;
          expressionParameterValue.multiplyValue =
            CubismExpressionMotion.DefaultMultiplyValue;
          expressionParameterValue.overwriteValue = currentParameterValue;
        } else {
          expressionParameterValue.additiveValue = this.calculateValue(
            expressionParameterValue.additiveValue,
            CubismExpressionMotion.DefaultAdditiveValue,
            fadeWeight
          );
          expressionParameterValue.multiplyValue = this.calculateValue(
            expressionParameterValue.multiplyValue,
            CubismExpressionMotion.DefaultMultiplyValue,
            fadeWeight
          );
          expressionParameterValue.overwriteValue = this.calculateValue(
            expressionParameterValue.overwriteValue,
            currentParameterValue,
            fadeWeight
          );
        }
        continue;
      }

      // 값 계산
      const value = expressionParameters.at(parameterIndex).value;
      let newAdditiveValue, newMultiplyValue, newOverwriteValue;
      switch (expressionParameters.at(parameterIndex).blendType) {
        case ExpressionBlendType.Additive:
          newAdditiveValue = value;
          newMultiplyValue = CubismExpressionMotion.DefaultMultiplyValue;
          newOverwriteValue = currentParameterValue;
          break;

        case ExpressionBlendType.Multiply:
          newAdditiveValue = CubismExpressionMotion.DefaultAdditiveValue;
          newMultiplyValue = value;
          newOverwriteValue = currentParameterValue;
          break;

        case ExpressionBlendType.Overwrite:
          newAdditiveValue = CubismExpressionMotion.DefaultAdditiveValue;
          newMultiplyValue = CubismExpressionMotion.DefaultMultiplyValue;
          newOverwriteValue = value;
          break;

        default:
          return;
      }

      if (expressionIndex == 0) {
        expressionParameterValue.additiveValue = newAdditiveValue;
        expressionParameterValue.multiplyValue = newMultiplyValue;
        expressionParameterValue.overwriteValue = newOverwriteValue;
      } else {
        expressionParameterValue.additiveValue =
          expressionParameterValue.additiveValue * (1.0 - fadeWeight) +
          newAdditiveValue * fadeWeight;
        expressionParameterValue.multiplyValue =
          expressionParameterValue.multiplyValue * (1.0 - fadeWeight) +
          newMultiplyValue * fadeWeight;
        expressionParameterValue.overwriteValue =
          expressionParameterValue.overwriteValue * (1.0 - fadeWeight) +
          newOverwriteValue * fadeWeight;
      }
    }
  }

  /**
   * @brief 표정이 참조하는 파라미터를 가져옵니다
   *
   * 표정이 참조하는 파라미터를 가져옵니다
   *
   * @return 표정 파라미터
   */
  public getExpressionParameters() {
    return this._parameters;
  }

  /**
   * @brief 표정 페이드 값 가져오기
   *
   * 현재 표정의 페이드 가중치 값을 가져옵니다.
   *
   * @returns 표정의 페이드 가중치 값
   *
   * @deprecated CubismExpressionMotion.fadeWeight가 삭제될 예정이므로 사용을 권장하지 않습니다.
   * CubismExpressionMotionManager.getFadeWeight(index: number): number 를 사용하십시오.
   * @see CubismExpressionMotionManager#getFadeWeight(index: number)
   */
  public getFadeWeight() {
    return this._fadeWeight;
  }

  protected parse(buffer: ArrayBuffer, size: number) {
    const json: CubismJson = CubismJson.create(buffer, size);
    if (!json) {
      return;
    }

    const root: Value = json.getRoot();

    this.setFadeInTime(
      root.getValueByString(ExpressionKeyFadeIn).toFloat(DefaultFadeTime)
    ); // 페이드인
    this.setFadeOutTime(
      root.getValueByString(ExpressionKeyFadeOut).toFloat(DefaultFadeTime)
    ); // 페이드아웃

    // 각 파라미터에 대해
    const parameterCount = root
      .getValueByString(ExpressionKeyParameters)
      .getSize();
    this._parameters.prepareCapacity(parameterCount);

    for (let i = 0; i < parameterCount; ++i) {
      const param: Value = root
        .getValueByString(ExpressionKeyParameters)
        .getValueByIndex(i);
      const parameterId: CubismIdHandle = CubismFramework.getIdManager().getId(
        param.getValueByString(ExpressionKeyId).getRawString()
      ); // 파라미터 ID

      const value: number = param
        .getValueByString(ExpressionKeyValue)
        .toFloat(); // 값

      // 계산 방법 설정
      let blendType: ExpressionBlendType;

      if (
        param.getValueByString(ExpressionKeyBlend).isNull() ||
        param.getValueByString(ExpressionKeyBlend).getString() == BlendValueAdd
      ) {
        blendType = ExpressionBlendType.Additive;
      } else if (
        param.getValueByString(ExpressionKeyBlend).getString() ==
        BlendValueMultiply
      ) {
        blendType = ExpressionBlendType.Multiply;
      } else if (
        param.getValueByString(ExpressionKeyBlend).getString() ==
        BlendValueOverwrite
      ) {
        blendType = ExpressionBlendType.Overwrite;
      } else {
        // 기타 사양에 없는 값을 설정했을 때는 덧셈 모드로 하여 복구
        blendType = ExpressionBlendType.Additive;
      }

      // 설정 객체를 생성하여 목록에 추가
      const item: ExpressionParameter = new ExpressionParameter();

      item.parameterId = parameterId;
      item.blendType = blendType;
      item.value = value;

      this._parameters.pushBack(item);
    }

    CubismJson.delete(json); // JSON 데이터는 불필요해지면 삭제
  }

  /**
   * @brief 블렌드 계산
   *
   * 입력된 값으로 블렌드 계산을 합니다.
   *
   * @param source 현재 값
   * @param destination 적용할 값
   * @param weight 가중치
   * @returns 계산 결과
   */
  public calculateValue(
    source: number,
    destination: number,
    fadeWeight: number
  ): number {
    return source * (1.0 - fadeWeight) + destination * fadeWeight;
  }

  /**
   * 생성자
   */
  protected constructor() {
    super();
    this._parameters = new csmVector<ExpressionParameter>();
    this._fadeWeight = 0.0;
  }

  private _parameters: csmVector<ExpressionParameter>; // 표정 파라미터 정보 목록

  /**
   * 현재 표정의 가중치
   *
   * @deprecated 버그를 유발할 수 있으므로 사용을 권장하지 않습니다.
   */
  private _fadeWeight: number;
}

/**
 * 표정 파라미터 값 계산 방식
 */
export enum ExpressionBlendType {
  Additive = 0, // 덧셈
  Multiply = 1, // 곱셈
  Overwrite = 2 // 덮어쓰기
}

/**
 * 표정 파라미터 정보
 */
export class ExpressionParameter {
  parameterId: CubismIdHandle; // 파라미터 ID
  blendType: ExpressionBlendType; // 파라미터 연산 종류
  value: number; // 값
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismexpressionmotion';
import { ExpressionParameterValue } from './cubismexpressionmotionmanager';
import { CubismDefaultParameterId } from '../cubismdefaultparameterid';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismExpressionMotion = $.CubismExpressionMotion;
  export type CubismExpressionMotion = $.CubismExpressionMotion;
  export const ExpressionBlendType = $.ExpressionBlendType;
  export type ExpressionBlendType = $.ExpressionBlendType;
  export const ExpressionParameter = $.ExpressionParameter;
  export type ExpressionParameter = $.ExpressionParameter;
}