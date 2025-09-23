/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { CubismModel } from '../model/cubismmodel';
import { ACubismMotion } from './acubismmotion';
import {
  CubismMotionQueueEntryHandle,
  CubismMotionQueueManager
} from './cubismmotionqueuemanager';

/**
 * 모션 관리
 *
 * 모션을 관리하는 클래스
 */
export class CubismMotionManager extends CubismMotionQueueManager {
  /**
   * 생성자
   */
  public constructor() {
    super();
    this._currentPriority = 0;
    this._reservePriority = 0;
  }

  /**
   * 재생 중인 모션의 우선순위 가져오기
   * @return  모션의 우선순위
   */
  public getCurrentPriority(): number {
    return this._currentPriority;
  }

  /**
   * 예약 중인 모션의 우선순위를 가져옵니다.
   * @return  모션의 우선순위
   */
  public getReservePriority(): number {
    return this._reservePriority;
  }

  /**
   * 예약 중인 모션의 우선순위를 설정합니다.
   * @param   val     우선순위
   */
  public setReservePriority(val: number): void {
    this._reservePriority = val;
  }

  /**
   * 우선순위를 설정하고 모션을 시작합니다.
   *
   * @param motion          모션
   * @param autoDelete      재생이 종료된 모션의 인스턴스를 삭제하려면 true
   * @param priority        우선순위
   * @return                시작한 모션의 식별 번호를 반환합니다. 개별 모션이 종료되었는지 여부를 판정하는 IsFinished()의 인수로 사용합니다. 시작할 수 없으면 "-1"
   */
  public startMotionPriority(
    motion: ACubismMotion,
    autoDelete: boolean,
    priority: number
  ): CubismMotionQueueEntryHandle {
    if (priority == this._reservePriority) {
      this._reservePriority = 0; // 예약 해제
    }

    this._currentPriority = priority; // 재생 중인 모션의 우선순위 설정

    return super.startMotion(motion, autoDelete);
  }

  /**
   * 모션을 업데이트하고 모델에 파라미터 값을 반영합니다.
   *
   * @param model   대상 모델
   * @param deltaTimeSeconds    델타 시간[초]
   * @return  true    업데이트됨
   * @return  false   업데이트되지 않음
   */
  public updateMotion(model: CubismModel, deltaTimeSeconds: number): boolean {
    this._userTimeSeconds += deltaTimeSeconds;

    const updated: boolean = super.doUpdateMotion(model, this._userTimeSeconds);

    if (this.isFinished()) {
      this._currentPriority = 0; // 재생 중인 모션의 우선순위 해제
    }

    return updated;
  }

  /**
   * 모션을 예약합니다.
   *
   * @param   priority    우선순위
   * @return  true    예약됨
   * @return  false   예약되지 않음
   */
  public reserveMotion(priority: number): boolean {
    if (
      priority <= this._reservePriority ||
      priority <= this._currentPriority
    ) {
      return false;
    }

    this._reservePriority = priority;

    return true;
  }

  _currentPriority: number; // 현재 재생 중인 모션의 우선순위
  _reservePriority: number; // 재생 예정인 모션의 우선순위. 재생 중에는 0이 됩니다. 모션 파일을 다른 스레드에서 로드할 때의 기능。
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismmotionmanager';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismMotionManager = $.CubismMotionManager;
  export type CubismMotionManager = $.CubismMotionManager;
}