/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { CSM_ASSERT, CubismLogError } from '../utils/cubismdebug';
import { CubismModel } from './cubismmodel';

/**
 * Moc 데이터 관리
 *
 * Moc 데이터의 관리를 수행하는 클래스.
 */
export class CubismMoc {
  /**
   * Moc 데이터 생성
   */
  public static create(
    mocBytes: ArrayBuffer,
    shouldCheckMocConsistency: boolean
  ): CubismMoc {
    let cubismMoc: CubismMoc = null;

    if (shouldCheckMocConsistency) {
      // .moc3 무결성 확인
      const consistency = this.hasMocConsistency(mocBytes);

      if (!consistency) {
        // 무결성이 확인되지 않으면 처리하지 않음
        CubismLogError(`Inconsistent MOC3.`);
        return cubismMoc;
      }
    }

    const moc: Live2DCubismCore.Moc =
      Live2DCubismCore.Moc.fromArrayBuffer(mocBytes);

    if (moc) {
      cubismMoc = new CubismMoc(moc);
      cubismMoc._mocVersion = Live2DCubismCore.Version.csmGetMocVersion(
        moc,
        mocBytes
      );
    }

    return cubismMoc;
  }

  /**
   * Moc 데이터 삭제
   *
   * Moc 데이터를 삭제합니다.
   */
  public static delete(moc: CubismMoc): void {
    moc._moc._release();
    moc._moc = null;
    moc = null;
  }

  /**
   * 모델 생성
   *
   * @return Moc 데이터에서 생성된 모델
   */
  createModel(): CubismModel {
    let cubismModel: CubismModel = null;

    const model: Live2DCubismCore.Model = Live2DCubismCore.Model.fromMoc(
      this._moc
    );

    if (model) {
      cubismModel = new CubismModel(model);
      cubismModel.initialize();

      ++this._modelCount;
    }

    return cubismModel;
  }

  /**
   * 모델 삭제
   */
  deleteModel(model: CubismModel): void {
    if (model != null) {
      model.release();
      model = null;
      --this._modelCount;
    }
  }

  /**
   * 생성자
   */
  private constructor(moc: Live2DCubismCore.Moc) {
    this._moc = moc;
    this._modelCount = 0;
    this._mocVersion = 0;
  }

  /**
   * 소멸자 해당 처리
   */
  public release(): void {
    CSM_ASSERT(this._modelCount == 0);

    this._moc._release();
    this._moc = null;
  }

  /**
   * 최신 .moc3 버전 가져오기
   */
  public getLatestMocVersion(): number {
    return Live2DCubismCore.Version.csmGetLatestMocVersion();
  }

  /**
   * 로드한 모델의 .moc3 버전 가져오기
   */
  public getMocVersion(): number {
    return this._mocVersion;
  }

  /**
   * .moc3 무결성 검증
   */
  public static hasMocConsistency(mocBytes: ArrayBuffer): boolean {
    const isConsistent =
      Live2DCubismCore.Moc.prototype.hasMocConsistency(mocBytes);
    return isConsistent === 1 ? true : false;
  }

  _moc: Live2DCubismCore.Moc; // Moc 데이터
  _modelCount: number; // Moc 데이터로 생성된 모델 수
  _mocVersion: number; // 로드한 모델의 .moc3 버전
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismmoc';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismMoc = $.CubismMoc;
  export type CubismMoc = $.CubismMoc;
}