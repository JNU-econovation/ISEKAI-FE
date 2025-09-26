/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { CubismIdHandle } from '../id/cubismid';
import { CubismFramework } from '../live2dcubismframework';
import { csmString } from '../type/csmstring';
import { csmVector } from '../type/csmvector';
import { CubismModelUserDataJson } from './cubismmodeluserdatajson';

const ArtMesh = 'ArtMesh';

/**
 * 사용자 데이터 인터페이스
 *
 * Json에서 로드한 사용자 데이터를 기록하기 위한 구조체
 */
export class CubismModelUserDataNode {
  targetType: CubismIdHandle; // 사용자 데이터 대상 타입
  targetId: CubismIdHandle; // 사용자 데이터 대상 ID
  value: csmString; // 사용자 데이터
}

/**
 * 사용자 데이터 관리 클래스
 *
 * 사용자 데이터를 로드, 관리, 검색 인터페이스, 해제까지 수행합니다.
 */
export class CubismModelUserData {
  /**
   * 인스턴스 생성
   *
   * @param buffer    userdata3.json이 로드된 버퍼
   * @param size      버퍼의 크기
   * @return 생성된 인스턴스
   */
  public static create(buffer: ArrayBuffer, size: number): CubismModelUserData {
    const ret: CubismModelUserData = new CubismModelUserData();

    ret.parseUserData(buffer, size);

    return ret;
  }

  /**
   * 인스턴스를 파기합니다.
   *
   * @param modelUserData 파기할 인스턴스
   */
  public static delete(modelUserData: CubismModelUserData): void {
    if (modelUserData != null) {
      modelUserData.release();
      modelUserData = null;
    }
  }

  /**
   * ArtMesh의 사용자 데이터 목록 가져오기
   *
   * @return 사용자 데이터 목록
   */
  public getArtMeshUserDatas(): csmVector<CubismModelUserDataNode> {
    return this._artMeshUserDataNode;
  }

  /**
   * userdata3.json 파싱
   *
   * @param buffer    userdata3.json이 로드된 버퍼
   * @param size      버퍼의 크기
   */
  public parseUserData(buffer: ArrayBuffer, size: number): void {
    let json: CubismModelUserDataJson = new CubismModelUserDataJson(
      buffer,
      size
    );
    if (!json) {
      json.release();
      json = void 0;
      return;
    }

    const typeOfArtMesh = CubismFramework.getIdManager().getId(ArtMesh);
    const nodeCount: number = json.getUserDataCount();

    for (let i = 0; i < nodeCount; i++) {
      const addNode: CubismModelUserDataNode = new CubismModelUserDataNode();

      addNode.targetId = json.getUserDataId(i);
      addNode.targetType = CubismFramework.getIdManager().getId(
        json.getUserDataTargetType(i)
      );
      addNode.value = new csmString(json.getUserDataValue(i));
      this._userDataNodes.pushBack(addNode);

      if (addNode.targetType == typeOfArtMesh) {
        this._artMeshUserDataNode.pushBack(addNode);
      }
    }

    json.release();
    json = void 0;
  }

  /**
   * 생성자
   */
  public constructor() {
    this._userDataNodes = new csmVector<CubismModelUserDataNode>();
    this._artMeshUserDataNode = new csmVector<CubismModelUserDataNode>();
  }

  /**
   * 소멸자 해당 처리
   *
   * 사용자 데이터 구조체 배열을 해제합니다.
   */
  public release(): void {
    for (let i = 0; i < this._userDataNodes.getSize(); ++i) {
      this._userDataNodes.set(i, null);
    }

    this._userDataNodes = null;
  }

  private _userDataNodes: csmVector<CubismModelUserDataNode>; // 사용자 데이터 구조체 배열
  private _artMeshUserDataNode: csmVector<CubismModelUserDataNode>; // 조회 목록 유지
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismmodeluserdata';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismModelUserData = $.CubismModelUserData;
  export type CubismModelUserData = $.CubismModelUserData;
  export const CubismModelUserDataNode = $.CubismModelUserDataNode;
  export type CubismModelUserDataNode = $.CubismModelUserDataNode;
}