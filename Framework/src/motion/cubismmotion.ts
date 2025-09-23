/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { CubismIdHandle } from '../id/cubismid';
import { csmDelete, CubismFramework } from '../live2dcubismframework';
import { CubismMath } from '../math/cubismmath';
import { CubismModel } from '../model/cubismmodel';
import { csmString } from '../type/csmstring';
import { csmVector } from '../type/csmvector';
import {
  CSM_ASSERT,
  CubismLogDebug,
  CubismLogError,
  CubismLogWarning
} from '../utils/cubismdebug';
import {
  ACubismMotion,
  BeganMotionCallback,
  FinishedMotionCallback
} from './acubismmotion';
import {
  CubismMotionCurve,
  CubismMotionCurveTarget,
  CubismMotionData,
  CubismMotionEvent,
  CubismMotionPoint,
  CubismMotionSegment,
  CubismMotionSegmentType
} from './cubismmotioninternal';
import { CubismMotionJson, EvaluationOptionFlag } from './cubismmotionjson';
import { CubismMotionQueueEntry } from './cubismmotionqueueentry';

const EffectNameEyeBlink = 'EyeBlink';
const EffectNameLipSync = 'LipSync';
const TargetNameModel = 'Model';
const TargetNameParameter = 'Parameter';
const TargetNamePartOpacity = 'PartOpacity';

// Id
const IdNameOpacity = 'Opacity';

/**
 * Cubism SDK R2 이전 모션을 재현하려면 true, 애니메이터 모션을 올바르게 재현하려면 false.
 */
const UseOldBeziersCurveMotion = false;

function lerpPoints(
  a: CubismMotionPoint,
  b: CubismMotionPoint,
  t: number
): CubismMotionPoint {
  const result: CubismMotionPoint = new CubismMotionPoint();

  result.time = a.time + (b.time - a.time) * t;
  result.value = a.value + (b.value - a.value) * t;

  return result;
}

function linearEvaluate(points: CubismMotionPoint[], time: number): number {
  let t: number = (time - points[0].time) / (points[1].time - points[0].time);

  if (t < 0.0) {
    t = 0.0;
  }

  return points[0].value + (points[1].value - points[0].value) * t;
}

function bezierEvaluate(points: CubismMotionPoint[], time: number): number {
  let t: number = (time - points[0].time) / (points[3].time - points[0].time);

  if (t < 0.0) {
    t = 0.0;
  }

  const p01: CubismMotionPoint = lerpPoints(points[0], points[1], t);
  const p12: CubismMotionPoint = lerpPoints(points[1], points[2], t);
  const p23: CubismMotionPoint = lerpPoints(points[2], points[3], t);

  const p012: CubismMotionPoint = lerpPoints(p01, p12, t);
  const p123: CubismMotionPoint = lerpPoints(p12, p23, t);

  return lerpPoints(p012, p123, t).value;
}

function bezierEvaluateBinarySearch(
  points: CubismMotionPoint[],
  time: number
): number {
  const xError = 0.01;

  const x: number = time;
  let x1: number = points[0].time;
  let x2: number = points[3].time;
  let cx1: number = points[1].time;
  let cx2: number = points[2].time;

  let ta = 0.0;
  let tb = 1.0;
  let t = 0.0;
  let i = 0;

  for (let var33 = true; i < 20; ++i) {
    if (x < x1 + xError) {
      t = ta;
      break;
    }

    if (x2 - xError < x) {
      t = tb;
      break;
    }

    let centerx: number = (cx1 + cx2) * 0.5;
    cx1 = (x1 + cx1) * 0.5;
    cx2 = (x2 + cx2) * 0.5;
    const ctrlx12: number = (cx1 + centerx) * 0.5;
    const ctrlx21: number = (cx2 + centerx) * 0.5;
    centerx = (ctrlx12 + ctrlx21) * 0.5;
    if (x < centerx) {
      tb = (ta + tb) * 0.5;
      if (centerx - xError < x) {
        t = tb;
        break;
      }

      x2 = centerx;
      cx2 = ctrlx12;
    } else {
      ta = (ta + tb) * 0.5;
      if (x < centerx + xError) {
        t = ta;
        break;
      }

      x1 = centerx;
      cx1 = ctrlx21;
    }
  }

  if (i == 20) {
    t = (ta + tb) * 0.5;
  }

  if (t < 0.0) {
    t = 0.0;
  }
  if (t > 1.0) {
    t = 1.0;
  }

  const p01: CubismMotionPoint = lerpPoints(points[0], points[1], t);
  const p12: CubismMotionPoint = lerpPoints(points[1], points[2], t);
  const p23: CubismMotionPoint = lerpPoints(points[2], points[3], t);

  const p012: CubismMotionPoint = lerpPoints(p01, p12, t);
  const p123: CubismMotionPoint = lerpPoints(p12, p23, t);

  return lerpPoints(p012, p123, t).value;
}

function bezierEvaluateCardanoInterpretation(
  points: CubismMotionPoint[],
  time: number
): number {
  const x: number = time;
  const x1: number = points[0].time;
  const x2: number = points[3].time;
  const cx1: number = points[1].time;
  const cx2: number = points[2].time;

  const a: number = x2 - 3.0 * cx2 + 3.0 * cx1 - x1;
  const b: number = 3.0 * cx2 - 6.0 * cx1 + 3.0 * x1;
  const c: number = 3.0 * cx1 - 3.0 * x1;
  const d: number = x1 - x;

  const t: number = CubismMath.cardanoAlgorithmForBezier(a, b, c, d);

  const p01: CubismMotionPoint = lerpPoints(points[0], points[1], t);
  const p12: CubismMotionPoint = lerpPoints(points[1], points[2], t);
  const p23: CubismMotionPoint = lerpPoints(points[2], points[3], t);

  const p012: CubismMotionPoint = lerpPoints(p01, p12, t);
  const p123: CubismMotionPoint = lerpPoints(p12, p23, t);

  return lerpPoints(p012, p123, t).value;
}

function steppedEvaluate(points: CubismMotionPoint[], time: number): number {
  return points[0].value;
}

function inverseSteppedEvaluate(
  points: CubismMotionPoint[],
  time: number
): number {
  return points[1].value;
}

function evaluateCurve(
  motionData: CubismMotionData,
  index: number,
  time: number,
  isCorrection: boolean,
  endTime: number
): number {
  // Find segment to evaluate.
  const curve: CubismMotionCurve = motionData.curves.at(index);

  let target = -1;
  const totalSegmentCount: number = curve.baseSegmentIndex + curve.segmentCount;
  let pointPosition = 0;
  for (let i: number = curve.baseSegmentIndex; i < totalSegmentCount; ++i) {
    // Get first point of next segment.
    pointPosition =
      motionData.segments.at(i).basePointIndex +
      ((motionData.segments.at(i).segmentType as CubismMotionSegmentType) ==
      CubismMotionSegmentType.CubismMotionSegmentType_Bezier
        ? 3
        : 1);

    // Break if time lies within current segment.
    if (motionData.points.at(pointPosition).time > time) {
      target = i;
      break;
    }
  }

  if (target == -1) {
    if (isCorrection && time < endTime) {
      return correctEndPoint(
        motionData,
        totalSegmentCount - 1,
        motionData.segments.at(curve.baseSegmentIndex).basePointIndex,
        pointPosition,
        time,
        endTime
      );
    }
    return motionData.points.at(pointPosition).value;
  }

  const segment: CubismMotionSegment = motionData.segments.at(target);

  return segment.evaluate(motionData.points.get(segment.basePointIndex), time);
}

/**
 * 종점에서 시작점으로의 보정 처리
 * @param motionData
 * @param segmentIndex
 * @param beginIndex
 * @param endIndex
 * @param time
 * @param endTime
 * @returns
 */
function correctEndPoint(
  motionData: CubismMotionData,
  segmentIndex: number,
  beginIndex: number,
  endIndex: number,
  time: number,
  endTime: number
): number {
  const motionPoint: CubismMotionPoint[] = [
    new CubismMotionPoint(),
    new CubismMotionPoint()
  ];
  {
    const src = motionData.points.at(endIndex);
    motionPoint[0].time = src.time;
    motionPoint[0].value = src.value;
  }
  {
    const src = motionData.points.at(beginIndex);
    motionPoint[1].time = endTime;
    motionPoint[1].value = src.value;
  }

  switch (
    motionData.segments.at(segmentIndex).segmentType as CubismMotionSegmentType
  ) {
    case CubismMotionSegmentType.CubismMotionSegmentType_Linear:
    case CubismMotionSegmentType.CubismMotionSegmentType_Bezier:
    default:
      return linearEvaluate(motionPoint, time);
    case CubismMotionSegmentType.CubismMotionSegmentType_Stepped:
      return steppedEvaluate(motionPoint, time);
    case CubismMotionSegmentType.CubismMotionSegmentType_InverseStepped:
      return inverseSteppedEvaluate(motionPoint, time);
  }
}

/**
 * 모션 동작의 버전 관리를 위한 열거자.
 * 자세한 내용은 SDK 설명서를 참조하십시오.
 */
export enum MotionBehavior {
  MotionBehavior_V1,
  MotionBehavior_V2
}

/**
 * 모션 클래스
 *
 * 모션의 클래스.
 */
export class CubismMotion extends ACubismMotion {
  /**
   * 인스턴스를 생성합니다.
   *
   * @param buffer motion3.json이 로드된 버퍼
   * @param size 버퍼의 크기
   * @param onFinishedMotionHandler 모션 재생 종료 시 호출되는 콜백 함수
   * @param onBeganMotionHandler 모션 재생 시작 시 호출되는 콜백 함수
   * @param shouldCheckMotionConsistency motion3.json 무결성 확인 여부
   * @return 생성된 인스턴스
   */
  public static create(
    buffer: ArrayBuffer,
    size: number,
    onFinishedMotionHandler?: FinishedMotionCallback,
    onBeganMotionHandler?: BeganMotionCallback,
    shouldCheckMotionConsistency: boolean = false
  ): CubismMotion {
    const ret = new CubismMotion();

    ret.parse(buffer, size, shouldCheckMotionConsistency);
    if (ret._motionData) {
      ret._sourceFrameRate = ret._motionData.fps;
      ret._loopDurationSeconds = ret._motionData.duration;
      ret._onFinishedMotion = onFinishedMotionHandler;
      ret._onBeganMotion = onBeganMotionHandler;
    } else {
      csmDelete(ret);
      return null;
    }

    // 참고: Editor에서는 루프가 있는 모션 내보내기를 지원하지 않습니다.
    // ret->_loop = (ret->_motionData->Loop > 0);
    return ret;
  }

  /**
   * 모델 파라미터 업데이트 실행
   * @param model             대상 모델
   * @param userTimeSeconds   현재 시간 [초]
   * @param fadeWeight        모션 가중치
   * @param motionQueueEntry  CubismMotionQueueManager에서 관리하는 모션
   */
  public doUpdateParameters(
    model: CubismModel,
    userTimeSeconds: number,
    fadeWeight: number,
    motionQueueEntry: CubismMotionQueueEntry
  ): void {
    if (this._modelCurveIdEyeBlink == null) {
      this._modelCurveIdEyeBlink =
        CubismFramework.getIdManager().getId(EffectNameEyeBlink);
    }

    if (this._modelCurveIdLipSync == null) {
      this._modelCurveIdLipSync =
        CubismFramework.getIdManager().getId(EffectNameLipSync);
    }

    if (this._modelCurveIdOpacity == null) {
      this._modelCurveIdOpacity =
        CubismFramework.getIdManager().getId(IdNameOpacity);
    }

    if (this._motionBehavior === MotionBehavior.MotionBehavior_V2) {
      if (this._previousLoopState !== this._isLoop) {
        // 종료 시간을 계산합니다.
        this.adjustEndTime(motionQueueEntry);
        this._previousLoopState = this._isLoop;
      }
    }

    let timeOffsetSeconds: number =
      userTimeSeconds - motionQueueEntry.getStartTime();

    if (timeOffsetSeconds < 0.0) {
      timeOffsetSeconds = 0.0; // 오류 회피
    }

    let lipSyncValue: number = Number.MAX_VALUE;
    let eyeBlinkValue: number = Number.MAX_VALUE;

    // 눈 깜박임, 립싱크 중 모션 적용을 감지하기 위한 비트 (최대 maxFlagCount개)
    const maxTargetSize = 64;
    let lipSyncFlags = 0;
    let eyeBlinkFlags = 0;

    // 눈 깜박임, 립싱크 대상 수가 상한을 초과하는 경우
    if (this._eyeBlinkParameterIds.getSize() > maxTargetSize) {
      CubismLogDebug(
        'too many eye blink targets : {0}',
        this._eyeBlinkParameterIds.getSize()
      );
    }
    if (this._lipSyncParameterIds.getSize() > maxTargetSize) {
      CubismLogDebug(
        'too many lip sync targets : {0}',
        this._lipSyncParameterIds.getSize()
      );
    }

    const tmpFadeIn: number =
      this._fadeInSeconds <= 0.0
        ? 1.0
        : CubismMath.getEasingSine(
            (userTimeSeconds - motionQueueEntry.getFadeInStartTime()) /
              this._fadeInSeconds
          );

    const tmpFadeOut: number =
      this._fadeOutSeconds <= 0.0 || motionQueueEntry.getEndTime() < 0.0
        ? 1.0
        : CubismMath.getEasingSine(
            (motionQueueEntry.getEndTime() - userTimeSeconds) /
              this._fadeOutSeconds
          );
    let value: number;
    let c: number, parameterIndex: number;

    // 'Repeat' time as necessary.
    let time: number = timeOffsetSeconds;
    let duration: number = this._motionData.duration;
    const isCorrection: boolean =
      this._motionBehavior === MotionBehavior.MotionBehavior_V2 && this._isLoop;

    if (this._isLoop) {
      if (this._motionBehavior === MotionBehavior.MotionBehavior_V2) {
        duration += 1.0 / this._motionData.fps;
      }
      while (time > duration) {
        time -= duration;
      }
    }

    const curves: csmVector<CubismMotionCurve> = this._motionData.curves;

    // Evaluate model curves.
    for (
      c = 0;
      c < this._motionData.curveCount &&
      curves.at(c).type ==
        CubismMotionCurveTarget.CubismMotionCurveTarget_Model;
      ++c
    ) {
      // Evaluate curve and call handler.
      value = evaluateCurve(this._motionData, c, time, isCorrection, duration);

      if (curves.at(c).id == this._modelCurveIdEyeBlink) {
        eyeBlinkValue = value;
      } else if (curves.at(c).id == this._modelCurveIdLipSync) {
        lipSyncValue = value;
      } else if (curves.at(c).id == this._modelCurveIdOpacity) {
        this._modelOpacity = value;
        model.setModelOapcity(this.getModelOpacityValue());
      }
    }

    let parameterMotionCurveCount = 0;

    for (
      ;
      c < this._motionData.curveCount &&
      curves.at(c).type ==
        CubismMotionCurveTarget.CubismMotionCurveTarget_Parameter;
      ++c
    ) {
      parameterMotionCurveCount++;

      // Find parameter index.
      parameterIndex = model.getParameterIndex(curves.at(c).id);

      // Skip curve evaluation if no value in sink.
      if (parameterIndex == -1) {
        continue;
      }

      const sourceValue: number =
        model.getParameterValueByIndex(parameterIndex);

      // Evaluate curve and apply value.
      value = evaluateCurve(this._motionData, c, time, isCorrection, duration);

      if (eyeBlinkValue != Number.MAX_VALUE) {
        for (
          let i = 0;
          i < this._eyeBlinkParameterIds.getSize() && i < maxTargetSize;
          ++i
        ) {
          if (this._eyeBlinkParameterIds.at(i) == curves.at(c).id) {
            value *= eyeBlinkValue;
            eyeBlinkFlags |= 1 << i;
            break;
          }
        }
      }

      if (lipSyncValue != Number.MAX_VALUE) {
        for (
          let i = 0;
          i < this._lipSyncParameterIds.getSize() && i < maxTargetSize;
          ++i
        ) {
          if (this._lipSyncParameterIds.at(i) == curves.at(c).id) {
            value += lipSyncValue;
            lipSyncFlags |= 1 << i;
            break;
          }
        }
      }

      // Process "repeats only" for compatibility
      if (model.isRepeat(parameterIndex)) {
        value = model.getParameterRepeatValue(parameterIndex, value);
      }

      let v: number;

      // 파라미터별 페이드
      if (curves.at(c).fadeInTime < 0.0 && curves.at(c).fadeOutTime < 0.0) {
        // 모션 페이드 적용
        v = sourceValue + (value - sourceValue) * fadeWeight;
      } else {
        // 파라미터에 페이드인 또는 페이드아웃이 설정되어 있으면 그것을 적용
        let fin: number;
        let fout: number;

        if (curves.at(c).fadeInTime < 0.0) {
          fin = tmpFadeIn;
        } else {
          fin =
            curves.at(c).fadeInTime == 0.0
              ? 1.0
              : CubismMath.getEasingSine(
                  (userTimeSeconds - motionQueueEntry.getFadeInStartTime()) /
                    curves.at(c).fadeInTime
                );
        }

        if (curves.at(c).fadeOutTime < 0.0) {
          fout = tmpFadeOut;
        } else {
          fout =
            curves.at(c).fadeOutTime == 0.0 ||
            motionQueueEntry.getEndTime() < 0.0
              ? 1.0
              : CubismMath.getEasingSine(
                  (motionQueueEntry.getEndTime() - userTimeSeconds) /
                    curves.at(c).fadeOutTime
                );
        }

        const paramWeight: number = this._weight * fin * fout;

        // 파라미터별 페이드 적용
        v = sourceValue + (value - sourceValue) * paramWeight;
      }

      model.setParameterValueByIndex(parameterIndex, v, 1.0);
    }

    {
      if (eyeBlinkValue != Number.MAX_VALUE) {
        for (
          let i = 0;
          i < this._eyeBlinkParameterIds.getSize() && i < maxTargetSize;
          ++i
        ) {
          const sourceValue: number = model.getParameterValueById(
            this._eyeBlinkParameterIds.at(i)
          );

          // 모션으로 덮어쓴 경우 눈 깜박임은 적용하지 않음
          if ((eyeBlinkFlags >> i) & 0x01) {
            continue;
          }

          const v: number =
            sourceValue + (eyeBlinkValue - sourceValue) * fadeWeight;

          model.setParameterValueById(this._eyeBlinkParameterIds.at(i), v);
        }
      }

      if (lipSyncValue != Number.MAX_VALUE) {
        for (
          let i = 0;
          i < this._lipSyncParameterIds.getSize() && i < maxTargetSize;
          ++i
        ) {
          const sourceValue: number = model.getParameterValueById(
            this._lipSyncParameterIds.at(i)
          );

          // 모션으로 덮어쓴 경우 립싱크는 적용하지 않음
          if ((lipSyncFlags >> i) & 0x01) {
            continue;
          }

          const v: number =
            sourceValue + (lipSyncValue - sourceValue) * fadeWeight;

          model.setParameterValueById(this._lipSyncParameterIds.at(i), v);
        }
      }
    }

    for (
      ;
      c < this._motionData.curveCount &&
      curves.at(c).type ==
        CubismMotionCurveTarget.CubismMotionCurveTarget_PartOpacity;
      ++c
    ) {
      // Find parameter index.
      parameterIndex = model.getParameterIndex(curves.at(c).id);

      // Skip curve evaluation if no value in sink.
      if (parameterIndex == -1) {
        continue;
      }

      // Evaluate curve and apply value.
      value = evaluateCurve(this._motionData, c, time, isCorrection, duration);

      model.setParameterValueByIndex(parameterIndex, value);
    }

    if (timeOffsetSeconds >= duration) {
      if (this._isLoop) {
        this.updateForNextLoop(motionQueueEntry, userTimeSeconds, time);
      } else {
        if (this._onFinishedMotion) {
          this._onFinishedMotion(this);
        }

        motionQueueEntry.setIsFinished(true);
      }
    }
    this._lastWeight = fadeWeight;
  }

  /**
   * 루프 정보 설정
   * @param loop 루프 정보
   */
  public setIsLoop(loop: boolean): void {
    CubismLogWarning(
      'setIsLoop() is a deprecated function. Please use setLoop().'
    );
    this._isLoop = loop;
  }

  /**
   * 루프 정보 가져오기
   * @return true 루프함
   * @return false 루프하지 않음
   */
  public isLoop(): boolean {
    CubismLogWarning(
      'isLoop() is a deprecated function. Please use getLoop().'
    );
    return this._isLoop;
  }

  /**
   * 루프 시 페이드인 정보 설정
   * @param loopFadeIn  루프 시 페이드인 정보
   */
  public setIsLoopFadeIn(loopFadeIn: boolean): void {
    CubismLogWarning(
      'setIsLoopFadeIn() is a deprecated function. Please use setLoopFadeIn().'
    );
    this._isLoopFadeIn = loopFadeIn;
  }

  /**
   * 루프 시 페이드인 정보 가져오기
   *
   * @return  true    함
   * @return  false   하지 않음
   */
  public isLoopFadeIn(): boolean {
    CubismLogWarning(
      'isLoopFadeIn() is a deprecated function. Please use getLoopFadeIn().'
    );
    return this._isLoopFadeIn;
  }

  /**
   * 모션 동작의 버전을 설정합니다.
   *
   * @param Specifies the version of the Motion Behavior.
   */
  public setMotionBehavior(motionBehavior: MotionBehavior) {
    this._motionBehavior = motionBehavior;
  }

  /**
   * 모션 동작의 버전을 가져옵니다.
   *
   * @return Returns the version of the Motion Behavior.
   */
  public getMotionBehavior(): MotionBehavior {
    return this._motionBehavior;
  }

  /**
   * 모션 길이를 가져옵니다.
   *
   * @return  모션 길이 [초]
   */
  public getDuration(): number {
    return this._isLoop ? -1.0 : this._loopDurationSeconds;
  }

  /**
   * 모션 루프 시 길이를 가져옵니다.
   *
   * @return  모션 루프 시 길이 [초]
   */
  public getLoopDuration(): number {
    return this._loopDurationSeconds;
  }

  /**
   * 파라미터에 대한 페이드인 시간을 설정합니다.
   *
   * @param parameterId     파라미터 ID
   * @param value           페이드인에 걸리는 시간 [초]
   */
  public setParameterFadeInTime(
    parameterId: CubismIdHandle,
    value: number
  ): void {
    const curves: csmVector<CubismMotionCurve> = this._motionData.curves;

    for (let i = 0; i < this._motionData.curveCount; ++i) {
      if (parameterId == curves.at(i).id) {
        curves.at(i).fadeInTime = value;
        return;
      }
    }
  }

  /**
   * 파라미터에 대한 페이드아웃 시간 설정
   * @param parameterId     파라미터 ID
   * @param value           페이드아웃에 걸리는 시간 [초]
   */
  public setParameterFadeOutTime(
    parameterId: CubismIdHandle,
    value: number
  ): void {
    const curves: csmVector<CubismMotionCurve> = this._motionData.curves;

    for (let i = 0; i < this._motionData.curveCount; ++i) {
      if (parameterId == curves.at(i).id) {
        curves.at(i).fadeOutTime = value;
        return;
      }
    }
  }

  /**
   * 파라미터에 대한 페이드인 시간 가져오기
   * @param    parameterId     파라미터 ID
   * @return   페이드인에 걸리는 시간 [초]
   */
  public getParameterFadeInTime(parameterId: CubismIdHandle): number {
    const curves: csmVector<CubismMotionCurve> = this._motionData.curves;

    for (let i = 0; i < this._motionData.curveCount; ++i) {
      if (parameterId == curves.at(i).id) {
        return curves.at(i).fadeInTime;
      }
    }

    return -1;
  }

  /**
   * 파라미터에 대한 페이드아웃 시간 가져오기
   *
   * @param   parameterId     파라미터 ID
   * @return   페이드아웃에 걸리는 시간 [초]
   */
  public getParameterFadeOutTime(parameterId: CubismIdHandle): number {
    const curves: csmVector<CubismMotionCurve> = this._motionData.curves;

    for (let i = 0; i < this._motionData.curveCount; ++i) {
      if (parameterId == curves.at(i).id) {
        return curves.at(i).fadeOutTime;
      }
    }

    return -1;
  }

  /**
   * 자동 효과가 적용된 파라미터 ID 목록 설정
   * @param eyeBlinkParameterIds    자동 눈 깜박임이 적용된 파라미터 ID 목록
   * @param lipSyncParameterIds     립싱크가 적용된 파라미터 ID 목록
   */
  public setEffectIds(
    eyeBlinkParameterIds: csmVector<CubismIdHandle>,
    lipSyncParameterIds: csmVector<CubismIdHandle>
  ): void {
    this._eyeBlinkParameterIds = eyeBlinkParameterIds;
    this._lipSyncParameterIds = lipSyncParameterIds;
  }

  /**
   * 생성자
   */
  public constructor() {
    super();
    this._sourceFrameRate = 30.0;
    this._loopDurationSeconds = -1.0;
    this._isLoop = false; // true에서 false로 기본값 변경
    this._isLoopFadeIn = true; // 루프 시 페이드인이 활성화되었는지 여부 플래그
    this._lastWeight = 0.0;
    this._motionData = null;
    this._modelCurveIdEyeBlink = null;
    this._modelCurveIdLipSync = null;
    this._modelCurveIdOpacity = null;
    this._eyeBlinkParameterIds = null;
    this._lipSyncParameterIds = null;
    this._modelOpacity = 1.0;
    this._debugMode = false;
  }

  /**
   * 소멸자 해당 처리
   */
  public release(): void {
    this._motionData = void 0;
    this._motionData = null;
  }

  /**
   *
   * @param motionQueueEntry
   * @param userTimeSeconds
   * @param time
   */
  public updateForNextLoop(
    motionQueueEntry: CubismMotionQueueEntry,
    userTimeSeconds: number,
    time: number
  ) {
    switch (this._motionBehavior) {
      case MotionBehavior.MotionBehavior_V2:
      default:
        motionQueueEntry.setStartTime(userTimeSeconds - time); // 초기 상태로
        if (this._isLoopFadeIn) {
          // 루프 중 루프용 페이드인이 활성화된 경우 페이드인 재설정
          motionQueueEntry.setFadeInStartTime(userTimeSeconds - time);
        }

        if (this._onFinishedMotion != null) {
          this._onFinishedMotion(this);
        }
        break;
      case MotionBehavior.MotionBehavior_V1:
        // 이전 루프 처리
        motionQueueEntry.setStartTime(userTimeSeconds); // 초기 상태로
        if (this._isLoopFadeIn) {
          // 루프 중 루프용 페이드인이 활성화된 경우 페이드인 재설정
          motionQueueEntry.setFadeInStartTime(userTimeSeconds);
        }
        break;
    }
  }

  /**
   * motion3.json을 파싱합니다.
   *
   * @param motionJson  motion3.json이 로드된 버퍼
   * @param size        버퍼의 크기
   * @param shouldCheckMotionConsistency motion3.json 무결성 확인 여부
   */
  public parse(
    motionJson: ArrayBuffer,
    size: number,
    shouldCheckMotionConsistency: boolean = false
  ): void {
    let json: CubismMotionJson = new CubismMotionJson(motionJson, size);

    if (!json) {
      json.release();
      json = void 0;
      return;
    }

    if (shouldCheckMotionConsistency) {
      const consistency = json.hasConsistency();
      if (!consistency) {
        json.release();
        CubismLogError('Inconsistent motion3.json.');
        return;
      }
    }

    this._motionData = new CubismMotionData();

    this._motionData.duration = json.getMotionDuration();
    this._motionData.loop = json.isMotionLoop();
    this._motionData.curveCount = json.getMotionCurveCount();
    this._motionData.fps = json.getMotionFps();
    this._motionData.eventCount = json.getEventCount();

    const areBeziersRestructed: boolean = json.getEvaluationOptionFlag(
      EvaluationOptionFlag.EvaluationOptionFlag_AreBeziersRistricted
    );

    if (json.isExistMotionFadeInTime()) {
      this._fadeInSeconds =
        json.getMotionFadeInTime() < 0.0 ? 1.0 : json.getMotionFadeInTime();
    } else {
      this._fadeInSeconds = 1.0;
    }

    if (json.isExistMotionFadeOutTime()) {
      this._fadeOutSeconds =
        json.getMotionFadeOutTime() < 0.0 ? 1.0 : json.getMotionFadeOutTime();
    } else {
      this._fadeOutSeconds = 1.0;
    }

    this._motionData.curves.updateSize(
      this._motionData.curveCount,
      CubismMotionCurve,
      true
    );
    this._motionData.segments.updateSize(
      json.getMotionTotalSegmentCount(),
      CubismMotionSegment,
      true
    );
    this._motionData.points.updateSize(
      json.getMotionTotalPointCount(),
      CubismMotionPoint,
      true
    );
    this._motionData.events.updateSize(
      this._motionData.eventCount,
      CubismMotionEvent,
      true
    );

    let totalPointCount = 0;
    let totalSegmentCount = 0;

    // Curves
    for (
      let curveCount = 0;
      curveCount < this._motionData.curveCount;
      ++curveCount
    ) {
      if (json.getMotionCurveTarget(curveCount) == TargetNameModel) {
        this._motionData.curves.at(curveCount).type =
          CubismMotionCurveTarget.CubismMotionCurveTarget_Model;
      } else if (json.getMotionCurveTarget(curveCount) == TargetNameParameter) {
        this._motionData.curves.at(curveCount).type =
          CubismMotionCurveTarget.CubismMotionCurveTarget_Parameter;
      } else if (
        json.getMotionCurveTarget(curveCount) == TargetNamePartOpacity
      ) {
        this._motionData.curves.at(curveCount).type =
          CubismMotionCurveTarget.CubismMotionCurveTarget_PartOpacity;
      } else {
        CubismLogWarning(
          'Warning : Unable to get segment type from Curve! The number of "CurveCount" may be incorrect!'
        );
      }

      this._motionData.curves.at(curveCount).id =
        json.getMotionCurveId(curveCount);

      this._motionData.curves.at(curveCount).baseSegmentIndex =
        totalSegmentCount;

      this._motionData.curves.at(curveCount).fadeInTime =
        json.isExistMotionCurveFadeInTime(curveCount)
          ? json.getMotionCurveFadeInTime(curveCount)
          : -1.0;
      this._motionData.curves.at(curveCount).fadeOutTime =
        json.isExistMotionCurveFadeOutTime(curveCount)
          ? json.getMotionCurveFadeOutTime(curveCount)
          : -1.0;

      // Segments
      for (
        let segmentPosition = 0;
        segmentPosition < json.getMotionCurveSegmentCount(curveCount);

      ) {
        if (segmentPosition == 0) {
          this._motionData.segments.at(totalSegmentCount).basePointIndex =
            totalPointCount;

          this._motionData.points.at(totalPointCount).time =
            json.getMotionCurveSegment(curveCount, segmentPosition);
          this._motionData.points.at(totalPointCount).value =
            json.getMotionCurveSegment(curveCount, segmentPosition + 1);

          totalPointCount += 1;
          segmentPosition += 2;
        } else {
          this._motionData.segments.at(totalSegmentCount).basePointIndex =
            totalPointCount - 1;
        }

        const segment: number = json.getMotionCurveSegment(
          curveCount,
          segmentPosition
        );

        const segmentType: CubismMotionSegmentType = segment;
        switch (segmentType) {
          case CubismMotionSegmentType.CubismMotionSegmentType_Linear: {
            this._motionData.segments.at(totalSegmentCount).segmentType =
              CubismMotionSegmentType.CubismMotionSegmentType_Linear;
            this._motionData.segments.at(totalSegmentCount).evaluate =
              linearEvaluate;

            this._motionData.points.at(totalPointCount).time =
              json.getMotionCurveSegment(curveCount, segmentPosition + 1);
            this._motionData.points.at(totalPointCount).value =
              json.getMotionCurveSegment(curveCount, segmentPosition + 2);

            totalPointCount += 1;
            segmentPosition += 3;

            break;
          }
          case CubismMotionSegmentType.CubismMotionSegmentType_Bezier: {
            this._motionData.segments.at(totalSegmentCount).segmentType =
              CubismMotionSegmentType.CubismMotionSegmentType_Bezier;

            if (areBeziersRestructed || UseOldBeziersCurveMotion) {
              this._motionData.segments.at(totalSegmentCount).evaluate =
                bezierEvaluate;
            } else {
              this._motionData.segments.at(totalSegmentCount).evaluate =
                bezierEvaluateCardanoInterpretation;
            }

            this._motionData.points.at(totalPointCount).time =
              json.getMotionCurveSegment(curveCount, segmentPosition + 1);
            this._motionData.points.at(totalPointCount).value =
              json.getMotionCurveSegment(curveCount, segmentPosition + 2);

            this._motionData.points.at(totalPointCount + 1).time =
              json.getMotionCurveSegment(curveCount, segmentPosition + 3);
            this._motionData.points.at(totalPointCount + 1).value =
              json.getMotionCurveSegment(curveCount, segmentPosition + 4);

            this._motionData.points.at(totalPointCount + 2).time =
              json.getMotionCurveSegment(curveCount, segmentPosition + 5);
            this._motionData.points.at(totalPointCount + 2).value =
              json.getMotionCurveSegment(curveCount, segmentPosition + 6);

            totalPointCount += 3;
            segmentPosition += 7;

            break;
          }

          case CubismMotionSegmentType.CubismMotionSegmentType_Stepped: {
            this._motionData.segments.at(totalSegmentCount).segmentType =
              CubismMotionSegmentType.CubismMotionSegmentType_Stepped;
            this._motionData.segments.at(totalSegmentCount).evaluate =
              steppedEvaluate;

            this._motionData.points.at(totalPointCount).time =
              json.getMotionCurveSegment(curveCount, segmentPosition + 1);
            this._motionData.points.at(totalPointCount).value =
              json.getMotionCurveSegment(curveCount, segmentPosition + 2);

            totalPointCount += 1;
            segmentPosition += 3;

            break;
          }

          case CubismMotionSegmentType.CubismMotionSegmentType_InverseStepped: {
            this._motionData.segments.at(totalSegmentCount).segmentType =
              CubismMotionSegmentType.CubismMotionSegmentType_InverseStepped;
            this._motionData.segments.at(totalSegmentCount).evaluate =
              inverseSteppedEvaluate;

            this._motionData.points.at(totalPointCount).time =
              json.getMotionCurveSegment(curveCount, segmentPosition + 1);
            this._motionData.points.at(totalPointCount).value =
              json.getMotionCurveSegment(curveCount, segmentPosition + 2);

            totalPointCount += 1;
            segmentPosition += 3;

            break;
          }
          default: {
            CSM_ASSERT(0);
            break;
          }
        }

        ++this._motionData.curves.at(curveCount).segmentCount;
        ++totalSegmentCount;
      }
    }

    for (
      let userdatacount = 0;
      userdatacount < json.getEventCount();
      ++userdatacount
    ) {
      this._motionData.events.at(userdatacount).fireTime =
        json.getEventTime(userdatacount);
      this._motionData.events.at(userdatacount).value =
        json.getEventValue(userdatacount);
    }

    json.release();
    json = void 0;
    json = null;
  }

  /**
   * 모델 파라미터 업데이트
   *
   * 이벤트 발생 확인.
   * 입력하는 시간은 호출되는 모션 타이밍을 0으로 한 초 단위로 수행합니다.
   *
   * @param beforeCheckTimeSeconds   이전 이벤트 확인 시간 [초]
   * @param motionTimeSeconds        이번 재생 시간 [초]
   */
  public getFiredEvent(
    beforeCheckTimeSeconds: number,
    motionTimeSeconds: number
  ): csmVector<csmString> {
    this._firedEventValues.updateSize(0);

    // 이벤트 발생 확인
    for (let u = 0; u < this._motionData.eventCount; ++u) {
      if (
        this._motionData.events.at(u).fireTime > beforeCheckTimeSeconds &&
        this._motionData.events.at(u).fireTime <= motionTimeSeconds
      ) {
        this._firedEventValues.pushBack(
          new csmString(this._motionData.events.at(u).value.s)
        );
      }
    }

    return this._firedEventValues;
  }

  /**
   * 불투명도 커브 존재 여부 확인
   *
   * @returns true  -> 키가 존재함
   *          false -> 키가 존재하지 않음
   */
  public isExistModelOpacity(): boolean {
    for (let i = 0; i < this._motionData.curveCount; i++) {
      const curve: CubismMotionCurve = this._motionData.curves.at(i);

      if (curve.type != CubismMotionCurveTarget.CubismMotionCurveTarget_Model) {
        continue;
      }

      if (curve.id.getString().s.localeCompare(IdNameOpacity) == 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * 불투명도 커브의 인덱스를 반환합니다.
   *
   * @returns success:불투명도 커브의 인덱스
   */
  public getModelOpacityIndex(): number {
    if (this.isExistModelOpacity()) {
      for (let i = 0; i < this._motionData.curveCount; i++) {
        const curve: CubismMotionCurve = this._motionData.curves.at(i);

        if (
          curve.type != CubismMotionCurveTarget.CubismMotionCurveTarget_Model
        ) {
          continue;
        }

        if (curve.id.getString().s.localeCompare(IdNameOpacity) == 0) {
          return i;
        }
      }
    }
    return -1;
  }

  /**
   * 불투명도 ID를 반환합니다.
   *
   * @param index 모션 커브의 인덱스
   * @returns success:불투명도 커브의 인덱스
   */
  public getModelOpacityId(index: number): CubismIdHandle {
    if (index != -1) {
      const curve: CubismMotionCurve = this._motionData.curves.at(index);

      if (curve.type == CubismMotionCurveTarget.CubismMotionCurveTarget_Model) {
        if (curve.id.getString().s.localeCompare(IdNameOpacity) == 0) {
          return CubismFramework.getIdManager().getId(curve.id.getString().s);
        }
      }
    }

    return null;
  }

  /**
   * 현재 시간의 불투명도 값을 반환합니다.
   *
   * @returns success:모션의 해당 시간에서의 Opacity 값
   */
  public getModelOpacityValue(): number {
    return this._modelOpacity;
  }

  /**
   * 디버그용 플래그를 설정합니다.
   *
   * @param debugMode 디버그 모드 활성화/비활성화
   */
  public setDebugMode(debugMode: boolean): void {
    this._debugMode = debugMode;
  }

  public _sourceFrameRate: number; // 로드한 파일의 FPS. 기술이 없으면 기본값 15fps가 됨
  public _loopDurationSeconds: number; // mtn 파일에 정의된 일련의 모션 길이
  public _motionBehavior: MotionBehavior = MotionBehavior.MotionBehavior_V2;
  public _lastWeight: number; // 마지막으로 설정된 가중치

  public _motionData: CubismMotionData; // 실제 모션 데이터 본체

  public _eyeBlinkParameterIds: csmVector<CubismIdHandle>; // 자동 눈 깜박임을 적용할 파라미터 ID 핸들 목록. 모델(모델 설정)과 파라미터를 연결합니다.
  public _lipSyncParameterIds: csmVector<CubismIdHandle>; // 립싱크를 적용할 파라미터 ID 핸들 목록. 모델(모델 설정)과 파라미터를 연결합니다.

  public _modelCurveIdEyeBlink: CubismIdHandle; // 모델이 가진 자동 눈 깜박임용 파라미터 ID 핸들. 모델과 모션을 연결합니다.
  public _modelCurveIdLipSync: CubismIdHandle; // 모델이 가진 립싱크용 파라미터 ID 핸들. 모델과 모션을 연결합니다.
  public _modelCurveIdOpacity: CubismIdHandle; // 모델이 가진 불투명도용 파라미터 ID 핸들. 모델과 모션을 연결합니다.

  public _modelOpacity: number; // 모션에서 가져온 불투명도

  private _debugMode: boolean; // 디버그 모드 여부
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismmotion';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismMotion = $.CubismMotion;
  export type CubismMotion = $.CubismMotion;
}