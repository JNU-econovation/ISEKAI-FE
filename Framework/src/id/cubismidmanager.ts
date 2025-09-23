/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { csmString } from '../type/csmstring';
import { csmVector } from '../type/csmvector';
import { CubismId } from './cubismid';

/**
 * ID 이름 관리
 *
 * ID 이름을 관리합니다.
 */
export class CubismIdManager {
  /**
   * 생성자
   */
  public constructor() {
    this._ids = new csmVector<CubismId>();
  }

  /**
   * 소멸자 해당 처리
   */
  public release(): void {
    for (let i = 0; i < this._ids.getSize(); ++i) {
      this._ids.set(i, void 0);
    }
    this._ids = null;
  }

  /**
   * ID 이름을 목록에서 등록
   *
   * @param ids ID 이름 목록
   * @param count ID 개수
   */
  public registerIds(ids: string[] | csmString[]): void {
    for (let i = 0; i < ids.length; i++) {
      this.registerId(ids[i]);
    }
  }

  /**
   * ID 이름 등록
   *
   * @param id ID 이름
   */
  public registerId(id: string | csmString): CubismId {
    let result: CubismId = null;

    if ('string' == typeof id) {
      if ((result = this.findId(id)) != null) {
        return result;
      }

      result = CubismId.createIdInternal(id);
      this._ids.pushBack(result);
    } else {
      return this.registerId(id.s);
    }

    return result;
  }

  /**
   * ID 이름으로 ID 가져오기
   *
   * @param id ID 이름
   */
  public getId(id: csmString | string): CubismId {
    return this.registerId(id);
  }

  /**
   * ID 이름으로 ID 확인
   *
   * @return true 존재함
   * @return false 존재하지 않음
   */
  public isExist(id: csmString | string): boolean {
    if ('string' == typeof id) {
      return this.findId(id) != null;
    }
    return this.isExist(id.s);
  }

  /**
   * ID 이름으로 ID 검색.
   *
   * @param id ID 이름
   * @return 등록된 ID. 없으면 NULL.
   */
  private findId(id: string): CubismId {
    for (let i = 0; i < this._ids.getSize(); ++i) {
      if (this._ids.at(i).getString().isEqual(id)) {
        return this._ids.at(i);
      }
    }

    return null;
  }

  private _ids: csmVector<CubismId>; // 등록된 ID 목록
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismidmanager';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismIdManager = $.CubismIdManager;
  export type CubismIdManager = $.CubismIdManager;
}