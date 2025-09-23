/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { ACubismMotion } from './acubismmotion';
import { CubismMotionQueueEntry } from './cubismmotionqueueentry';
import { csmVector, iterator } from '../type/csmvector';
import { CubismModel } from '../model/cubismmodel';
import { csmString } from '../type/csmstring';

/**
 * 모션 재생 관리
 *
 * 모션 재생 관리용 클래스. CubismMotion 모션 등 ACubismMotion의 서브 클래스를 재생하기 위해 사용합니다.
 *
 * @note 재생 중에 다른 모션이 StartMotion()되면 새 모션으로 부드럽게 전환되고 이전 모션은 중단됩니다.
 *       표정용 모션, 몸용 모션 등을 별도로 모션화한 경우 등,
 *       여러 모션을 동시에 재생하려면 여러 CubismMotionQueueManager 인스턴스를 사용합니다.
 */
export class CubismMotionQueueManager {
  /**
   * 생성자
   */
  public constructor() {
    this._userTimeSeconds = 0.0;
    this._eventCallBack = null;
    this._eventCustomData = null;
    this._motions = new csmVector<CubismMotionQueueEntry>();
  }

  /**
   * 소멸자
   */
  public release(): void {
    for (let i = 0; i < this._motions.getSize(); ++i) {
      if (this._motions.at(i)) {
        this._motions.at(i).release();
        this._motions.set(i, null);
      }
    }

    this._motions = null;
  }

  /**
   * 지정한 모션 시작
   *
   * 지정한 모션을 시작합니다. 동일한 타입의 모션이 이미 있는 경우, 기존 모션에 종료 플래그를 설정하고 페이드 아웃을 시작합니다.
   *
   * @param   motion          시작할 모션
   * @param   autoDelete      재생이 종료된 모션의 인스턴스를 삭제하려면 true
   * @param   userTimeSeconds Deprecated: 델타 시간의 누적 값 [초] 함수 내에서 참조하지 않으므로 사용은 권장하지 않습니다.
   * @return                      시작한 모션의 식별 번호를 반환합니다. 개별 모션이 종료되었는지 여부를 판정하는 IsFinished()의 인수로 사용합니다. 시작할 수 없으면 "-1"
   */
  public startMotion(
    motion: ACubismMotion,
    autoDelete: boolean,
    userTimeSeconds?: number
  ): CubismMotionQueueEntryHandle {
    if (motion == null) {
      return InvalidMotionQueueEntryHandleValue;
    }

    let motionQueueEntry: CubismMotionQueueEntry = null;

    // 이미 모션이 있으면 종료 플래그를 설정
    for (let i = 0; i < this._motions.getSize(); ++i) {
      motionQueueEntry = this._motions.at(i);
      if (motionQueueEntry == null) {
        continue;
      }

      motionQueueEntry.setFadeOut(motionQueueEntry._motion.getFadeOutTime()); // 페이드 아웃 설정
    }

    motionQueueEntry = new CubismMotionQueueEntry(); // 종료 시 파기
    motionQueueEntry._autoDelete = autoDelete;
    motionQueueEntry._motion = motion;

    this._motions.pushBack(motionQueueEntry);

    return motionQueueEntry._motionQueueEntryHandle;
  }

  /**
   * 모든 모션 종료 확인
   * @return true 모두 종료됨
   * @return false 종료되지 않음
   */
  public isFinished(): boolean {
    // ------- 처리 수행 -------
    // 이미 모션이 있으면 종료 플래그를 설정

    for (
      let ite: iterator<CubismMotionQueueEntry> = this._motions.begin();
      ite.notEqual(this._motions.end());

    ) {
      let motionQueueEntry: CubismMotionQueueEntry = ite.ptr();

      if (motionQueueEntry == null) {
        ite = this._motions.erase(ite); // 삭제
        continue;
      }

      const motion: ACubismMotion = motionQueueEntry._motion;

      if (motion == null) {
        motionQueueEntry.release();
        motionQueueEntry = null;
        ite = this._motions.erase(ite); // 삭제
        continue;
      }

      // ----- 종료된 처리가 있으면 삭제 -----
      if (!motionQueueEntry.isFinished()) {
        return false;
      } else {
        ite.preIncrement();
      }
    }

    return true;
  }

  /**
   * 지정한 모션 종료 확인
   * @param motionQueueEntryNumber 모션의 식별 번호
   * @return true 모두 종료됨
   * @return false 종료되지 않음
   */
  public isFinishedByHandle(
    motionQueueEntryNumber: CubismMotionQueueEntryHandle
  ): boolean {
    for (
      let ite: iterator<CubismMotionQueueEntry> = this._motions.begin();
      ite.notEqual(this._motions.end());
      ite.increment()
    ) {
      const motionQueueEntry: CubismMotionQueueEntry = ite.ptr();

      if (motionQueueEntry == null) {
        continue;
      }

      if (
        motionQueueEntry._motionQueueEntryHandle == motionQueueEntryNumber &&
        !motionQueueEntry.isFinished()
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * 모든 모션 정지
   */
  public stopAllMotions(): void {
    // ------- 처리 수행 -------
    // 이미 모션이 있으면 종료 플래그를 설정

    for (
      let ite: iterator<CubismMotionQueueEntry> = this._motions.begin();
      ite.notEqual(this._motions.end());

    ) {
      let motionQueueEntry: CubismMotionQueueEntry = ite.ptr();

      if (motionQueueEntry == null) {
        ite = this._motions.erase(ite);

        continue;
      }

      // ----- 종료된 처리가 있으면 삭제 -----
      motionQueueEntry.release();
      motionQueueEntry = null;
      ite = this._motions.erase(ite); // 삭제
    }
  }

  /**
   * @brief CubismMotionQueueEntry 배열 가져오기
   *
   * CubismMotionQueueEntry의 배열을 가져옵니다.
   *
   * @return  CubismMotionQueueEntry의 배열에 대한 포인터
   * @retval  NULL   찾을 수 없음
   */
  public getCubismMotionQueueEntries(): csmVector<CubismMotionQueueEntry> {
    return this._motions;
  }

  /**
   * 지정한 CubismMotionQueueEntry 가져오기

   * @param   motionQueueEntryNumber  모션의 식별 번호
   * @return  지정한 CubismMotionQueueEntry
   * @return  null   찾을 수 없음
   */
  public getCubismMotionQueueEntry(
    motionQueueEntryNumber: any
  ): CubismMotionQueueEntry {
    //------- 처리 수행 -------
    for (
      let ite: iterator<CubismMotionQueueEntry> = this._motions.begin();
      ite.notEqual(this._motions.end());
      ite.preIncrement()
    ) {
      const motionQueueEntry: CubismMotionQueueEntry = ite.ptr();

      if (motionQueueEntry == null) {
        continue;
      }

      if (motionQueueEntry._motionQueueEntryHandle == motionQueueEntryNumber) {
        return motionQueueEntry;
      }
    }

    return null;
  }

  /**
   * 이벤트를 수신할 콜백 등록
   *
   * @param callback 콜백 함수
   * @param customData 콜백으로 반환될 데이터
   */
  public setEventCallback(
    callback: CubismMotionEventFunction,
    customData: any = null
  ): void {
    this._eventCallBack = callback;
    this._eventCustomData = customData;
  }

  /**
   * 모션을 업데이트하고 모델에 파라미터 값을 반영합니다.
   *
   * @param   model   대상 모델
   * @param   userTimeSeconds   델타 시간의 누적 값 [초]
   * @return  true    모델에 파라미터 값 반영 있음
   * @return  false   모델에 파라미터 값 반영 없음 (모션 변화 없음)
   */
  public doUpdateMotion(model: CubismModel, userTimeSeconds: number): boolean {
    let updated = false;

    // ------- 처리 수행 --------
    // 이미 모션이 있으면 종료 플래그를 설정

    for (
      let ite: iterator<CubismMotionQueueEntry> = this._motions.begin();
      ite.notEqual(this._motions.end());

    ) {
      let motionQueueEntry: CubismMotionQueueEntry = ite.ptr();

      if (motionQueueEntry == null) {
        ite = this._motions.erase(ite); // 삭제
        continue;
      }

      const motion: ACubismMotion = motionQueueEntry._motion;

      if (motion == null) {
        motionQueueEntry.release();
        motionQueueEntry = null;
        ite = this._motions.erase(ite); // 삭제

        continue;
      }

      // ------ 값 반영 ------
      motion.updateParameters(model, motionQueueEntry, userTimeSeconds);
      updated = true;

      // ------ 사용자 트리거 이벤트 검사 ----
      const firedList: csmVector<csmString> = motion.getFiredEvent(
        motionQueueEntry.getLastCheckEventSeconds() -
          motionQueueEntry.getStartTime(),
        userTimeSeconds - motionQueueEntry.getStartTime()
      );

      for (let i = 0; i < firedList.getSize(); ++i) {
        this._eventCallBack(this, firedList.at(i), this._eventCustomData);
      }

      motionQueueEntry.setLastCheckEventSeconds(userTimeSeconds);

      // ------ 종료된 처리가 있으면 삭제 -----
      if (motionQueueEntry.isFinished()) {
        motionQueueEntry.release();
        motionQueueEntry = null;
        ite = this._motions.erase(ite); // 삭제
      } else {
        if (motionQueueEntry.isTriggeredFadeOut()) {
          motionQueueEntry.startFadeOut(
            motionQueueEntry.getFadeOutSeconds(),
            userTimeSeconds
          );
        }
        ite.preIncrement();
      }
    }

    return updated;
  }
  _userTimeSeconds: number; // 델타 시간의 누적 값 [초]

  _motions: csmVector<CubismMotionQueueEntry>; // 모션
  _eventCallBack: CubismMotionEventFunction; // 콜백 함수
  _eventCustomData: any; // 콜백으로 반환되는 데이터
}

/**
 * 이벤트 콜백 함수 정의
 *
 * 이벤트 콜백에 등록할 수 있는 함수의 타입 정보
 * @param caller        발생한 이벤트를 재생시킨 CubismMotionQueueManager
 * @param eventValue    발생한 이벤트의 문자열 데이터
 * @param customData   콜백으로 반환될 등록 시 지정된 데이터
 */
export interface CubismMotionEventFunction {
  (
    caller: CubismMotionQueueManager,
    eventValue: csmString,
    customData: any
  ): void;
}

/**
 * 모션 식별 번호
 *
 * 모션 식별 번호의 정의
 */
export declare type CubismMotionQueueEntryHandle = any;
export const InvalidMotionQueueEntryHandleValue: CubismMotionQueueEntryHandle =
  -1;

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismmotionqueuemanager';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismMotionQueueManager = $.CubismMotionQueueManager;
  export type CubismMotionQueueManager = $.CubismMotionQueueManager;
  export const InvalidMotionQueueEntryHandleValue =
    $.InvalidMotionQueueEntryHandleValue;
  export type CubismMotionQueueEntryHandle = $.CubismMotionQueueEntryHandle;
  export type CubismMotionEventFunction = $.CubismMotionEventFunction;
}