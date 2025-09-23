/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { CubismMath } from './cubismmath';

const FrameRate = 30;
const Epsilon = 0.01;

/**
 * 얼굴 방향 제어 기능
 *
 * 얼굴 방향 제어 기능을 제공하는 클래스.
 */
export class CubismTargetPoint {
  /**
   * 생성자
   */
  public constructor() {
    this._faceTargetX = 0.0;
    this._faceTargetY = 0.0;
    this._faceX = 0.0;
    this._faceY = 0.0;
    this._faceVX = 0.0;
    this._faceVY = 0.0;
    this._lastTimeSeconds = 0.0;
    this._userTimeSeconds = 0.0;
  }

  /**
   * 업데이트 처리
   */
  public update(deltaTimeSeconds: number): void {
    // 델타 시간을 더합니다.
    this._userTimeSeconds += deltaTimeSeconds;

    // 목을 중앙에서 좌우로 흔들 때의 평균 속도는 초당 속도. 가속·감속을 고려하여 그 2배를 최고 속도로 합니다.
    // 얼굴의 흔들림 정도를 중앙(0.0)에서 좌우는 (+-1.0)로 합니다.
    const faceParamMaxV: number = 40.0 / 10.0; // 7.5초간 40분 이동(5.3/sc)
    const maxV: number = (faceParamMaxV * 1.0) / FrameRate; // 1프레임당 변경 가능한 속도 상한

    if (this._lastTimeSeconds == 0.0) {
      this._lastTimeSeconds = this._userTimeSeconds;
      return;
    }

    const deltaTimeWeight: number =
      (this._userTimeSeconds - this._lastTimeSeconds) * FrameRate;
    this._lastTimeSeconds = this._userTimeSeconds;

    // 최고 속도가 될 때까지의 시간
    const timeToMaxSpeed = 0.15;
    const frameToMaxSpeed: number = timeToMaxSpeed * FrameRate; // sec * frame/sec
    const maxA: number = (deltaTimeWeight * maxV) / frameToMaxSpeed; // 1프레임당 가속도

    // 목표 방향은 (dx, dy) 방향의 벡터가 됩니다.
    const dx: number = this._faceTargetX - this._faceX;
    const dy: number = this._faceTargetY - this._faceY;

    if (CubismMath.abs(dx) <= Epsilon && CubismMath.abs(dy) <= Epsilon) {
      return; // 변화 없음
    }

    // 속도가 최대보다 큰 경우 속도를 줄입니다.
    const d: number = CubismMath.sqrt(dx * dx + dy * dy);

    // 진행 방향의 최대 속도 벡터
    const vx: number = (maxV * dx) / d;
    const vy: number = (maxV * dy) / d;

    // 현재 속도에서 새 속도로의 변화(가속도)를 구합니다.
    let ax: number = vx - this._faceVX;
    let ay: number = vy - this._faceVY;

    const a: number = CubismMath.sqrt(ax * ax + ay * ay);

    // 가속 시
    if (a < -maxA || a > maxA) {
      ax *= maxA / a;
      ay *= maxA / a;
    }

    // 가속도를 원래 속도에 더하여 새 속도로 합니다.
    this._faceVX += ax;
    this._faceVY += ay;

    // 목표 방향에 가까워졌을 때 부드럽게 감속하기 위한 처리
    // 설정된 가속도로 멈출 수 있는 거리와 속도의 관계에서
    // 현재 취할 수 있는 최고 속도를 계산하고, 그 이상일 때는 속도를 줄입니다.
    // ※원래 인간은 근력으로 힘(가속도)을 조절할 수 있어 자유도가 높지만, 간단한 처리로 끝냈습니다.
    {
      // 가속도, 속도, 거리의 관계식.
      //            2  6           2               3
      //      sqrt(a  t  + 16 a h t  - 8 a h) - a t
      // v = --------------------------------------
      //                    2
      //                 4 t  - 2
      // (t=1)
      // 	시간 t는 미리 가속도, 속도를 1/60(프레임레이트, 단위 없음)으로
      // 	생각하고 있으므로 t=1로 지워도 괜찮습니다 (※미검증)

      const maxV: number =
        0.5 *
        (CubismMath.sqrt(maxA * maxA + 16.0 * maxA * d - 8.0 * maxA * d) -
          maxA);
      const curV: number = CubismMath.sqrt(
        this._faceVX * this._faceVX + this._faceVY * this._faceVY
      );

      if (curV > maxV) {
        // 현재 속도 > 최고 속도일 때, 최고 속도까지 감속
        this._faceVX *= maxV / curV;
        this._faceVY *= maxV / curV;
      }
    }

    this._faceX += this._faceVX;
    this._faceY += this._faceVY;
  }

  /**
   * X축 얼굴 방향 값 가져오기
   *
   * @return X축 얼굴 방향 값 (-1.0 ~ 1.0)
   */
  public getX(): number {
    return this._faceX;
  }

  /**
   * Y축 얼굴 방향 값 가져오기
   *
   * @return Y축 얼굴 방향 값 (-1.0 ~ 1.0)
   */
  public getY(): number {
    return this._faceY;
  }

  /**
   * 얼굴 방향 목표값 설정
   *
   * @param x X축 얼굴 방향 값 (-1.0 ~ 1.0)
   * @param y Y축 얼굴 방향 값 (-1.0 ~ 1.0)
   */
  public set(x: number, y: number): void {
    this._faceTargetX = x;
    this._faceTargetY = y;
  }

  private _faceTargetX: number; // 얼굴 방향의 X 목표값 (이 값에 가까워짐)
  private _faceTargetY: number; // 얼굴 방향의 Y 목표값 (이 값에 가까워짐)
  private _faceX: number; // 얼굴 방향 X (-1.0 ~ 1.0)
  private _faceY: number; // 얼굴 방향 Y (-1.0 ~ 1.0)
  private _faceVX: number; // 얼굴 방향의 변화 속도 X
  private _faceVY: number; // 얼굴 방향의 변화 속도 Y
  private _lastTimeSeconds: number; // 마지막 실행 시간 [초]
  private _userTimeSeconds: number; // 델타 시간의 누적 값 [초]
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismtargetpoint';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismTargetPoint = $.CubismTargetPoint;
  export type CubismTargetPoint = $.CubismTargetPoint;
}