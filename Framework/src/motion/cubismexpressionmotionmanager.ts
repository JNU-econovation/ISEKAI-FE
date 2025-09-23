import { CubismId, CubismIdHandle } from '../id/cubismid';
import { LogLevel, csmDelete } from '../live2dcubismframework';
import { CubismModel } from '../model/cubismmodel';
import { csmVector, iterator } from '../type/csmvector';
import { ACubismMotion } from './acubismmotion';
import { CubismExpressionMotion } from './cubismexpressionmotion';
import { CubismMotionQueueEntry } from './cubismmotionqueueentry';
import {
  CubismMotionQueueEntryHandle,
  CubismMotionQueueManager
} from './cubismmotionqueuemanager';
import { CubismLogInfo } from '../utils/cubismdebug';

/**
 * @brief 파라미터에 적용할 표정 값을 가지는 구조체
 */
export class ExpressionParameterValue {
  parameterId: CubismIdHandle; // 파라미터 ID
  additiveValue: number; // 덧셈 값
  multiplyValue: number; // 곱셈 값
  overwriteValue: number; // 덮어쓰기 값
}

/**
 * @brief 표정 모션 관리
 *
 * 표정 모션의 관리를 수행하는 클래스.
 */
export class CubismExpressionMotionManager extends CubismMotionQueueManager {
  /**
   * 생성자
   */
  public constructor() {
    super();
    this._currentPriority = 0;
    this._reservePriority = 0;
    this._expressionParameterValues = new csmVector<ExpressionParameterValue>();
    this._fadeWeights = new csmVector<number>();
  }

  /**
   * 소멸자 해당 처리
   */
  public release(): void {
    if (this._expressionParameterValues) {
      csmDelete(this._expressionParameterValues);
      this._expressionParameterValues = null;
    }

    if (this._fadeWeights) {
      csmDelete(this._fadeWeights);
      this._fadeWeights = null;
    }
  }

  /**
   * @deprecated
   * Expression에서는 Priority를 사용하지 않으므로 이 함수는 더 이상 사용되지 않습니다.
   *
   * @brief 재생 중인 모션의 우선순위 가져오기
   *
   * 재생 중인 모션의 우선순위를 가져옵니다.
   *
   * @returns 모션의 우선순위
   */
  public getCurrentPriority(): number {
    CubismLogInfo(
      'CubismExpressionMotionManager.getCurrentPriority() is deprecated because a priority value is not actually used during expression motion playback.'
    );
    return this._currentPriority;
  }

  /**
   * @deprecated
   * Expression에서는 Priority를 사용하지 않으므로 이 함수는 더 이상 사용되지 않습니다.
   *
   * @brief 예약 중인 모션의 우선순위 가져오기
   *
   * 예약 중인 모션의 우선순위를 가져옵니다.
   *
   * @return  모션의 우선순위
   */
  public getReservePriority(): number {
    CubismLogInfo(
      'CubismExpressionMotionManager.getReservePriority() is deprecated because a priority value is not actually used during expression motion playback.'
    );
    return this._reservePriority;
  }

  /**
   * @brief 재생 중인 모션의 가중치를 가져옵니다.
   *
   * @param[in]    index    표정의 인덱스
   * @returns               표정 모션의 가중치
   */
  public getFadeWeight(index: number): number {
    if (
      index < 0 ||
      this._fadeWeights.getSize() < 1 ||
      index >= this._fadeWeights.getSize()
    ) {
      console.warn(
        'Failed to get the fade weight value. The element at that index does not exist.'
      );
      return -1;
    }

    return this._fadeWeights.at(index);
  }

  /**
   * @brief 모션의 가중치 설정.
   *
   * @param[in]    index    표정의 인덱스
   * @param[in]    index    표정 모션의 가중치
   */
  public setFadeWeight(index: number, expressionFadeWeight: number): void {
    if (
      index < 0 ||
      this._fadeWeights.getSize() < 1 ||
      this._fadeWeights.getSize() <= index
    ) {
      console.warn(
        'Failed to set the fade weight value. The element at that index does not exist.'
      );
      return;
    }

    this._fadeWeights.set(index, expressionFadeWeight);
  }

  /**
   * @deprecated
   * Expression에서는 Priority를 사용하지 않으므로 이 함수는 더 이상 사용되지 않습니다.
   *
   * @brief 예약 중인 모션의 우선순위 설정
   *
   * 예약 중인 모션의 우선순위를 설정합니다.
   *
   * @param[in]   priority     우선순위
   */
  public setReservePriority(priority: number) {
    CubismLogInfo(
      'CubismExpressionMotionManager.setReservePriority() is deprecated because a priority value is not actually used during expression motion playback.'
    );
    this._reservePriority = priority;
  }

  /**
   * @deprecated
   * Expression에서는 Priority를 사용하지 않으므로 이 함수는 더 이상 사용되지 않습니다.
   * CubismExpressionMotionManager.startMotion()을 사용하십시오.
   *
   * @brief 우선순위를 설정하고 모션 시작
   *
   * 우선순위를 설정하고 모션을 시작합니다.
   *
   * @param[in]   motion          모션
   * @param[in]   autoDelete      재생이 종료된 모션의 인스턴스를 삭제하려면 true
   * @param[in]   priority        우선순위
   * @return                      시작한 모션의 식별 번호를 반환합니다. 개별 모션이 종료되었는지 여부를 판정하는 IsFinished()의 인수로 사용합니다. 시작할 수 없으면 "-1"
   */
  public startMotionPriority(
    motion: ACubismMotion,
    autoDelete: boolean,
    priority: number
  ): CubismMotionQueueEntryHandle {
    CubismLogInfo(
      'CubismExpressionMotionManager.startMotionPriority() is deprecated because a priority value is not actually used during expression motion playback.'
    );
    if (priority == this.getReservePriority()) {
      this.setReservePriority(0);
    }
    this._currentPriority = priority;

    return this.startMotion(motion, autoDelete);
  }

  /**
   * @brief 모션 업데이트
   *
   * 모션을 업데이트하고 모델에 파라미터 값을 반영합니다.
   *
   * @param[in]   model   대상 모델
   * @param[in]   deltaTimeSeconds    델타 시간[초]
   * @retval  true    업데이트됨
   * @retval  false   업데이트되지 않음
   */
  public updateMotion(model: CubismModel, deltaTimeSeconds: number): boolean {
    this._userTimeSeconds += deltaTimeSeconds;
    let updated = false;
    const motions = this.getCubismMotionQueueEntries();

    let expressionWeight = 0.0;
    let expressionIndex = 0;

    if (this._fadeWeights.getSize() !== motions.getSize()) {
      const difference = motions.getSize() - this._fadeWeights.getSize();
      for (let i = 0; i < difference; i++) {
        this._fadeWeights.pushBack(0.0);
      }
    }

    // ------- 처리 수행 --------
    // 이미 모션이 있으면 종료 플래그를 설정
    for (
      let ite: iterator<CubismMotionQueueEntry> = this._motions.begin();
      ite.notEqual(this._motions.end());

    ) {
      const motionQueueEntry = ite.ptr();

      if (motionQueueEntry == null) {
        ite = motions.erase(ite); //삭제
        continue;
      }

      const expressionMotion = <CubismExpressionMotion>(
        motionQueueEntry.getCubismMotion()
      );

      if (expressionMotion == null) {
        csmDelete(motionQueueEntry);
        ite = motions.erase(ite); //삭제
        continue;
      }

      const expressionParameters = expressionMotion.getExpressionParameters();

      if (motionQueueEntry.isAvailable()) {
        // 재생 중인 Expression이 참조하는 파라미터를 모두 나열
        for (let i = 0; i < expressionParameters.getSize(); ++i) {
          if (expressionParameters.at(i).parameterId == null) {
            continue;
          }

          let index = -1;
          // 목록에 파라미터 ID가 있는지 검색
          for (let j = 0; j < this._expressionParameterValues.getSize(); ++j) {
            if (
              this._expressionParameterValues.at(j).parameterId !=
              expressionParameters.at(i).parameterId
            ) {
              continue;
            }

            index = j;
            break;
          }

          if (index >= 0) {
            continue;
          }

          // 파라미터가 목록에 없으면 새로 추가
          const item: ExpressionParameterValue = new ExpressionParameterValue();
          item.parameterId = expressionParameters.at(i).parameterId;
          item.additiveValue = CubismExpressionMotion.DefaultAdditiveValue;
          item.multiplyValue = CubismExpressionMotion.DefaultMultiplyValue;
          item.overwriteValue = model.getParameterValueById(item.parameterId);
          this._expressionParameterValues.pushBack(item);
        }
      }

      // ------ 값 계산 ------
      expressionMotion.setupMotionQueueEntry(
        motionQueueEntry,
        this._userTimeSeconds
      );
      this.setFadeWeight(
        expressionIndex,
        expressionMotion.updateFadeWeight(
          motionQueueEntry,
          this._userTimeSeconds
        )
      );
      expressionMotion.calculateExpressionParameters(
        model,
        this._userTimeSeconds,
        motionQueueEntry,
        this._expressionParameterValues,
        expressionIndex,
        this.getFadeWeight(expressionIndex)
      );

      expressionWeight +=
        expressionMotion.getFadeInTime() == 0.0
          ? 1.0
          : CubismMath.getEasingSine(
              (this._userTimeSeconds - motionQueueEntry.getFadeInStartTime()) /
                expressionMotion.getFadeInTime()
            );

      updated = true;

      if (motionQueueEntry.isTriggeredFadeOut()) {
        // 페이드 아웃 시작
        motionQueueEntry.startFadeOut(
          motionQueueEntry.getFadeOutSeconds(),
          this._userTimeSeconds
        );
      }

      ite.preIncrement();
      ++expressionIndex;
    }

    // ----- 최신 Expression의 페이드가 완료되면 그 이전 항목 삭제 ------
    if (motions.getSize() > 1) {
      const latestFadeWeight: number = this.getFadeWeight(
        this._fadeWeights.getSize() - 1
      );
      if (latestFadeWeight >= 1.0) {
        // 배열의 마지막 요소는 삭제하지 않음
        for (let i = motions.getSize() - 2; i >= 0; --i) {
          const motionQueueEntry = motions.at(i);
          csmDelete(motionQueueEntry);
          motions.remove(i);
          this._fadeWeights.remove(i);
        }
      }
    }

    if (expressionWeight > 1.0) {
      expressionWeight = 1.0;
    }

    // 모델에 각 값 적용
    for (let i = 0; i < this._expressionParameterValues.getSize(); ++i) {
      const expressionParameterValue = this._expressionParameterValues.at(i);
      model.setParameterValueById(
        expressionParameterValue.parameterId,
        (expressionParameterValue.overwriteValue +
          expressionParameterValue.additiveValue) *
          expressionParameterValue.multiplyValue,
        expressionWeight
      );

      expressionParameterValue.additiveValue =
        CubismExpressionMotion.DefaultAdditiveValue;
      expressionParameterValue.multiplyValue =
        CubismExpressionMotion.DefaultMultiplyValue;
    }

    return updated;
  }

  private _expressionParameterValues: csmVector<ExpressionParameterValue>; ///< 모델에 적용할 각 파라미터 값
  private _fadeWeights: csmVector<number>; ///< 재생 중인 표정의 가중치
  private _currentPriority: number; ///< @deprecated 현재 재생 중인 모션의 우선순위. Expression에서는 사용하지 않으므로 더 이상 사용되지 않습니다.
  private _reservePriority: number; ///< @deprecated 재생 예정인 모션의 우선순위. 재생 중에는 0이 됩니다. 모션 파일을 다른 스레드에서 로드할 때의 기능. Expression에서는 사용하지 않으므로 더 이상 사용되지 않습니다。
  private _startExpressionTime: number; ///< 표정 재생 시작 시간
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismexpressionmotionmanager';
import { CubismMath } from '../math/cubismmath';
import { CubismDebug, CubismLogError } from '../utils/cubismdebug';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismExpressionMotionManager = $.CubismExpressionMotionManager;
  export type CubismExpressionMotionManager = $.CubismExpressionMotionManager;
}