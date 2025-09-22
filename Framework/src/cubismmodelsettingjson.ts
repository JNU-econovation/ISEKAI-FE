/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * 이 소스 코드의 사용은 https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html 에서 찾을 수 있는 Live2D Open Software 라이선스의 적용을 받습니다.
 */

import { ICubismModelSetting } from './icubismmodelsetting';
import { CubismIdHandle } from './id/cubismid';
import { CubismFramework } from './live2dcubismframework';
import { csmMap, iterator } from './type/csmmap';
import { csmVector } from './type/csmvector';
import { CubismJson, Value } from './utils/cubismjson';

export enum FrequestNode {
  FrequestNode_Groups, // getRoot().getValueByString(Groups)
  FrequestNode_Moc, // getRoot().getValueByString(FileReferences).getValueByString(Moc)
  FrequestNode_Motions, // getRoot().getValueByString(FileReferences).getValueByString(Motions)
  FrequestNode_Expressions, // getRoot().getValueByString(FileReferences).getValueByString(Expressions)
  FrequestNode_Textures, // getRoot().getValueByString(FileReferences).getValueByString(Textures)
  FrequestNode_Physics, // getRoot().getValueByString(FileReferences).getValueByString(Physics)
  FrequestNode_Pose, // getRoot().getValueByString(FileReferences).getValueByString(Pose)
  FrequestNode_HitAreas // getRoot().getValueByString(HitAreas)
}

/**
 * Model3Json 파서
 *
 * model3.json 파일을 파싱하여 값을 가져옵니다.
 */
export class CubismModelSettingJson extends ICubismModelSetting {
  /**
   * 인자 있는 생성자
   *
   * @param buffer    Model3Json을 바이트 배열로 읽어들인 데이터 버퍼
   * @param size      Model3Json의 데이터 크기
   */
  public constructor(buffer: ArrayBuffer, size: number) {
    super();
    this._json = CubismJson.create(buffer, size);

    if (this.getJson()) {
      this._jsonValue = new csmVector<Value>();

      // 순서는 enum FrequestNode와 일치시킵니다.
      this._jsonValue.pushBack(
        this.getJson().getRoot().getValueByString(this.groups)
      );
      this._jsonValue.pushBack(
        this.getJson()
          .getRoot()
          .getValueByString(this.fileReferences)
          .getValueByString(this.moc)
      );
      this._jsonValue.pushBack(
        this.getJson()
          .getRoot()
          .getValueByString(this.fileReferences)
          .getValueByString(this.motions)
      );
      this._jsonValue.pushBack(
        this.getJson()
          .getRoot()
          .getValueByString(this.fileReferences)
          .getValueByString(this.expressions)
      );
      this._jsonValue.pushBack(
        this.getJson()
          .getRoot()
          .getValueByString(this.fileReferences)
          .getValueByString(this.textures)
      );
      this._jsonValue.pushBack(
        this.getJson()
          .getRoot()
          .getValueByString(this.fileReferences)
          .getValueByString(this.physics)
      );
      this._jsonValue.pushBack(
        this.getJson()
          .getRoot()
          .getValueByString(this.fileReferences)
          .getValueByString(this.pose)
      );
      this._jsonValue.pushBack(
        this.getJson().getRoot().getValueByString(this.hitAreas)
      );
    }
  }

  /**
   * 소멸자 해당 처리
   */
  public release(): void {
    CubismJson.delete(this._json);

    this._jsonValue = null;
  }

  /**
   * CubismJson 객체 가져오기
   *
   * @return CubismJson
   */
  public getJson(): CubismJson {
    return this._json;
  }

  /**
   * Moc 파일 이름 가져오기
   * @return Moc 파일 이름
   */
  public getModelFileName(): string {
    if (!this.isExistModelFile()) {
      return '';
    }
    return this._jsonValue.at(FrequestNode.FrequestNode_Moc).getRawString();
  }

  /**
   * 모델이 사용하는 텍스처 수 가져오기
   * 텍스처 수
   */
  public getTextureCount(): number {
    if (!this.isExistTextureFiles()) {
      return 0;
    }

    return this._jsonValue.at(FrequestNode.FrequestNode_Textures).getSize();
  }

  /**
   * 텍스처가 배치된 디렉토리 이름 가져오기
   * @return 텍스처가 배치된 디렉토리 이름
   */
  public getTextureDirectory(): string {
    const texturePath = this._jsonValue
      .at(FrequestNode.FrequestNode_Textures)
      .getValueByIndex(0)
      .getRawString();

    const pathArray = texturePath.split('/');
    // 마지막 요소는 텍스처 이름이므로 불필요
    const arrayLength = pathArray.length - 1;
    let textureDirectoryStr = '';

    // 분할된 경로 결합
    for (let i = 0; i < arrayLength; i++) {
      textureDirectoryStr += pathArray[i];
      if (i < arrayLength - 1) {
        textureDirectoryStr += '/';
      }
    }

    return textureDirectoryStr;
  }

  /**
   * 모델이 사용하는 텍스처 이름 가져오기
   * @param index 배열의 인덱스 값
   * @return 텍스처 이름
   */
  public getTextureFileName(index: number): string {
    return this._jsonValue
      .at(FrequestNode.FrequestNode_Textures)
      .getValueByIndex(index)
      .getRawString();
  }

  /**
   * 모델에 설정된 히트 판정 수 가져오기
   * @return 모델에 설정된 히트 판정 수
   */
  public getHitAreasCount(): number {
    if (!this.isExistHitAreas()) {
      return 0;
    }

    return this._jsonValue.at(FrequestNode.FrequestNode_HitAreas).getSize();
  }

  /**
   * 히트 판정에 설정된 ID 가져오기
   *
   * @param index 배열의 index
   * @return 히트 판정에 설정된 ID
   */
  public getHitAreaId(index: number): CubismIdHandle {
    return CubismFramework.getIdManager().getId(
      this._jsonValue
        .at(FrequestNode.FrequestNode_HitAreas)
        .getValueByIndex(index)
        .getValueByString(this.id)
        .getRawString()
    );
  }

  /**
   * 히트 판정에 설정된 이름 가져오기
   * @param index 배열의 인덱스 값
   * @return 히트 판정에 설정된 이름
   */
  public getHitAreaName(index: number): string {
    return this._jsonValue
      .at(FrequestNode.FrequestNode_HitAreas)
      .getValueByIndex(index)
      .getValueByString(this.name)
      .getRawString();
  }

  /**
   * 물리 연산 설정 파일 이름 가져오기
   * @return 물리 연산 설정 파일 이름
   */
  public getPhysicsFileName(): string {
    if (!this.isExistPhysicsFile()) {
      return '';
    }

    return this._jsonValue.at(FrequestNode.FrequestNode_Physics).getRawString();
  }

  /**
   * 파츠 전환 설정 파일 이름 가져오기
   * @return 파츠 전환 설정 파일 이름
   */
  public getPoseFileName(): string {
    if (!this.isExistPoseFile()) {
      return '';
    }

    return this._jsonValue.at(FrequestNode.FrequestNode_Pose).getRawString();
  }

  /**
   * 표정 설정 파일 수 가져오기
   * @return 표정 설정 파일 수
   */
  public getExpressionCount(): number {
    if (!this.isExistExpressionFile()) {
      return 0;
    }

    return this._jsonValue.at(FrequestNode.FrequestNode_Expressions).getSize();
  }

  /**
   * 표정 설정 파일을 식별하는 이름(별칭) 가져오기
   * @param index 배열의 인덱스 값
   * @return 표정 이름
   */
  public getExpressionName(index: number): string {
    return this._jsonValue
      .at(FrequestNode.FrequestNode_Expressions)
      .getValueByIndex(index)
      .getValueByString(this.name)
      .getRawString();
  }

  /**
   * 표정 설정 파일 이름 가져오기
   * @param index 배열의 인덱스 값
   * @return 표정 설정 파일 이름
   */
  public getExpressionFileName(index: number): string {
    return this._jsonValue
      .at(FrequestNode.FrequestNode_Expressions)
      .getValueByIndex(index)
      .getValueByString(this.filePath)
      .getRawString();
  }

  /**
   * 모션 그룹 수 가져오기
   * @return 모션 그룹 수
   */
  public getMotionGroupCount(): number {
    if (!this.isExistMotionGroups()) {
      return 0;
    }

    return this._jsonValue
      .at(FrequestNode.FrequestNode_Motions)
      .getKeys()
      .getSize();
  }

  /**
   * 모션 그룹 이름 가져오기
   * @param index 배열의 인덱스 값
   * @return 모션 그룹 이름
   */
  public getMotionGroupName(index: number): string {
    if (!this.isExistMotionGroups()) {
      return null;
    }

    return this._jsonValue
      .at(FrequestNode.FrequestNode_Motions)
      .getKeys()
      .at(index);
  }

  /**
   * 모션 그룹에 포함된 모션 수 가져오기
   * @param groupName 모션 그룹 이름
   * @return 모션 그룹 수
   */
  public getMotionCount(groupName: string): number {
    if (!this.isExistMotionGroupName(groupName)) {
      return 0;
    }

    return this._jsonValue
      .at(FrequestNode.FrequestNode_Motions)
      .getValueByString(groupName)
      .getSize();
  }

  /**
   * 그룹 이름과 인덱스 값으로 모션 파일 이름 가져오기
   * @param groupName 모션 그룹 이름
   * @param index     배열의 인덱스 값
   * @return 모션 파일 이름
   */
  public getMotionFileName(groupName: string, index: number): string {
    if (!this.isExistMotionGroupName(groupName)) {
      return '';
    }

    return this._jsonValue
      .at(FrequestNode.FrequestNode_Motions)
      .getValueByString(groupName)
      .getValueByIndex(index)
      .getValueByString(this.filePath)
      .getRawString();
  }

  /**
   * 모션에 해당하는 사운드 파일 이름 가져오기
   * @param groupName 모션 그룹 이름
   * @param index 배열의 인덱스 값
   * @return 사운드 파일 이름
   */
  public getMotionSoundFileName(groupName: string, index: number): string {
    if (!this.isExistMotionSoundFile(groupName, index)) {
      return '';
    }

    return this._jsonValue
      .at(FrequestNode.FrequestNode_Motions)
      .getValueByString(groupName)
      .getValueByIndex(index)
      .getValueByString(this.soundPath)
      .getRawString();
  }

  /**
   * 모션 시작 시 페이드인 처리 시간 가져오기
   * @param groupName 모션 그룹 이름
   * @param index 배열의 인덱스 값
   * @return 페이드인 처리 시간 [초]
   */
  public getMotionFadeInTimeValue(groupName: string, index: number): number {
    if (!this.isExistMotionFadeIn(groupName, index)) {
      return -1.0;
    }

    return this._jsonValue
      .at(FrequestNode.FrequestNode_Motions)
      .getValueByString(groupName)
      .getValueByIndex(index)
      .getValueByString(this.fadeInTime)
      .toFloat();
  }

  /**
   * 모션 종료 시 페이드아웃 처리 시간 가져오기
   * @param groupName 모션 그룹 이름
   * @param index 배열의 인덱스 값
   * @return 페이드아웃 처리 시간 [초]
   */
  public getMotionFadeOutTimeValue(groupName: string, index: number): number {
    if (!this.isExistMotionFadeOut(groupName, index)) {
      return -1.0;
    }

    return this._jsonValue
      .at(FrequestNode.FrequestNode_Motions)
      .getValueByString(groupName)
      .getValueByIndex(index)
      .getValueByString(this.fadeOutTime)
      .toFloat();
  }

  /**
   * 사용자 데이터 파일 이름 가져오기
   * @return 사용자 데이터 파일 이름
   */
  public getUserDataFile(): string {
    if (!this.isExistUserDataFile()) {
      return '';
    }

    return this.getJson()
      .getRoot()
      .getValueByString(this.fileReferences)
      .getValueByString(this.userData)
      .getRawString();
  }

  /**
   * 레이아웃 정보 가져오기
   * @param outLayoutMap csmMap 클래스의 인스턴스
   * @return true 레이아웃 정보가 존재함
   * @return false 레이아웃 정보가 존재하지 않음
   */
  public getLayoutMap(outLayoutMap: csmMap<string, number>): boolean {
    // 존재하지 않는 요소에 접근하면 오류가 발생하므로 Value가 null인 경우 null을 대입합니다.
    const map: csmMap<string, Value> = this.getJson()
      .getRoot()
      .getValueByString(this.layout)
      .getMap();

    if (map == null) {
      return false;
    }

    let ret = false;

    for (
      const ite: iterator<string, Value> = map.begin();
      ite.notEqual(map.end());
      ite.preIncrement()
    ) {
      outLayoutMap.setValue(ite.ptr().first, ite.ptr().second.toFloat());
      ret = true;
    }

    return ret;
  }

  /**
   * 눈 깜박임과 관련된 파라미터 수 가져오기
   * @return 눈 깜박임과 관련된 파라미터 수
   */
  public getEyeBlinkParameterCount(): number {
    if (!this.isExistEyeBlinkParameters()) {
      return 0;
    }

    let num = 0;
    for (
      let i = 0;
      i < this._jsonValue.at(FrequestNode.FrequestNode_Groups).getSize();
      i++
    ) {
      const refI: Value = this._jsonValue
        .at(FrequestNode.FrequestNode_Groups)
        .getValueByIndex(i);
      if (refI.isNull() || refI.isError()) {
        continue;
      }

      if (refI.getValueByString(this.name).getRawString() == this.eyeBlink) {
        num = refI.getValueByString(this.ids).getVector().getSize();
        break;
      }
    }

    return num;
  }

  /**
   * 눈 깜박임과 관련된 파라미터 ID 가져오기
   * @param index 배열의 인덱스 값
   * @return 파라미터 ID
   */
  public getEyeBlinkParameterId(index: number): CubismIdHandle {
    if (!this.isExistEyeBlinkParameters()) {
      return null;
    }

    for (
      let i = 0;
      i < this._jsonValue.at(FrequestNode.FrequestNode_Groups).getSize();
      i++
    ) {
      const refI: Value = this._jsonValue
        .at(FrequestNode.FrequestNode_Groups)
        .getValueByIndex(i);
      if (refI.isNull() || refI.isError()) {
        continue;
      }

      if (refI.getValueByString(this.name).getRawString() == this.eyeBlink) {
        return CubismFramework.getIdManager().getId(
          refI.getValueByString(this.ids).getValueByIndex(index).getRawString()
        );
      }
    }
    return null;
  }

  /**
   * 립싱크와 관련된 파라미터 수 가져오기
   * @return 립싱크와 관련된 파라미터 수
   */
  public getLipSyncParameterCount(): number {
    if (!this.isExistLipSyncParameters()) {
      return 0;
    }

    let num = 0;
    for (
      let i = 0;
      i < this._jsonValue.at(FrequestNode.FrequestNode_Groups).getSize();
      i++
    ) {
      const refI: Value = this._jsonValue
        .at(FrequestNode.FrequestNode_Groups)
        .getValueByIndex(i);
      if (refI.isNull() || refI.isError()) {
        continue;
      }

      if (refI.getValueByString(this.name).getRawString() == this.lipSync) {
        num = refI.getValueByString(this.ids).getVector().getSize();
        break;
      }
    }

    return num;
  }

  /**
   * 립싱크와 관련된 파라미터 수 가져오기
   * @param index 배열의 인덱스 값
   * @return 파라미터 ID
   */
  public getLipSyncParameterId(index: number): CubismIdHandle {
    if (!this.isExistLipSyncParameters()) {
      return null;
    }

    for (
      let i = 0;
      i < this._jsonValue.at(FrequestNode.FrequestNode_Groups).getSize();
      i++
    ) {
      const refI: Value = this._jsonValue
        .at(FrequestNode.FrequestNode_Groups)
        .getValueByIndex(i);
      if (refI.isNull() || refI.isError()) {
        continue;
      }

      if (refI.getValueByString(this.name).getRawString() == this.lipSync) {
        return CubismFramework.getIdManager().getId(
          refI.getValueByString(this.ids).getValueByIndex(index).getRawString()
        );
      }
    }
    return null;
  }

  /**
   * 모델 파일 키 존재 여부 확인
   * @return true 키가 존재함
   * @return false 키가 존재하지 않음
   */
  protected isExistModelFile(): boolean {
    const node: Value = this._jsonValue.at(FrequestNode.FrequestNode_Moc);
    return !node.isNull() && !node.isError();
  }

  /**
   * 텍스처 파일 키 존재 여부 확인
   * @return true 키가 존재함
   * @return false 키가 존재하지 않음
   */
  protected isExistTextureFiles(): boolean {
    const node: Value = this._jsonValue.at(FrequestNode.FrequestNode_Textures);
    return !node.isNull() && !node.isError();
  }

  /**
   * 히트 판정 키 존재 여부 확인
   * @return true 키가 존재함
   * @return false 키가 존재하지 않음
   */
  protected isExistHitAreas(): boolean {
    const node: Value = this._jsonValue.at(FrequestNode.FrequestNode_HitAreas);
    return !node.isNull() && !node.isError();
  }

  /**
   * 물리 연산 파일 키 존재 여부 확인
   * @return true 키가 존재함
   * @return false 키가 존재하지 않음
   */
  protected isExistPhysicsFile(): boolean {
    const node: Value = this._jsonValue.at(FrequestNode.FrequestNode_Physics);
    return !node.isNull() && !node.isError();
  }

  /**
   * 포즈 설정 파일 키 존재 여부 확인
   * @return true 키가 존재함
   * @return false 키가 존재하지 않음
   */
  protected isExistPoseFile(): boolean {
    const node: Value = this._jsonValue.at(FrequestNode.FrequestNode_Pose);
    return !node.isNull() && !node.isError();
  }

  /**
   * 표정 설정 파일 키 존재 여부 확인
   * @return true 키가 존재함
   * @return false 키가 존재하지 않음
   */
  protected isExistExpressionFile(): boolean {
    const node: Value = this._jsonValue.at(
      FrequestNode.FrequestNode_Expressions
    );
    return !node.isNull() && !node.isError();
  }

  /**
   * 모션 그룹 키 존재 여부 확인
   * @return true 키가 존재함
   * @return false 키가 존재하지 않음
   */
  protected isExistMotionGroups(): boolean {
    const node: Value = this._jsonValue.at(FrequestNode.FrequestNode_Motions);
    return !node.isNull() && !node.isError();
  }

  /**
   * 인수로 지정한 모션 그룹 키 존재 여부 확인
   * @param groupName  그룹 이름
   * @return true 키가 존재함
   * @return false 키가 존재하지 않음
   */
  protected isExistMotionGroupName(groupName: string): boolean {
    const node: Value = this._jsonValue
      .at(FrequestNode.FrequestNode_Motions)
      .getValueByString(groupName);
    return !node.isNull() && !node.isError();
  }

  /**
   * 인수로 지정한 모션에 해당하는 사운드 파일 키 존재 여부 확인
   * @param groupName  그룹 이름
   * @param index 배열의 인덱스 값
   * @return true 키가 존재함
   * @return false 키가 존재하지 않음
   */
  protected isExistMotionSoundFile(groupName: string, index: number): boolean {
    const node: Value = this._jsonValue
      .at(FrequestNode.FrequestNode_Motions)
      .getValueByString(groupName)
      .getValueByIndex(index)
      .getValueByString(this.soundPath);
    return !node.isNull() && !node.isError();
  }

  /**
   * 인수로 지정한 모션에 해당하는 페이드인 시간 키 존재 여부 확인
   * @param groupName  그룹 이름
   * @param index 배열의 인덱스 값
   * @return true 키가 존재함
   * @return false 키가 존재하지 않음
   */
  protected isExistMotionFadeIn(groupName: string, index: number): boolean {
    const node: Value = this._jsonValue
      .at(FrequestNode.FrequestNode_Motions)
      .getValueByString(groupName)
      .getValueByIndex(index)
      .getValueByString(this.fadeInTime);
    return !node.isNull() && !node.isError();
  }

  /**
   * 인수로 지정한 모션에 해당하는 페이드아웃 시간 키 존재 여부 확인
   * @param groupName  그룹 이름
   * @param index 배열의 인덱스 값
   * @return true 키가 존재함
   * @return false 키가 존재하지 않음
   */
  protected isExistMotionFadeOut(groupName: string, index: number): boolean {
    const node: Value = this._jsonValue
      .at(FrequestNode.FrequestNode_Motions)
      .getValueByString(groupName)
      .getValueByIndex(index)
      .getValueByString(this.fadeOutTime);
    return !node.isNull() && !node.isError();
  }

  /**
   * UserData 파일 이름 존재 여부 확인
   * @return true 키가 존재함
   * @return false 키가 존재하지 않음
   */
  protected isExistUserDataFile(): boolean {
    const node: Value = this.getJson()
      .getRoot()
      .getValueByString(this.fileReferences)
      .getValueByString(this.userData);
    return !node.isNull() && !node.isError();
  }

  /**
   * 눈 깜박임에 연결된 파라미터 존재 여부 확인
   * @return true 키가 존재함
   * @return false 키가 존재하지 않음
   */
  protected isExistEyeBlinkParameters(): boolean {
    if (
      this._jsonValue.at(FrequestNode.FrequestNode_Groups).isNull() ||
      this._jsonValue.at(FrequestNode.FrequestNode_Groups).isError()
    ) {
      return false;
    }

    for (
      let i = 0;
      i < this._jsonValue.at(FrequestNode.FrequestNode_Groups).getSize();
      i++
    ) {
      if (
        this._jsonValue
          .at(FrequestNode.FrequestNode_Groups)
          .getValueByIndex(i)
          .getValueByString(this.name)
          .getRawString() == this.eyeBlink
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * 립싱크에 연결된 파라미터 존재 여부 확인
   * @return true 키가 존재함
   * @return false 키가 존재하지 않음
   */
  protected isExistLipSyncParameters(): boolean {
    if (
      this._jsonValue.at(FrequestNode.FrequestNode_Groups).isNull() ||
      this._jsonValue.at(FrequestNode.FrequestNode_Groups).isError()
    ) {
      return false;
    }
    for (
      let i = 0;
      i < this._jsonValue.at(FrequestNode.FrequestNode_Groups).getSize();
      i++
    ) {
      if (
        this._jsonValue
          .at(FrequestNode.FrequestNode_Groups)
          .getValueByIndex(i)
          .getValueByString(this.name)
          .getRawString() == this.lipSync
      ) {
        return true;
      }
    }
    return false;
  }

  protected _json: CubismJson;
  protected _jsonValue: csmVector<Value>;

  /**
   * Model3Json 키 문자열
   */
  protected readonly version = 'Version';
  protected readonly fileReferences = 'FileReferences';

  protected readonly groups = 'Groups';
  protected readonly layout = 'Layout';
  protected readonly hitAreas = 'HitAreas';

  protected readonly moc = 'Moc';
  protected readonly textures = 'Textures';
  protected readonly physics = 'Physics';
  protected readonly pose = 'Pose';
  protected readonly expressions = 'Expressions';
  protected readonly motions = 'Motions';

  protected readonly userData = 'UserData';
  protected readonly name = 'Name';
  protected readonly filePath = 'File';
  protected readonly id = 'Id';
  protected readonly ids = 'Ids';
  protected readonly target = 'Target';

  // Motions
  protected readonly idle = 'Idle';
  protected readonly tapBody = 'TapBody';
  protected readonly pinchIn = 'PinchIn';
  protected readonly pinchOut = 'PinchOut';
  protected readonly shake = 'Shake';
  protected readonly flickHead = 'FlickHead';
  protected readonly parameter = 'Parameter';

  protected readonly soundPath = 'Sound';
  protected readonly fadeInTime = 'FadeInTime';
  protected readonly fadeOutTime = 'FadeOutTime';

  // Layout
  protected readonly centerX = 'CenterX';
  protected readonly centerY = 'CenterY';
  protected readonly x = 'X';
  protected readonly y = 'Y';
  protected readonly width = 'Width';
  protected readonly height = 'Height';

  protected readonly lipSync = 'LipSync';
  protected readonly eyeBlink = 'EyeBlink';

  protected readonly initParameter = 'init_param';
  protected readonly initPartsVisible = 'init_parts_visible';
  protected readonly val = 'val';
}

// 호환성을 위한 네임스페이스 정의.
import * as $ from './cubismmodelsettingjson';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismFramework {
  export const CubismModelSettingJson = $.CubismModelSettingJson;
  export type CubismModelSettingJson = $.CubismModelSettingJson;
  export const FrequestNode = $.FrequestNode;
  export type FrequestNode = $.FrequestNode;
}