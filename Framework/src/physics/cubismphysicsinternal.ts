/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { CubismIdHandle } from '../id/cubismid';
import { CubismVector2 } from '../math/cubismvector2';
import { csmVector } from '../type/csmvector';

/**
 * 물리 연산의 적용 대상 종류
 */
export enum CubismPhysicsTargetType {
  CubismPhysicsTargetType_Parameter // 파라미터에 적용
}

/**
 * 물리 연산의 입력 종류
 */
export enum CubismPhysicsSource {
  CubismPhysicsSource_X, // X축 위치에서
  CubismPhysicsSource_Y, // Y축 위치에서
  CubismPhysicsSource_Angle // 각도에서
}

/**
 * @brief 물리 연산에 사용하는 외부 힘
 *
 * 물리 연산에 사용하는 외부 힘.
 */
export class PhysicsJsonEffectiveForces {
  constructor() {
    this.gravity = new CubismVector2(0, 0);
    this.wind = new CubismVector2(0, 0);
  }
  gravity: CubismVector2; // 중력
  wind: CubismVector2; // 바람
}

/**
 * 물리 연산의 파라미터 정보
 */
export class CubismPhysicsParameter {
  id: CubismIdHandle; // 파라미터
  targetType: CubismPhysicsTargetType; // 적용 대상 종류
}

/**
 * 물리 연산의 정규화 정보
 */
export class CubismPhysicsNormalization {
  minimum: number; // 최대값
  maximum: number; // 최소값
  defalut: number; // 기본값
}

/**
 * 물리 연산의 연산에 사용하는 물리점 정보
 */
export class CubismPhysicsParticle {
  constructor() {
    this.initialPosition = new CubismVector2(0, 0);
    this.position = new CubismVector2(0, 0);
    this.lastPosition = new CubismVector2(0, 0);
    this.lastGravity = new CubismVector2(0, 0);
    this.force = new CubismVector2(0, 0);
    this.velocity = new CubismVector2(0, 0);
  }

  initialPosition: CubismVector2; // 초기 위치
  mobility: number; // 움직임 용이성
  delay: number; // 지연
  acceleration: number; // 가속도
  radius: number; // 거리
  position: CubismVector2; // 현재 위치
  lastPosition: CubismVector2; // 마지막 위치
  lastGravity: CubismVector2; // 마지막 중력
  force: CubismVector2; // 현재 가해지는 힘
  velocity: CubismVector2; // 현재 속도
}

/**
 * 물리 연산의 물리점 관리
 */
export class CubismPhysicsSubRig {
  constructor() {
    this.normalizationPosition = new CubismPhysicsNormalization();
    this.normalizationAngle = new CubismPhysicsNormalization();
  }
  inputCount: number; // 입력 개수
  outputCount: number; // 출력 개수
  particleCount: number; // 물리점 개수
  baseInputIndex: number; // 입력의 첫 인덱스
  baseOutputIndex: number; // 출력의 첫 인덱스
  baseParticleIndex: number; // 물리점의 첫 인덱스
  normalizationPosition: CubismPhysicsNormalization; // 정규화된 위치
  normalizationAngle: CubismPhysicsNormalization; // 정규화된 각도
}

/**
 * 정규화된 파라미터 취득 함수 선언
 * @param targetTranslation     // 연산 결과의 이동값
 * @param targetAngle           // 연산 결과의 각도
 * @param value                 // 파라미터 값
 * @param parameterMinimunValue // 파라미터의 최소값
 * @param parameterMaximumValue // 파라미터의 최대값
 * @param parameterDefaultValue // 파라미터의 기본값
 * @param normalizationPosition // 정규화된 위치
 * @param normalizationAngle    // 정규화된 각도
 * @param isInverted            // 값이 반전되었는지?
 * @param weight                // 가중치
 */
export interface normalizedPhysicsParameterValueGetter {
  (
    targetTranslation: CubismVector2,
    targetAngle: { angle: number },
    value: number,
    parameterMinimunValue: number,
    parameterMaximumValue: number,
    parameterDefaultValue: number,
    normalizationPosition: CubismPhysicsNormalization,
    normalizationAngle: CubismPhysicsNormalization,
    isInverted: boolean,
    weight: number
  ): void;
}

/**
 * 물리 연산 값 취득 함수 선언
 * @param translation 이동값
 * @param particles 물리점 목록
 * @param isInverted 값이 반영되었는지
 * @param parentGravity 중력
 * @return 값
 */
export interface physicsValueGetter {
  (
    translation: CubismVector2,
    particles: CubismPhysicsParticle[],
    particleIndex: number,
    isInverted: boolean,
    parentGravity: CubismVector2
  ): number;
}

/**
 * 물리 연산 스케일 취득 함수 선언
 * @param translationScale 이동값의 스케일
 * @param angleScale    각도의 스케일
 * @return 스케일 값
 */
export interface physicsScaleGetter {
  (translationScale: CubismVector2, angleScale: number): number;
}

/**
 * 물리 연산의 입력 정보
 */
export class CubismPhysicsInput {
  constructor() {
    this.source = new CubismPhysicsParameter();
  }
  source: CubismPhysicsParameter; // 입력 소스 파라미터
  sourceParameterIndex: number; // 입력 소스 파라미터의 인덱스
  weight: number; // 가중치
  type: number; // 입력 종류
  reflect: boolean; // 값이 반전되었는지 여부
  getNormalizedParameterValue: normalizedPhysicsParameterValueGetter; // 정규화된 파라미터 값 취득 함수
}

/**
 * @brief 물리 연산의 출력 정보
 *
 * 물리 연산의 출력 정보.
 */
export class CubismPhysicsOutput {
  constructor() {
    this.destination = new CubismPhysicsParameter();
    this.translationScale = new CubismVector2(0, 0);
  }

  destination: CubismPhysicsParameter; // 출력 대상 파라미터
  destinationParameterIndex: number; // 출력 대상 파라미터의 인덱스
  vertexIndex: number; // 진자의 인덱스
  translationScale: CubismVector2; // 이동값의 스케일
  angleScale: number; // 각도의 스케일
  weight: number; // 가중치
  type: CubismPhysicsSource; // 출력의 종류
  reflect: boolean; // 값이 반전되었는지 여부
  valueBelowMinimum: number; // 최소값 미만일 때의 값
  valueExceededMaximum: number; // 최대값을 초과했을 때의 값
  getValue: physicsValueGetter; // 물리 연산 값 취득 함수
  getScale: physicsScaleGetter; // 물리 연산 스케일 값 취득 함수
}

/**
 * @brief 물리 연산의 데이터
 *
 * 물리 연산의 데이터.
 */
export class CubismPhysicsRig {
  constructor() {
    this.settings = new csmVector<CubismPhysicsSubRig>();
    this.inputs = new csmVector<CubismPhysicsInput>();
    this.outputs = new csmVector<CubismPhysicsOutput>();
    this.particles = new csmVector<CubismPhysicsParticle>();
    this.gravity = new CubismVector2(0, 0);
    this.wind = new CubismVector2(0, 0);
    this.fps = 0.0;
  }

  subRigCount: number; // 물리 연산의 물리점 개수
  settings: csmVector<CubismPhysicsSubRig>; // 물리 연산의 물리점 관리 목록
  inputs: csmVector<CubismPhysicsInput>; // 물리 연산의 입력 목록
  outputs: csmVector<CubismPhysicsOutput>; // 물리 연산의 출력 목록
  particles: csmVector<CubismPhysicsParticle>; // 물리 연산의 물리점 목록
  gravity: CubismVector2; // 중력
  wind: CubismVector2; // 바람
  fps: number; // 물리 연산 동작 FPS
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismphysicsinternal';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismPhysicsInput = $.CubismPhysicsInput;
  export type CubismPhysicsInput = $.CubismPhysicsInput;
  export const CubismPhysicsNormalization = $.CubismPhysicsNormalization;
  export type CubismPhysicsNormalization = $.CubismPhysicsNormalization;
  export const CubismPhysicsOutput = $.CubismPhysicsOutput;
  export type CubismPhysicsOutput = $.CubismPhysicsOutput;
  export const CubismPhysicsParameter = $.CubismPhysicsParameter;
  export type CubismPhysicsParameter = $.CubismPhysicsParameter;
  export const CubismPhysicsParticle = $.CubismPhysicsParticle;
  export type CubismPhysicsParticle = $.CubismPhysicsParticle;
  export const CubismPhysicsRig = $.CubismPhysicsRig;
  export type CubismPhysicsRig = $.CubismPhysicsRig;
  export const CubismPhysicsSource = $.CubismPhysicsSource;
  export type CubismPhysicsSource = $.CubismPhysicsSource;
  export const CubismPhysicsSubRig = $.CubismPhysicsSubRig;
  export type CubismPhysicsSubRig = $.CubismPhysicsSubRig;
  export const CubismPhysicsTargetType = $.CubismPhysicsTargetType;
  export type CubismPhysicsTargetType = $.CubismPhysicsTargetType;
  export const PhysicsJsonEffectiveForces = $.PhysicsJsonEffectiveForces;
  export type PhysicsJsonEffectiveForces = $.PhysicsJsonEffectiveForces;
  export type normalizedPhysicsParameterValueGetter =
    $.normalizedPhysicsParameterValueGetter;
  export type physicsScaleGetter = $.physicsScaleGetter;
  export type physicsValueGetter = $.physicsValueGetter;
}