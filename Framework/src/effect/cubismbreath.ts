/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { CubismIdHandle } from '../id/cubismid';
import { CubismModel } from '../model/cubismmodel';
import { csmVector } from '../type/csmvector';

/**
 * 호흡 기능
 *
 * 호흡 기능을 제공합니다.
 */
export class CubismBreath {
  /**
   * 인스턴스 생성
   */
  public static create(): CubismBreath {
    return new CubismBreath();
  }

  /**
   * 인스턴스 파기
   * @param instance 대상 CubismBreath
   */
  public static delete(instance: CubismBreath): void {
    if (instance != null) {
      instance = null;
    }
  }

  /**
   * 호흡 파라미터 연결
   * @param breathParameters 호흡을 연결할 파라미터 목록
   */
  public setParameters(breathParameters: csmVector<BreathParameterData>): void {
    this._breathParameters = breathParameters;
  }

  /**
   * 호흡에 연결된 파라미터 가져오기
   * @return 호흡에 연결된 파라미터 목록
   */
  public getParameters(): csmVector<BreathParameterData> {
    return this._breathParameters;
  }

  /**
   * 모델 파라미터 업데이트
   * @param model 대상 모델
   * @param deltaTimeSeconds 델타 시간 [초]
   */
  public updateParameters(model: CubismModel, deltaTimeSeconds: number): void {
    this._currentTime += deltaTimeSeconds;

    const t: number = this._currentTime * 2.0 * Math.PI;

    for (let i = 0; i < this._breathParameters.getSize(); ++i) {
      const data: BreathParameterData = this._breathParameters.at(i);

      model.addParameterValueById(
        data.parameterId,
        data.offset + data.peak * Math.sin(t / data.cycle),
        data.weight
      );
    }
  }

  /**
   * 생성자
   */
  public constructor() {
    this._currentTime = 0.0;
  }

  _breathParameters: csmVector<BreathParameterData>; // 호흡에 연결된 파라미터 목록
  _currentTime: number; // 누적 시간 [초]
}

/**
 * 호흡 파라미터 정보
 */
export class BreathParameterData {
  /**
   * 생성자
   * @param parameterId   호흡을 연결할 파라미터 ID
   * @param offset        호흡을 사인파로 했을 때의 파동 오프셋
   * @param peak          호흡을 사인파로 했을 때의 파동 높이
   * @param cycle         호흡을 사인파로 했을 때의 파동 주기
   * @param weight        파라미터에 대한 가중치
   */
  constructor(
    parameterId?: CubismIdHandle,
    offset?: number,
    peak?: number,
    cycle?: number,
    weight?: number
  ) {
    this.parameterId = parameterId == undefined ? null : parameterId;
    this.offset = offset == undefined ? 0.0 : offset;
    this.peak = peak == undefined ? 0.0 : peak;
    this.cycle = cycle == undefined ? 0.0 : cycle;
    this.weight = weight == undefined ? 0.0 : weight;
  }

  parameterId: CubismIdHandle; // 호흡을 연결할 파라미터 ID
  offset: number; // 호흡을 사인파로 했을 때의 파동 오프셋
  peak: number; // 호흡을 사인파로 했을 때의 파동 높이
  cycle: number; // 호흡을 사인파로 했을 때의 파동 주기
  weight: number; // 파라미터에 대한 가중치
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismbreath';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const BreathParameterData = $.BreathParameterData;
  export type BreathParameterData = $.BreathParameterData;
  export const CubismBreath = $.CubismBreath;
  export type CubismBreath = $.CubismBreath;
}