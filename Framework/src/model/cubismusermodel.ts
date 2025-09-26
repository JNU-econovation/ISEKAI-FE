/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { CubismBreath } from '../effect/cubismbreath';
import { CubismEyeBlink } from '../effect/cubismeyeblink';
import { CubismPose } from '../effect/cubismpose';
import { ICubismModelSetting } from '../icubismmodelsetting';
import { CubismIdHandle } from '../id/cubismid';
import { Constant } from '../live2dcubismframework';
import { CubismModelMatrix } from '../math/cubismmodelmatrix';
import { CubismTargetPoint } from '../math/cubismtargetpoint';
import {
  ACubismMotion,
  BeganMotionCallback,
  FinishedMotionCallback
} from '../motion/acubismmotion';
import { CubismExpressionMotion } from '../motion/cubismexpressionmotion';
import { CubismExpressionMotionManager } from '../motion/cubismexpressionmotionmanager';
import { CubismMotion } from '../motion/cubismmotion';
import { CubismMotionManager } from '../motion/cubismmotionmanager';
import { CubismMotionQueueManager } from '../motion/cubismmotionqueuemanager';
import { CubismPhysics } from '../physics/cubismphysics';
import { CubismRenderer_WebGL } from '../rendering/cubismrenderer_webgl';
import { csmString } from '../type/csmstring';
import { CubismLogError, CubismLogInfo } from '../utils/cubismdebug';
import { CubismMoc } from './cubismmoc';
import { CubismModel } from './cubismmodel';
import { CubismModelUserData } from './cubismmodeluserdata';

/**
 * 사용자가 실제로 사용하는 모델
 *
 * 사용자가 실제로 사용하는 모델의 기본 클래스. 이를 상속하여 사용자가 구현합니다.
 */
export class CubismUserModel {
  /**
   * 초기화 상태 가져오기
   *
   * 초기화되었는지?
   *
   * @return true     초기화됨
   * @return false    초기화되지 않음
   */
  public isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * 초기화 상태 설정
   *
   * 초기화 상태를 설정합니다.
   *
   * @param v 초기화 상태
   */
  public setInitialized(v: boolean): void {
    this._initialized = v;
  }

  /**
   * 업데이트 상태 가져오기
   *
   * 업데이트되었는지?
   *
   * @return true     업데이트됨
   * @return false    업데이트되지 않음
   */
  public isUpdating(): boolean {
    return this._updating;
  }

  /**
   * 업데이트 상태 설정
   *
   * 업데이트 상태를 설정합니다.
   *
   * @param v 업데이트 상태
   */
  public setUpdating(v: boolean): void {
    this._updating = v;
  }

  /**
   * 마우스 드래그 정보 설정
   * @param x 드래그하는 커서의 X 위치
   * @param y 드래그하는 커서의 Y 위치
   */
  public setDragging(x: number, y: number): void {
    this._dragManager.set(x, y);
  }

  /**
   * 가속도 정보 설정
   * @param x X축 방향 가속도
   * @param y Y축 방향 가속도
   * @param z Z축 방향 가속도
   */
  public setAcceleration(x: number, y: number, z: number): void {
    this._accelerationX = x;
    this._accelerationY = y;
    this._accelerationZ = z;
  }

  /**
   * 모델 행렬 가져오기
   * @return 모델 행렬
   */
  public getModelMatrix(): CubismModelMatrix {
    return this._modelMatrix;
  }

  /**
   * 불투명도 설정
   * @param a 불투명도
   */
  public setOpacity(a: number): void {
    this._opacity = a;
  }

  /**
   * 불투명도 가져오기
   * @return 불투명도
   */
  public getOpacity(): number {
    return this._opacity;
  }

  /**
   * 모델 데이터 로드
   *
   * @param buffer    moc3 파일이 로드된 버퍼
   */
  public loadModel(buffer: ArrayBuffer, shouldCheckMocConsistency = false) {
    this._moc = CubismMoc.create(buffer, shouldCheckMocConsistency);

    if (this._moc == null) {
      CubismLogError('Failed to CubismMoc.create().');
      return;
    }

    this._model = this._moc.createModel();

    if (this._model == null) {
      CubismLogError('Failed to CreateModel().');
      return;
    }

    this._model.saveParameters();
    this._modelMatrix = new CubismModelMatrix(
      this._model.getCanvasWidth(),
      this._model.getCanvasHeight()
    );
  }

  /**
   * 모션 데이터 로드
   * @param buffer motion3.json 파일이 로드된 버퍼
   * @param size 버퍼의 크기
   * @param name 모션의 이름
   * @param onFinishedMotionHandler 모션 재생 종료 시 호출되는 콜백 함수
   * @param onBeganMotionHandler 모션 재생 시작 시 호출되는 콜백 함수
   * @param modelSetting 모델 설정
   * @param group 모션 그룹 이름
   * @param index 모션 인덱스
   * @param shouldCheckMotionConsistency motion3.json 무결성 확인 여부
   * @return 모션 클래스
   */
  public loadMotion(
    buffer: ArrayBuffer,
    size: number,
    name: string,
    onFinishedMotionHandler?: FinishedMotionCallback,
    onBeganMotionHandler?: BeganMotionCallback,
    modelSetting?: ICubismModelSetting,
    group?: string,
    index?: number,
    shouldCheckMotionConsistency: boolean = false
  ): CubismMotion {
    if (buffer == null || size == 0) {
      CubismLogError('Failed to loadMotion().');
      return null;
    }

    const motion: CubismMotion = CubismMotion.create(
      buffer,
      size,
      onFinishedMotionHandler,
      onBeganMotionHandler,
      shouldCheckMotionConsistency
    );

    if (motion == null) {
      CubismLogError(`Failed to create motion from buffer in LoadMotion()`);
      return null;
    }

    // 필요한 경우 모션 페이드 값 덮어쓰기
    if (modelSetting) {
      const fadeInTime: number = modelSetting.getMotionFadeInTimeValue(
        group,
        index
      );
      if (fadeInTime >= 0.0) {
        motion.setFadeInTime(fadeInTime);
      }

      const fadeOutTime = modelSetting.getMotionFadeOutTimeValue(group, index);
      if (fadeOutTime >= 0.0) {
        motion.setFadeOutTime(fadeOutTime);
      }
    }

    return motion;
  }

  /**
   * 표정 데이터 로드
   * @param buffer exp 파일이 로드된 버퍼
   * @param size 버퍼의 크기
   * @param name 표정의 이름
   */
  public loadExpression(
    buffer: ArrayBuffer,
    size: number,
    name: string
  ): ACubismMotion {
    if (buffer == null || size == 0) {
      CubismLogError('Failed to loadExpression().');
      return null;
    }
    return CubismExpressionMotion.create(buffer, size);
  }

  /**
   * 포즈 데이터 로드
   * @param buffer pose3.json이 로드된 버퍼
   * @param size 버퍼의 크기
   */
  public loadPose(buffer: ArrayBuffer, size: number): void {
    if (buffer == null || size == 0) {
      CubismLogError('Failed to loadPose().');
      return;
    }
    this._pose = CubismPose.create(buffer, size);
  }

  /**
   * 모델에 첨부된 사용자 데이터 로드
   * @param buffer userdata3.json이 로드된 버퍼
   * @param size 버퍼의 크기
   */
  public loadUserData(buffer: ArrayBuffer, size: number): void {
    if (buffer == null || size == 0) {
      CubismLogError('Failed to loadUserData().');
      return;
    }
    this._modelUserData = CubismModelUserData.create(buffer, size);
  }

  /**
   * 물리 연산 데이터 로드
   * @param buffer  physics3.json이 로드된 버퍼
   * @param size    버퍼의 크기
   */
  public loadPhysics(buffer: ArrayBuffer, size: number): void {
    if (buffer == null || size == 0) {
      CubismLogError('Failed to loadPhysics().');
      return;
    }
    this._physics = CubismPhysics.create(buffer, size);
  }

  /**
   * 히트 판정 가져오기
   * @param drawableId 검증하려는 Drawable의 ID
   * @param pointX X 위치
   * @param pointY Y 위치
   * @return true 히트함
   * @return false 히트하지 않음
   */
  public isHit(
    drawableId: CubismIdHandle,
    pointX: number,
    pointY: number
  ): boolean {
    const drawIndex: number = this._model.getDrawableIndex(drawableId);

    if (drawIndex < 0) {
      return false; // 존재하지 않으면 false
    }

    const count: number = this._model.getDrawableVertexCount(drawIndex);
    const vertices: Float32Array = this._model.getDrawableVertices(drawIndex);

    let left: number = vertices[0];
    let right: number = vertices[0];
    let top: number = vertices[1];
    let bottom: number = vertices[1];

    for (let j = 1; j < count; ++j) {
      const x = vertices[Constant.vertexOffset + j * Constant.vertexStep];
      const y = vertices[Constant.vertexOffset + j * Constant.vertexStep + 1];

      if (x < left) {
        left = x; // Min x
      }

      if (x > right) {
        right = x; // Max x
      }

      if (y < top) {
        top = y; // Min y
      }

      if (y > bottom) {
        bottom = y; // Max y
      }
    }

    const tx: number = this._modelMatrix.invertTransformX(pointX);
    const ty: number = this._modelMatrix.invertTransformY(pointY);

    return left <= tx && tx <= right && top <= ty && ty <= bottom;
  }

  /**
   * 모델 가져오기
   * @return 모델
   */
  public getModel(): CubismModel {
    return this._model;
  }

  /**
   * 렌더러 가져오기
   * @return 렌더러
   */
  public getRenderer(): CubismRenderer_WebGL {
    return this._renderer;
  }

  /**
   * 렌더러를 생성하고 초기화를 실행합니다.
   * @param maskBufferCount 버퍼 생성 수
   */
  public createRenderer(maskBufferCount = 1): void {
    if (this._renderer) {
      this.deleteRenderer();
    }

    this._renderer = new CubismRenderer_WebGL();
    this._renderer.initialize(this._model, maskBufferCount);
  }

  /**
   * 렌더러 해제
   */
  public deleteRenderer(): void {
    if (this._renderer != null) {
      this._renderer.release();
      this._renderer = null;
    }
  }

  /**
   * 이벤트 발생 시 표준 처리
   *
   * Event가 재생 처리 시에 있었을 경우의 처리를 합니다.
   * 상속으로 덮어쓰는 것을 상정하고 있습니다.
   * 덮어쓰지 않으면 로그를 출력합니다.
   *
   * @param eventValue 발생한 이벤트의 문자열 데이터
   */
  public motionEventFired(eventValue: csmString): void {
    CubismLogInfo('{0}', eventValue.s);
  }

  /**
   * 이벤트용 콜백
   *
   * CubismMotionQueueManager에 이벤트용으로 등록하기 위한 콜백.
   * CubismUserModel의 상속처의 EventFired를 호출합니다.
   *
   * @param caller 발생한 이벤트를 관리하던 모션 관리자, 비교용
   * @param eventValue 발생한 이벤트의 문자열 데이터
   * @param customData CubismUserModel을 상속한 인스턴스를 상정
   */
  public static cubismDefaultMotionEventCallback(
    caller: CubismMotionQueueManager,
    eventValue: csmString,
    customData: CubismUserModel
  ): void {
    const model: CubismUserModel = customData;

    if (model != null) {
      model.motionEventFired(eventValue);
    }
  }

  /**
   * 생성자
   */
  public constructor() {
    // 각 변수 초기화
    this._moc = null;
    this._model = null;
    this._motionManager = null;
    this._expressionManager = null;
    this._eyeBlink = null;
    this._breath = null;
    this._modelMatrix = null;
    this._pose = null;
    this._dragManager = null;
    this._physics = null;
    this._modelUserData = null;
    this._initialized = false;
    this._updating = false;
    this._opacity = 1.0;
    this._lipsync = true;
    this._lastLipSyncValue = 0.0;
    this._dragX = 0.0;
    this._dragY = 0.0;
    this._accelerationX = 0.0;
    this._accelerationY = 0.0;
    this._accelerationZ = 0.0;
    this._mocConsistency = false;
    this._debugMode = false;
    this._renderer = null;

    // 모션 관리자 생성
    this._motionManager = new CubismMotionManager();
    this._motionManager.setEventCallback(
      CubismUserModel.cubismDefaultMotionEventCallback,
      this
    );

    // 표정 관리자 생성
    this._expressionManager = new CubismExpressionMotionManager();

    // 드래그에 의한 애니메이션
    this._dragManager = new CubismTargetPoint();
  }

  /**
   * 소멸자에 해당하는 처리
   */
  public release() {
    if (this._motionManager != null) {
      this._motionManager.release();
      this._motionManager = null;
    }

    if (this._expressionManager != null) {
      this._expressionManager.release();
      this._expressionManager = null;
    }

    if (this._moc != null) {
      this._moc.deleteModel(this._model);
      this._moc.release();
      this._moc = null;
    }

    this._modelMatrix = null;

    CubismPose.delete(this._pose);
    CubismEyeBlink.delete(this._eyeBlink);
    CubismBreath.delete(this._breath);

    this._dragManager = null;

    CubismPhysics.delete(this._physics);
    CubismModelUserData.delete(this._modelUserData);

    this.deleteRenderer();
  }

  protected _moc: CubismMoc; // Moc 데이터
  protected _model: CubismModel; // Model 인스턴스

  protected _motionManager: CubismMotionManager; // 모션 관리
  protected _expressionManager: CubismExpressionMotionManager; // 표정 관리
  protected _eyeBlink: CubismEyeBlink; // 자동 눈 깜박임
  protected _breath: CubismBreath; // 호흡
  protected _modelMatrix: CubismModelMatrix; // 모델 행렬
  protected _pose: CubismPose; // 포즈 관리
  protected _dragManager: CubismTargetPoint; // 마우스 드래그
  protected _physics: CubismPhysics; // 물리 연산
  protected _modelUserData: CubismModelUserData; // 사용자 데이터

  protected _initialized: boolean; // 초기화되었는지 여부
  protected _updating: boolean; // 업데이트되었는지 여부
  protected _opacity: number; // 불투명도
  protected _lipsync: boolean; // 립싱크 여부
  protected _lastLipSyncValue: number; // 마지막 립싱크 제어 값
  protected _dragX: number; // 마우스 드래그의 X 위치
  protected _dragY: number; // 마우스 드래그의 Y 위치
  protected _accelerationX: number; // X축 방향 가속도
  protected _accelerationY: number; // Y축 방향 가속도
  protected _accelerationZ: number; // Z축 방향 가속도
  protected _mocConsistency: boolean; // MOC3 무결성 검증 여부
  protected _motionConsistency: boolean; // motion3.json 무결성 검증 여부
  protected _debugMode: boolean; // 디버그 모드 여부

  private _renderer: CubismRenderer_WebGL; // 렌더러
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismusermodel';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismUserModel = $.CubismUserModel;
  export type CubismUserModel = $.CubismUserModel;
}