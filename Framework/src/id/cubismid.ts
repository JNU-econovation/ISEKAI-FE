/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { csmString } from '../type/csmstring';

/**
 * 파라미터 이름·파트 이름·Drawable 이름을 유지
 *
 * 파라미터 이름·파트 이름·Drawable 이름을 유지하는 클래스.
 *
 * @note 지정한 ID 문자열에서 CubismId를 가져올 때는 이 클래스의 생성 메소드를 호출하지 말고,
 *       CubismIdManager().getId(id)를 사용하십시오
 */
export class CubismId {
  /**
   * 내부에서 사용하는 CubismId 클래스 생성 메소드
   *
   * @param id ID 문자열
   * @returns CubismId
   * @note 지정한 ID 문자열에서 CubismId를 가져올 때는
   *       CubismIdManager().getId(id)를 사용하십시오
   */
  public static createIdInternal(id: string | csmString) {
    return new CubismId(id);
  }

  /**
   * ID 이름 가져오기
   */
  public getString(): csmString {
    return this._id;
  }

  /**
   * id 비교
   * @param c 비교할 id
   * @return 같으면 true, 다르면 false를 반환
   */
  public isEqual(c: string | csmString | CubismId): boolean {
    if (typeof c === 'string') {
      return this._id.isEqual(c);
    } else if (c instanceof csmString) {
      return this._id.isEqual(c.s);
    } else if (c instanceof CubismId) {
      return this._id.isEqual(c._id.s);
    }
    return false;
  }

  /**
   * id 비교
   * @param c 비교할 id
   * @return 같으면 true, 다르면 false를 반환
   */
  public isNotEqual(c: string | csmString | CubismId): boolean {
    if (typeof c == 'string') {
      return !this._id.isEqual(c);
    } else if (c instanceof csmString) {
      return !this._id.isEqual(c.s);
    } else if (c instanceof CubismId) {
      return !this._id.isEqual(c._id.s);
    }
    return false;
  }

  /**
   * private 생성자
   *
   * @note 사용자에 의한 생성은 허용되지 않습니다
   */
  private constructor(id: string | csmString) {
    if (typeof id === 'string') {
      this._id = new csmString(id);
      return;
    }

    this._id = id;
  }

  private _id: csmString; // ID 이름
}

export declare type CubismIdHandle = CubismId;

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismid';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismId = $.CubismId;
  export type CubismId = $.CubismId;
  export type CubismIdHandle = $.CubismIdHandle;
}