/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { CubismIdHandle } from '../id/cubismid';
import { CubismFramework } from '../live2dcubismframework';
import { csmString } from '../type/csmstring';
import { CSM_ASSERT, CubismLogWarning } from '../utils/cubismdebug';
import { CubismJson, JsonMap } from '../utils/cubismjson';
import { CubismMotionSegmentType } from './cubismmotioninternal';

// JSON 키
const Meta = 'Meta';
const Duration = 'Duration';
const Loop = 'Loop';
const AreBeziersRestricted = 'AreBeziersRestricted';
const CurveCount = 'CurveCount';
const Fps = 'Fps';
const TotalSegmentCount = 'TotalSegmentCount';
const TotalPointCount = 'TotalPointCount';
const Curves = 'Curves';
const Target = 'Target';
const Id = 'Id';
const FadeInTime = 'FadeInTime';
const FadeOutTime = 'FadeOutTime';
const Segments = 'Segments';
const UserData = 'UserData';
const UserDataCount = 'UserDataCount';
const TotalUserDataSize = 'TotalUserDataSize';
const Time = 'Time';
const Value = 'Value';

/**
 * motion3.json의 컨테이너.
 */
export class CubismMotionJson {
  /**
   * 생성자
   * @param buffer motion3.json이 로드된 버퍼
   * @param size 버퍼의 크기
   */
  public constructor(buffer: ArrayBuffer, size: number) {
    this._json = CubismJson.create(buffer, size);
  }

  /**
   * 소멸자 해당 처리
   */
  public release(): void {
    CubismJson.delete(this._json);
  }

  /**
   * 모션 길이를 가져옵니다.
   * @return 모션 길이 [초]
   */
  public getMotionDuration(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(Duration)
      .toFloat();
  }

  /**
   * 모션 루프 정보 가져오기
   * @return true 루프함
   * @return false 루프하지 않음
   */
  public isMotionLoop(): boolean {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(Loop)
      .toBoolean();
  }

  /**
   *  motion3.json 파일 무결성 확인
   *
   * @return 정상적인 파일인 경우 true를 반환합니다.
   */
  hasConsistency(): boolean {
    let result = true;

    if (!this._json || !this._json.getRoot()) {
      return false;
    }

    const actualCurveListSize = this._json
      .getRoot()
      .getValueByString(Curves)
      .getVector()
      .getSize();
    let actualTotalSegmentCount = 0;
    let actualTotalPointCount = 0;

    // 카운트 처리
    for (
      let curvePosition = 0;
      curvePosition < actualCurveListSize;
      ++curvePosition
    ) {
      for (
        let segmentPosition = 0;
        segmentPosition < this.getMotionCurveSegmentCount(curvePosition);

      ) {
        if (segmentPosition == 0) {
          actualTotalPointCount += 1;
          segmentPosition += 2;
        }

        const segment = this.getMotionCurveSegment(
          curvePosition,
          segmentPosition
        ) as CubismMotionSegmentType;

        switch (segment) {
          case CubismMotionSegmentType.CubismMotionSegmentType_Linear:
            actualTotalPointCount += 1;
            segmentPosition += 3;
            break;
          case CubismMotionSegmentType.CubismMotionSegmentType_Bezier:
            actualTotalPointCount += 3;
            segmentPosition += 7;
            break;
          case CubismMotionSegmentType.CubismMotionSegmentType_Stepped:
            actualTotalPointCount += 1;
            segmentPosition += 3;
            break;
          case CubismMotionSegmentType.CubismMotionSegmentType_InverseStepped:
            actualTotalPointCount += 1;
            segmentPosition += 3;
            break;
          default:
            CSM_ASSERT(0);
            break;
        }

        ++actualTotalSegmentCount;
      }
    }

    // 개수 확인
    if (actualCurveListSize != this.getMotionCurveCount()) {
      CubismLogWarning('The number of curves does not match the metadata.');
      result = false;
    }
    if (actualTotalSegmentCount != this.getMotionTotalSegmentCount()) {
      CubismLogWarning('The number of segment does not match the metadata.');
      result = false;
    }
    if (actualTotalPointCount != this.getMotionTotalPointCount()) {
      CubismLogWarning('The number of point does not match the metadata.');
      result = false;
    }

    return result;
  }

  public getEvaluationOptionFlag(flagType: EvaluationOptionFlag): boolean {
    if (
      EvaluationOptionFlag.EvaluationOptionFlag_AreBeziersRistricted == flagType
    ) {
      return this._json
        .getRoot()
        .getValueByString(Meta)
        .getValueByString(AreBeziersRestricted)
        .toBoolean();
    }

    return false;
  }

  /**
   * 모션 커브 개수 가져오기
   * @return 모션 커브 개수
   */
  public getMotionCurveCount(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(CurveCount)
      .toInt();
  }

  /**
   * 모션 프레임레이트 가져오기
   * @return 프레임레이트 [FPS]
   */
  public getMotionFps(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(Fps)
      .toFloat();
  }

  /**
   * 모션 세그먼트 총합계 가져오기
   * @return 모션 세그먼트 가져오기
   */
  public getMotionTotalSegmentCount(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(TotalSegmentCount)
      .toInt();
  }

  /**
   * 모션 커브의 제어점 총합계 가져오기
   * @return 모션 커브의 제어점 총합계
   */
  public getMotionTotalPointCount(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(TotalPointCount)
      .toInt();
  }

  /**
   * 모션 페이드인 시간 존재 여부
   * @return true 존재함
   * @return false 존재하지 않음
   */
  public isExistMotionFadeInTime(): boolean {
    return !this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(FadeInTime)
      .isNull();
  }

  /**
   * 모션 페이드아웃 시간 존재 여부
   * @return true 존재함
   * @return false 존재하지 않음
   */
  public isExistMotionFadeOutTime(): boolean {
    return !this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(FadeOutTime)
      .isNull();
  }

  /**
   * 모션 페이드인 시간 가져오기
   * @return 페이드인 시간 [초]
   */
  public getMotionFadeInTime(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(FadeInTime)
      .toFloat();
  }

  /**
   * 모션 페이드아웃 시간 가져오기
   * @return 페이드아웃 시간 [초]
   */
  public getMotionFadeOutTime(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(FadeOutTime)
      .toFloat();
  }

  /**
   * 모션 커브 종류 가져오기
   * @param curveIndex 커브의 인덱스
   * @return 커브의 종류
   */
  public getMotionCurveTarget(curveIndex: number): string {
    return this._json
      .getRoot()
      .getValueByString(Curves)
      .getValueByIndex(curveIndex)
      .getValueByString(Target)
      .getRawString();
  }

  /**
   * 모션 커브 ID 가져오기
   * @param curveIndex 커브의 인덱스
   * @return 커브의 ID
   */
  public getMotionCurveId(curveIndex: number): CubismIdHandle {
    return CubismFramework.getIdManager().getId(
      this._json
        .getRoot()
        .getValueByString(Curves)
        .getValueByIndex(curveIndex)
        .getValueByString(Id)
        .getRawString()
    );
  }

  /**
   * 모션 커브의 페이드인 시간 존재 여부
   * @param curveIndex 커브의 인덱스
   * @return true 존재함
   * @return false 존재하지 않음
   */
  public isExistMotionCurveFadeInTime(curveIndex: number): boolean {
    return !this._json
      .getRoot()
      .getValueByString(Curves)
      .getValueByIndex(curveIndex)
      .getValueByString(FadeInTime)
      .isNull();
  }

  /**
   * 모션 커브의 페이드아웃 시간 존재 여부
   * @param curveIndex 커브의 인덱스
   * @return true 존재함
   * @return false 존재하지 않음
   */
  public isExistMotionCurveFadeOutTime(curveIndex: number): boolean {
    return !this._json
      .getRoot()
      .getValueByString(Curves)
      .getValueByIndex(curveIndex)
      .getValueByString(FadeOutTime)
      .isNull();
  }

  /**
   * 모션 커브의 페이드인 시간 가져오기
   * @param curveIndex 커브의 인덱스
   * @return 페이드인 시간 [초]
   */
  public getMotionCurveFadeInTime(curveIndex: number): number {
    return this._json
      .getRoot()
      .getValueByString(Curves)
      .getValueByIndex(curveIndex)
      .getValueByString(FadeInTime)
      .toFloat();
  }

  /**
   * 모션 커브의 페이드아웃 시간 가져오기
   * @param curveIndex 커브의 인덱스
   * @return 페이드아웃 시간 [초]
   */
  public getMotionCurveFadeOutTime(curveIndex: number): number {
    return this._json
      .getRoot()
      .getValueByString(Curves)
      .getValueByIndex(curveIndex)
      .getValueByString(FadeOutTime)
      .toFloat();
  }

  /**
   * 모션 커브의 세그먼트 개수를 가져옵니다.
   * @param curveIndex 커브의 인덱스
   * @return 모션 커브의 세그먼트 개수
   */
  public getMotionCurveSegmentCount(curveIndex: number): number {
    return this._json
      .getRoot()
      .getValueByString(Curves)
      .getValueByIndex(curveIndex)
      .getValueByString(Segments)
      .getVector()
      .getSize();
  }

  /**
   * 모션 커브의 세그먼트 값 가져오기
   * @param curveIndex 커브의 인덱스
   * @param segmentIndex 세그먼트의 인덱스
   * @return 세그먼트 값
   */
  public getMotionCurveSegment(
    curveIndex: number,
    segmentIndex: number
  ): number {
    return this._json
      .getRoot()
      .getValueByString(Curves)
      .getValueByIndex(curveIndex)
      .getValueByString(Segments)
      .getValueByIndex(segmentIndex)
      .toFloat();
  }

  /**
   * 이벤트 개수 가져오기
   * @return 이벤트 개수
   */
  public getEventCount(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(UserDataCount)
      .toInt();
  }

  /**
   *  이벤트 총 문자 수 가져오기
   * @return 이벤트 총 문자 수
   */
  public getTotalEventValueSize(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(TotalUserDataSize)
      .toInt();
  }

  /**
   * 이벤트 시간 가져오기
   * @param userDataIndex 이벤트의 인덱스
   * @return 이벤트 시간 [초]
   */
  public getEventTime(userDataIndex: number): number {
    return this._json
      .getRoot()
      .getValueByString(UserData)
      .getValueByIndex(userDataIndex)
      .getValueByString(Time)
      .toFloat();
  }

  /**
   * 이벤트 가져오기
   * @param userDataIndex 이벤트의 인덱스
   * @return 이벤트의 문자열
   */
  public getEventValue(userDataIndex: number): csmString {
    return new csmString(
      this._json
        .getRoot()
        .getValueByString(UserData)
        .getValueByIndex(userDataIndex)
        .getValueByString(Value)
        .getRawString()
    );
  }

  _json: CubismJson; // motion3.json 데이터
}

/**
 * @brief 베지어 곡선 해석 방법의 플래그 타입
 */
export enum EvaluationOptionFlag {
  EvaluationOptionFlag_AreBeziersRistricted = 0 ///< 베지어 핸들 규제 상태
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismmotionjson';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismMotionJson = $.CubismMotionJson;
  export type CubismMotionJson = $.CubismMotionJson;
}