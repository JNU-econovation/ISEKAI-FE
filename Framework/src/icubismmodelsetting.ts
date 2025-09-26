/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { CubismIdHandle } from './id/cubismid';
import { csmMap } from './type/csmmap';

/**
 * 모델 설정 정보를 다루는 함수를 선언한 순수 가상 클래스.
 *
 * 이 클래스를 상속하여 모델 설정 정보를 다루는 클래스가 됩니다.
 */
export abstract class ICubismModelSetting {
  /**
   * Moc 파일 이름 가져오기
   * @return Moc 파일 이름
   */
  public abstract getModelFileName(): string;

  /**
   * 모델이 사용하는 텍스처 수 가져오기
   * 텍스처 수
   */
  public abstract getTextureCount(): number;

  /**
   * 텍스처가 배치된 디렉토리 이름 가져오기
   * @return 텍스처가 배치된 디렉토리 이름
   */
  public abstract getTextureDirectory(): string;

  /**
   * 모델이 사용하는 텍스처 이름 가져오기
   * @param index 배열의 인덱스 값
   * @return 텍스처 이름
   */
  public abstract getTextureFileName(index: number): string;

  /**
   * 모델에 설정된 히트 판정 수 가져오기
   * @return 모델에 설정된 히트 판정 수
   */
  public abstract getHitAreasCount(): number;

  /**
   * 히트 판정에 설정된 ID 가져오기
   *
   * @param index 배열의 index
   * @return 히트 판정에 설정된 ID
   */
  public abstract getHitAreaId(index: number): CubismIdHandle;

  /**
   * 히트 판정에 설정된 이름 가져오기
   * @param index 배열의 인덱스 값
   * @return 히트 판정에 설정된 이름
   */
  public abstract getHitAreaName(index: number): string;

  /**
   * 물리 연산 설정 파일 이름 가져오기
   * @return 물리 연산 설정 파일 이름
   */
  public abstract getPhysicsFileName(): string;

  /**
   * 파츠 전환 설정 파일 이름 가져오기
   * @return 파츠 전환 설정 파일 이름
   */
  public abstract getPoseFileName(): string;

  /**
   * 표정 설정 파일 수 가져오기
   * @return 표정 설정 파일 수
   */
  public abstract getExpressionCount(): number;

  /**
   * 표정 설정 파일을 식별하는 이름(별칭) 가져오기
   * @param index 배열의 인덱스 값
   * @return 표정 이름
   */
  public abstract getExpressionName(index: number): string;

  /**
   * 표정 설정 파일 이름 가져오기
   * @param index 배열의 인덱스 값
   * @return 표정 설정 파일 이름
   */
  public abstract getExpressionFileName(index: number): string;

  /**
   * 모션 그룹 수 가져오기
   * @return 모션 그룹 수
   */
  public abstract getMotionGroupCount(): number;

  /**
   * 모션 그룹 이름 가져오기
   * @param index 배열의 인덱스 값
   * @return 모션 그룹 이름
   */
  public abstract getMotionGroupName(index: number): string;

  /**
   * 모션 그룹에 포함된 모션 수 가져오기
   * @param groupName 모션 그룹 이름
   * @return 모션 그룹 수
   */
  public abstract getMotionCount(groupName: string): number;

  /**
   * 그룹 이름과 인덱스 값으로 모션 파일 이름 가져오기
   * @param groupName 모션 그룹 이름
   * @param index     배열의 인덱스 값
   * @return 모션 파일 이름
   */
  public abstract getMotionFileName(groupName: string, index: number): string;

  /**
   * 모션에 해당하는 사운드 파일 이름 가져오기
   * @param groupName 모션 그룹 이름
   * @param index 배열의 인덱스 값
   * @return 사운드 파일 이름
   */
  public abstract getMotionSoundFileName(
    groupName: string,
    index: number
  ): string;

  /**
   * 모션 시작 시 페이드인 처리 시간 가져오기
   * @param groupName 모션 그룹 이름
   * @param index 배열의 인덱스 값
   * @return 페이드인 처리 시간 [초]
   */
  public abstract getMotionFadeInTimeValue(
    groupName: string,
    index: number
  ): number;

  /**
   * 모션 종료 시 페이드아웃 처리 시간 가져오기
   * @param groupName 모션 그룹 이름
   * @param index 배열의 인덱스 값
   * @return 페이드아웃 처리 시간 [초]
   */
  public abstract getMotionFadeOutTimeValue(
    groupName: string,
    index: number
  ): number;

  /**
   * 사용자 데이터 파일 이름 가져오기
   * @return 사용자 데이터 파일 이름
   */
  public abstract getUserDataFile(): string;

  /**
   * 레이아웃 정보 가져오기
   * @param outLayoutMap csmMap 클래스의 인스턴스
   * @return true 레이아웃 정보가 존재함
   * @return false 레이아웃 정보가 존재하지 않음
   */
  public abstract getLayoutMap(outLayoutMap: csmMap<string, number>): boolean;

  /**
   * 눈 깜박임과 관련된 파라미터 수 가져오기
   * @return 눈 깜박임과 관련된 파라미터 수
   */
  public abstract getEyeBlinkParameterCount(): number;

  /**
   * 눈 깜박임과 관련된 파라미터 ID 가져오기
   * @param index 배열의 인덱스 값
   * @return 파라미터 ID
   */
  public abstract getEyeBlinkParameterId(index: number): CubismIdHandle;

  /**
   * 립싱크와 관련된 파라미터 수 가져오기
   * @return 립싱크와 관련된 파라미터 수
   */
  public abstract getLipSyncParameterCount(): number;

  /**
   * 립싱크와 관련된 파라미터 수 가져오기
   * @param index 배열의 인덱스 값
   * @return 파라미터 ID
   */
  public abstract getLipSyncParameterId(index: number): CubismIdHandle;
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './icubismmodelsetting';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const ICubismModelSetting = $.ICubismModelSetting;
  export type ICubismModelSetting = $.ICubismModelSetting;
}