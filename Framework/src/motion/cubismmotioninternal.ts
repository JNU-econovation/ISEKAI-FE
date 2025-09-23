/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { CubismIdHandle } from '../id/cubismid';
import { csmString } from '../type/csmstring';
import { csmVector } from '../type/csmvector';

/**
 * @brief 모션 커브 종류
 *
 * 모션 커브의 종류.
 */
export enum CubismMotionCurveTarget {
  CubismMotionCurveTarget_Model, // 모델에 대해
  CubismMotionCurveTarget_Parameter, // 파라미터에 대해
  CubismMotionCurveTarget_PartOpacity // 파츠의 불투명도에 대해
}

/**
 * @brief 모션 커브 세그먼트 종류
 *
 * 모션 커브의 세그먼트 종류.
 */
export enum CubismMotionSegmentType {
  CubismMotionSegmentType_Linear = 0, // 리니어
  CubismMotionSegmentType_Bezier = 1, // 베지어 곡선
  CubismMotionSegmentType_Stepped = 2, // 스텝
  CubismMotionSegmentType_InverseStepped = 3 // 인버스 스텝
}

/**
 * @brief 모션 커브의 제어점
 *
 * 모션 커브의 제어점.
 */
export class CubismMotionPoint {
  time = 0.0; // 시간 [초]
  value = 0.0; // 값
}

/**
 * 모션 커브 세그먼트의 평가 함수
 *
 * @param   points      모션 커브의 제어점 목록
 * @param   time        평가할 시간 [초]
 */
export interface csmMotionSegmentEvaluationFunction {
  (points: CubismMotionPoint[], time: number): number;
}

/**
 * @brief 모션 커브의 세그먼트
 *
 * 모션 커브의 세그먼트.
 */
export class CubismMotionSegment {
  /**
   * @brief 생성자
   *
   * 생성자.
   */
  public constructor() {
    this.evaluate = null;
    this.basePointIndex = 0;
    this.segmentType = 0;
  }

  evaluate: csmMotionSegmentEvaluationFunction; // 사용할 평가 함수
  basePointIndex: number; // 첫 세그먼트에 대한 인덱스
  segmentType: number; // 세그먼트 종류
}

/**
 * @brief 모션 커브
 *
 * 모션 커브.
 */
export class CubismMotionCurve {
  public constructor() {
    this.type = CubismMotionCurveTarget.CubismMotionCurveTarget_Model;
    this.segmentCount = 0;
    this.baseSegmentIndex = 0;
    this.fadeInTime = 0.0;
    this.fadeOutTime = 0.0;
  }

  type: CubismMotionCurveTarget; // 커브 종류
  id: CubismIdHandle; // 커브 ID
  segmentCount: number; // 세그먼트 개수
  baseSegmentIndex: number; // 첫 세그먼트의 인덱스
  fadeInTime: number; // 페이드인에 걸리는 시간 [초]
  fadeOutTime: number; // 페이드아웃에 걸리는 시간 [초]
}

/**
 * 이벤트.
 */
export class CubismMotionEvent {
  fireTime = 0.0;
  value: csmString;
}

/**
 * @brief 모션 데이터
 *
 * 모션 데이터.
 */
export class CubismMotionData {
  public constructor() {
    this.duration = 0.0;
    this.loop = false;
    this.curveCount = 0;
    this.eventCount = 0;
    this.fps = 0.0;

    this.curves = new csmVector<CubismMotionCurve>();
    this.segments = new csmVector<CubismMotionSegment>();
    this.points = new csmVector<CubismMotionPoint>();
    this.events = new csmVector<CubismMotionEvent>();
  }

  duration: number; // 모션 길이 [초]
  loop: boolean; // 루프 여부
  curveCount: number; // 커브 개수
  eventCount: number; // UserData 개수
  fps: number; // 프레임레이트
  curves: csmVector<CubismMotionCurve>; // 커브 목록
  segments: csmVector<CubismMotionSegment>; // 세그먼트 목록
  points: csmVector<CubismMotionPoint>; // 포인트 목록
  events: csmVector<CubismMotionEvent>; // 이벤트 목록
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismmotioninternal';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismMotionCurve = $.CubismMotionCurve;
  export type CubismMotionCurve = $.CubismMotionCurve;
  export const CubismMotionCurveTarget = $.CubismMotionCurveTarget;
  export type CubismMotionCurveTarget = $.CubismMotionCurveTarget;
  export const CubismMotionData = $.CubismMotionData;
  export type CubismMotionData = $.CubismMotionData;
  export const CubismMotionEvent = $.CubismMotionEvent;
  export type CubismMotionEvent = $.CubismMotionEvent;
  export const CubismMotionPoint = $.CubismMotionPoint;
  export type CubismMotionPoint = $.CubismMotionPoint;
  export const CubismMotionSegment = $.CubismMotionSegment;
  export type CubismMotionSegment = $.CubismMotionSegment;
  export const CubismMotionSegmentType = $.CubismMotionSegmentType;
  export type CubismMotionSegmentType = $.CubismMotionSegmentType;
  export type csmMotionSegmentEvaluationFunction =
    $.csmMotionSegmentEvaluationFunction;
}