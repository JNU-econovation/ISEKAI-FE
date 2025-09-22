/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { CubismMath } from '../math/cubismmath';
import { CubismModel } from '../model/cubismmodel';
import { csmString } from '../type/csmstring';
import { csmVector } from '../type/csmvector';
import { CSM_ASSERT, CubismDebug } from '../utils/cubismdebug';
import { CubismMotionQueueEntry } from './cubismmotionqueueentry';

/** 모션 재생 시작 콜백 함수 정의 */
export type BeganMotionCallback = (self: ACubismMotion) => void;

/** 모션 재생 종료 콜백 함수 정의 */
export type FinishedMotionCallback = (self: ACubismMotion) => void;

/**
 * 모션의 추상 기본 클래스
 *
 * 모션의 추상 기본 클래스. MotionQueueManager에 의해 모션 재생을 관리합니다.
 */
export abstract class ACubismMotion {
  /**
   * 인스턴스 파기
   */
  public static delete(motion: ACubismMotion): void {
    motion.release();
    motion = null;
  }

  /**
   * 생성자
   */
  public constructor() {
    this._fadeInSeconds = -1.0;
    this._fadeOutSeconds = -1.0;
    this._weight = 1.0;
    this._offsetSeconds = 0.0; // 재생 시작 시간
    this._isLoop = false; // 루프 여부
    this._isLoopFadeIn = true; // 루프 시 페이드인이 활성화되어 있는지 여부 플래그. 초기값은 활성화.
    this._previousLoopState = this._isLoop;
    this._firedEventValues = new csmVector<csmString>();
  }

  /**
   * 소멸자 해당 처리
   */
  public release(): void {
    this._weight = 0.0;
  }

  /**
   * 모델 파라미터
   * @param model 대상 모델
   * @param motionQueueEntry CubismMotionQueueManager에서 관리하는 모션
   * @param userTimeSeconds 델타 시간의 누적 값 [초]
   */
  public updateParameters(
    model: CubismModel,
    motionQueueEntry: CubismMotionQueueEntry,
    userTimeSeconds: number
  ): void {
    if (!motionQueueEntry.isAvailable() || motionQueueEntry.isFinished()) {
      return;
    }

    this.setupMotionQueueEntry(motionQueueEntry, userTimeSeconds);

    const fadeWeight = this.updateFadeWeight(motionQueueEntry, userTimeSeconds);

    //---- 모든 파라미터 ID를 루프 ----
    this.doUpdateParameters(
      model,
      userTimeSeconds,
      fadeWeight,
      motionQueueEntry
    );

    // 후처리
    // 종료 시간을 지나면 종료 플래그를 설정 (CubismMotionQueueManager)
    if (
      motionQueueEntry.getEndTime() > 0 &&
      motionQueueEntry.getEndTime() < userTimeSeconds
    ) {
      motionQueueEntry.setIsFinished(true); // 종료
    }
  }

  /**
   * @brief 모델 재생 시작 처리
   *
   * 모션 재생을 시작하기 위한 설정을 수행합니다.
   *
   * @param[in]   motionQueueEntry    CubismMotionQueueManager에서 관리하는 모션
   * @param[in]   userTimeSeconds     델타 시간의 누적 값 [초]
   */
  public setupMotionQueueEntry(
    motionQueueEntry: CubismMotionQueueEntry,
    userTimeSeconds: number
  ) {
    if (motionQueueEntry == null || motionQueueEntry.isStarted()) {
      return;
    }

    if (!motionQueueEntry.isAvailable()) {
      return;
    }

    motionQueueEntry.setIsStarted(true);
    motionQueueEntry.setStartTime(userTimeSeconds - this._offsetSeconds); // 모션 시작 시간 기록
    motionQueueEntry.setFadeInStartTime(userTimeSeconds); // 페이드인 시작 시간

    if (motionQueueEntry.getEndTime() < 0.0) {
      // 시작하기 전에 종료 설정이 되어 있는 경우가 있음
      this.adjustEndTime(motionQueueEntry);
    }

    // 재생 시작 콜백
    if (motionQueueEntry._motion._onBeganMotion) {
      motionQueueEntry._motion._onBeganMotion(motionQueueEntry._motion);
    }
  }

  /**
   * @brief 모델 가중치 업데이트
   *
   * 모션의 가중치를 업데이트합니다.
   *
   * @param[in]   motionQueueEntry    CubismMotionQueueManager에서 관리하는 모션
   * @param[in]   userTimeSeconds     델타 시간의 누적 값 [초]
   */
  public updateFadeWeight(
    motionQueueEntry: CubismMotionQueueEntry,
    userTimeSeconds: number
  ): number {
    if (motionQueueEntry == null) {
      CubismDebug.print(LogLevel.LogLevel_Error, 'motionQueueEntry is null.');
    }

    let fadeWeight: number = this._weight; // 현재 값과 곱할 비율

    //---- 페이드인·아웃 처리 ----
    // 단순한 사인 함수로 이징
    const fadeIn: number =
      this._fadeInSeconds == 0.0
        ? 1.0
        : CubismMath.getEasingSine(
            (userTimeSeconds - motionQueueEntry.getFadeInStartTime()) /
              this._fadeInSeconds
          );

    const fadeOut: number =
      this._fadeOutSeconds == 0.0 || motionQueueEntry.getEndTime() < 0.0
        ? 1.0
        : CubismMath.getEasingSine(
            (motionQueueEntry.getEndTime() - userTimeSeconds) /
              this._fadeOutSeconds
          );

    fadeWeight = fadeWeight * fadeIn * fadeOut;

    motionQueueEntry.setState(userTimeSeconds, fadeWeight);

    CSM_ASSERT(0.0 <= fadeWeight && fadeWeight <= 1.0);

    return fadeWeight;
  }

  /**
   * 페이드인 시간 설정
   * @param fadeInSeconds 페이드인에 걸리는 시간 [초]
   */
  public setFadeInTime(fadeInSeconds: number): void {
    this._fadeInSeconds = fadeInSeconds;
  }

  /**
   * 페이드아웃 시간 설정
   * @param fadeOutSeconds 페이드아웃에 걸리는 시간 [초]
   */
  public setFadeOutTime(fadeOutSeconds: number): void {
    this._fadeOutSeconds = fadeOutSeconds;
  }

  /**
   * 페이드아웃에 걸리는 시간 가져오기
   * @return 페이드아웃에 걸리는 시간 [초]
   */
  public getFadeOutTime(): number {
    return this._fadeOutSeconds;
  }

  /**
   * 페이드인에 걸리는 시간 가져오기
   * @return 페이드인에 걸리는 시간 [초]
   */
  public getFadeInTime(): number {
    return this._fadeInSeconds;
  }

  /**
   * 모션 적용 가중치 설정
   * @param weight 가중치 (0.0 - 1.0)
   */
  public setWeight(weight: number): void {
    this._weight = weight;
  }

  /**
   * 모션 적용 가중치 가져오기
   * @return 가중치 (0.0 - 1.0)
   */
  public getWeight(): number {
    return this._weight;
  }

  /**
   * 모션 길이 가져오기
   * @return 모션 길이 [초]
   *
   * @note 루프 시에는 "-1".
   *       루프가 아닌 경우 재정의합니다.
   *       양수 값일 때는 가져온 시간으로 종료됩니다.
   *       "-1"일 때는 외부에서 정지 명령이 없는 한 끝나지 않는 처리가 됩니다.
   */
  public getDuration(): number {
    return -1.0;
  }

  /**
   * 모션 루프 1회분의 길이 가져오기
   * @return 모션 루프 1회분의 길이 [초]
   *
   * @note 루프하지 않는 경우 getDuration()과 동일한 값을 반환
   *       루프 1회분의 길이를 정의할 수 없는 경우(프로그램적으로 계속 움직이는 서브클래스 등)에는 "-1"을 반환
   */
  public getLoopDuration(): number {
    return -1.0;
  }

  /**
   * 모션 재생 시작 시간 설정
   * @param offsetSeconds 모션 재생 시작 시간 [초]
   */
  public setOffsetTime(offsetSeconds: number): void {
    this._offsetSeconds = offsetSeconds;
  }

  /**
   * 루프 정보 설정
   * @param loop 루프 정보
   */
  public setLoop(loop: boolean): void {
    this._isLoop = loop;
  }

  /**
   * 루프 정보 가져오기
   * @return true 루프함
   * @return false 루프하지 않음
   */
  public getLoop(): boolean {
    return this._isLoop;
  }

  /**
   * 루프 시 페이드인 정보 설정
   * @param loopFadeIn  루프 시 페이드인 정보
   */
  public setLoopFadeIn(loopFadeIn: boolean) {
    this._isLoopFadeIn = loopFadeIn;
  }

  /**
   * 루프 시 페이드인 정보 가져오기
   *
   * @return  true    함
   * @return  false   하지 않음
   */
  public getLoopFadeIn(): boolean {
    return this._isLoopFadeIn;
  }

  /**
   * 모델 파라미터 업데이트
   *
   * 이벤트 발생 확인.
   * 입력하는 시간은 호출되는 모션 타이밍을 0으로 한 초 단위로 수행합니다.
   *
   * @param beforeCheckTimeSeconds 이전 이벤트 확인 시간 [초]
   * @param motionTimeSeconds 이번 재생 시간 [초]
   */
  public getFiredEvent(
    beforeCheckTimeSeconds: number,
    motionTimeSeconds: number
  ): csmVector<csmString> {
    return this._firedEventValues;
  }

  /**
   * 모션을 업데이트하고 모델에 파라미터 값을 반영합니다.
   * @param model 대상 모델
   * @param userTimeSeconds 델타 시간의 누적 값 [초]
   * @param weight 모션 가중치
   * @param motionQueueEntry CubismMotionQueueManager에서 관리하는 모션
   * @return true 모델에 파라미터 값 반영 있음
   * @return false 모델에 파라미터 값 반영 없음 (모션 변화 없음)
   */
  public abstract doUpdateParameters(
    model: CubismModel,
    userTimeSeconds: number,
    weight: number,
    motionQueueEntry: CubismMotionQueueEntry
  ): void;

  /**
   * 모션 재생 시작 콜백 등록
   *
   * 모션 재생 시작 콜백을 등록합니다.
   * 다음 상태에서는 호출되지 않습니다:
   *   1. 재생 중인 모션이 "루프"로 설정된 경우
   *   2. 콜백이 등록되지 않은 경우
   *
   * @param onBeganMotionHandler 모션 재생 시작 콜백 함수
   */
  public setBeganMotionHandler = (onBeganMotionHandler: BeganMotionCallback) =>
    (this._onBeganMotion = onBeganMotionHandler);

  /**
   * 모션 재생 시작 콜백 가져오기
   *
   * 모션 재생 시작 콜백을 가져옵니다.
   *
   * @return 등록된 모션 재생 시작 콜백 함수
   */
  public getBeganMotionHandler = () => this._onBeganMotion;

  /**
   * 모션 재생 종료 콜백 등록
   *
   * 모션 재생 종료 콜백을 등록합니다.
   * isFinished 플래그를 설정하는 타이밍에 호출됩니다.
   * 다음 상태에서는 호출되지 않습니다:
   *   1. 재생 중인 모션이 "루프"로 설정된 경우
   *   2. 콜백이 등록되지 않은 경우
   *
   * @param onFinishedMotionHandler 모션 재생 종료 콜백 함수
   */
  public setFinishedMotionHandler = (
    onFinishedMotionHandler: FinishedMotionCallback
  ) => (this._onFinishedMotion = onFinishedMotionHandler);

  /**
   * 모션 재생 종료 콜백 가져오기
   *
   * 모션 재생 종료 콜백을 가져옵니다.
   *
   * @return 등록된 모션 재생 종료 콜백 함수
   */
  public getFinishedMotionHandler = () => this._onFinishedMotion;

  /**
   * 불투명도 커브 존재 여부 확인
   *
   * @returns true  -> 키가 존재함
   *          false -> 키가 존재하지 않음
   */
  public isExistModelOpacity(): boolean {
    return false;
  }

  /**
   * 불투명도 커브의 인덱스를 반환합니다.
   *
   * @returns success:불투명도 커브의 인덱스
   */
  public getModelOpacityIndex(): number {
    return -1;
  }

  /**
   * 불투명도 ID를 반환합니다.
   *
   * @param index 모션 커브의 인덱스
   * @returns success:불투명도 ID
   */
  public getModelOpacityId(index: number): CubismIdHandle {
    return null;
  }

  /**
   * 지정 시간의 불투명도 값을 반환합니다.
   *
   * @returns success:모션의 현재 시간에서의 Opacity 값
   *
   * @note  업데이트된 값을 가져오려면 UpdateParameters() 다음에 호출합니다.
   */
  protected getModelOpacityValue(): number {
    return 1.0;
  }

  /**
   * 종료 시간 조정
   * @param motionQueueEntry CubismMotionQueueManager에서 관리하는 모션
   */
  protected adjustEndTime(motionQueueEntry: CubismMotionQueueEntry) {
    const duration = this.getDuration();

    // duration == -1인 경우 루프
    const endTime =
      duration <= 0.0 ? -1 : motionQueueEntry.getStartTime() + duration;

    motionQueueEntry.setEndTime(endTime);
  }

  public _fadeInSeconds: number; // 페이드인에 걸리는 시간 [초]
  public _fadeOutSeconds: number; // 페이드아웃에 걸리는 시간 [초]
  public _weight: number; // 모션 가중치
  public _offsetSeconds: number; // 모션 재생 시작 시간 [초]
  public _isLoop: boolean; // 루프 활성화 여부 플래그
  public _isLoopFadeIn: boolean; // 루프 시 페이드인 활성화 여부 플래그
  public _previousLoopState: boolean; // 이전 `_isLoop` 상태
  public _firedEventValues: csmVector<csmString>;

  // 모션 재생 시작 콜백 함수
  public _onBeganMotion?: BeganMotionCallback;
  // 모션 재생 종료 콜백 함수
  public _onFinishedMotion?: FinishedMotionCallback;
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './acubismmotion';
import { CubismIdHandle } from '../id/cubismid';
import { LogLevel } from '../live2dcubismframework';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const ACubismMotion = $.ACubismMotion;
  export type ACubismMotion = $.ACubismMotion;
  export type BeganMotionCallback = $.BeganMotionCallback;
  export type FinishedMotionCallback = $.FinishedMotionCallback;
}