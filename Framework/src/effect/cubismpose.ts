/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { CubismIdHandle } from '../id/cubismid';
import { CubismFramework } from '../live2dcubismframework';
import { CubismModel } from '../model/cubismmodel';
import { csmVector, iterator } from '../type/csmvector';
import { CubismJson, Value } from '../utils/cubismjson';

const Epsilon = 0.001;
const DefaultFadeInSeconds = 0.5;

// Pose.json 태그
const FadeIn = 'FadeInTime';
const Link = 'Link';
const Groups = 'Groups';
const Id = 'Id';

/**
 * 파츠 불투명도 설정
 *
 * 파츠의 불투명도를 관리하고 설정합니다.
 */
export class CubismPose {
  /**
   * 인스턴스 생성
   * @param pose3json pose3.json 데이터
   * @param size pose3.json 데이터의 크기 [byte]
   * @return 생성된 인스턴스
   */
  public static create(pose3json: ArrayBuffer, size: number): CubismPose {
    const json: CubismJson = CubismJson.create(pose3json, size);
    if (!json) {
      return null;
    }

    const ret: CubismPose = new CubismPose();
    const root: Value = json.getRoot();

    // 페이드 시간 지정
    if (!root.getValueByString(FadeIn).isNull()) {
      ret._fadeTimeSeconds = root
        .getValueByString(FadeIn)
        .toFloat(DefaultFadeInSeconds);

      if (ret._fadeTimeSeconds < 0.0) {
        ret._fadeTimeSeconds = DefaultFadeInSeconds;
      }
    }

    // 파츠 그룹
    const poseListInfo: Value = root.getValueByString(Groups);
    const poseCount: number = poseListInfo.getSize();

    for (let poseIndex = 0; poseIndex < poseCount; ++poseIndex) {
      const idListInfo: Value = poseListInfo.getValueByIndex(poseIndex);
      const idCount: number = idListInfo.getSize();
      let groupCount = 0;

      for (let groupIndex = 0; groupIndex < idCount; ++groupIndex) {
        const partInfo: Value = idListInfo.getValueByIndex(groupIndex);
        const partData: PartData = new PartData();
        const parameterId: CubismIdHandle =
          CubismFramework.getIdManager().getId(
            partInfo.getValueByString(Id).getRawString()
          );

        partData.partId = parameterId;

        // 링크할 파츠 설정
        if (!partInfo.getValueByString(Link).isNull()) {
          const linkListInfo: Value = partInfo.getValueByString(Link);
          const linkCount: number = linkListInfo.getSize();

          for (let linkIndex = 0; linkIndex < linkCount; ++linkIndex) {
            const linkPart: PartData = new PartData();
            const linkId: CubismIdHandle = CubismFramework.getIdManager().getId(
              linkListInfo.getValueByIndex(linkIndex).getString()
            );

            linkPart.partId = linkId;

            partData.link.pushBack(linkPart);
          }
        }

        ret._partGroups.pushBack(partData.clone());

        ++groupCount;
      }

      ret._partGroupCounts.pushBack(groupCount);
    }

    CubismJson.delete(json);

    return ret;
  }

  /**
   * 인스턴스를 파기합니다.
   * @param pose 대상 CubismPose
   */
  public static delete(pose: CubismPose): void {
    if (pose != null) {
      pose = null;
    }
  }

  /**
   * 모델 파라미터 업데이트
   * @param model 대상 모델
   * @param deltaTimeSeconds 델타 시간 [초]
   */
  public updateParameters(model: CubismModel, deltaTimeSeconds: number): void {
    // 이전 모델과 다르면 초기화 필요
    if (model != this._lastModel) {
      // 파라미터 인덱스 초기화
      this.reset(model);
    }

    this._lastModel = model;

    // 설정에서 시간을 변경하면 경과 시간이 마이너스가 될 수 있으므로 경과 시간 0으로 처리
    if (deltaTimeSeconds < 0.0) {
      deltaTimeSeconds = 0.0;
    }

    let beginIndex = 0;

    for (let i = 0; i < this._partGroupCounts.getSize(); i++) {
      const partGroupCount: number = this._partGroupCounts.at(i);

      this.doFade(model, deltaTimeSeconds, beginIndex, partGroupCount);

      beginIndex += partGroupCount;
    }

    this.copyPartOpacities(model);
  }

  /**
   * 표시 초기화
   * @param model 대상 모델
   * @note 불투명도 초기값이 0이 아닌 파라미터는 불투명도를 1로 설정
   */
  public reset(model: CubismModel): void {
    let beginIndex = 0;

    for (let i = 0; i < this._partGroupCounts.getSize(); ++i) {
      const groupCount: number = this._partGroupCounts.at(i);

      for (let j: number = beginIndex; j < beginIndex + groupCount; ++j) {
        this._partGroups.at(j).initialize(model);

        const partsIndex: number = this._partGroups.at(j).partIndex;
        const paramIndex: number = this._partGroups.at(j).parameterIndex;

        if (partsIndex < 0) {
          continue;
        }

        model.setPartOpacityByIndex(partsIndex, j == beginIndex ? 1.0 : 0.0);
        model.setParameterValueByIndex(paramIndex, j == beginIndex ? 1.0 : 0.0);

        for (let k = 0; k < this._partGroups.at(j).link.getSize(); ++k) {
          this._partGroups.at(j).link.at(k).initialize(model);
        }
      }

      beginIndex += groupCount;
    }
  }

  /**
   * 파츠 불투명도 복사
   *
   * @param model 대상 모델
   */
  public copyPartOpacities(model: CubismModel): void {
    for (
      let groupIndex = 0;
      groupIndex < this._partGroups.getSize();
      ++groupIndex
    ) {
      const partData: PartData = this._partGroups.at(groupIndex);

      if (partData.link.getSize() == 0) {
        continue; // 연동할 파라미터 없음
      }

      const partIndex: number = this._partGroups.at(groupIndex).partIndex;
      const opacity: number = model.getPartOpacityByIndex(partIndex);

      for (
        let linkIndex = 0;
        linkIndex < partData.link.getSize();
        ++linkIndex
      ) {
        const linkPart: PartData = partData.link.at(linkIndex);
        const linkPartIndex: number = linkPart.partIndex;

        if (linkPartIndex < 0) {
          continue;
        }

        model.setPartOpacityByIndex(linkPartIndex, opacity);
      }
    }
  }

  /**
   * 파츠 페이드 조작을 수행합니다.
   * @param model 대상 모델
   * @param deltaTimeSeconds 델타 시간 [초]
   * @param beginIndex 페이드 조작을 수행할 파츠 그룹의 시작 인덱스
   * @param partGroupCount 페이드 조작을 수행할 파츠 그룹의 개수
   */
  public doFade(
    model: CubismModel,
    deltaTimeSeconds: number,
    beginIndex: number,
    partGroupCount: number
  ): void {
    let visiblePartIndex = -1;
    let newOpacity = 1.0;

    const phi = 0.5;
    const backOpacityThreshold = 0.15;

    // 현재 표시 상태인 파츠 가져오기
    for (let i: number = beginIndex; i < beginIndex + partGroupCount; ++i) {
      const partIndex: number = this._partGroups.at(i).partIndex;
      const paramIndex: number = this._partGroups.at(i).parameterIndex;

      if (model.getParameterValueByIndex(paramIndex) > Epsilon) {
        if (visiblePartIndex >= 0) {
          break;
        }

        visiblePartIndex = i;
        // 0으로 나누기 방지
        if (this._fadeTimeSeconds == 0) {
          newOpacity = 1.0;
          continue;
        }

        newOpacity = model.getPartOpacityByIndex(partIndex);

        // 새 불투명도 계산
        newOpacity += deltaTimeSeconds / this._fadeTimeSeconds;

        if (newOpacity > 1.0) {
          newOpacity = 1.0;
        }
      }
    }

    if (visiblePartIndex < 0) {
      visiblePartIndex = 0;
      newOpacity = 1.0;
    }

    // 표시 파츠, 비표시 파츠의 불투명도 설정
    for (let i: number = beginIndex; i < beginIndex + partGroupCount; ++i) {
      const partsIndex: number = this._partGroups.at(i).partIndex;

      // 표시 파츠 설정
      if (visiblePartIndex == i) {
        model.setPartOpacityByIndex(partsIndex, newOpacity); // 먼저 설정
      }
      // 비표시 파츠 설정
      else {
        let opacity: number = model.getPartOpacityByIndex(partsIndex);
        let a1: number; // 계산으로 구해지는 불투명도

        if (newOpacity < phi) {
          a1 = (newOpacity * (phi - 1)) / phi + 1.0; // (0,1),(phi,phi)를 지나는 직선식
        } else {
          a1 = ((1 - newOpacity) * phi) / (1.0 - phi); // (1,0),(phi,phi)를 지나는 직선식
        }

        // 배경이 보이는 비율을 제한하는 경우
        const backOpacity: number = (1.0 - a1) * (1.0 - newOpacity);

        if (backOpacity > backOpacityThreshold) {
          a1 = 1.0 - backOpacityThreshold / (1.0 - newOpacity);
        }

        if (opacity > a1) {
          opacity = a1; // 계산된 불투명도보다 크면(진하면) 불투명도를 높임
        }

        model.setPartOpacityByIndex(partsIndex, opacity);
      }
    }
  }

  /**
   * 생성자
   */
  public constructor() {
    this._fadeTimeSeconds = DefaultFadeInSeconds;
    this._lastModel = null;
    this._partGroups = new csmVector<PartData>();
    this._partGroupCounts = new csmVector<number>();
  }

  _partGroups: csmVector<PartData>; // 파츠 그룹
  _partGroupCounts: csmVector<number>; // 각 파츠 그룹의 개수
  _fadeTimeSeconds: number; // 페이드 시간 [초]
  _lastModel: CubismModel; // 이전에 조작한 모델
}

/**
 * 파츠에 관한 데이터 관리
 */
export class PartData {
  /**
   * 생성자
   */
  constructor(v?: PartData) {
    this.parameterIndex = 0;
    this.partIndex = 0;
    this.link = new csmVector<PartData>();

    if (v != undefined) {
      this.partId = v.partId;

      for (
        const ite: iterator<PartData> = v.link.begin();
        ite.notEqual(v.link.end());
        ite.preIncrement()
      ) {
        this.link.pushBack(ite.ptr().clone());
      }
    }
  }

  /**
   * = 연산자 오버로드
   */
  public assignment(v: PartData): PartData {
    this.partId = v.partId;

    for (
      const ite: iterator<PartData> = v.link.begin();
      ite.notEqual(v.link.end());
      ite.preIncrement()
    ) {
      this.link.pushBack(ite.ptr().clone());
    }

    return this;
  }

  /**
   * 초기화
   * @param model 초기화에 사용할 모델
   */
  public initialize(model: CubismModel): void {
    this.parameterIndex = model.getParameterIndex(this.partId);
    this.partIndex = model.getPartIndex(this.partId);

    model.setParameterValueByIndex(this.parameterIndex, 1);
  }

  /**
   * 객체 복사본 생성
   */
  public clone(): PartData {
    const clonePartData: PartData = new PartData();

    clonePartData.partId = this.partId;
    clonePartData.parameterIndex = this.parameterIndex;
    clonePartData.partIndex = this.partIndex;
    clonePartData.link = new csmVector<PartData>();

    for (
      let ite: iterator<PartData> = this.link.begin();
      ite.notEqual(this.link.end());
      ite.increment()
    ) {
      clonePartData.link.pushBack(ite.ptr().clone());
    }

    return clonePartData;
  }

  partId: CubismIdHandle; // 파츠 ID
  parameterIndex: number; // 파라미터 인덱스
  partIndex: number; // 파츠 인덱스
  link: csmVector<PartData>; // 연동하는 파라미터
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismpose';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismPose = $.CubismPose;
  export type CubismPose = $.CubismPose;
  export const PartData = $.PartData;
  export type PartData = $.PartData;
}