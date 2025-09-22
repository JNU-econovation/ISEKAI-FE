/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { ACubismMotion } from './acubismmotion';
import { CubismMotionQueueEntryHandle } from './cubismmotionqueuemanager';

/**
 * CubismMotionQueueManager에서 재생 중인 각 모션의 관리 클래스.
 */
export class CubismMotionQueueEntry {
  /**
   * 생성자
   */
  public constructor() {
    this._autoDelete = false;
    this._motion = null;
    this._available = true;
    this._finished = false;
    this._started = false;
    this._startTimeSeconds = -1.0;
    this._fadeInStartTimeSeconds = 0.0;
    this._endTimeSeconds = -1.0;
    this._stateTimeSeconds = 0.0;
    this._stateWeight = 0.0;
    this._lastEventCheckSeconds = 0.0;
    this._motionQueueEntryHandle = this;
    this._fadeOutSeconds = 0.0;
    this._isTriggeredFadeOut = false;
  }

  /**
   * 소멸자 해당 처리
   */
  public release(): void {
    if (this._autoDelete && this._motion) {
      ACubismMotion.delete(this._motion); //
    }
  }

  /**
   * 페이드 아웃 시간 및 시작 판정 설정
   * @param fadeOutSeconds 페이드 아웃에 걸리는 시간 [초]
   */
  public setFadeOut(fadeOutSeconds: number): void {
    this._fadeOutSeconds = fadeOutSeconds;
    this._isTriggeredFadeOut = true;
  }

  /**
   * 페이드 아웃 시작
   * @param fadeOutSeconds 페이드 아웃에 걸리는 시간 [초]
   * @param userTimeSeconds 델타 시간의 누적 값 [초]
   */
  public startFadeOut(fadeOutSeconds: number, userTimeSeconds: number): void {
    const newEndTimeSeconds: number = userTimeSeconds + fadeOutSeconds;
    this._isTriggeredFadeOut = true;

    if (
      this._endTimeSeconds < 0.0 ||
      newEndTimeSeconds < this._endTimeSeconds
    ) {
      this._endTimeSeconds = newEndTimeSeconds;
    }
  }

  /**
   * 모션 종료 확인
   *
   * @return true 모션이 종료됨
   * @return false 종료되지 않음
   */
  public isFinished(): boolean {
    return this._finished;
  }

  /**
   * 모션 시작 확인
   * @return true 모션이 시작됨
   * @return false 시작되지 않음
   */
  public isStarted(): boolean {
    return this._started;
  }

  /**
   * 모션 시작 시간 가져오기
   * @return 모션 시작 시간 [초]
   */
  public getStartTime(): number {
    return this._startTimeSeconds;
  }

  /**
   * 페이드 인 시작 시간 가져오기
   * @return 페이드 인 시작 시간 [초]
   */
  public getFadeInStartTime(): number {
    return this._fadeInStartTimeSeconds;
  }

  /**
   * 페이드 인 종료 시간 가져오기
   * @return 페이드 인 종료 시간
   */
  public getEndTime(): number {
    return this._endTimeSeconds;
  }

  /**
   * 모션 시작 시간 설정
   * @param startTime 모션 시작 시간
   */
  public setStartTime(startTime: number): void {
    this._startTimeSeconds = startTime;
  }

  /**
   * 페이드 인 시작 시간 설정
   * @param startTime 페이드 인 시작 시간 [초]
   */
  public setFadeInStartTime(startTime: number): void {
    this._fadeInStartTimeSeconds = startTime;
  }

  /**
   * 페이드 인 종료 시간 설정
   * @param endTime 페이드 인 종료 시간 [초]
   */
  public setEndTime(endTime: number): void {
    this._endTimeSeconds = endTime;
  }

  /**
   * 모션 종료 설정
   * @param f true인 경우 모션 종료
   */
  public setIsFinished(f: boolean): void {
    this._finished = f;
  }

  /**
   * 모션 시작 설정
   * @param f true인 경우 모션 시작
   */
  public setIsStarted(f: boolean): void {
    this._started = f;
  }

  /**
   * 모션 유효성 확인
   * @return true 모션이 유효함
   * @return false 모션이 유효하지 않음
   */
  public isAvailable(): boolean {
    return this._available;
  }

  /**
   * 모션 유효성 설정
   * @param v true인 경우 모션이 유효함
   */
  public setIsAvailable(v: boolean): void {
    this._available = v;
  }

  /**
   * 모션 상태 설정
   * @param timeSeconds 현재 시간 [초]
   * @param weight 모션 가중치
   */
  public setState(timeSeconds: number, weight: number): void {
    this._stateTimeSeconds = timeSeconds;
    this._stateWeight = weight;
  }

  /**
   * 모션 현재 시간 가져오기
   * @return 모션 현재 시간 [초]
   */
  public getStateTime(): number {
    return this._stateTimeSeconds;
  }

  /**
   * 모션 가중치 가져오기
   * @return 모션 가중치
   */
  public getStateWeight(): number {
    return this._stateWeight;
  }

  /**
   * 마지막으로 이벤트 발생을 확인한 시간 가져오기
   *
   * @return 마지막으로 이벤트 발생을 확인한 시간 [초]
   */
  public getLastCheckEventSeconds(): number {
    return this._lastEventCheckSeconds;
  }

  /**
   * 마지막으로 이벤트를 확인한 시간 설정
   * @param checkSeconds 마지막으로 이벤트를 확인한 시간 [초]
   */
  public setLastCheckEventSeconds(checkSeconds: number): void {
    this._lastEventCheckSeconds = checkSeconds;
  }

  /**
   * 페이드 아웃 시작 판정 가져오기
   * @return 페이드 아웃 시작 여부
   */
  public isTriggeredFadeOut(): boolean {
    return this._isTriggeredFadeOut;
  }

  /**
   * 페이드 아웃 시간 가져오기
   * @return 페이드 아웃 시간 [초]
   */
  public getFadeOutSeconds(): number {
    return this._fadeOutSeconds;
  }

  /**
   * 모션 가져오기
   *
   * @return 모션
   */
  public getCubismMotion(): ACubismMotion {
    return this._motion;
  }

  _autoDelete: boolean; // 자동 삭제
  _motion: ACubismMotion; // 모션

  _available: boolean; // 활성화 플래그
  _finished: boolean; // 종료 플래그
  _started: boolean; // 시작 플래그
  _startTimeSeconds: number; // 모션 재생 시작 시간 [초]
  _fadeInStartTimeSeconds: number; // 페이드 인 시작 시간 (루프 시에는 처음만) [초]
  _endTimeSeconds: number; // 종료 예정 시간 [초]
  _stateTimeSeconds: number; // 시간 상태 [초]
  _stateWeight: number; // 가중치 상태
  _lastEventCheckSeconds: number; // 마지막 Motion 측에서 확인한 시간
  private _fadeOutSeconds: number; // 페이드 아웃 시간 [초]
  private _isTriggeredFadeOut: boolean; // 페이드 아웃 시작 플래그

  _motionQueueEntryHandle: CubismMotionQueueEntryHandle; // 인스턴스별로 고유한 값을 가지는 식별 번호
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismmotionqueueentry';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismMotionQueueEntry = $.CubismMotionQueueEntry;
  export type CubismMotionQueueEntry = $.CubismMotionQueueEntry;
}