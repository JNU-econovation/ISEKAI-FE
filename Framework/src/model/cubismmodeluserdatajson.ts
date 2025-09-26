/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { CubismIdHandle } from '../id/cubismid';
import { CubismFramework } from '../live2dcubismframework';
import { CubismJson } from '../utils/cubismjson';

const Meta = 'Meta';
const UserDataCount = 'UserDataCount';
const TotalUserDataSize = 'TotalUserDataSize';
const UserData = 'UserData';
const Target = 'Target';
const Id = 'Id';
const Value = 'Value';

export class CubismModelUserDataJson {
  /**
   * 생성자
   * @param buffer    userdata3.json이 로드된 버퍼
   * @param size      버퍼 크기
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
   * 사용자 데이터 개수 가져오기
   * @return 사용자 데이터 개수
   */
  public getUserDataCount(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(UserDataCount)
      .toInt();
  }

  /**
   * 사용자 데이터 총 문자열 수 가져오기
   *
   * @return 사용자 데이터 총 문자열 수
   */
  public getTotalUserDataSize(): number {
    return this._json
      .getRoot()
      .getValueByString(Meta)
      .getValueByString(TotalUserDataSize)
      .toInt();
  }

  /**
   * 사용자 데이터 타입 가져오기
   *
   * @return 사용자 데이터 타입
   */
  public getUserDataTargetType(i: number): string {
    return this._json
      .getRoot()
      .getValueByString(UserData)
      .getValueByIndex(i)
      .getValueByString(Target)
      .getRawString();
  }

  /**
   * 사용자 데이터의 대상 ID 가져오기
   *
   * @param i 인덱스
   * @return 사용자 데이터 대상 ID
   */
  public getUserDataId(i: number): CubismIdHandle {
    return CubismFramework.getIdManager().getId(
      this._json
        .getRoot()
        .getValueByString(UserData)
        .getValueByIndex(i)
        .getValueByString(Id)
        .getRawString()
    );
  }

  /**
   * 사용자 데이터의 문자열 가져오기
   *
   * @param i 인덱스
   * @return 사용자 데이터
   */
  public getUserDataValue(i: number): string {
    return this._json
      .getRoot()
      .getValueByString(UserData)
      .getValueByIndex(i)
      .getValueByString(Value)
      .getRawString();
  }

  private _json: CubismJson;
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismmodeluserdatajson';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismModelUserDataJson = $.CubismModelUserDataJson;
  export type CubismModelUserDataJson = $.CubismModelUserDataJson;
}