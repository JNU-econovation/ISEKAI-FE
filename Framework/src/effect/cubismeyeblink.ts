/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { ICubismModelSetting } from '../icubismmodelsetting';
import { CubismIdHandle } from '../id/cubismid';
import { CubismModel } from '../model/cubismmodel';
import { csmVector } from '../type/csmvector';

/**
 * 자동 눈 깜박임 기능
 *
 * 자동 눈 깜박임 기능을 제공합니다.
 */
export class CubismEyeBlink {
  /**
   * 인스턴스를 생성합니다.
   * @param modelSetting 모델 설정 정보
   * @return 생성된 인스턴스
   * @note 인수가 NULL인 경우 파라미터 ID가 설정되지 않은 빈 인스턴스를 생성합니다.
   */
  public static create(
    modelSetting: ICubismModelSetting = null
  ): CubismEyeBlink {
    return new CubismEyeBlink(modelSetting);
  }

  /**
   * 인스턴스 파기
   * @param eyeBlink 대상 CubismEyeBlink
   */
  public static delete(eyeBlink: CubismEyeBlink): void {
    if (eyeBlink != null) {
      eyeBlink = null;
    }
  }

  /**
   * 눈 깜박임 간격 설정
   * @param blinkingInterval 눈 깜박임 간격 시간 [초]
   */
  public setBlinkingInterval(blinkingInterval: number): void {
    this._blinkingIntervalSeconds = blinkingInterval;
  }

  /**
   * 눈 깜박임 모션 상세 설정
   * @param closing   눈꺼풀을 감는 동작에 걸리는 시간 [초]
   * @param closed    눈꺼풀을 감고 있는 동작에 걸리는 시간 [초]
   * @param opening   눈꺼풀을 뜨는 동작에 걸리는 시간 [초]
   */
  public setBlinkingSetting(
    closing: number,
    closed: number,
    opening: number
  ): void {
    this._closingSeconds = closing;
    this._closedSeconds = closed;
    this._openingSeconds = opening;
  }

  /**
   * 눈 깜박임을 적용할 파라미터 ID 목록 설정
   * @param parameterIds 파라미터 ID 목록
   */
  public setParameterIds(parameterIds: csmVector<CubismIdHandle>): void {
    this._parameterIds = parameterIds;
  }

  /**
   * 눈 깜박임을 적용할 파라미터 ID 목록 가져오기
   * @return 파라미터 ID 목록
   */
  public getParameterIds(): csmVector<CubismIdHandle> {
    return this._parameterIds;
  }

  /**
   * 모델 파라미터 업데이트
   * @param model 대상 모델
   * @param deltaTimeSeconds 델타 시간 [초]
   */
  public updateParameters(model: CubismModel, deltaTimeSeconds: number): void {
    this._userTimeSeconds += deltaTimeSeconds;
    let parameterValue: number;
    let t = 0.0;
    const blinkingState: EyeState = this._blinkingState;

    switch (blinkingState) {
      case EyeState.EyeState_Closing:
        t =
          (this._userTimeSeconds - this._stateStartTimeSeconds) /
          this._closingSeconds;

        if (t >= 1.0) {
          t = 1.0;
          this._blinkingState = EyeState.EyeState_Closed;
          this._stateStartTimeSeconds = this._userTimeSeconds;
        }

        parameterValue = 1.0 - t;

        break;
      case EyeState.EyeState_Closed:
        t =
          (this._userTimeSeconds - this._stateStartTimeSeconds) /
          this._closedSeconds;

        if (t >= 1.0) {
          this._blinkingState = EyeState.EyeState_Opening;
          this._stateStartTimeSeconds = this._userTimeSeconds;
        }

        parameterValue = 0.0;

        break;
      case EyeState.EyeState_Opening:
        t =
          (this._userTimeSeconds - this._stateStartTimeSeconds) /
          this._openingSeconds;

        if (t >= 1.0) {
          t = 1.0;
          this._blinkingState = EyeState.EyeState_Interval;
          this._nextBlinkingTime = this.determinNextBlinkingTiming();
        }

        parameterValue = t;

        break;
      case EyeState.EyeState_Interval:
        if (this._nextBlinkingTime < this._userTimeSeconds) {
          this._blinkingState = EyeState.EyeState_Closing;
          this._stateStartTimeSeconds = this._userTimeSeconds;
        }

        parameterValue = 1.0;

        break;
      case EyeState.EyeState_First:
      default:
        this._blinkingState = EyeState.EyeState_Interval;
        this._nextBlinkingTime = this.determinNextBlinkingTiming();

        parameterValue = 1.0;
        break;
    }

    if (!CubismEyeBlink.CloseIfZero) {
      parameterValue = -parameterValue;
    }

    for (let i = 0; i < this._parameterIds.getSize(); ++i) {
      model.setParameterValueById(this._parameterIds.at(i), parameterValue);
    }
  }

  /**
   * 생성자
   * @param modelSetting 모델 설정 정보
   */
  public constructor(modelSetting: ICubismModelSetting) {
    this._blinkingState = EyeState.EyeState_First;
    this._nextBlinkingTime = 0.0;
    this._stateStartTimeSeconds = 0.0;
    this._blinkingIntervalSeconds = 4.0;
    this._closingSeconds = 0.1;
    this._closedSeconds = 0.05;
    this._openingSeconds = 0.15;
    this._userTimeSeconds = 0.0;
    this._parameterIds = new csmVector<CubismIdHandle>();

    if (modelSetting == null) {
      return;
    }

    for (let i = 0; i < modelSetting.getEyeBlinkParameterCount(); ++i) {
      this._parameterIds.pushBack(modelSetting.getEyeBlinkParameterId(i));
    }
  }

  /**
   * 다음 눈 깜박임 타이밍 결정
   *
   * @return 다음 눈 깜박임을 수행할 시간 [초]
   */
  public determinNextBlinkingTiming(): number {
    const r: number = Math.random();
    return (
      this._userTimeSeconds + r * (2.0 * this._blinkingIntervalSeconds - 1.0)
    );
  }

  _blinkingState: number; // 현재 상태
  _parameterIds: csmVector<CubismIdHandle>; // 조작 대상 파라미터의 ID 목록
  _nextBlinkingTime: number; // 다음 눈 깜박임 시간 [초]
  _stateStartTimeSeconds: number; // 현재 상태가 시작된 시간 [초]
  _blinkingIntervalSeconds: number; // 눈 깜박임 간격 [초]
  _closingSeconds: number; // 눈을 감는 동작에 걸리는 시간 [초]
  _closedSeconds: number; // 눈을 감고 있는 동작에 걸리는 시간 [초]
  _openingSeconds: number; // 눈을 뜨는 동작에 걸리는 시간 [초]
  _userTimeSeconds: number; // 델타 시간의 누적 값 [초]

  /**
   * ID로 지정된 눈 파라미터가 0일 때 닫히면 true, 1일 때 닫히면 false.
   */
  static readonly CloseIfZero: boolean = true;
}

/**
 * 눈 깜박임 상태
 *
 * 눈 깜박임 상태를 나타내는 열거형
 */
export enum EyeState {
  EyeState_First = 0, // 초기 상태
  EyeState_Interval, // 눈 깜박이지 않는 상태
  EyeState_Closing, // 눈꺼풀이 감기는 중인 상태
  EyeState_Closed, // 눈꺼풀이 감긴 상태
  EyeState_Opening // 눈꺼풀이 뜨이는 중인 상태
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismeyeblink';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismEyeBlink = $.CubismEyeBlink;
  export type CubismEyeBlink = $.CubismEyeBlink;
  export const EyeState = $.EyeState;
  export type EyeState = $.EyeState;
}